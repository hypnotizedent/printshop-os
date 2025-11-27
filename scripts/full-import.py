#!/usr/bin/env python3
"""
PrintShop OS - Full Data Import
Imports customers and orders from Printavo to Strapi.

Run from docker-host or via SSH tunnel.
"""

import json
import subprocess
import sys
from datetime import datetime

# Configuration - EDIT THESE
STRAPI_URL = "http://localhost:1337"
STRAPI_TOKEN = "73b35f5663a72296c3ca825d4f8e2a1af016aaeff8b252f1f80dc2cc99669919a94a0e1d982861470846a08ebd3ed7146093e86b9823814e939903de99524ea9e7e778de5317fd070f0d2ced8d22010d49b1815fe40eaefd7d78dceb27753112869b1b90351174efa710fc0958d2b08405d266bb79a68d7dc23f22686bff4c3d"

# File paths (relative to printshop-os root)
CUSTOMERS_FILE = "data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z/customers.json"
ORDERS_FILE = "data/processed/orders_with_images.json"


def curl_post(endpoint, data):
    """Make authenticated POST request."""
    cmd = [
        'curl', '-s', '-X', 'POST', f'{STRAPI_URL}{endpoint}',
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {STRAPI_TOKEN}',
        '-d', json.dumps(data)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout


def curl_get(endpoint):
    """Make authenticated GET request."""
    cmd = [
        'curl', '-s', f'{STRAPI_URL}{endpoint}',
        '-H', f'Authorization: Bearer {STRAPI_TOKEN}'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout) if result.stdout else None
    except:
        return None


def check_connection():
    """Verify Strapi is accessible."""
    result = curl_get('/admin/init')
    if result and result.get('data', {}).get('hasAdmin'):
        print("✅ Strapi connection verified")
        return True
    print("❌ Cannot connect to Strapi")
    return False


def get_counts():
    """Get current record counts."""
    customers = curl_get('/api/customers?pagination[limit]=1')
    orders = curl_get('/api/orders?pagination[limit]=1')
    
    c_count = customers.get('meta', {}).get('pagination', {}).get('total', 0) if customers else 0
    o_count = orders.get('meta', {}).get('pagination', {}).get('total', 0) if orders else 0
    
    return c_count, o_count


def import_customers(limit=500):
    """Import customers with valid emails."""
    print(f"\n📥 Importing Customers (limit: {limit})...")
    
    try:
        with open(CUSTOMERS_FILE, 'r') as f:
            customers = json.load(f)
    except FileNotFoundError:
        print(f"   ❌ File not found: {CUSTOMERS_FILE}")
        return 0
    
    # Filter: must have email and orders
    valid = [c for c in customers 
             if (c.get('email') or c.get('customer_email')) 
             and c.get('orders_count', 0) > 0]
    
    print(f"   Found {len(valid)} customers with email and orders")
    
    success = 0
    failed = 0
    seen_emails = set()
    
    for i, c in enumerate(valid[:limit]):
        email = (c.get('email') or c.get('customer_email') or '').strip().lower()
        
        # Skip duplicates
        if email in seen_emails:
            continue
        seen_emails.add(email)
        
        # Build name
        first = (c.get('first_name') or '').strip()
        last = (c.get('last_name') or '').strip()
        name = f"{first} {last}".strip()
        if not name:
            name = c.get('company', '') or f"Customer {c['id']}"
        
        # Get address
        shipping = c.get('shipping_address_attributes', {})
        billing = c.get('billing_address_attributes', {})
        
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
                "printavoId": str(c['id']),
                "notes": (c.get('extra_notes') or '')[:1000] or None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        response = curl_post('/api/customers', data)
        
        if '"documentId"' in response or '"id"' in response:
            success += 1
        else:
            failed += 1
            if failed <= 3:  # Show first 3 errors
                print(f"   Error: {response[:200]}")
        
        if (i + 1) % 100 == 0:
            print(f"   Progress: {i + 1}/{min(limit, len(valid))} ({success} ok, {failed} err)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed}")
    return success


def import_orders(limit=500):
    """Import orders from 2025."""
    print(f"\n📥 Importing Orders (limit: {limit})...")
    
    try:
        with open(ORDERS_FILE, 'r') as f:
            orders = json.load(f)
    except FileNotFoundError:
        print(f"   ❌ File not found: {ORDERS_FILE}")
        return 0
    
    # Filter to 2025 orders
    orders_2025 = [o for o in orders if o.get('created_at', '').startswith('2025')]
    print(f"   Found {len(orders_2025)} orders from 2025")
    
    # Status mapping
    status_map = {
        'Pending': 'QUOTE',
        'Quote': 'QUOTE',
        'Quote Sent': 'QUOTE_SENT',
        'Approved': 'QUOTE_APPROVED',
        'In Production': 'IN_PRODUCTION',
        'Complete': 'COMPLETE',
        'Delivered': 'COMPLETE',
        'Ready for Pickup': 'READY_FOR_PICKUP',
        'Payment Needed': 'PAYMENT_NEEDED',
        'Paid': 'INVOICE_PAID',
        'Cancelled': 'CANCELLED'
    }
    
    success = 0
    failed = 0
    seen_order_nums = set()
    
    for i, o in enumerate(orders_2025[:limit]):
        order_num = str(o.get('visual_id', o['id']))
        
        # Skip duplicates
        if order_num in seen_order_nums:
            continue
        seen_order_nums.add(order_num)
        
        # Map status
        printavo_status = o.get('order_status', {}).get('name', 'Pending')
        status = status_map.get(printavo_status, 'QUOTE')
        
        # Build line items summary
        line_items = o.get('lineitems_attributes', [])
        items = []
        for item in line_items[:20]:
            items.append({
                "name": (item.get('style_description') or 'Item')[:100],
                "sku": item.get('style_number', ''),
                "quantity": item.get('total_quantity', 1),
                "price": float(item.get('taxable_total', 0) or 0)
            })
        
        data = {
            "data": {
                "orderNumber": order_num,
                "status": status,
                "totalAmount": float(o.get('total', 0) or 0),
                "printavoId": str(o['id']),
                "notes": (o.get('notes') or '')[:2000] or None,
                "productionNotes": (o.get('production_notes') or '')[:2000] or None,
                "dueDate": o.get('due_date') or None,
                "items": items if items else None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        response = curl_post('/api/orders', data)
        
        if '"documentId"' in response or '"id"' in response:
            success += 1
        else:
            failed += 1
            if failed <= 3:
                print(f"   Error [{order_num}]: {response[:200]}")
        
        if (i + 1) % 100 == 0:
            print(f"   Progress: {i + 1}/{min(limit, len(orders_2025))} ({success} ok, {failed} err)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed}")
    return success


def main():
    print("=" * 60)
    print("  PrintShop OS - Full Data Import")
    print("=" * 60)
    print(f"  Strapi: {STRAPI_URL}")
    print(f"  Time: {datetime.now().isoformat()}")
    print()
    
    if not check_connection():
        sys.exit(1)
    
    before_c, before_o = get_counts()
    print(f"  Before: {before_c} customers, {before_o} orders")
    
    # Run imports
    customers_added = import_customers(limit=500)
    orders_added = import_orders(limit=500)
    
    after_c, after_o = get_counts()
    
    print("\n" + "=" * 60)
    print("  IMPORT COMPLETE")
    print("=" * 60)
    print(f"  Customers: {before_c} → {after_c} (+{customers_added})")
    print(f"  Orders: {before_o} → {after_o} (+{orders_added})")
    print(f"\n  View in Strapi: {STRAPI_URL}/admin")
    print("=" * 60)


if __name__ == "__main__":
    main()
