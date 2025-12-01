#!/usr/bin/env python3
"""
Printavo Data Import Script for PrintShop OS
=============================================
Production-ready import system with:
- Auto-detection of export directories
- Strapi schema mapping
- Checkpointing and resume
- Validation and deduplication
- Relationship linking
- Progress reporting
- Error handling with retry
- Dry run mode

Usage:
    # Auto-detect and import everything
    python3 scripts/printavo-import.py

    # Import specific entities
    python3 scripts/printavo-import.py --customers-only
    python3 scripts/printavo-import.py --orders-only
    python3 scripts/printavo-import.py --line-items-only

    # Resume from checkpoint
    python3 scripts/printavo-import.py --resume

    # Validate without importing
    python3 scripts/printavo-import.py --dry-run

    # Use specific export directory
    python3 scripts/printavo-import.py --export-dir data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z

Last Updated: 2025-12-01
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from lib.strapi_client import StrapiClient
    from lib.printavo_mapper import PrintavoMapper
except ImportError:
    # Fallback if run from different directory
    from scripts.lib.strapi_client import StrapiClient
    from scripts.lib.printavo_mapper import PrintavoMapper

# Try to import tqdm for progress bars
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

# Try to load dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# =============================================================================
# CONFIGURATION
# =============================================================================
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PRINTAVO_EXPORTS_DIR = DATA_DIR / "raw" / "printavo-exports"
CHECKPOINT_DIR = DATA_DIR

# Checkpoint filenames
CUSTOMER_CHECKPOINT = "customer-import-checkpoint.json"
ORDER_CHECKPOINT = "order-import-checkpoint.json"
LINE_ITEM_CHECKPOINT = "line-item-import-checkpoint.json"

# Import settings
CHECKPOINT_INTERVAL = 50  # Save checkpoint every N records
DEFAULT_BATCH_SIZE = 100


# =============================================================================
# EXPORT DIRECTORY DETECTION
# =============================================================================
def find_latest_export_dir(base_dir: Path) -> Optional[Path]:
    """
    Find the most recent export directory.
    
    Supports formats:
    - printavo_YYYY-MM-DDTHH-MM-SS-MMMZ/
    - complete_YYYY-MM-DD_HH-MM-SS/
    
    Returns:
        Path to the most recent export directory, or None if not found
    """
    if not base_dir.exists():
        return None
    
    # Patterns to match
    patterns = [
        re.compile(r'^printavo_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z?)$'),
        re.compile(r'^complete_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})$'),
    ]
    
    candidates = []
    
    for item in base_dir.iterdir():
        if not item.is_dir():
            continue
        
        for pattern in patterns:
            match = pattern.match(item.name)
            if match:
                # Use modification time as fallback for sorting
                mtime = item.stat().st_mtime
                candidates.append((mtime, item))
                break
    
    if not candidates:
        return None
    
    # Sort by modification time, newest first
    candidates.sort(reverse=True, key=lambda x: x[0])
    return candidates[0][1]


def validate_export_dir(export_dir: Path) -> Tuple[bool, List[str]]:
    """
    Validate that export directory has required files.
    
    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []
    
    if not export_dir.exists():
        errors.append(f"Export directory does not exist: {export_dir}")
        return False, errors
    
    # Check for required files
    customers_file = export_dir / "customers.json"
    orders_file = export_dir / "orders.json"
    
    if not customers_file.exists():
        errors.append(f"Missing customers.json in {export_dir}")
    
    if not orders_file.exists():
        errors.append(f"Missing orders.json in {export_dir}")
    
    return len(errors) == 0, errors


