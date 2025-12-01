"""
Printavo Web Scraper for Artwork and Production Files

Scrapes artwork files, production files, and mockups from Printavo
web interface. These files are not available via the REST API.

Supports:
- PNG, JPG, GIF (artwork)
- PDF, EPS, AI (production)
- DST, PES, EXP (embroidery - critical)
- PSD, INDD (source files)
"""

import os
import re
import time
import hashlib
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse

import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    raise ImportError("beautifulsoup4 required. Run: pip install beautifulsoup4")

from .file_detector import FileDetector, FileType


HTML_PARSER = 'html.parser'


@dataclass
class DownloadStats:
    """Statistics for download tracking."""
    files_downloaded: int = 0
    bytes_downloaded: int = 0
    files_skipped: int = 0
    files_failed: int = 0
    orders_processed: int = 0
    orders_with_files: int = 0
    errors: List[str] = field(default_factory=list)


@dataclass
class ScrapedFile:
    """Represents a file scraped from Printavo."""
    url: str
    filename: str
    file_type: FileType
    source_type: str  # 'mockup', 'artwork', 'proof', 'attachment'
    order_id: Optional[int] = None
    order_visual_id: Optional[str] = None
    customer_id: Optional[int] = None
    size_bytes: int = 0
    downloaded: bool = False
    local_path: Optional[Path] = None


def slugify(text: str, max_length: int = 50) -> str:
    """Convert text to URL-safe slug."""
    if not text:
        return "unknown"
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    # Convert to lowercase and replace spaces/special chars
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text[:max_length] or "unknown"


