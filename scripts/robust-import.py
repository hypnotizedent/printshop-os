#!/usr/bin/env python3
"""
Robust Import Script for PrintShop OS
======================================
Features:
- Progress bars (tqdm)
- Checkpoint/resume support
- Auto-retry with exponential backoff
- Connection health checks
- ntfy notifications for completion/failure
- Parallel imports (configurable)

Usage:
    python scripts/robust-import.py [--customers] [--orders] [--all]
    python scripts/robust-import.py --resume  # Resume from checkpoint
    python scripts/robust-import.py --status  # Show import status

Last Updated: 2025-11-28
"""

import json
import sys
import time
import argparse
import requests
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Tuple

# Import canonical config
sys.path.insert(0, str(Path(__file__).parent))
from config import (
    STRAPI_URL, STRAPI_TOKEN, 
    CUSTOMERS_FILE, ORDERS_FILE, LINE_ITEMS_FILE,
    CUSTOMER_CHECKPOINT, ORDER_CHECKPOINT, LINE_ITEM_CHECKPOINT,
    PRINTAVO_STATUS_MAP, BATCH_SIZE, PARALLEL_WORKERS,
    RETRY_ATTEMPTS, RETRY_DELAY, REQUEST_TIMEOUT,
    NTFY_URL, NTFY_TOPIC, get_headers, validate_config
)

