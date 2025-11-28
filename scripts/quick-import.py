#!/usr/bin/env python3
"""
Quick Import Script - Recovers data from Printavo exports to Strapi.
Uses the latest complete extraction from Nov 27, 2025.
"""

import json
import subprocess
import sys
from pathlib import Path

# Configuration
STRAPI_URL = "http://100.92.156.118:1337"
STRAPI_TOKEN = "dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e"

# Data paths (latest complete extraction)
DATA_DIR = Path("data/raw/printavo-exports/complete_2025-11-27_14-20-05")
CUSTOMERS_FILE = DATA_DIR / "customers.json"
ORDERS_FILE = DATA_DIR / "orders.json"


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


def import_customers():
    """Import all customers with valid emails."""
    print("\n📥 Importing Customers...")
    
    with open(CUSTOMERS_FILE, 'r') as f:
        customers = json.load(f)
    
    # Filter: must have email and orders
    valid = [c for c in customers 
             if (c.get('email') or c.get('customer_email')) 
             and c.get('orders_count', 0) > 0]
    
    print(f"   Found {len(valid)} customers with email and orders")
    
    success = 0
    failed = 0
    duplicates = 0
    seen_emails = set()
    
    for i, c in enumerate(valid):
        email = (c.get('email') or c.get('customer_email') or '').strip().lower()
        
        # Skip duplicates
        if email in seen_emails:
            duplicates += 1
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
                "notes": c.get('extra_notes') or None,
                "taxExempt": c.get('tax_exempt', False)
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        response = curl_post('/api/customers', data)
        if '"documentId"' in response and '"error"' not in response:
            success += 1
        else:
            failed += 1
        
        if (i + 1) % 100 == 0:
            print(f"   Progress: {i + 1}/{len(valid)} ({success} success, {failed} failed, {duplicates} duplicates)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed} | ⏭️ Duplicates: {duplicates}")
    return success


def import_orders():
    """Import all orders."""
    print("\n📥 Importing Orders...")
    
    with open(ORDERS_FILE, 'r') as f:
        orders = json.load(f)
    
    print(f"   Found {len(orders)} total orders")
    
    # Status mapping
    status_map = {
        'Pending': 'QUOTE',
        'Pending Approval': 'QUOTE_SENT',
        'Approved': 'QUOTE_APPROVED',
        'Payment Received': 'PAID',
        'In Production': 'IN_PRODUCTION',
        'Waiting for Pickup': 'READY',
        'Complete': 'COMPLETE',
        'Delivered': 'COMPLETE',
        'Quote Sent': 'QUOTE_SENT',
        'CANCELLED': 'CANCELLED'
    }
    
    success = 0
    failed = 0
    
    for i, order in enumerate(orders):
        # Map status
        printavo_status = order.get('order_status', {}).get('name', 'Pending')
        strapi_status = status_map.get(printavo_status, 'QUOTE')
        
        # Get customer reference by printavoId
        customer_id = order.get('customer_id')
        
        # Format dates
        due_date = order.get('due_date')
        if due_date:
            # Strapi expects YYYY-MM-DD format
            due_date = due_date.split('T')[0] if 'T' in due_date else due_date
        
        data = {
            "data": {
                "orderNumber": str(order.get('visual_id', order['id'])),
                "status": strapi_status,
                "totalAmount": float(order.get('total', 0) or 0),
                "printavoId": str(order['id']),
                "printavoCustomerId": str(customer_id) if customer_id else None,
                "notes": order.get('notes') or None,
                "dueDate": due_date,
                "productionNotes": order.get('production_notes') or None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        response = curl_post('/api/orders', data)
        if '"documentId"' in response and '"error"' not in response:
            success += 1
        else:
            failed += 1
            if failed <= 3:
                print(f"   Sample error: {response[:200]}")
        
        if (i + 1) % 500 == 0:
            print(f"   Progress: {i + 1}/{len(orders)} ({success} success, {failed} failed)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed}")
    return success


def main():
    print("=" * 60)
    print("  PrintShop OS - Quick Data Recovery Import")
    print("=" * 60)
    print(f"  Strapi URL: {STRAPI_URL}")
    print(f"  Data Dir: {DATA_DIR}")
    
    # Verify files exist
    if not CUSTOMERS_FILE.exists():
        print(f"\n❌ Customers file not found: {CUSTOMERS_FILE}")
        sys.exit(1)
    if not ORDERS_FILE.exists():
        print(f"\n❌ Orders file not found: {ORDERS_FILE}")
        sys.exit(1)
    
    # Test connection
    response = curl_get('/api/customers')
    if not response:
        print(f"\n❌ Cannot connect to Strapi at {STRAPI_URL}")
        sys.exit(1)
    
    existing_customers = response.get('meta', {}).get('pagination', {}).get('total', 0)
    print(f"  Existing customers: {existing_customers}")
    
    response = curl_get('/api/orders')
    existing_orders = response.get('meta', {}).get('pagination', {}).get('total', 0) if response else 0
    print(f"  Existing orders: {existing_orders}")
    
    # Run imports
    customers = import_customers()
    orders = import_orders()
    
    print("\n" + "=" * 60)
    print("  IMPORT COMPLETE")
    print("=" * 60)
    print(f"  Customers imported: {customers}")
    print(f"  Orders imported: {orders}")
    print(f"\n  Strapi Admin: {STRAPI_URL}/admin")
    print(f"  Login: ronny@ronny.works / PrintShop2025!")
    print("=" * 60)


if __name__ == "__main__":
    main()