class PrintavoScraper:
    """
    Web scraper for Printavo artwork and production files.
    
    Features:
    - Parallel downloads (configurable concurrency)
    - Rate limiting to avoid blocking
    - Resume support with checkpoints
    - File type detection and categorization
    - Integrity verification
    """
    
    BASE_URL = "https://www.printavo.com"
    LOGIN_URL = f"{BASE_URL}/users/sign_in"
    
    # Default rate limiting
    REQUEST_DELAY = 2.0  # Seconds between order page requests
    DOWNLOAD_DELAY = 0.5  # Seconds between file downloads
    
    # Concurrent download settings
    MAX_CONCURRENT_DOWNLOADS = 5
    
    def __init__(
        self,
        email: Optional[str] = None,
        password: Optional[str] = None,
        output_dir: Optional[Path] = None,
        checkpoint_file: Optional[Path] = None,
        max_workers: int = 5
    ):
        """
        Initialize Printavo scraper.
        
        Args:
            email: Printavo login email (or PRINTAVO_EMAIL env var)
            password: Printavo password (or PRINTAVO_PASSWORD env var)
            output_dir: Directory for downloaded files
            checkpoint_file: Path to checkpoint file for resume
            max_workers: Max concurrent downloads
        """
        self.email = email or os.getenv('PRINTAVO_EMAIL', '')
        self.password = password or os.getenv('PRINTAVO_PASSWORD', '')
        self.output_dir = output_dir or Path('data/artwork')
        self.checkpoint_file = checkpoint_file
        self.max_workers = min(max_workers, self.MAX_CONCURRENT_DOWNLOADS)
        
        if not self.email or not self.password:
            raise ValueError("PRINTAVO_EMAIL and PRINTAVO_PASSWORD are required")
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        })
        
        self.stats = DownloadStats()
        self._logged_in = False
        self._checkpoint: Dict[str, Any] = {}
        self._completed_orders: Set[int] = set()
        
        if checkpoint_file and checkpoint_file.exists():
            self._load_checkpoint()
    
    def _load_checkpoint(self) -> None:
        """Load checkpoint from file."""
        if self.checkpoint_file and self.checkpoint_file.exists():
            import json
            try:
                with open(self.checkpoint_file, 'r') as f:
                    self._checkpoint = json.load(f)
                self._completed_orders = set(self._checkpoint.get('completed_orders', []))
            except (ValueError, IOError):
                self._checkpoint = {}
    
    def _save_checkpoint(self) -> None:
        """Save checkpoint to file."""
        if self.checkpoint_file:
            import json
            self._checkpoint['completed_orders'] = list(self._completed_orders)
            self._checkpoint['updated_at'] = datetime.now().isoformat()
            self._checkpoint['stats'] = {
                'files_downloaded': self.stats.files_downloaded,
                'bytes_downloaded': self.stats.bytes_downloaded,
                'orders_processed': self.stats.orders_processed,
            }
            with open(self.checkpoint_file, 'w') as f:
                json.dump(self._checkpoint, f, indent=2)
    
    def login(self) -> bool:
        """
        Authenticate with Printavo web interface.
        
        Returns:
            True if login successful
        """
        print("🔐 Logging in to Printavo...")
        
        try:
            response = self.session.get(self.LOGIN_URL, timeout=30)
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
            
            response = self.session.post(
                self.LOGIN_URL, 
                data=login_data, 
                allow_redirects=True,
                timeout=30
            )
            
            if any(x in response.url for x in ['dashboard', 'invoices', 'calendar']):
                print("✅ Login successful")
                self._logged_in = True
                return True
            
            if 'Invalid Email or password' in response.text:
                print("❌ Invalid credentials")
                return False
            
            print(f"⚠️ Login status unclear. URL: {response.url}")
            return False
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Login failed: {e}")
            return False
    
    def _extract_file_urls(self, html: str, page_url: str) -> List[ScrapedFile]:
        """
        Extract artwork and file URLs from order page HTML.
        
        Args:
            html: Page HTML content
            page_url: URL of the page
            
        Returns:
            List of ScrapedFile objects
        """
        soup = BeautifulSoup(html, HTML_PARSER)
        files: List[ScrapedFile] = []
        seen_urls: Set[str] = set()
        
        # CSS selectors and their source types
        selectors = [
            ('img[src*="mockup"]', 'mockup'),
            ('img[src*="proof"]', 'proof'),
            ('img[src*="artwork"]', 'artwork'),
            ('img[src*="filestackcontent.com"]', 'artwork'),
            ('a[href*="filestackcontent.com"]', 'file'),
            ('img[src*="filepicker.io"]', 'artwork'),
            ('a[href*="filepicker.io"]', 'file'),
            ('img[src*="cdn.filepicker.io"]', 'artwork'),
            ('a[href*="cdn.filepicker.io"]', 'file'),
            ('img[src*="s3.amazonaws"]', 'artwork'),
            ('a[href*="s3.amazonaws"]', 'file'),
            ('.line-item-group img', 'lineitem'),
            ('.imprint-image img', 'imprint'),
            ('a[href*="/attachments/"]', 'attachment'),
            ('a[href*=".dst"]', 'embroidery'),
            ('a[href*=".pes"]', 'embroidery'),
            ('a[href*=".eps"]', 'vector'),
            ('a[href*=".ai"]', 'vector'),
            ('a[href*=".pdf"]', 'document'),
        ]
        
        for selector, source_type in selectors:
            elements = soup.select(selector)
            for elem in elements:
                url = elem.get('src') or elem.get('href')
                if not url:
                    continue
                
                # Make URL absolute
                url = urljoin(page_url, url)
                
                # Skip duplicates
                if url in seen_urls:
                    continue
                
                # Skip tracking pixels and icons
                parsed = urlparse(url)
                path_lower = parsed.path.lower()
                
                skip_patterns = [
                    'pixel', 'tracking', 'icon', 'logo', 'avatar', 
                    'spacer', 'blank', '1x1', 'loader', 'spinner'
                ]
                if any(pattern in path_lower for pattern in skip_patterns):
                    continue
                
                # Detect file type
                ext, file_type = FileDetector.detect_from_url(url)
                
                # Skip unknown types unless from known CDNs
                is_cdn = any(cdn in url for cdn in [
                    'filestackcontent.com', 
                    'filepicker.io', 
                    's3.amazonaws',
                    'cdn.filepicker.io'
                ])
                
                if file_type == FileType.UNKNOWN and not is_cdn:
                    continue
                
                # Get original file URL (remove resize parameters)
                if 'filestackcontent.com' in url and 'resize=' in url:
                    match = re.search(r'(https://cdn\.filepicker\.io/[A-Za-z0-9]+)', url)
                    if match:
                        url = match.group(1)
                
                seen_urls.add(url)
                
                # Generate filename
                filename = FileDetector.generate_filename(
                    source_type, 
                    url, 
                    index=len(files)
                )
                
                files.append(ScrapedFile(
                    url=url,
                    filename=filename,
                    file_type=file_type,
                    source_type=source_type,
                ))
        
        return files
    
    def _download_file(
        self, 
        file: ScrapedFile, 
        output_dir: Path,
        verify: bool = True
    ) -> bool:
        """
        Download a single file.
        
        Args:
            file: ScrapedFile to download
            output_dir: Directory to save file
            verify: Whether to verify file integrity
            
        Returns:
            True if download successful
        """
        output_path = output_dir / file.filename
        
        # Skip if already exists and has content
        if output_path.exists() and output_path.stat().st_size > 0:
            self.stats.files_skipped += 1
            file.downloaded = True
            file.local_path = output_path
            return True
        
        try:
            response = self.session.get(
                file.url,
                stream=True,
                timeout=60,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # Write file
            output_dir.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = output_path.stat().st_size
            
            # Verify file
            if verify:
                is_valid, error = FileDetector.validate_file(output_path, file.file_type)
                if not is_valid:
                    output_path.unlink()
                    self.stats.files_failed += 1
                    self.stats.errors.append(f"Validation failed {file.url}: {error}")
                    return False
            
            file.downloaded = True
            file.local_path = output_path
            file.size_bytes = file_size
            
            self.stats.files_downloaded += 1
            self.stats.bytes_downloaded += file_size
            
            time.sleep(self.DOWNLOAD_DELAY)
            return True
            
        except requests.exceptions.RequestException as e:
            self.stats.files_failed += 1
            self.stats.errors.append(f"Download failed {file.url}: {str(e)}")
            return False
    
    def _download_files_parallel(
        self,
        files: List[ScrapedFile],
        output_dir: Path
    ) -> List[ScrapedFile]:
        """
        Download files in parallel.
        
        Args:
            files: List of files to download
            output_dir: Directory to save files
            
        Returns:
            List of successfully downloaded files
        """
        downloaded = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self._download_file, f, output_dir): f
                for f in files
            }
            
            for future in as_completed(futures):
                file = futures[future]
                try:
                    if future.result():
                        downloaded.append(file)
                except Exception as e:
                    self.stats.errors.append(f"Download error: {str(e)}")
        
        return downloaded
    
    def _get_order_output_path(self, order: Dict[str, Any]) -> Path:
        """
        Generate output path for order files.
        
        Structure: by_customer/{customer-slug}-{id}/{year}/{visual_id}_{order-slug}/
        
        Args:
            order: Order data dict
            
        Returns:
            Path for order files
        """
        # Customer info
        customer = order.get('customer', {})
        customer_id = customer.get('id') or order.get('customer_id', 'unknown')
        customer_name = (
            customer.get('company_name') or 
            customer.get('full_name') or 
            'Unknown Customer'
        )
        customer_slug = slugify(customer_name)
        
        # Order info
        visual_id = order.get('visual_id', order.get('id'))
        order_nickname = order.get('order_nickname', '') or f"order-{visual_id}"
        order_slug = slugify(order_nickname)
        
        # Date for year organization
        created_at = order.get('created_at') or order.get('custom_created_at', '')
        try:
            year = datetime.fromisoformat(created_at.replace('Z', '+00:00')).year
        except (ValueError, AttributeError):
            year = 'unknown'
        
        # Build path
        customer_folder = f"{customer_slug}-{customer_id}"
        order_folder = f"{visual_id}_{order_slug}"
        
        return self.output_dir / "by_customer" / customer_folder / str(year) / order_folder
    
    def scrape_order(
        self,
        order: Dict[str, Any],
        download: bool = True
    ) -> Dict[str, Any]:
        """
        Scrape files from a single order.
        
        Args:
            order: Order data dict
            download: Whether to download files
            
        Returns:
            Dict with scraped files info
        """
        order_id = order.get('id')
        visual_id = order.get('visual_id')
        
        # Skip if already completed
        if order_id in self._completed_orders:
            return {'status': 'skipped', 'reason': 'already completed'}
        
        # Get order page URLs to try
        public_url = order.get('public_url') or order.get('url')
        urls_to_try = [
            public_url,
            f"https://www.printavo.com/invoices/{order_id}",
            f"https://www.printavo.com/invoices/{order_id}/workorder"
        ]
        
        html = None
        used_url = None
        
        for url in urls_to_try:
            if not url:
                continue
            try:
                response = self.session.get(url, timeout=30)
                if response.status_code == 200:
                    html = response.text
                    used_url = url
                    break
                elif response.status_code == 429:
                    # Rate limited
                    time.sleep(10)
            except requests.exceptions.RequestException:
                continue
        
        if not html:
            return {'status': 'error', 'reason': 'could not fetch order page'}
        
        # Extract files
        files = self._extract_file_urls(html, used_url)
        
        if not files:
            self.stats.orders_processed += 1
            self._completed_orders.add(order_id)
            return {'status': 'success', 'files': 0, 'reason': 'no files found'}
        
        # Add order info to files
        for f in files:
            f.order_id = order_id
            f.order_visual_id = visual_id
            f.customer_id = order.get('customer', {}).get('id')
        
        result = {
            'status': 'success',
            'order_id': order_id,
            'visual_id': visual_id,
            'files_found': len(files),
            'files': files
        }
        
        if download:
            output_path = self._get_order_output_path(order)
            downloaded = self._download_files_parallel(files, output_path)
            
            result['files_downloaded'] = len(downloaded)
            result['output_path'] = str(output_path)
            
            if downloaded:
                self.stats.orders_with_files += 1
                
                # Save order manifest
                self._save_order_manifest(order, downloaded, output_path)
        
        self.stats.orders_processed += 1
        self._completed_orders.add(order_id)
        
        time.sleep(self.REQUEST_DELAY)
        return result
    
    def _save_order_manifest(
        self,
        order: Dict[str, Any],
        files: List[ScrapedFile],
        output_path: Path
    ) -> None:
        """Save order manifest with file info."""
        import json
        
        customer = order.get('customer', {})
        manifest = {
            'order_id': order.get('id'),
            'visual_id': order.get('visual_id'),
            'order_nickname': order.get('order_nickname', ''),
            'customer_id': customer.get('id'),
            'customer_name': customer.get('company_name') or customer.get('full_name', ''),
            'created_at': order.get('created_at'),
            'scraped_at': datetime.now().isoformat(),
            'files': [
                {
                    'filename': f.filename,
                    'url': f.url,
                    'type': f.file_type.value,
                    'source': f.source_type,
                    'size_bytes': f.size_bytes,
                }
                for f in files
            ]
        }
        
        manifest_path = output_path / 'manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
    
    def scrape_orders(
        self,
        orders: List[Dict[str, Any]],
        on_progress: Optional[Callable[[int, int, Dict], None]] = None,
        checkpoint_interval: int = 20
    ) -> Dict[str, Any]:
        """
        Scrape files from multiple orders.
        
        Args:
            orders: List of order dicts
            on_progress: Callback (current, total, result) for progress
            checkpoint_interval: Save checkpoint every N orders
            
        Returns:
            Summary dict
        """
        if not self._logged_in:
            if not self.login():
                return {'status': 'error', 'reason': 'login failed'}
        
        total = len(orders)
        results = []
        
        for i, order in enumerate(orders):
            result = self.scrape_order(order, download=True)
            results.append(result)
            
            if on_progress:
                on_progress(i + 1, total, result)
            
            # Save checkpoint
            if (i + 1) % checkpoint_interval == 0:
                self._save_checkpoint()
        
        # Final checkpoint
        self._save_checkpoint()
        
        return {
            'status': 'success',
            'orders_processed': self.stats.orders_processed,
            'orders_with_files': self.stats.orders_with_files,
            'files_downloaded': self.stats.files_downloaded,
            'bytes_downloaded': self.stats.bytes_downloaded,
            'files_skipped': self.stats.files_skipped,
            'files_failed': self.stats.files_failed,
            'errors': self.stats.errors[-20:],  # Last 20 errors
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scraping statistics."""
        return {
            'files_downloaded': self.stats.files_downloaded,
            'bytes_downloaded': self.stats.bytes_downloaded,
            'files_skipped': self.stats.files_skipped,
            'files_failed': self.stats.files_failed,
            'orders_processed': self.stats.orders_processed,
            'orders_with_files': self.stats.orders_with_files,
            'completed_orders': len(self._completed_orders),
            'errors': len(self.stats.errors),
        }
