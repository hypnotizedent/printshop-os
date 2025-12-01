#!/usr/bin/env python3
"""
Printavo Complete Extraction System

Downloads EVERYTHING from Printavo and stores it in MinIO for permanent archival.
This ensures a complete backup before fully migrating away from Printavo.

Features:
- Complete API data extraction (orders, customers, line items, payments, etc.)
- Web scraping for artwork and production files (DST, EPS, AI, PDF, etc.)
- Organized MinIO storage structure
- Resume support with checkpoints
- Rate limiting and parallel downloads
- Progress reporting with ETA

Usage:
    # Full extraction (everything)
    python scripts/printavo-extract-all.py

    # Extract specific data types
    python scripts/printavo-extract-all.py --orders-only
    python scripts/printavo-extract-all.py --artwork-only
    python scripts/printavo-extract-all.py --production-files-only

    # Resume interrupted extraction
    python scripts/printavo-extract-all.py --resume

    # Sync to MinIO
    python scripts/printavo-extract-all.py --sync-to-minio

    # Dry run (list what would be downloaded)
    python scripts/printavo-extract-all.py --dry-run

Environment Variables:
    PRINTAVO_EMAIL - Printavo account email
    PRINTAVO_TOKEN - Printavo API token
    PRINTAVO_PASSWORD - Printavo web login password
    MINIO_ENDPOINT - MinIO endpoint (default: 100.92.156.118:9000)
    MINIO_ACCESS_KEY - MinIO access key
    MINIO_SECRET_KEY - MinIO secret key
    MINIO_BUCKET - MinIO bucket (default: printshop)

Author: PrintShop OS Team
Created: 2025-12-01
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from lib.printavo_api import PrintavoAPI
from lib.printavo_scraper import PrintavoScraper
from lib.minio_uploader import MinIOUploader
from lib.file_detector import FileDetector, FileType


# =============================================================================
# Configuration
# =============================================================================

DEFAULT_DATA_DIR = Path('data/printavo-archive')
DEFAULT_CHECKPOINT_DIR = Path('data')


def format_bytes(size: int) -> str:
    """Format bytes to human readable."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size = size / 1024
    return f"{size:.1f} PB"


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable."""
    if seconds < 60:
        return f"{seconds:.0f}s"
    if seconds < 3600:
        mins = seconds / 60
        return f"{mins:.1f}m"
    hours = seconds / 3600
    return f"{hours:.1f}h"


# =============================================================================
# API Data Extraction
# =============================================================================

def extract_api_data(
    output_dir: Path,
    checkpoint_file: Path,
    include_details: bool = True,
    on_progress: Optional[callable] = None
) -> Dict[str, Any]:
    """
    Extract all data from Printavo API.
    
    Args:
        output_dir: Directory to save extracted data
        checkpoint_file: Path to checkpoint file
        include_details: Include order details (tasks, payments, etc.)
        on_progress: Progress callback
        
    Returns:
        Extraction summary dict
    """
    print("=" * 70)
    print("📦 PRINTAVO API DATA EXTRACTION")
    print("=" * 70)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    api = PrintavoAPI(checkpoint_file=checkpoint_file)
    results = {}
    
    # Timestamp for this extraction
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    export_dir = output_dir / 'exports' / timestamp
    export_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Output directory: {export_dir}")
    print()
    
    # 1. Account info
    print("🏢 Fetching account info...")
    account = api.get_account()
    _save_json(account, export_dir / 'account.json')
    print(f"   ✓ Account info saved")
    
    # 2. Reference data
    print("\n📊 Fetching reference data...")
    
    statuses = api.get_order_statuses()
    _save_json(statuses, export_dir / 'order_statuses.json')
    print(f"   ✓ {len(statuses)} order statuses")
    results['order_statuses'] = len(statuses)
    
    categories = api.get_categories()
    _save_json(categories, export_dir / 'categories.json')
    print(f"   ✓ {len(categories)} categories")
    results['categories'] = len(categories)
    
    delivery_methods = api.get_delivery_methods()
    _save_json(delivery_methods, export_dir / 'delivery_methods.json')
    print(f"   ✓ {len(delivery_methods)} delivery methods")
    results['delivery_methods'] = len(delivery_methods)
    
    payment_terms = api.get_payment_terms()
    _save_json(payment_terms, export_dir / 'payment_terms.json')
    print(f"   ✓ {len(payment_terms)} payment terms")
    results['payment_terms'] = len(payment_terms)
    
    users = api.get_users()
    _save_json(users, export_dir / 'users.json')
    print(f"   ✓ {len(users)} users")
    results['users'] = len(users)
    
    # 3. Products
    print("\n🏷️ Fetching products...")
    
    def on_products_page(data, current, total):
        print(f"   Page fetched: {current}/{total}")
    
    products = api.fetch_paginated('products', per_page=100, on_page=on_products_page)
    _save_json(products, export_dir / 'products.json')
    print(f"   ✓ {len(products)} products")
    results['products'] = len(products)
    
    # 4. Customers
    print("\n👥 Fetching customers...")
    
    def on_customers_page(data, current, total):
        print(f"   Fetched: {current}/{total}")
    
    customers = api.fetch_paginated('customers', per_page=100, on_page=on_customers_page)
    _save_json(customers, export_dir / 'customers.json')
    print(f"   ✓ {len(customers)} customers")
    results['customers'] = len(customers)
    
    # 5. Orders
    print("\n📦 Fetching orders...")
    
    def on_orders_page(data, current, total):
        print(f"   Fetched: {current}/{total}")
    
    orders = api.fetch_paginated('orders', per_page=100, on_page=on_orders_page)
    _save_json(orders, export_dir / 'orders.json')
    print(f"   ✓ {len(orders)} orders")
    results['orders'] = len(orders)
    
    # 6. Extract embedded line items
    print("\n📝 Extracting line items from orders...")
    line_items = api.extract_line_items_from_orders(orders)
    _save_json(line_items, export_dir / 'line_items.json')
    print(f"   ✓ {len(line_items)} line items")
    results['line_items'] = len(line_items)
    
    # 7. Order details (if requested)
    if include_details:
        print("\n🔍 Fetching order details (tasks, payments, expenses)...")
        print("   This may take a while...")
        
        def on_detail_progress(current, total):
            if current % 50 == 0 or current == total:
                pct = (current / total) * 100
                print(f"   Progress: {current}/{total} ({pct:.1f}%)")
        
        details = api.extract_all_order_details(orders, on_progress=on_detail_progress)
        
        _save_json(details['lineitemgroups'], export_dir / 'lineitemgroups.json')
        _save_json(details['tasks'], export_dir / 'tasks.json')
        _save_json(details['payments'], export_dir / 'payments.json')
        _save_json(details['expenses'], export_dir / 'expenses.json')
        _save_json(details['fees'], export_dir / 'fees.json')
        
        results['lineitemgroups'] = len(details['lineitemgroups'])
        results['tasks'] = len(details['tasks'])
        results['payments'] = len(details['payments'])
        results['expenses'] = len(details['expenses'])
        results['fees'] = len(details['fees'])
        
        print(f"   ✓ Lineitemgroups: {results['lineitemgroups']} orders")
        print(f"   ✓ Tasks: {results['tasks']} orders")
        print(f"   ✓ Payments: {results['payments']} orders")
        print(f"   ✓ Expenses: {results['expenses']} orders")
    
    # 8. Standalone tasks
    print("\n✅ Fetching standalone tasks...")
    tasks = api.fetch_paginated('tasks', per_page=100)
    _save_json(tasks, export_dir / 'standalone_tasks.json')
    print(f"   ✓ {len(tasks)} standalone tasks")
    results['standalone_tasks'] = len(tasks)
    
    # 9. Expenses
    print("\n💸 Fetching expenses...")
    expenses = api.fetch_paginated('expenses', per_page=100)
    _save_json(expenses, export_dir / 'all_expenses.json')
    print(f"   ✓ {len(expenses)} expenses")
    results['all_expenses'] = len(expenses)
    
    # 10. Inquiries
    print("\n📧 Fetching inquiries...")
    inquiries = api.fetch_paginated('inquiries', per_page=100)
    _save_json(inquiries, export_dir / 'inquiries.json')
    print(f"   ✓ {len(inquiries)} inquiries")
    results['inquiries'] = len(inquiries)
    
    # Save summary
    api_stats = api.get_stats()
    summary = {
        'extraction_date': datetime.now().isoformat(),
        'timestamp': timestamp,
        'results': results,
        'api_stats': api_stats,
        'files': list(export_dir.glob('*.json'))
    }
    
    _save_json(summary, export_dir / 'summary.json')
    
    # Print summary
    print("\n" + "=" * 70)
    print("✅ API EXTRACTION COMPLETE")
    print("=" * 70)
    for key, count in results.items():
        print(f"   {key:20s}: {count:,}")
    print(f"\n   Total Requests: {api_stats['requests']:,}")
    print(f"   Errors: {api_stats['errors']}")
    print(f"\n   Output: {export_dir}")
    
    return {
        'status': 'success',
        'timestamp': timestamp,
        'export_dir': str(export_dir),
        'results': results,
        'orders': orders,
        'customers': customers,
    }


def _save_json(data: Any, filepath: Path) -> None:
    """Save data to JSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)