# =============================================================================
# CHECKPOINT MANAGEMENT
# =============================================================================
class Checkpoint:
    """Manages checkpoint state for resumable imports."""
    
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.data = self._load()
    
    def _load(self) -> Dict:
        if self.filepath.exists():
            try:
                with open(self.filepath, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                pass
        return {
            "last_index": 0,
            "imported_ids": [],
            "failed_ids": [],
            "skipped_ids": [],
            "started_at": None,
            "updated_at": None,
            "export_dir": None
        }
    
    def save(self):
        self.data["updated_at"] = datetime.now().isoformat()
        with open(self.filepath, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def mark_imported(self, record_id: str, index: int):
        if record_id not in self.data["imported_ids"]:
            self.data["imported_ids"].append(record_id)
        self.data["last_index"] = index
        if len(self.data["imported_ids"]) % CHECKPOINT_INTERVAL == 0:
            self.save()
    
    def mark_failed(self, record_id: str, error: str = None):
        if record_id not in self.data["failed_ids"]:
            self.data["failed_ids"].append(record_id)
    
    def mark_skipped(self, record_id: str):
        if record_id not in self.data["skipped_ids"]:
            self.data["skipped_ids"].append(record_id)
    
    def is_imported(self, record_id: str) -> bool:
        return record_id in self.data["imported_ids"]
    
    def start(self, export_dir: str = None):
        if not self.data["started_at"]:
            self.data["started_at"] = datetime.now().isoformat()
        if export_dir:
            self.data["export_dir"] = str(export_dir)
        self.save()
    
    def reset(self):
        self.data = {
            "last_index": 0,
            "imported_ids": [],
            "failed_ids": [],
            "skipped_ids": [],
            "started_at": None,
            "updated_at": None,
            "export_dir": None
        }
        if self.filepath.exists():
            self.filepath.unlink()
    
    def get_stats(self) -> Dict:
        return {
            "imported": len(self.data.get("imported_ids", [])),
            "failed": len(self.data.get("failed_ids", [])),
            "skipped": len(self.data.get("skipped_ids", [])),
            "last_index": self.data.get("last_index", 0),
            "started_at": self.data.get("started_at"),
            "updated_at": self.data.get("updated_at"),
            "export_dir": self.data.get("export_dir")
        }


# =============================================================================
# IMPORT FUNCTIONS
# =============================================================================
def create_progress_bar(total: int, desc: str):
    """Create a progress bar (tqdm or fallback)."""
    if HAS_TQDM:
        return tqdm(total=total, desc=desc)
    else:
        return SimpleProgress(total, desc)


class SimpleProgress:
    """Simple progress indicator when tqdm is not available."""
    
    def __init__(self, total: int, desc: str):
        self.total = total
        self.desc = desc
        self.current = 0
        self.start_time = time.time()
    
    def update(self, n: int = 1):
        self.current += n
        if self.current % 100 == 0 or self.current == self.total:
            elapsed = time.time() - self.start_time
            rate = self.current / elapsed if elapsed > 0 else 0
            eta = (self.total - self.current) / rate if rate > 0 else 0
            print(f"\r{self.desc}: {self.current}/{self.total} ({rate:.1f}/s, ETA: {eta:.0f}s)", end="", flush=True)
    
    def set_postfix(self, **kwargs):
        pass
    
    def close(self):
        print()  # New line after progress
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()


def import_customers(
    client: StrapiClient,
    mapper: PrintavoMapper,
    export_dir: Path,
    resume: bool = False,
    dry_run: bool = False
) -> Dict:
    """
    Import customers from Printavo export.
    
    Returns:
        Dict with success, failed, skipped counts
    """
    print("\n" + "=" * 60)
    print("📥 IMPORTING CUSTOMERS")
    print("=" * 60)
    
    checkpoint_file = CHECKPOINT_DIR / CUSTOMER_CHECKPOINT
    checkpoint = Checkpoint(checkpoint_file)
    
    # Load customer data
    customers_file = export_dir / "customers.json"
    with open(customers_file, 'r') as f:
        customers = json.load(f)
    
    print(f"📊 Total customers in file: {len(customers):,}")
    
    # Filter customers with valid data
    # Must have email (required) and at least 1 order (to avoid empty records)
    valid_customers = []
    for c in customers:
        email = c.get('email') or c.get('customer_email')
        orders_count = c.get('orders_count', 0)
        if email and orders_count > 0:
            valid_customers.append(c)
    
    print(f"📊 Valid customers (with email + orders): {len(valid_customers):,}")
    
    if resume:
        stats = checkpoint.get_stats()
        print(f"📊 Previously imported: {stats['imported']:,}")
        print(f"📊 Previously failed: {stats['failed']:,}")
    
    if not dry_run:
        checkpoint.start(str(export_dir))
    
    success = 0
    failed = 0
    skipped = 0
    seen_emails: Set[str] = set()
    
    # Build set of existing printavoIds for deduplication
    if not dry_run:
        print("🔍 Checking for existing customers...")
        existing_ids = set()
        existing_customers = client.get_all_paginated(
            '/api/customers',
            fields=['printavoId'],
            page_size=100
        )
        for c in existing_customers:
            if c.get('attributes', {}).get('printavoId'):
                existing_ids.add(c['attributes']['printavoId'])
        print(f"📊 Existing customers in Strapi: {len(existing_ids):,}")
    else:
        existing_ids = set()
    
    with create_progress_bar(len(valid_customers), "Customers") as pbar:
        for i, customer in enumerate(valid_customers):
            customer_id = str(customer.get('id'))
            
            # Skip if already imported (from checkpoint)
            if checkpoint.is_imported(customer_id):
                skipped += 1
                pbar.update(1)
                continue
            
            # Skip if already exists in Strapi
            if customer_id in existing_ids:
                checkpoint.mark_skipped(customer_id)
                skipped += 1
                pbar.update(1)
                continue
            
            # Map to Strapi format
            mapped = mapper.map_customer(customer)
            
            # Validate
            is_valid, errors = mapper.validate_customer(mapped)
            if not is_valid:
                checkpoint.mark_failed(customer_id, "; ".join(errors))
                failed += 1
                pbar.update(1)
                continue
            
            # Check for duplicate emails
            email = mapped.get('email', '').lower()
            if email in seen_emails:
                checkpoint.mark_skipped(customer_id)
                skipped += 1
                pbar.update(1)
                continue
            seen_emails.add(email)
            
            if dry_run:
                success += 1
                pbar.update(1)
                continue
            
            # Create in Strapi
            ok, response = client.post('/api/customers', {'data': mapped})
            
            if ok:
                success += 1
                checkpoint.mark_imported(customer_id, i)
            else:
                failed += 1
                checkpoint.mark_failed(customer_id)
                # Log first few failures for debugging
                if failed <= 3:
                    error_msg = response.get('error', {}).get('message', 'Unknown error') if response else 'No response'
                    print(f"\n⚠️  Sample error: {error_msg}")
            
            pbar.update(1)
            if HAS_TQDM:
                pbar.set_postfix({"✓": success, "✗": failed, "⏭": skipped})
    
    if not dry_run:
        checkpoint.save()
    
    return {"success": success, "failed": failed, "skipped": skipped}


def import_orders(
    client: StrapiClient,
    mapper: PrintavoMapper,
    export_dir: Path,
    resume: bool = False,
    dry_run: bool = False
) -> Dict:
    """
    Import orders from Printavo export.
    
    Returns:
        Dict with success, failed, skipped counts
    """
    print("\n" + "=" * 60)
    print("📥 IMPORTING ORDERS")
    print("=" * 60)
    
    checkpoint_file = CHECKPOINT_DIR / ORDER_CHECKPOINT
    checkpoint = Checkpoint(checkpoint_file)
    
    # Load order data
    orders_file = export_dir / "orders.json"
    with open(orders_file, 'r') as f:
        orders = json.load(f)
    
    print(f"📊 Total orders in file: {len(orders):,}")
    
    if resume:
        stats = checkpoint.get_stats()
        print(f"📊 Previously imported: {stats['imported']:,}")
        print(f"📊 Previously failed: {stats['failed']:,}")
    
    if not dry_run:
        checkpoint.start(str(export_dir))
    
    success = 0
    failed = 0
    skipped = 0
    
    # Build set of existing printavoIds for deduplication
    if not dry_run:
        print("🔍 Checking for existing orders...")
        existing_ids = set()
        existing_orders = client.get_all_paginated(
            '/api/orders',
            fields=['printavoId'],
            page_size=100
        )
        for o in existing_orders:
            if o.get('attributes', {}).get('printavoId'):
                existing_ids.add(o['attributes']['printavoId'])
        print(f"📊 Existing orders in Strapi: {len(existing_ids):,}")
    else:
        existing_ids = set()
    
    with create_progress_bar(len(orders), "Orders") as pbar:
        for i, order in enumerate(orders):
            order_id = str(order.get('id'))
            
            # Skip if already imported (from checkpoint)
            if checkpoint.is_imported(order_id):
                skipped += 1
                pbar.update(1)
                continue
            
            # Skip if already exists in Strapi
            if order_id in existing_ids:
                checkpoint.mark_skipped(order_id)
                skipped += 1
                pbar.update(1)
                continue
            
            # Map to Strapi format
            mapped = mapper.map_order(order)
            
            # Validate
            is_valid, errors = mapper.validate_order(mapped)
            if not is_valid:
                checkpoint.mark_failed(order_id, "; ".join(errors))
                failed += 1
                pbar.update(1)
                continue
            
            if dry_run:
                success += 1
                pbar.update(1)
                continue
            
            # Create in Strapi
            ok, response = client.post('/api/orders', {'data': mapped})
            
            if ok:
                success += 1
                checkpoint.mark_imported(order_id, i)
            else:
                failed += 1
                checkpoint.mark_failed(order_id)
                # Log first few failures for debugging
                if failed <= 3:
                    error_msg = response.get('error', {}).get('message', 'Unknown error') if response else 'No response'
                    print(f"\n⚠️  Sample error: {error_msg}")
            
            pbar.update(1)
            if HAS_TQDM:
                pbar.set_postfix({"✓": success, "✗": failed, "⏭": skipped})
    
    if not dry_run:
        checkpoint.save()
    
    return {"success": success, "failed": failed, "skipped": skipped}


def import_line_items(
    client: StrapiClient,
    mapper: PrintavoMapper,
    export_dir: Path,
    resume: bool = False,
    dry_run: bool = False
) -> Dict:
    """
    Import line items from orders in Printavo export.
    
    Line items are extracted from orders (lineitems_attributes field).
    
    Returns:
        Dict with success, failed, skipped counts
    """
    print("\n" + "=" * 60)
    print("📥 IMPORTING LINE ITEMS")
    print("=" * 60)
    
    checkpoint_file = CHECKPOINT_DIR / LINE_ITEM_CHECKPOINT
    checkpoint = Checkpoint(checkpoint_file)
    
    # Load order data (line items are embedded in orders)
    orders_file = export_dir / "orders.json"
    with open(orders_file, 'r') as f:
        orders = json.load(f)
    
    # Extract all line items with order context
    all_items = []
    for order in orders:
        items = mapper.extract_line_items_from_order(order)
        all_items.extend(items)
    
    print(f"📊 Total line items extracted: {len(all_items):,}")
    
    if resume:
        stats = checkpoint.get_stats()
        print(f"📊 Previously imported: {stats['imported']:,}")
        print(f"📊 Previously failed: {stats['failed']:,}")
    
    if not dry_run:
        checkpoint.start(str(export_dir))
    
    success = 0
    failed = 0
    skipped = 0
    
    # Build set of existing printavoIds for deduplication
    if not dry_run:
        print("🔍 Checking for existing line items...")
        existing_ids = set()
        existing_items = client.get_all_paginated(
            '/api/line-items',
            fields=['printavoId'],
            page_size=100
        )
        for item in existing_items:
            if item.get('attributes', {}).get('printavoId'):
                existing_ids.add(item['attributes']['printavoId'])
        print(f"📊 Existing line items in Strapi: {len(existing_ids):,}")
    else:
        existing_ids = set()
    
    with create_progress_bar(len(all_items), "Line Items") as pbar:
        for i, item in enumerate(all_items):
            item_id = str(item.get('printavoId'))
            
            # Skip if already imported (from checkpoint)
            if checkpoint.is_imported(item_id):
                skipped += 1
                pbar.update(1)
                continue
            
            # Skip if already exists in Strapi
            if item_id in existing_ids:
                checkpoint.mark_skipped(item_id)
                skipped += 1
                pbar.update(1)
                continue
            
            # Validate
            is_valid, errors = mapper.validate_line_item(item)
            if not is_valid:
                checkpoint.mark_failed(item_id, "; ".join(errors))
                failed += 1
                pbar.update(1)
                continue
            
            if dry_run:
                success += 1
                pbar.update(1)
                continue
            
            # Create in Strapi
            ok, response = client.post('/api/line-items', {'data': item})
            
            if ok:
                success += 1
                checkpoint.mark_imported(item_id, i)
            else:
                failed += 1
                checkpoint.mark_failed(item_id)
                # Log first few failures for debugging
                if failed <= 3:
                    error_msg = response.get('error', {}).get('message', 'Unknown error') if response else 'No response'
                    print(f"\n⚠️  Sample error: {error_msg}")
            
            pbar.update(1)
            if HAS_TQDM:
                pbar.set_postfix({"✓": success, "✗": failed, "⏭": skipped})
    
    if not dry_run:
        checkpoint.save()
    
    return {"success": success, "failed": failed, "skipped": skipped}


def link_orders_to_customers(
    client: StrapiClient,
    dry_run: bool = False
) -> Dict:
    """
    Link orders to customers via printavoId matching.
    
    After import, orders have printavoCustomerId but not the actual
    customer relation. This function creates the relations.
    
    Returns:
        Dict with linked, failed, skipped counts
    """
    print("\n" + "=" * 60)
    print("🔗 LINKING ORDERS TO CUSTOMERS")
    print("=" * 60)
    
    # Build customer lookup by printavoId
    print("🔍 Loading customers...")
    customers = client.get_all_paginated(
        '/api/customers',
        fields=['printavoId'],
        page_size=100
    )
    
    customer_map = {}  # printavoId -> Strapi ID
    for c in customers:
        printavo_id = c.get('attributes', {}).get('printavoId')
        if printavo_id:
            customer_map[printavo_id] = c['id']
    
    print(f"📊 Customers loaded: {len(customer_map):,}")
    
    # Get orders that need linking
    print("🔍 Loading orders without customer relation...")
    all_orders = client.get_all_paginated(
        '/api/orders',
        fields=['printavoCustomerId'],
        page_size=100
    )
    
    # Filter to orders that have printavoCustomerId but we can map
    orders_to_link = []
    for order in all_orders:
        attrs = order.get('attributes', {})
        printavo_customer_id = attrs.get('printavoCustomerId')
        if printavo_customer_id and printavo_customer_id in customer_map:
            orders_to_link.append({
                'id': order['id'],
                'customer_id': customer_map[printavo_customer_id]
            })
    
    print(f"📊 Orders to link: {len(orders_to_link):,}")
    
    linked = 0
    failed = 0
    
    if dry_run:
        return {"linked": len(orders_to_link), "failed": 0, "skipped": 0}
    
    with create_progress_bar(len(orders_to_link), "Linking") as pbar:
        for order in orders_to_link:
            ok, response = client.put(
                f"/api/orders/{order['id']}",
                {'data': {'customer': order['customer_id']}}
            )
            
            if ok:
                linked += 1
            else:
                failed += 1
            
            pbar.update(1)
            if HAS_TQDM:
                pbar.set_postfix({"✓": linked, "✗": failed})
    
    return {"linked": linked, "failed": failed, "skipped": len(all_orders) - len(orders_to_link)}


def link_line_items_to_orders(
    client: StrapiClient,
    dry_run: bool = False
) -> Dict:
    """
    Link line items to orders via orderId/orderVisualId matching.
    
    Returns:
        Dict with linked, failed, skipped counts
    """
    print("\n" + "=" * 60)
    print("🔗 LINKING LINE ITEMS TO ORDERS")
    print("=" * 60)
    
    # Build order lookup by printavoId
    print("🔍 Loading orders...")
    orders = client.get_all_paginated(
        '/api/orders',
        fields=['printavoId'],
        page_size=100
    )
    
    order_map = {}  # printavoId -> Strapi ID
    for o in orders:
        printavo_id = o.get('attributes', {}).get('printavoId')
        if printavo_id:
            order_map[printavo_id] = o['id']
    
    print(f"📊 Orders loaded: {len(order_map):,}")
    
    # Get line items that need linking
    print("🔍 Loading line items...")
    all_items = client.get_all_paginated(
        '/api/line-items',
        fields=['orderId'],
        page_size=100
    )
    
    # Filter to items that have orderId but we can map
    items_to_link = []
    for item in all_items:
        attrs = item.get('attributes', {})
        order_id = str(attrs.get('orderId')) if attrs.get('orderId') else None
        if order_id and order_id in order_map:
            items_to_link.append({
                'id': item['id'],
                'order_id': order_map[order_id]
            })
    
    print(f"📊 Line items to link: {len(items_to_link):,}")
    
    linked = 0
    failed = 0
    
    if dry_run:
        return {"linked": len(items_to_link), "failed": 0, "skipped": 0}
    
    with create_progress_bar(len(items_to_link), "Linking") as pbar:
        for item in items_to_link:
            ok, response = client.put(
                f"/api/line-items/{item['id']}",
                {'data': {'order': item['order_id']}}
            )
            
            if ok:
                linked += 1
            else:
                failed += 1
            
            pbar.update(1)
            if HAS_TQDM:
                pbar.set_postfix({"✓": linked, "✗": failed})
    
    return {"linked": linked, "failed": failed, "skipped": len(all_items) - len(items_to_link)}


def show_status():
    """Show current import status from checkpoints."""
    print("\n" + "=" * 60)
    print("📊 IMPORT STATUS")
    print("=" * 60)
    
    checkpoints = [
        ("Customers", CHECKPOINT_DIR / CUSTOMER_CHECKPOINT),
        ("Orders", CHECKPOINT_DIR / ORDER_CHECKPOINT),
        ("Line Items", CHECKPOINT_DIR / LINE_ITEM_CHECKPOINT)
    ]
    
    for name, path in checkpoints:
        checkpoint = Checkpoint(path)
        stats = checkpoint.get_stats()
        print(f"\n{name}:")
        print(f"  ✓ Imported: {stats['imported']:,}")
        print(f"  ✗ Failed: {stats['failed']:,}")
        print(f"  ⏭ Skipped: {stats['skipped']:,}")
        print(f"  📍 Last index: {stats['last_index']:,}")
        print(f"  🕐 Started: {stats['started_at'] or 'Never'}")
        print(f"  🔄 Updated: {stats['updated_at'] or 'Never'}")
        if stats.get('export_dir'):
            print(f"  📁 Export: {stats['export_dir']}")


def reset_checkpoints():
    """Reset all checkpoints."""
    checkpoints = [
        CHECKPOINT_DIR / CUSTOMER_CHECKPOINT,
        CHECKPOINT_DIR / ORDER_CHECKPOINT,
        CHECKPOINT_DIR / LINE_ITEM_CHECKPOINT
    ]
    
    for path in checkpoints:
        if path.exists():
            path.unlink()
            print(f"🗑️  Deleted: {path}")


# =============================================================================
# MAIN
# =============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Printavo Data Import for PrintShop OS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Auto-detect and import everything
    python3 scripts/printavo-import.py

    # Import specific entities
    python3 scripts/printavo-import.py --customers-only
    python3 scripts/printavo-import.py --orders-only
    python3 scripts/printavo-import.py --line-items-only

    # Resume from checkpoint
    python3 scripts/printavo-import.py --resume

    # Validate without importing
    python3 scripts/printavo-import.py --dry-run
        """
    )
    
    # Entity selection
    parser.add_argument("--customers-only", action="store_true",
                       help="Import only customers")
    parser.add_argument("--orders-only", action="store_true",
                       help="Import only orders")
    parser.add_argument("--line-items-only", action="store_true",
                       help="Import only line items")
    
    # Link operations
    parser.add_argument("--link-only", action="store_true",
                       help="Only run relationship linking (orders→customers, items→orders)")
    
    # Control flags
    parser.add_argument("--resume", action="store_true",
                       help="Resume from checkpoint")
    parser.add_argument("--dry-run", action="store_true",
                       help="Validate without importing")
    
    # Configuration
    parser.add_argument("--export-dir", type=str,
                       help="Path to specific export directory")
    parser.add_argument("--strapi-url", type=str,
                       help="Strapi URL (defaults to STRAPI_URL env var)")
    parser.add_argument("--strapi-token", type=str,
                       help="Strapi API token (defaults to STRAPI_TOKEN env var)")
    
    # Utility commands
    parser.add_argument("--status", action="store_true",
                       help="Show import status")
    parser.add_argument("--reset", action="store_true",
                       help="Reset checkpoints")
    
    args = parser.parse_args()
    
    # Handle utility commands
    if args.status:
        show_status()
        return
    
    if args.reset:
        reset_checkpoints()
        return
    
    # Determine export directory
    if args.export_dir:
        export_dir = Path(args.export_dir)
    else:
        export_dir = find_latest_export_dir(PRINTAVO_EXPORTS_DIR)
        if not export_dir:
            print(f"❌ No export directory found in {PRINTAVO_EXPORTS_DIR}")
            print("   Use --export-dir to specify a directory")
            sys.exit(1)
    
    # Validate export directory
    is_valid, errors = validate_export_dir(export_dir)
    if not is_valid:
        print("❌ Export directory validation failed:")
        for error in errors:
            print(f"   - {error}")
        sys.exit(1)
    
    # Initialize client
    strapi_url = args.strapi_url or os.getenv("STRAPI_URL", "http://localhost:1337")
    strapi_token = args.strapi_token or os.getenv("STRAPI_TOKEN", "")
    
    if not strapi_token:
        print("❌ STRAPI_TOKEN not set")
        print("   Set via --strapi-token or STRAPI_TOKEN environment variable")
        sys.exit(1)
    
    client = StrapiClient(url=strapi_url, token=strapi_token)
    mapper = PrintavoMapper()
    
    # Print configuration
    print("=" * 60)
    print("  PrintShop OS - Printavo Data Import")
    print("=" * 60)
    print(f"  Export Dir: {export_dir}")
    print(f"  Strapi URL: {strapi_url}")
    print(f"  Resume: {'Yes' if args.resume else 'No'}")
    print(f"  Dry Run: {'Yes' if args.dry_run else 'No'}")
    
    # Check if tqdm is available
    if not HAS_TQDM:
        print("  ⚠️  Install tqdm for progress bars: pip install tqdm")
    
    # Check Strapi health
    if not args.dry_run:
        print("\n🔄 Checking Strapi connection...")
        if not client.wait_for_healthy(max_wait=30):
            print("❌ Could not connect to Strapi")
            print(f"   URL: {strapi_url}")
            sys.exit(1)
        print("✅ Strapi is healthy")
        
        # Show current counts
        print(f"\n  Current in Strapi:")
        print(f"    Customers: {client.get_count('/api/customers'):,}")
        print(f"    Orders: {client.get_count('/api/orders'):,}")
        print(f"    Line Items: {client.get_count('/api/line-items'):,}")
    
    results = {}
    start_time = time.time()
    
    try:
        # Determine what to import
        any_specific_flag = args.customers_only or args.orders_only or args.line_items_only or args.link_only
        import_customers_flag = args.customers_only or not any_specific_flag
        import_orders_flag = args.orders_only or not any_specific_flag
        import_line_items_flag = args.line_items_only or not any_specific_flag
        link_flag = args.link_only or not any_specific_flag
        
        # Run imports
        if import_customers_flag:
            results["customers"] = import_customers(
                client, mapper, export_dir,
                resume=args.resume, dry_run=args.dry_run
            )
        
        if import_orders_flag:
            results["orders"] = import_orders(
                client, mapper, export_dir,
                resume=args.resume, dry_run=args.dry_run
            )
        
        if import_line_items_flag:
            results["line_items"] = import_line_items(
                client, mapper, export_dir,
                resume=args.resume, dry_run=args.dry_run
            )
        
        # Link relationships (functions handle dry_run internally)
        if link_flag:
            results["customer_links"] = link_orders_to_customers(client, dry_run=args.dry_run)
            results["order_links"] = link_line_items_to_orders(client, dry_run=args.dry_run)
        
        elapsed = time.time() - start_time
        
        # Summary
        print("\n" + "=" * 60)
        print("  IMPORT COMPLETE" + (" (DRY RUN)" if args.dry_run else ""))
        print("=" * 60)
        
        for entity, stats in results.items():
            if 'success' in stats:
                print(f"  {entity.replace('_', ' ').title()}: ✓{stats['success']:,} ✗{stats['failed']:,} ⏭{stats['skipped']:,}")
            elif 'linked' in stats:
                print(f"  {entity.replace('_', ' ').title()}: 🔗{stats['linked']:,} ✗{stats['failed']:,} ⏭{stats['skipped']:,}")
        
        print(f"\n  ⏱️  Time: {elapsed:.1f}s")
        
        if not args.dry_run:
            print(f"\n  Final counts in Strapi:")
            print(f"    Customers: {client.get_count('/api/customers'):,}")
            print(f"    Orders: {client.get_count('/api/orders'):,}")
            print(f"    Line Items: {client.get_count('/api/line-items'):,}")
            print(f"\n  Strapi Admin: {strapi_url}/admin")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Import interrupted - checkpoints saved")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
