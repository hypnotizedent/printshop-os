#!/usr/bin/env python3
"""
Printavo Artwork Scraper v2 - Customer-Organized

Enhanced scraper that organizes artwork by customer for easy reorder lookup.

STORAGE STRUCTURE:
data/artwork/
  ├── by_customer/
  │   └── {customer-slug}-{printavo_id}/
  │       ├── customer.json
  │       └── YYYY/
  │           └── {visual_id}_{order-slug}/
  │               ├── artwork_1.png
  │               └── order.json
  ├── by_order/           # Symlinks for quick order lookup
  │   └── {visual_id}/ → ../by_customer/.../
  └── index.json          # Searchable master index

USAGE:
  PRINTAVO_PASSWORD='xxx' python scripts/printavo-artwork-scraper-v2.py [limit]

Author: PrintShop OS Team
Created: 2025-11-27
"""

import os
import sys
import json
import time
import re
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import Optional, List, Dict
import unicodedata

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: beautifulsoup4 required. Run: pip install beautifulsoup4")
    sys.exit(1)

HTML_PARSER = 'html.parser'


def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    if not text:
        return "unknown"
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    # Convert to lowercase and replace spaces/special chars
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text[:50] or "unknown"  # Limit length


class PrintavoArtworkScraperV2:
    """Enhanced scraper with customer-based organization."""
    
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
        })
        
        self.stats = {
            'orders_processed': 0,
            'orders_with_artwork': 0,
            'files_downloaded': 0,
            'bytes_downloaded': 0,
            'customers_seen': set(),
            'errors': [],
            'started_at': None,
            'completed_at': None
        }
        
        # Customer index for building master index
        self.customer_index = {}
        self.order_index = {}
        
        self.checkpoint = self._load_checkpoint()
        
    def _load_checkpoint(self) -> Dict:
        if self.checkpoint_file.exists():
            with open(self.checkpoint_file) as f:
                data = json.load(f)
                # Restore customer index from checkpoint
                self.customer_index = data.get('customer_index', {})
                self.order_index = data.get('order_index', {})
                return data
        return {'last_order_index': 0, 'completed_orders': [], 'customer_index': {}, 'order_index': {}}
    
    def _save_checkpoint(self, order_index: int, order_id: int):
        self.checkpoint['last_order_index'] = order_index
        if order_id not in self.checkpoint['completed_orders']:
            self.checkpoint['completed_orders'].append(order_id)
        self.checkpoint['customer_index'] = self.customer_index
        self.checkpoint['order_index'] = self.order_index
        with open(self.checkpoint_file, 'w') as f:
            json.dump(self.checkpoint, f, indent=2, default=str)
    
    def login(self) -> bool:
        """Authenticate with Printavo web interface."""
        print("🔐 Logging in to Printavo...")
        
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
        
        login_data = {
            'authenticity_token': csrf_token,
            'user[email]': self.email,
            'user[password]': self.password,
            'user[remember_me]': '1'
        }
        
        response = self.session.post(self.LOGIN_URL, data=login_data, allow_redirects=True)
        
        if any(x in response.url for x in ['dashboard', 'invoices', 'calendar']):
            print("✅ Login successful")
            return True
        
        if 'Invalid Email or password' in response.text:
            print("❌ Invalid credentials")
            return False
        
        print(f"⚠️ Login status unclear. URL: {response.url}")
        return False
    
    def _rate_limit_wait(self, base_delay: float = 2.0, attempt: int = 0):
        delay = base_delay * (2 ** attempt)
        time.sleep(min(delay, 60))
    
    def _download_file(self, url: str, output_path: Path) -> bool:
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
        
        selectors = [
            ('img[src*="mockup"]', 'mockup'),
            ('img[src*="proof"]', 'proof'),
            ('img[src*="artwork"]', 'artwork'),
            ('img[src*="filestackcontent.com"]', 'artwork'),
            ('a[href*="filestackcontent.com"]', 'file'),
            ('img[src*="filepicker.io"]', 'artwork'),
            ('a[href*="filepicker.io"]', 'file'),
            ('img[src*="s3.amazonaws"]', 'artwork'),
            ('.line-item-group img', 'lineitem'),
            ('.imprint-image img', 'imprint'),
            ('a[href*="/attachments/"]', 'attachment'),
        ]
        
        seen_urls = set()
        
        for selector, art_type in selectors:
            elements = soup.select(selector)
            for elem in elements:
                url = elem.get('src') or elem.get('href')
                if not url:
                    continue
                
                url = urljoin(order_url, url)
                
                if url in seen_urls:
                    continue
                
                parsed = urlparse(url)
                path_lower = parsed.path.lower()
                
                if any(skip in path_lower for skip in [
                    'pixel', 'tracking', 'icon', 'logo', 'avatar', 'spacer', 'blank', '1x1'
                ]):
                    continue
                
                valid_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.ai', '.eps', '.svg', '.psd']
                has_valid_ext = any(path_lower.endswith(ext) for ext in valid_extensions)
                is_cdn = 'filestackcontent.com' in url or 's3.amazonaws' in url or 'filepicker.io' in url
                
                if has_valid_ext or is_cdn:
                    # Get full-size version
                    if 'filestackcontent.com' in url and 'resize=' in url:
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
    
    def _get_order_path(self, order: Dict) -> Path:
        """Generate customer-organized path for order artwork."""
        # Customer info
        customer = order.get('customer', {})
        customer_id = customer.get('id') or order.get('customer_id', 'unknown')
        customer_name = customer.get('company_name') or customer.get('full_name') or 'Unknown Customer'
        customer_slug = slugify(customer_name)
        
        # Order info
        visual_id = order.get('visual_id', order.get('id'))
        order_nickname = order.get('order_nickname', '') or f"order-{visual_id}"
        order_slug = slugify(order_nickname)
        
        # Date for year organization
        created_at = order.get('created_at') or order.get('custom_created_at', '')
        try:
            year = datetime.fromisoformat(created_at.replace('Z', '+00:00')).year
        except:
            year = 'unknown'
        
        # Build path: by_customer/{customer-slug}-{id}/{year}/{visual_id}_{order-slug}/
        customer_folder = f"{customer_slug}-{customer_id}"
        order_folder = f"{visual_id}_{order_slug}"
        
        # Track in index
        self.customer_index[str(customer_id)] = {
            'name': customer_name,
            'slug': customer_slug,
            'folder': customer_folder,
            'order_count': self.customer_index.get(str(customer_id), {}).get('order_count', 0) + 1
        }
        
        return self.output_dir / "by_customer" / customer_folder / str(year) / order_folder
    
    def _create_order_symlink(self, order: Dict, order_path: Path):
        """Create symlink in by_order/ for quick lookup."""
        visual_id = order.get('visual_id', order.get('id'))
        symlink_dir = self.output_dir / "by_order"
        symlink_dir.mkdir(parents=True, exist_ok=True)
        
        symlink_path = symlink_dir / str(visual_id)
        
        # Calculate relative path for symlink
        try:
            rel_path = os.path.relpath(order_path, symlink_dir)
            if symlink_path.exists() or symlink_path.is_symlink():
                symlink_path.unlink()
            symlink_path.symlink_to(rel_path)
        except Exception as e:
            self.stats['errors'].append(f"Symlink failed for {visual_id}: {e}")
    
    def scrape_order(self, order: Dict) -> Optional[Dict]:
        """Scrape artwork from a single order with customer organization."""
        order_id = order.get('id')
        visual_id = order.get('visual_id')
        public_url = order.get('public_url') or order.get('url')
        
        if not public_url:
            return None
        
        # Try fetching order page
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
        
        # Extract artwork
        artwork_items = self._extract_artwork_urls(html, used_url)
        
        if not artwork_items:
            return None
        
        self.stats['orders_with_artwork'] += 1
        
        # Get customer-organized path
        order_path = self._get_order_path(order)
        order_path.mkdir(parents=True, exist_ok=True)
        
        # Download files
        downloaded = []
        for i, item in enumerate(artwork_items):
            ext = Path(urlparse(item['url']).path).suffix or '.png'
            filename = f"{item['type']}_{i+1}{ext}"
            output_path = order_path / filename
            
            if self._download_file(item['url'], output_path):
                downloaded.append({
                    'filename': filename,
                    'url': item['url'],
                    'type': item['type'],
                    'size_bytes': output_path.stat().st_size
                })
        
        # Get customer info
        customer = order.get('customer', {})
        customer_name = customer.get('company_name') or customer.get('full_name') or 'Unknown'
        
        # Save order manifest
        manifest = {
            'order_id': order_id,
            'visual_id': visual_id,
            'order_nickname': order.get('order_nickname', ''),
            'customer_id': customer.get('id') or order.get('customer_id'),
            'customer_name': customer_name,
            'created_at': order.get('created_at'),
            'scraped_at': datetime.now().isoformat(),
            'source_url': used_url,
            'files': downloaded,
            'line_items': [
                {
                    'style': li.get('style_number'),
                    'description': li.get('style_description'),
                    'color': li.get('color'),
                    'quantity': li.get('total_quantities')
                }
                for li in order.get('lineitems_attributes', [])
            ]
        }
        
        with open(order_path / 'order.json', 'w') as f:
            json.dump(manifest, f, indent=2)
        
        # Create symlink for by_order access
        self._create_order_symlink(order, order_path)
        
        # Track in order index
        self.order_index[str(visual_id)] = {
            'order_id': order_id,
            'customer_id': customer.get('id'),
            'customer_name': customer_name,
            'nickname': order.get('order_nickname', ''),
            'date': order.get('created_at', '')[:10] if order.get('created_at') else '',
            'file_count': len(downloaded),
            'path': str(order_path.relative_to(self.output_dir))
        }
        
        return manifest
    
    def _save_master_index(self):
        """Save searchable master index."""
        index = {
            'generated_at': datetime.now().isoformat(),
            'total_customers': len(self.customer_index),
            'total_orders': len(self.order_index),
            'total_files': self.stats['files_downloaded'],
            'total_size_mb': round(self.stats['bytes_downloaded'] / 1024 / 1024, 2),
            'customers': self.customer_index,
            'orders': self.order_index
        }
        
        with open(self.output_dir / 'index.json', 'w') as f:
            json.dump(index, f, indent=2)
    
    def run(self, limit: Optional[int] = None):
        """Run the complete scraping process."""
        print("=" * 70)
        print("🎨 PRINTAVO ARTWORK SCRAPER v2 (Customer-Organized)")
        print("=" * 70)
        print(f"Output: {self.output_dir}")
        print(f"Orders file: {self.orders_file}")
        print()
        
        if not self.login():
            print("❌ Authentication failed. Exiting.")
            return
        
        print("\n📦 Loading orders...")
        with open(self.orders_file) as f:
            orders = json.load(f)
        
        total_orders = len(orders)
        print(f"   Found {total_orders:,} orders")
        
        if limit:
            orders = orders[:limit]
            print(f"   Limiting to {limit} orders")
        
        start_index = self.checkpoint.get('last_order_index', 0)
        if start_index > 0:
            print(f"   Resuming from order index {start_index}")
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / "by_customer").mkdir(exist_ok=True)
        (self.output_dir / "by_order").mkdir(exist_ok=True)
        
        self.stats['started_at'] = datetime.now().isoformat()
        
        print("\n🔍 Scraping orders for artwork...")
        
        for i, order in enumerate(orders[start_index:], start=start_index):
            visual_id = order.get('visual_id', 'N/A')
            customer = order.get('customer', {})
            customer_name = customer.get('company_name') or customer.get('full_name') or 'Unknown'
            customer_name_short = customer_name[:20] + '...' if len(customer_name) > 20 else customer_name
            
            self.stats['orders_processed'] += 1
            
            print(f"  [{i+1}/{len(orders)}] #{visual_id} ({customer_name_short})...", end='', flush=True)
            
            if order.get('id') in self.checkpoint.get('completed_orders', []):
                print(" (skip)")
                continue
            
            result = self.scrape_order(order)
            
            if result and result.get('files'):
                print(f" ✓ {len(result['files'])} files")
            else:
                print(" (no art)")
            
            self._save_checkpoint(i + 1, order.get('id'))
            self._rate_limit_wait(base_delay=2.0)
        
        self.stats['completed_at'] = datetime.now().isoformat()
        
        # Save master index
        self._save_master_index()
        
        print("\n" + "=" * 70)
        print("✅ SCRAPING COMPLETE")
        print("=" * 70)
        print(f"  Orders processed: {self.stats['orders_processed']:,}")
        print(f"  Orders with artwork: {self.stats['orders_with_artwork']:,}")
        print(f"  Unique customers: {len(self.customer_index):,}")
        print(f"  Files downloaded: {self.stats['files_downloaded']:,}")
        print(f"  Total size: {self.stats['bytes_downloaded'] / 1024 / 1024:.1f} MB")
        print(f"  Errors: {len(self.stats['errors'])}")
        print(f"\n  Output: {self.output_dir}")
        print(f"  Index: {self.output_dir / 'index.json'}")


def main():
    email = os.getenv('PRINTAVO_EMAIL', 'info@mintprints.com')
    password = os.getenv('PRINTAVO_PASSWORD')
    
    if not password:
        print("❌ Error: PRINTAVO_PASSWORD environment variable required")
        sys.exit(1)
    
    orders_file = Path('data/raw/printavo-exports/complete_2025-11-27_14-20-05/orders.json')
    output_dir = Path('data/artwork')
    
    if not orders_file.exists():
        print(f"❌ Orders file not found: {orders_file}")
        sys.exit(1)
    
    limit = None
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
            print(f"ℹ️  Limiting to {limit} orders (test mode)")
        except ValueError:
            pass
    
    scraper = PrintavoArtworkScraperV2(
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