# =============================================================================
# Artwork Extraction
# =============================================================================

def extract_artwork(
    orders: List[Dict[str, Any]],
    output_dir: Path,
    checkpoint_file: Path,
    limit: Optional[int] = None,
    on_progress: Optional[callable] = None
) -> Dict[str, Any]:
    """
    Extract artwork and production files from Printavo.
    
    Args:
        orders: List of orders to scrape
        output_dir: Directory to save files
        checkpoint_file: Path to checkpoint file
        limit: Optional limit on orders to process
        on_progress: Progress callback
        
    Returns:
        Extraction summary dict
    """
    print("\n" + "=" * 70)
    print("🎨 PRINTAVO ARTWORK EXTRACTION")
    print("=" * 70)
    
    artwork_dir = output_dir / 'artwork'
    artwork_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Output directory: {artwork_dir}")
    print(f"Orders to process: {len(orders) if not limit else min(limit, len(orders))}")
    print()
    
    try:
        scraper = PrintavoScraper(
            output_dir=artwork_dir,
            checkpoint_file=checkpoint_file
        )
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("   Set PRINTAVO_PASSWORD environment variable")
        return {'status': 'error', 'reason': str(e)}
    
    if limit:
        orders = orders[:limit]
    
    # Progress callback
    def on_scrape_progress(current, total, result):
        visual_id = result.get('visual_id', 'N/A')
        files = result.get('files_found', 0)
        downloaded = result.get('files_downloaded', 0)
        
        if files > 0:
            print(f"   [{current}/{total}] #{visual_id}: {downloaded}/{files} files")
        else:
            print(f"   [{current}/{total}] #{visual_id}: no files", end='\r')
    
    result = scraper.scrape_orders(orders, on_progress=on_scrape_progress)
    
    # Print summary
    print("\n" + "=" * 70)
    print("✅ ARTWORK EXTRACTION COMPLETE")
    print("=" * 70)
    
    stats = scraper.get_stats()
    print(f"   Orders processed: {stats['orders_processed']:,}")
    print(f"   Orders with files: {stats['orders_with_files']:,}")
    print(f"   Files downloaded: {stats['files_downloaded']:,}")
    print(f"   Total size: {format_bytes(stats['bytes_downloaded'])}")
    print(f"   Files skipped: {stats['files_skipped']:,}")
    print(f"   Files failed: {stats['files_failed']:,}")
    print(f"\n   Output: {artwork_dir}")
    
    return {
        'status': 'success',
        'artwork_dir': str(artwork_dir),
        'stats': stats,
    }


