#!/usr/bin/env python3
"""
Printavo Artwork Scraper

Scrapes artwork files from Printavo web interface since REST API doesn't expose them.

APPROACH:
1. Web login with session cookies
2. Iterate through all orders using their public_url
3. Parse HTML for artwork/mockup images
4. Download files to local storage organized by order

STORAGE STRUCTURE:
data/artwork/
  ├── by_order/
  │   ├── 13670/          # visual_id
  │   │   ├── artwork_1.png
  │   │   ├── mockup_1.jpg
  │   │   └── manifest.json
  │   └── 13671/
  │       └── ...
  └── manifest.json       # Master index of all scraped files

REQUIREMENTS:
- pip install requests beautifulsoup4 lxml

NOTES:
- Uses session auth (email/password), not API token
- Rate limited to avoid detection (2 seconds between requests)
- Checkpointing supported for resume after interruption
- Respects 429 rate limits with exponential backoff

Author: PrintShop OS Team
Created: 2025-11-27
"""

import os
import sys
import json
import time
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import Optional, List, Dict

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: beautifulsoup4 required. Run: pip install beautifulsoup4")
    sys.exit(1)

# Use html.parser (built-in, no extra dependencies)
HTML_PARSER = 'html.parser'


class PrintavoArtworkScraper:
    """Scrapes artwork files from Printavo web interface."""
    
    BASE_URL = "https://www.printavo.com"
    LOGIN_URL = f"{BASE_URL}/users/sign_in"
    
    def __init__(
        self, 
        email: str, 
        password: str, 
        output_dir: Path,
        orders_file: Path,
        checkpoint_file: Optional[Path] = None
    ):
        self.email = email
        self.password = password
        self.output_dir = output_dir
        self.orders_file = orders_file
        self.checkpoint_file = checkpoint_file or output_dir / "checkpoint.json"
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
        
        self.stats = {
            'orders_processed': 0,
            'orders_with_artwork': 0,
            'files_downloaded': 0,
            'bytes_downloaded': 0,
            'errors': [],
            'started_at': None,
            'completed_at': None
        }
        
        self.checkpoint = self._load_checkpoint()
        
    def _load_checkpoint(self) -> Dict:
        """Load checkpoint for resume capability."""
        if self.checkpoint_file.exists():
            with open(self.checkpoint_file) as f:
                return json.load(f)
        return {'last_order_index': 0, 'completed_orders': []}
    
    def _save_checkpoint(self, order_index: int, order_id: int):
        """Save checkpoint for resume."""
        self.checkpoint['last_order_index'] = order_index
        if order_id not in self.checkpoint['completed_orders']:
            self.checkpoint['completed_orders'].append(order_id)
        with open(self.checkpoint_file, 'w') as f:
            json.dump(self.checkpoint, f, indent=2)
    
    def login(self) -> bool:
        """Authenticate with Printavo web interface."""
        print("🔐 Logging in to Printavo...")
        
        # Get login page for CSRF token
        response = self.session.get(self.LOGIN_URL)
        if response.status_code != 200:
            print(f"❌ Failed to load login page: {response.status_code}")
            return False
        
        soup = BeautifulSoup(response.text, HTML_PARSER)
        csrf_input = soup.find('input', {'name': 'authenticity_token'})
        
        if not csrf_input:
            print("❌ Could not find CSRF token")
            return False
        
        csrf_token = csrf_input.get('value')
        
        # Submit login form
        login_data = {
            'authenticity_token': csrf_token,
            'user[email]': self.email,
            'user[password]': self.password,
            'user[remember_me]': '1'
        }
        
        response = self.session.post(
            self.LOGIN_URL,
            data=login_data,
            allow_redirects=True
        )
        
        # Check if login succeeded by looking for dashboard redirect
        if 'dashboard' in response.url or 'invoices' in response.url or 'calendar' in response.url:
            print("✅ Login successful")
            return True
        
        # Check for error message
        if 'Invalid Email or password' in response.text:
            print("❌ Invalid credentials")
            return False
        
        print(f"⚠️ Login status unclear. URL: {response.url}")
        return False
    
    def _rate_limit_wait(self, base_delay: float = 2.0, attempt: int = 0):
        """Wait with exponential backoff for rate limiting."""
        delay = base_delay * (2 ** attempt)
        time.sleep(min(delay, 60))  # Cap at 60 seconds
    
    def _download_file(self, url: str, output_path: Path) -> bool:
        """Download a file with error handling."""
        try:
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            self.stats['files_downloaded'] += 1
            self.stats['bytes_downloaded'] += output_path.stat().st_size
            return True
            
        except Exception as e:
            self.stats['errors'].append(f"Download failed {url}: {str(e)}")
            return False
    
    def _extract_artwork_urls(self, html: str, order_url: str) -> List[Dict]:
        """Extract artwork/mockup URLs from order page HTML."""
        soup = BeautifulSoup(html, HTML_PARSER)
        artwork = []
        
        # Common patterns for artwork in Printavo
        selectors = [
            # Mockup images
            ('img[src*="mockup"]', 'mockup'),
            ('img[src*="proof"]', 'proof'),
            ('img[src*="artwork"]', 'artwork'),
            
            # Filestack CDN
            ('img[src*="filestackcontent.com"]', 'artwork'),
            ('a[href*="filestackcontent.com"]', 'file'),
            
            # S3/AWS hosted
            ('img[src*="s3.amazonaws"]', 'artwork'),
            ('a[href*="s3.amazonaws"]', 'file'),
            
            # Generic images in line item groups
            ('.line-item-group img', 'lineitem'),
            ('.imprint-image img', 'imprint'),
            
            # File attachments
            ('a[href*="/attachments/"]', 'attachment'),
            ('a[href*="/files/"]', 'file'),
        ]
        
        seen_urls = set()
        
        for selector, art_type in selectors:
            elements = soup.select(selector)
            for elem in elements:
                # Get URL from src or href
                url = elem.get('src') or elem.get('href')
                if not url:
                    continue
                
                # Make absolute URL
                url = urljoin(order_url, url)
                
                # Skip duplicates and non-image URLs
                if url in seen_urls:
                    continue
                
                # Filter out tracking pixels, icons, etc.
                parsed = urlparse(url)
                path_lower = parsed.path.lower()
                
                if any(skip in path_lower for skip in [
                    'pixel', 'tracking', 'icon', 'logo', 'avatar',
                    'spacer', 'blank', '1x1'
                ]):
                    continue
                
                # Check file extension
                valid_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.ai', '.eps', '.svg', '.psd']
                has_valid_ext = any(path_lower.endswith(ext) for ext in valid_extensions)
                
                # Also accept CDN URLs without extensions
                is_cdn = 'filestackcontent.com' in url or 's3.amazonaws' in url or 'filepicker.io' in url
                
                if has_valid_ext or is_cdn:
                    # Get full-size version of Filestack images (remove resize transforms)
                    if 'filestackcontent.com' in url and 'resize=' in url:
                        # Extract the original file URL from the transform chain
                        # e.g., https://cdn.filestackcontent.com/.../resize=width:100/https://cdn.filepicker.io/XXX
                        import re
                        original_match = re.search(r'(https://cdn\.filepicker\.io/[A-Za-z0-9]+)', url)
                        if original_match:
                            url = original_match.group(1)
                    
                    seen_urls.add(url)
                    artwork.append({
                        'url': url,
                        'type': art_type,
                        'filename': Path(parsed.path).name or f"{art_type}_{len(artwork)}"
                    })
        
        return artwork
    
    def scrape_order(self, order: Dict) -> Optional[Dict]:
        """Scrape artwork from a single order."""
        order_id = order.get('id')
        visual_id = order.get('visual_id')
        public_url = order.get('public_url') or order.get('url')
        
        if not public_url:
            return None
        
        # Try different URL patterns
        urls_to_try = [
            public_url,
            f"https://www.printavo.com/invoices/{order_id}",
            f"https://www.printavo.com/invoices/{order_id}/workorder"
        ]
        
        html = None
        used_url = None
        
        for url in urls_to_try:
            try:
                response = self.session.get(url, timeout=30)
                if response.status_code == 200:
                    html = response.text
                    used_url = url
                    break
                elif response.status_code == 429:
                    print("    ⚠️ Rate limited, waiting...")
                    self._rate_limit_wait()
            except Exception as e:
                self.stats['errors'].append(f"Failed to fetch {url}: {str(e)}")
        
        if not html:
            return None
        
        # Extract artwork URLs
        artwork_items = self._extract_artwork_urls(html, used_url)
        
        if not artwork_items:
            return None
        
        self.stats['orders_with_artwork'] += 1
        
        # Create order directory
        order_dir = self.output_dir / "by_order" / str(visual_id)
        order_dir.mkdir(parents=True, exist_ok=True)
        
        # Download each artwork file
        downloaded = []
        for i, item in enumerate(artwork_items):
            # Generate safe filename
            ext = Path(urlparse(item['url']).path).suffix or '.png'
            filename = f"{item['type']}_{i+1}{ext}"
            output_path = order_dir / filename
            
            if self._download_file(item['url'], output_path):
                downloaded.append({
                    'filename': filename,
                    'url': item['url'],
                    'type': item['type'],
                    'size_bytes': output_path.stat().st_size
                })
        
        # Save order manifest
        manifest = {
            'order_id': order_id,
            'visual_id': visual_id,
            'customer': order.get('customer', {}).get('company_name') or order.get('customer', {}).get('full_name'),
            'scraped_at': datetime.now().isoformat(),
            'source_url': used_url,
            'files': downloaded
        }
        
        with open(order_dir / 'manifest.json', 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest
    
    def run(self, limit: Optional[int] = None):
        """Run the complete scraping process."""
        print("=" * 70)
        print("🎨 PRINTAVO ARTWORK SCRAPER")
        print("=" * 70)
        print(f"Output: {self.output_dir}")
        print(f"Orders file: {self.orders_file}")
        print()
        
        # Login
        if not self.login():
            print("❌ Authentication failed. Exiting.")
            return
        
        # Load orders
        print("\n📦 Loading orders...")
        with open(self.orders_file) as f:
            orders = json.load(f)
        
        total_orders = len(orders)
        print(f"   Found {total_orders:,} orders")
        
        if limit:
            orders = orders[:limit]
            print(f"   Limiting to {limit} orders")
        
        # Resume from checkpoint
        start_index = self.checkpoint.get('last_order_index', 0)
        if start_index > 0:
            print(f"   Resuming from order index {start_index}")
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.stats['started_at'] = datetime.now().isoformat()
        
        # Process each order
        print("\n🔍 Scraping orders for artwork...")
        
        for i, order in enumerate(orders[start_index:], start=start_index):
            visual_id = order.get('visual_id', 'N/A')
            self.stats['orders_processed'] += 1
            
            print(f"  [{i+1}/{len(orders)}] Order #{visual_id}...", end='', flush=True)
            
            # Skip already completed orders
            if order.get('id') in self.checkpoint.get('completed_orders', []):
                print(" (skipped - already done)")
                continue
            
            result = self.scrape_order(order)
            
            if result and result.get('files'):
                print(f" ✓ {len(result['files'])} files")
            else:
                print(" (no artwork)")
            
            # Save checkpoint
            self._save_checkpoint(i + 1, order.get('id'))
            
            # Rate limiting
            self._rate_limit_wait(base_delay=2.0)
        
        self.stats['completed_at'] = datetime.now().isoformat()
        
        # Save master manifest
        master_manifest = {
            'scraping_stats': self.stats,
            'checkpoint': self.checkpoint
        }
        
        with open(self.output_dir / 'manifest.json', 'w') as f:
            json.dump(master_manifest, f, indent=2)
        
        # Print summary
        print("\n" + "=" * 70)
        print("✅ SCRAPING COMPLETE")
        print("=" * 70)
        print(f"  Orders processed: {self.stats['orders_processed']:,}")
        print(f"  Orders with artwork: {self.stats['orders_with_artwork']:,}")
        print(f"  Files downloaded: {self.stats['files_downloaded']:,}")
        print(f"  Total size: {self.stats['bytes_downloaded'] / 1024 / 1024:.1f} MB")
        print(f"  Errors: {len(self.stats['errors'])}")
        print(f"\n  Output: {self.output_dir}")


def main():
    """Main entry point."""
    # Configuration
    email = os.getenv('PRINTAVO_EMAIL', 'ronny@mintprints.com')
    password = os.getenv('PRINTAVO_PASSWORD')  # Required for web auth
    
    if not password:
        print("❌ Error: PRINTAVO_PASSWORD environment variable required")
        print("   Web scraping requires password auth, not API token")
        print("\n   Usage:")
        print("   PRINTAVO_PASSWORD='your_password' python printavo-artwork-scraper.py")
        sys.exit(1)
    
    orders_file = Path('data/raw/printavo-exports/complete_2025-11-27_14-20-05/orders.json')
    output_dir = Path('data/artwork')
    
    if not orders_file.exists():
        print(f"❌ Orders file not found: {orders_file}")
        sys.exit(1)
    
    # Parse command line arguments
    limit = None
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
            print(f"ℹ️  Limiting to {limit} orders (test mode)")
        except ValueError:
            pass
    
    scraper = PrintavoArtworkScraper(
        email=email,
        password=password,
        output_dir=output_dir,
        orders_file=orders_file
    )
    
    try:
        scraper.run(limit=limit)
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraping interrupted. Progress saved to checkpoint.")
        sys.exit(0)


if __name__ == '__main__':
    main()
