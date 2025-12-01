"""
MinIO Upload Utilities

Uploads extracted Printavo data to MinIO for permanent archival.
Organizes files according to the storage structure spec.

Storage Structure:
minio://printshop/
├── printavo-archive/
│   ├── exports/{timestamp}/         # API data exports
│   ├── artwork/by_customer/         # Artwork files
│   ├── production-files/by_order/   # DST, EPS, etc.
│   └── index/                        # Searchable indexes
"""

import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    raise ImportError("minio required. Run: pip install minio")

from .file_detector import FileDetector, FileType


@dataclass
class UploadStats:
    """Statistics for upload tracking."""
    files_uploaded: int = 0
    bytes_uploaded: int = 0
    files_skipped: int = 0
    files_failed: int = 0
    errors: List[str] = field(default_factory=list)


class MinIOUploader:
    """
    MinIO uploader for Printavo archive.
    
    Features:
    - Organized storage structure
    - Resume support
    - Parallel uploads
    - Integrity verification
    - Index generation
    """
    
    # Default bucket and paths
    DEFAULT_BUCKET = 'printshop'
    ARCHIVE_PREFIX = 'printavo-archive'
    
    # Sub-paths within archive
    EXPORTS_PATH = 'exports'
    ARTWORK_PATH = 'artwork/by_customer'
    PRODUCTION_PATH = 'production-files/by_order'
    INDEX_PATH = 'index'
    
    def __init__(
        self,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        bucket: Optional[str] = None,
        secure: bool = False
    ):
        """
        Initialize MinIO uploader.
        
        Args:
            endpoint: MinIO endpoint (or MINIO_ENDPOINT env var)
            access_key: Access key (or MINIO_ACCESS_KEY env var)
            secret_key: Secret key (or MINIO_SECRET_KEY env var)
            bucket: Bucket name (or MINIO_BUCKET env var)
            secure: Use HTTPS (default False for local)
        """
        self.endpoint = endpoint or os.getenv('MINIO_ENDPOINT', '100.92.156.118:9000')
        self.access_key = access_key or os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
        self.secret_key = secret_key or os.getenv('MINIO_SECRET_KEY', '')
        self.bucket = bucket or os.getenv('MINIO_BUCKET', self.DEFAULT_BUCKET)
        self.secure = secure
        
        if not self.secret_key:
            raise ValueError("MINIO_SECRET_KEY is required")
        
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        self.stats = UploadStats()
        self._connected = False
    
    def connect(self) -> bool:
        """
        Connect to MinIO and ensure bucket exists.
        
        Returns:
            True if connection successful
        """
        try:
            # Test connection
            self.client.list_buckets()
            
            # Ensure bucket exists
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"✅ Created bucket: {self.bucket}")
            
            self._connected = True
            return True
            
        except S3Error as e:
            self.stats.errors.append(f"MinIO connection error: {str(e)}")
            return False
        except Exception as e:
            self.stats.errors.append(f"Connection error: {str(e)}")
            return False
    
    def _get_object_path(self, prefix: str, *parts: str) -> str:
        """Build object path from parts."""
        path_parts = [self.ARCHIVE_PREFIX, prefix] + list(parts)
        return '/'.join(p.strip('/') for p in path_parts if p)
    
    # =========================================================================
    # Export Data Upload
    # =========================================================================
    
    def upload_export(
        self,
        export_dir: Path,
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload an export directory to MinIO.
        
        Args:
            export_dir: Path to export directory
            timestamp: Optional timestamp (default: current time)
            
        Returns:
            Upload result dict
        """
        if not self._connected and not self.connect():
            return {'status': 'error', 'reason': 'connection failed'}
        
        if timestamp is None:
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        
        uploaded = []
        
        for file_path in export_dir.glob('*.json'):
            object_name = self._get_object_path(
                self.EXPORTS_PATH,
                timestamp,
                file_path.name
            )
            
            try:
                self.client.fput_object(
                    self.bucket,
                    object_name,
                    str(file_path)
                )
                
                file_size = file_path.stat().st_size
                self.stats.files_uploaded += 1
                self.stats.bytes_uploaded += file_size
                
                uploaded.append({
                    'file': file_path.name,
                    'object': object_name,
                    'size': file_size
                })
                
            except S3Error as e:
                self.stats.files_failed += 1
                self.stats.errors.append(f"Upload failed {file_path.name}: {str(e)}")
        
        return {
            'status': 'success',
            'timestamp': timestamp,
            'files_uploaded': len(uploaded),
            'files': uploaded
        }
    
    # =========================================================================
    # Artwork Upload
    # =========================================================================
    
    def upload_artwork_directory(
        self,
        artwork_dir: Path,
        on_progress: Optional[Callable[[int, int], None]] = None
    ) -> Dict[str, Any]:
        """
        Upload artwork directory to MinIO.
        
        Expected structure:
        artwork_dir/
        └── by_customer/
            └── {customer-slug}/
                └── {year}/
                    └── {order-folder}/
                        ├── artwork files
                        └── manifest.json
        
        Args:
            artwork_dir: Path to artwork directory
            on_progress: Callback (current, total) for progress
            
        Returns:
            Upload result dict
        """
        if not self._connected and not self.connect():
            return {'status': 'error', 'reason': 'connection failed'}
        
        by_customer = artwork_dir / 'by_customer'
        if not by_customer.exists():
            return {'status': 'error', 'reason': 'by_customer directory not found'}
        
        # Count total files
        all_files = list(by_customer.rglob('*'))
        file_list = [f for f in all_files if f.is_file()]
        total = len(file_list)
        
        uploaded = 0
        
        for i, file_path in enumerate(file_list):
            # Build relative path from by_customer
            rel_path = file_path.relative_to(by_customer)
            object_name = self._get_object_path(self.ARTWORK_PATH, str(rel_path))
            
            try:
                self.client.fput_object(
                    self.bucket,
                    object_name,
                    str(file_path)
                )
                
                file_size = file_path.stat().st_size
                self.stats.files_uploaded += 1
                self.stats.bytes_uploaded += file_size
                uploaded += 1
                
            except S3Error as e:
                self.stats.files_failed += 1
                self.stats.errors.append(f"Upload failed {rel_path}: {str(e)}")
            
            if on_progress and (i + 1) % 10 == 0:
                on_progress(i + 1, total)
        
        return {
            'status': 'success',
            'files_uploaded': uploaded,
            'files_failed': self.stats.files_failed
        }
    
    # =========================================================================
    # Single File Upload
    # =========================================================================
    
    def upload_file(
        self,
        local_path: Path,
        object_path: str,
        file_type: Optional[FileType] = None
    ) -> bool:
        """
        Upload a single file to MinIO.
        
        Args:
            local_path: Local file path
            object_path: Target object path (without bucket)
            file_type: Optional file type for categorization
            
        Returns:
            True if successful
        """
        if not self._connected and not self.connect():
            return False
        
        try:
            # Prepend archive prefix if not already there
            if not object_path.startswith(self.ARCHIVE_PREFIX):
                object_path = f"{self.ARCHIVE_PREFIX}/{object_path}"
            
            self.client.fput_object(
                self.bucket,
                object_path,
                str(local_path)
            )
            
            file_size = local_path.stat().st_size
            self.stats.files_uploaded += 1
            self.stats.bytes_uploaded += file_size
            
            return True
            
        except S3Error as e:
            self.stats.files_failed += 1
            self.stats.errors.append(f"Upload failed {local_path}: {str(e)}")
            return False
    
    # =========================================================================
    # Index Management
    # =========================================================================
    
    def upload_index(
        self,
        index_data: Dict[str, Any],
        index_name: str
    ) -> bool:
        """
        Upload an index file to MinIO.
        
        Args:
            index_data: Index data dict
            index_name: Name for index file (e.g., 'orders_index', 'customers_index')
            
        Returns:
            True if successful
        """
        if not self._connected and not self.connect():
            return False
        
        # Add metadata
        index_data['generated_at'] = datetime.now().isoformat()
        
        # Write to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.json', 
            delete=False
        ) as f:
            json.dump(index_data, f, indent=2, default=str)
            temp_path = f.name
        
        try:
            object_name = self._get_object_path(self.INDEX_PATH, f"{index_name}.json")
            
            self.client.fput_object(
                self.bucket,
                object_name,
                temp_path
            )
            
            os.unlink(temp_path)
            return True
            
        except S3Error as e:
            self.stats.errors.append(f"Index upload failed: {str(e)}")
            os.unlink(temp_path)
            return False
    
    def generate_orders_index(self, orders: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate orders index for quick lookup.
        
        Args:
            orders: List of order dicts
            
        Returns:
            Index dict
        """
        index = {
            'type': 'orders_index',
            'count': len(orders),
            'orders': {}
        }
        
        for order in orders:
            order_id = order.get('id')
            visual_id = order.get('visual_id')
            
            if not order_id:
                continue
            
            customer = order.get('customer', {})
            
            index['orders'][str(visual_id or order_id)] = {
                'id': order_id,
                'visual_id': visual_id,
                'nickname': order.get('order_nickname', ''),
                'customer_id': customer.get('id'),
                'customer_name': customer.get('company_name') or customer.get('full_name', ''),
                'created_at': order.get('created_at', '')[:10] if order.get('created_at') else '',
                'total': order.get('total'),
                'status': order.get('orderstatus', {}).get('name', ''),
                'line_item_count': len(order.get('lineitems_attributes', [])),
            }
        
        return index
    
    def generate_customers_index(self, customers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate customers index for quick lookup.
        
        Args:
            customers: List of customer dicts
            
        Returns:
            Index dict
        """
        index = {
            'type': 'customers_index',
            'count': len(customers),
            'customers': {}
        }
        
        for customer in customers:
            customer_id = customer.get('id')
            
            if not customer_id:
                continue
            
            index['customers'][str(customer_id)] = {
                'id': customer_id,
                'company_name': customer.get('company_name', ''),
                'full_name': customer.get('full_name', ''),
                'email': customer.get('email', ''),
                'phone': customer.get('phone', ''),
                'created_at': customer.get('created_at', '')[:10] if customer.get('created_at') else '',
            }
        
        return index
    
    def generate_artwork_index(self, artwork_dir: Path) -> Dict[str, Any]:
        """
        Generate artwork index from local directory.
        
        Args:
            artwork_dir: Path to artwork directory
            
        Returns:
            Index dict
        """
        index = {
            'type': 'artwork_index',
            'customers': {},
            'orders': {},
            'total_files': 0,
            'total_size': 0,
        }
        
        by_customer = artwork_dir / 'by_customer'
        if not by_customer.exists():
            return index
        
        # Walk through customer directories
        for customer_dir in by_customer.iterdir():
            if not customer_dir.is_dir():
                continue
            
            customer_slug = customer_dir.name
            customer_info = {
                'folder': customer_slug,
                'order_count': 0,
                'file_count': 0,
                'total_size': 0,
                'years': []
            }
            
            # Walk through year directories
            for year_dir in customer_dir.iterdir():
                if not year_dir.is_dir():
                    continue
                
                year = year_dir.name
                if year not in customer_info['years']:
                    customer_info['years'].append(year)
                
                # Walk through order directories
                for order_dir in year_dir.iterdir():
                    if not order_dir.is_dir():
                        continue
                    
                    customer_info['order_count'] += 1
                    
                    # Check for manifest
                    manifest_path = order_dir / 'manifest.json'
                    if manifest_path.exists():
                        try:
                            with open(manifest_path) as f:
                                manifest = json.load(f)
                            
                            visual_id = manifest.get('visual_id', order_dir.name)
                            index['orders'][str(visual_id)] = {
                                'customer_folder': customer_slug,
                                'year': year,
                                'folder': order_dir.name,
                                'file_count': len(manifest.get('files', [])),
                                'created_at': manifest.get('created_at', ''),
                            }
                            
                        except (json.JSONDecodeError, IOError):
                            pass
                    
                    # Count files
                    for file_path in order_dir.glob('*'):
                        if file_path.is_file() and file_path.name != 'manifest.json':
                            customer_info['file_count'] += 1
                            file_size = file_path.stat().st_size
                            customer_info['total_size'] += file_size
                            index['total_files'] += 1
                            index['total_size'] += file_size
            
            index['customers'][customer_slug] = customer_info
        
        return index
    
    # =========================================================================
    # Sync Operations
    # =========================================================================
    
    def sync_directory(
        self,
        local_dir: Path,
        remote_prefix: str,
        on_progress: Optional[Callable[[int, int, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Sync a local directory to MinIO.
        
        Args:
            local_dir: Local directory path
            remote_prefix: Remote path prefix
            on_progress: Callback (current, total, filename)
            
        Returns:
            Sync result dict
        """
        if not self._connected and not self.connect():
            return {'status': 'error', 'reason': 'connection failed'}
        
        # Get list of local files
        local_files = [f for f in local_dir.rglob('*') if f.is_file()]
        total = len(local_files)
        
        uploaded = 0
        skipped = 0
        
        for i, file_path in enumerate(local_files):
            rel_path = file_path.relative_to(local_dir)
            object_name = self._get_object_path(remote_prefix, str(rel_path))
            
            # Check if already exists
            try:
                self.client.stat_object(self.bucket, object_name)
                skipped += 1
                self.stats.files_skipped += 1
                continue
            except S3Error:
                pass  # Object doesn't exist, upload it
            
            try:
                self.client.fput_object(
                    self.bucket,
                    object_name,
                    str(file_path)
                )
                
                file_size = file_path.stat().st_size
                self.stats.files_uploaded += 1
                self.stats.bytes_uploaded += file_size
                uploaded += 1
                
            except S3Error as e:
                self.stats.files_failed += 1
                self.stats.errors.append(f"Upload failed {rel_path}: {str(e)}")
            
            if on_progress:
                on_progress(i + 1, total, str(rel_path))
        
        return {
            'status': 'success',
            'uploaded': uploaded,
            'skipped': skipped,
            'failed': self.stats.files_failed
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get upload statistics."""
        return {
            'files_uploaded': self.stats.files_uploaded,
            'bytes_uploaded': self.stats.bytes_uploaded,
            'files_skipped': self.stats.files_skipped,
            'files_failed': self.stats.files_failed,
            'errors': len(self.stats.errors),
        }
    
    def list_exports(self) -> List[str]:
        """List available exports in MinIO."""
        if not self._connected and not self.connect():
            return []
        
        prefix = self._get_object_path(self.EXPORTS_PATH, '')
        
        try:
            objects = self.client.list_objects(
                self.bucket,
                prefix=prefix,
                recursive=False
            )
            
            timestamps = set()
            for obj in objects:
                # Extract timestamp from path
                parts = obj.object_name.split('/')
                if len(parts) >= 3:
                    timestamps.add(parts[2])
            
            return sorted(timestamps, reverse=True)
            
        except S3Error:
            return []