# =============================================================================
# MinIO Sync
# =============================================================================

def sync_to_minio(
    data_dir: Path,
    on_progress: Optional[callable] = None
) -> Dict[str, Any]:
    """
    Sync extracted data to MinIO.
    
    Args:
        data_dir: Directory with extracted data
        on_progress: Progress callback
        
    Returns:
        Sync summary dict
    """
    print("\n" + "=" * 70)
    print("☁️ SYNCING TO MINIO")
    print("=" * 70)
    
    try:
        uploader = MinIOUploader()
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("   Set MINIO_SECRET_KEY environment variable")
        return {'status': 'error', 'reason': str(e)}
    
    if not uploader.connect():
        print("❌ Failed to connect to MinIO")
        return {'status': 'error', 'reason': 'connection failed'}
    
    print(f"✅ Connected to MinIO: {uploader.endpoint}")
    print(f"   Bucket: {uploader.bucket}")
    print()
    
    results = {}
    
    # 1. Upload exports
    exports_dir = data_dir / 'exports'
    if exports_dir.exists():
        print("📦 Uploading API exports...")
        for export_timestamp in sorted(exports_dir.iterdir(), reverse=True):
            if export_timestamp.is_dir():
                print(f"   Uploading {export_timestamp.name}...")
                result = uploader.upload_export(export_timestamp, export_timestamp.name)
                print(f"   ✓ {result.get('files_uploaded', 0)} files uploaded")
                results['exports'] = result
    
    # 2. Upload artwork
    artwork_dir = data_dir / 'artwork'
    if artwork_dir.exists():
        print("\n🎨 Uploading artwork...")
        
        def on_artwork_progress(current, total):
            if current % 100 == 0 or current == total:
                pct = (current / total) * 100
                print(f"   Progress: {current}/{total} ({pct:.1f}%)")
        
        result = uploader.upload_artwork_directory(artwork_dir, on_progress=on_artwork_progress)
        print(f"   ✓ {result.get('files_uploaded', 0)} files uploaded")
        results['artwork'] = result
    
    # 3. Generate and upload indexes
    print("\n📑 Generating indexes...")
    
    # Find latest export
    exports_dir = data_dir / 'exports'
    latest_export = None
    if exports_dir.exists():
        for export_dir in sorted(exports_dir.iterdir(), reverse=True):
            if export_dir.is_dir():
                latest_export = export_dir
                break
    
    if latest_export:
        # Orders index
        orders_file = latest_export / 'orders.json'
        if orders_file.exists():
            with open(orders_file) as f:
                orders = json.load(f)
            orders_index = uploader.generate_orders_index(orders)
            uploader.upload_index(orders_index, 'orders_index')
            print(f"   ✓ Orders index: {len(orders)} orders")
        
        # Customers index
        customers_file = latest_export / 'customers.json'
        if customers_file.exists():
            with open(customers_file) as f:
                customers = json.load(f)
            customers_index = uploader.generate_customers_index(customers)
            uploader.upload_index(customers_index, 'customers_index')
            print(f"   ✓ Customers index: {len(customers)} customers")
    
    # Artwork index
    if artwork_dir.exists():
        artwork_index = uploader.generate_artwork_index(artwork_dir)
        uploader.upload_index(artwork_index, 'artwork_index')
        print(f"   ✓ Artwork index: {artwork_index.get('total_files', 0)} files")
    
    # Print summary
    stats = uploader.get_stats()
    print("\n" + "=" * 70)
    print("✅ MINIO SYNC COMPLETE")
    print("=" * 70)
    print(f"   Files uploaded: {stats['files_uploaded']:,}")
    print(f"   Total size: {format_bytes(stats['bytes_uploaded'])}")
    print(f"   Files skipped: {stats['files_skipped']:,}")
    print(f"   Files failed: {stats['files_failed']:,}")
    
    return {
        'status': 'success',
        'results': results,
        'stats': stats,
    }