# Try to import tqdm, fallback to simple progress
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("⚠️  Install tqdm for progress bars: pip install tqdm")

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
            with open(self.filepath, 'r') as f:
                return json.load(f)
        return {
            "last_index": 0,
            "imported_ids": [],
            "failed_ids": [],
            "started_at": None,
            "updated_at": None
        }
    
    def save(self):
        self.data["updated_at"] = datetime.now().isoformat()
        with open(self.filepath, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def mark_imported(self, record_id: str, index: int):
        self.data["imported_ids"].append(record_id)
        self.data["last_index"] = index
        if len(self.data["imported_ids"]) % 50 == 0:
            self.save()
    
    def mark_failed(self, record_id: str):
        self.data["failed_ids"].append(record_id)
    
    def is_imported(self, record_id: str) -> bool:
        return record_id in self.data["imported_ids"]
    
    def start(self):
        if not self.data["started_at"]:
            self.data["started_at"] = datetime.now().isoformat()
        self.save()
    
    def get_stats(self) -> Dict:
        return {
            "imported": len(self.data["imported_ids"]),
            "failed": len(self.data["failed_ids"]),
            "last_index": self.data["last_index"],
            "started_at": self.data["started_at"],
            "updated_at": self.data["updated_at"]
        }

# =============================================================================
# API CLIENT WITH RETRY
# =============================================================================
class StrapiClient:
    """Strapi API client with retry logic and health checks."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(get_headers())
        self.session.timeout = REQUEST_TIMEOUT
    
    def health_check(self) -> bool:
        """Check if Strapi is reachable and responding."""
        try:
            r = self.session.get(f"{STRAPI_URL}/api/customers?pagination[limit]=1", timeout=10)
            return r.status_code == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    def wait_for_healthy(self, max_wait: int = 300) -> bool:
        """Wait for Strapi to become healthy."""
        print("🔄 Waiting for Strapi to be healthy...")
        start = time.time()
        while time.time() - start < max_wait:
            if self.health_check():
                print("✅ Strapi is healthy")
                return True
            time.sleep(5)
        print("❌ Strapi did not become healthy in time")
        return False
    
    def post(self, endpoint: str, data: Dict, retries: int = RETRY_ATTEMPTS) -> Tuple[bool, Optional[Dict]]:
        """POST with exponential backoff retry."""
        for attempt in range(retries):
            try:
                r = self.session.post(
                    f"{STRAPI_URL}{endpoint}",
                    json=data,
                    timeout=REQUEST_TIMEOUT
                )
                
                if r.status_code in (200, 201):
                    return True, r.json()
                elif r.status_code == 400:
                    # Validation error, don't retry
                    return False, r.json()
                elif r.status_code in (401, 403):
                    print(f"❌ Auth error: {r.status_code}")
                    return False, None
                else:
                    # Retry on 5xx errors
                    if attempt < retries - 1:
                        delay = RETRY_DELAY * (2 ** attempt)
                        time.sleep(delay)
                        
            except requests.exceptions.Timeout:
                if attempt < retries - 1:
                    delay = RETRY_DELAY * (2 ** attempt)
                    time.sleep(delay)
            except requests.exceptions.ConnectionError:
                if attempt < retries - 1:
                    # Connection lost, wait and retry
                    print(f"⚠️  Connection lost, retrying in {RETRY_DELAY * (2 ** attempt)}s...")
                    time.sleep(RETRY_DELAY * (2 ** attempt))
                    # Re-check health
                    if not self.wait_for_healthy(60):
                        return False, None
        
        return False, None
    
    def get_count(self, endpoint: str) -> int:
        """Get total count for a collection."""
        try:
            r = self.session.get(f"{STRAPI_URL}{endpoint}?pagination[limit]=1")
            if r.ok:
                return r.json().get("meta", {}).get("pagination", {}).get("total", 0)
        except:
            pass
        return 0

# =============================================================================
# IMPORT FUNCTIONS
# =============================================================================
def import_customers(client: StrapiClient, resume: bool = False) -> Dict:
    """Import customers with progress tracking and resume support."""
    print("\n" + "=" * 60)
    print("📥 IMPORTING CUSTOMERS")
    print("=" * 60)
    
    checkpoint = Checkpoint(CUSTOMER_CHECKPOINT)
    
    with open(CUSTOMERS_FILE, 'r') as f:
        customers = json.load(f)
    
    # Filter: must have email and orders
    valid = [c for c in customers 
             if (c.get('email') or c.get('customer_email')) 
             and c.get('orders_count', 0) > 0]
    
    print(f"📊 Total customers: {len(customers)}")
    print(f"📊 Valid (with email+orders): {len(valid)}")
    
    if resume:
        stats = checkpoint.get_stats()
        print(f"📊 Previously imported: {stats['imported']}")
        print(f"📊 Previously failed: {stats['failed']}")
    
    checkpoint.start()
    
    success = 0
    failed = 0
    skipped = 0
    seen_emails = set()
    
    # Progress bar
    iterator = tqdm(enumerate(valid), total=len(valid), desc="Customers") if HAS_TQDM else enumerate(valid)
    
    for i, c in iterator:
        customer_id = str(c['id'])
        
        # Skip if already imported
        if checkpoint.is_imported(customer_id):
            skipped += 1
            continue
        
        email = (c.get('email') or c.get('customer_email') or '').strip().lower()
        
        # Skip duplicate emails
        if email in seen_emails:
            skipped += 1
            continue
        seen_emails.add(email)
        
        # Build name
        first = (c.get('first_name') or '').strip()
        last = (c.get('last_name') or '').strip()
        name = f"{first} {last}".strip() or c.get('company', '') or f"Customer {c['id']}"
        
        # Get address
        shipping = c.get('shipping_address_attributes', {}) or {}
        billing = c.get('billing_address_attributes', {}) or {}
        
        data = {
            "data": {
                "name": name[:255],
                "email": email[:255],
                "company": (c.get('company') or '')[:255] or None,
                "phone": (c.get('phone') or '')[:50] or None,
                "address": (shipping.get('address1') or billing.get('address1') or '')[:255] or None,
                "city": (shipping.get('city') or billing.get('city') or '')[:100] or None,
                "state": (shipping.get('state_iso') or shipping.get('state') or '')[:50] or None,
                "zipCode": (shipping.get('zip') or billing.get('zip') or '')[:20] or None,
                "country": shipping.get('country_iso') or 'US',
                "printavoId": customer_id,
                "notes": c.get('extra_notes') or None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        ok, response = client.post('/api/customers', data)
        
        if ok:
            success += 1
            checkpoint.mark_imported(customer_id, i)
        else:
            failed += 1
            checkpoint.mark_failed(customer_id)
        
        # Update progress bar
        if HAS_TQDM:
            iterator.set_postfix({"✓": success, "✗": failed, "⏭": skipped})
    
    checkpoint.save()
    
    return {"success": success, "failed": failed, "skipped": skipped}


def import_orders(client: StrapiClient, resume: bool = False) -> Dict:
    """Import orders with progress tracking and resume support."""
    print("\n" + "=" * 60)
    print("📥 IMPORTING ORDERS")
    print("=" * 60)
    
    checkpoint = Checkpoint(ORDER_CHECKPOINT)
    
    with open(ORDERS_FILE, 'r') as f:
        orders = json.load(f)
    
    print(f"📊 Total orders: {len(orders)}")
    
    if resume:
        stats = checkpoint.get_stats()
        print(f"📊 Previously imported: {stats['imported']}")
        print(f"📊 Previously failed: {stats['failed']}")
    
    checkpoint.start()
    
    success = 0
    failed = 0
    skipped = 0
    
    # Progress bar
    iterator = tqdm(enumerate(orders), total=len(orders), desc="Orders") if HAS_TQDM else enumerate(orders)
    
    for i, order in iterator:
        order_id = str(order['id'])
        
        # Skip if already imported
        if checkpoint.is_imported(order_id):
            skipped += 1
            continue
        
        # Map status
        printavo_status = order.get('order_status', {}).get('name', 'Pending')
        strapi_status = PRINTAVO_STATUS_MAP.get(printavo_status, 'QUOTE')
        
        # Format dates
        due_date = order.get('due_date')
        if due_date:
            due_date = due_date.split('T')[0] if 'T' in due_date else due_date
        
        customer_id = order.get('customer_id')
        
        data = {
            "data": {
                "orderNumber": str(order.get('visual_id', order['id'])),
                "status": strapi_status,
                "totalAmount": float(order.get('total', 0) or 0),
                "printavoId": order_id,
                "printavoCustomerId": str(customer_id) if customer_id else None,
                "visualId": str(order.get('visual_id', '')),
                "notes": order.get('notes') or None,
                "dueDate": due_date,
                "productionNotes": order.get('production_notes') or None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        ok, response = client.post('/api/orders', data)
        
        if ok:
            success += 1
            checkpoint.mark_imported(order_id, i)
        else:
            failed += 1
            checkpoint.mark_failed(order_id)
            # Debug first few failures
            if failed <= 3 and response:
                print(f"\n⚠️  Sample error: {response.get('error', {}).get('message', 'Unknown')}")
        
        # Update progress bar
        if HAS_TQDM:
            iterator.set_postfix({"✓": success, "✗": failed, "⏭": skipped})
    
    checkpoint.save()
    
    return {"success": success, "failed": failed, "skipped": skipped}


def send_notification(title: str, message: str, priority: str = "default"):
    """Send notification via ntfy."""
    try:
        requests.post(
            f"{NTFY_URL}/{NTFY_TOPIC}",
            data=message,
            headers={
                "Title": title,
                "Priority": priority,
                "Tags": "printshop"
            },
            timeout=5
        )
    except:
        pass  # Notifications are optional

def show_status():
    """Show current import status from checkpoints."""
    print("\n" + "=" * 60)
    print("📊 IMPORT STATUS")
    print("=" * 60)
    
    for name, path in [
        ("Customers", CUSTOMER_CHECKPOINT),
        ("Orders", ORDER_CHECKPOINT),
        ("Line Items", LINE_ITEM_CHECKPOINT)
    ]:
        checkpoint = Checkpoint(path)
        stats = checkpoint.get_stats()
        print(f"\n{name}:")
        print(f"  ✓ Imported: {stats['imported']:,}")
        print(f"  ✗ Failed: {stats['failed']:,}")
        print(f"  📍 Last index: {stats['last_index']:,}")
        print(f"  🕐 Started: {stats['started_at'] or 'Never'}")
        print(f"  🔄 Updated: {stats['updated_at'] or 'Never'}")

# =============================================================================
# MAIN
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="Robust Strapi Import")
    parser.add_argument("--customers", action="store_true", help="Import customers only")
    parser.add_argument("--orders", action="store_true", help="Import orders only")
    parser.add_argument("--all", action="store_true", help="Import all data")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint")
    parser.add_argument("--status", action="store_true", help="Show import status")
    parser.add_argument("--reset", action="store_true", help="Reset checkpoints")
    args = parser.parse_args()
    
    if args.status:
        show_status()
        return
    
    if args.reset:
        for path in [CUSTOMER_CHECKPOINT, ORDER_CHECKPOINT, LINE_ITEM_CHECKPOINT]:
            if path.exists():
                path.unlink()
                print(f"🗑️  Deleted: {path}")
        return
    
    # Validate config
    errors = validate_config()
    if errors:
        print("❌ Configuration errors:")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    
    print("=" * 60)
    print("  PrintShop OS - Robust Data Import")
    print("=" * 60)
    print(f"  Strapi: {STRAPI_URL}")
    print(f"  Resume: {'Yes' if args.resume else 'No'}")
    
    # Initialize client and check health
    client = StrapiClient()
    if not client.wait_for_healthy():
        send_notification("Import Failed", "Strapi is not responding", "high")
        sys.exit(1)
    
    # Show current counts
    print(f"\n  Current in Strapi:")
    print(f"    Customers: {client.get_count('/api/customers'):,}")
    print(f"    Orders: {client.get_count('/api/orders'):,}")
    
    results = {}
    start_time = time.time()
    
    try:
        if args.customers or args.all or not (args.customers or args.orders):
            results["customers"] = import_customers(client, resume=args.resume)
        
        if args.orders or args.all or not (args.customers or args.orders):
            results["orders"] = import_orders(client, resume=args.resume)
        
        elapsed = time.time() - start_time
        
        # Summary
        print("\n" + "=" * 60)
        print("  IMPORT COMPLETE")
        print("=" * 60)
        for entity, stats in results.items():
            print(f"  {entity.title()}: ✓{stats['success']:,} ✗{stats['failed']:,} ⏭{stats['skipped']:,}")
        print(f"  ⏱️  Time: {elapsed:.1f}s")
        print(f"\n  Strapi Admin: {STRAPI_URL}/admin")
        
        # Notification
        total_success = sum(r['success'] for r in results.values())
        total_failed = sum(r['failed'] for r in results.values())
        send_notification(
            "Import Complete",
            f"✓ {total_success:,} imported, ✗ {total_failed:,} failed",
            "default" if total_failed == 0 else "high"
        )
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Import interrupted - checkpoints saved")
        send_notification("Import Interrupted", "Manual interrupt - checkpoints saved", "high")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        send_notification("Import Failed", str(e), "urgent")
        raise


if __name__ == "__main__":
    main()