# =============================================================================
# Dry Run
# =============================================================================

def dry_run(orders: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Dry run - show what would be extracted without downloading.
    
    Args:
        orders: List of orders
        
    Returns:
        Summary dict
    """
    print("\n" + "=" * 70)
    print("🔍 DRY RUN - Analyzing what would be extracted")
    print("=" * 70)
    
    # Count potential artwork files
    total_orders = len(orders)
    orders_with_urls = 0
    
    for order in orders:
        if order.get('public_url') or order.get('url'):
            orders_with_urls += 1
    
    print(f"\n📊 Order Statistics:")
    print(f"   Total orders: {total_orders:,}")
    print(f"   Orders with URLs: {orders_with_urls:,}")
    
    # Estimate file types based on order data
    line_items = 0
    for order in orders:
        line_items += len(order.get('lineitems_attributes', []))
    
    print(f"   Line items: {line_items:,}")
    
    # Customer stats
    customers = set()
    for order in orders:
        customer = order.get('customer', {})
        if customer.get('id'):
            customers.add(customer['id'])
    
    print(f"   Unique customers: {len(customers):,}")
    
    # Estimate storage
    print(f"\n📁 Estimated Storage:")
    print(f"   API exports: ~50-100 MB")
    print(f"   Artwork files: ~100-200 GB (based on {orders_with_urls:,} orders)")
    print(f"   Production files: ~20-50 GB")
    
    print(f"\n⏱️  Estimated Time:")
    api_time = total_orders * 0.7  # ~0.7 seconds per order for details
    artwork_time = orders_with_urls * 3  # ~3 seconds per order for artwork
    
    print(f"   API extraction: {format_duration(api_time)}")
    print(f"   Artwork scraping: {format_duration(artwork_time)}")
    print(f"   Total: {format_duration(api_time + artwork_time)}")
    
    return {
        'status': 'dry_run',
        'orders': total_orders,
        'orders_with_urls': orders_with_urls,
        'line_items': line_items,
        'customers': len(customers),
    }


# =============================================================================
# Main Entry Point
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Printavo Complete Extraction System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Full extraction
    python printavo-extract-all.py

    # Only extract API data
    python printavo-extract-all.py --orders-only

    # Only scrape artwork
    python printavo-extract-all.py --artwork-only

    # Resume interrupted extraction
    python printavo-extract-all.py --resume

    # Sync existing data to MinIO
    python printavo-extract-all.py --sync-to-minio

    # Dry run (show what would be done)
    python printavo-extract-all.py --dry-run
        """
    )
    
    parser.add_argument(
        '--orders-only',
        action='store_true',
        help='Only extract API data (orders, customers, etc.)'
    )
    
    parser.add_argument(
        '--artwork-only',
        action='store_true',
        help='Only scrape artwork files'
    )
    
    parser.add_argument(
        '--production-files-only',
        action='store_true',
        help='Only scrape production files (DST, EPS, etc.)'
    )
    
    parser.add_argument(
        '--resume',
        action='store_true',
        help='Resume from last checkpoint'
    )
    
    parser.add_argument(
        '--sync-to-minio',
        action='store_true',
        help='Sync extracted data to MinIO'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be extracted without downloading'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Limit number of orders to process'
    )
    
    parser.add_argument(
        '--output-dir',
        type=str,
        default=str(DEFAULT_DATA_DIR),
        help=f'Output directory (default: {DEFAULT_DATA_DIR})'
    )
    
    parser.add_argument(
        '--skip-details',
        action='store_true',
        help='Skip fetching order details (tasks, payments, etc.)'
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    checkpoint_dir = DEFAULT_CHECKPOINT_DIR
    
    print("=" * 70)
    print("🚀 PRINTAVO COMPLETE EXTRACTION SYSTEM")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Output: {output_dir}")
    print()
    
    start_time = time.time()
    orders = []
    customers = []
    
    try:
        # Sync only mode
        if args.sync_to_minio and not args.orders_only and not args.artwork_only:
            sync_to_minio(output_dir)
            return
        
        # API extraction
        if not args.artwork_only and not args.production_files_only:
            api_checkpoint = checkpoint_dir / 'printavo-api-checkpoint.json'
            
            result = extract_api_data(
                output_dir=output_dir,
                checkpoint_file=api_checkpoint,
                include_details=not args.skip_details,
            )
            
            if result.get('status') == 'success':
                orders = result.get('orders', [])
                customers = result.get('customers', [])
        
        # Load orders if we skipped API extraction
        if not orders and (args.artwork_only or args.production_files_only):
            # Try to load from latest export
            exports_dir = output_dir / 'exports'
            if exports_dir.exists():
                for export_dir in sorted(exports_dir.iterdir(), reverse=True):
                    orders_file = export_dir / 'orders.json'
                    if orders_file.exists():
                        print(f"📂 Loading orders from {orders_file}")
                        with open(orders_file) as f:
                            orders = json.load(f)
                        print(f"   ✓ Loaded {len(orders)} orders")
                        break
            
            if not orders:
                print("❌ No orders found. Run API extraction first.")
                sys.exit(1)
        
        # Dry run
        if args.dry_run:
            dry_run(orders)
            return
        
        # Artwork extraction
        if not args.orders_only:
            artwork_checkpoint = checkpoint_dir / 'printavo-artwork-checkpoint.json'
            
            extract_artwork(
                orders=orders,
                output_dir=output_dir,
                checkpoint_file=artwork_checkpoint,
                limit=args.limit,
            )
        
        # Sync to MinIO if requested
        if args.sync_to_minio:
            sync_to_minio(output_dir)
        
        # Final summary
        elapsed = time.time() - start_time
        print("\n" + "=" * 70)
        print("🎉 ALL EXTRACTIONS COMPLETE")
        print("=" * 70)
        print(f"   Total time: {format_duration(elapsed)}")
        print(f"   Output: {output_dir}")
        
    except KeyboardInterrupt:
        print("\n\n⏸️  Extraction interrupted. Progress saved to checkpoint.")
        print("   Run with --resume to continue.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise


if __name__ == '__main__':
    main()
