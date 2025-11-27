#!/usr/bin/env python3
"""
PrintShop OS - Full Data Import Script
Imports customers and orders from Printavo exports to Strapi.

Usage:
    export STRAPI_TOKEN="your-api-token-here"
    python scripts/import-all-data.py
"""

import json
import os
import subprocess
from datetime import datetime

# Configuration
STRAPI_URL = os.environ.get("STRAPI_URL", "http://100.92.156.118:1337")
STRAPI_TOKEN = os.environ.get("STRAPI_TOKEN", "")

# Debug: Print token status
if not STRAPI_TOKEN:
    print("⚠️ STRAPI_TOKEN not in environment, checking for hardcoded fallback...")
    
# Data files
CUSTOMERS_FILE = "data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z/customers.json"
ORDERS_FILE = "data/processed/orders_with_images.json"

def curl_get(url):
    """Make authenticated GET request."""
    cmd = ['curl', '-s', url]
    if STRAPI_TOKEN:
        cmd.extend(['-H', f'Authorization: Bearer {STRAPI_TOKEN}'])
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout) if result.stdout else None
    except:
        return None

def curl_post(url, data, debug=False):
    """Make authenticated POST request."""
    cmd = ['curl', '-s', '-X', 'POST', url,
           '-H', 'Content-Type: application/json']
    if STRAPI_TOKEN:
        cmd.extend(['-H', f'Authorization: Bearer {STRAPI_TOKEN}'])
    cmd.extend(['-d', json.dumps(data)])
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if debug:
        print(f"DEBUG: {result.stdout[:200]}")
    
    # Check for success - look for documentId in response (Strapi 5 format)
    success = '"documentId"' in result.stdout and '"error"' not in result.stdout
    if not success and result.stdout:
        # Log first failure for debugging
        if 'unique' in result.stdout.lower() or 'duplicate' in result.stdout.lower():
            return 'duplicate'
    return success

def import_customers():
    """Import customers from Printavo export."""
    print("\n📥 Importing Customers...")
    
    with open(CUSTOMERS_FILE, 'r') as f:
        customers = json.load(f)
    
    # Filter to customers with orders AND valid email
    recent_customers = [c for c in customers if c.get('orders_count', 0) > 0 and (c.get('email') or c.get('customer_email'))]
    print(f"   Found {len(recent_customers)} customers with orders and email")
    
    success = 0
    failed = 0
    skipped = 0
    
    for i, cust in enumerate(recent_customers[:500]):  # Limit to 500 for initial import
        # Transform to Strapi format
        shipping = cust.get('shipping_address_attributes', {})
        billing = cust.get('billing_address_attributes', {})
        
        name_parts = [cust.get('first_name', ''), cust.get('last_name', '')]
        name = ' '.join(p for p in name_parts if p).strip()
        if not name:
            name = cust.get('company', '') or f"Customer {cust['id']}"
        
        email = (cust.get('email') or cust.get('customer_email') or '').strip()
        if not email:
            skipped += 1
            continue
        
        data = {
            "data": {
                "name": name[:255],
                "email": email[:255],
                "company": (cust.get('company') or '')[:255] or None,
                "phone": (cust.get('phone') or '')[:50] or None,
                "address": (shipping.get('address1') or billing.get('address1') or '')[:255] or None,
                "city": (shipping.get('city') or billing.get('city') or '')[:100] or None,
                "state": (shipping.get('state_iso') or shipping.get('state') or '')[:50] or None,
                "zipCode": (shipping.get('zip') or billing.get('zip') or '')[:20] or None,
                "country": shipping.get('country_iso') or 'US',
                "printavoId": str(cust['id']),
                "notes": cust.get('extra_notes') or None,
                "taxExempt": cust.get('tax_exempt', False)
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        # Debug first request
        debug = (i == 0)
        result = curl_post(f"{STRAPI_URL}/api/customers", data, debug=debug)
        if result == True:
            success += 1
        elif result == 'duplicate':
            skipped += 1
        else:
            failed += 1
        
        if (i + 1) % 50 == 0:
            print(f"   Progress: {i + 1}/{min(500, len(recent_customers))} ({success} success, {skipped} skipped, {failed} failed)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed}")
    return success

def import_orders():
    """Import orders from Printavo export."""
    print("\n📥 Importing Orders...")
    
    with open(ORDERS_FILE, 'r') as f:
        orders = json.load(f)
    
    # Filter to 2025 orders
    orders_2025 = [o for o in orders if o.get('created_at', '').startswith('2025')]
    print(f"   Found {len(orders_2025)} orders from 2025")
    
    success = 0
    failed = 0
    
    for i, order in enumerate(orders_2025[:500]):  # Limit to 500 for initial import
        # Get customer reference
        customer_id = order.get('customer_id')
        
        # Map status
        status_map = {
            'Pending': 'QUOTE',
            'Approved': 'QUOTE_APPROVED', 
            'In Production': 'IN_PRODUCTION',
            'Complete': 'COMPLETE',
            'Delivered': 'COMPLETE',
            'Quote Sent': 'QUOTE_SENT'
        }
        printavo_status = order.get('order_status', {}).get('name', 'Pending')
        strapi_status = status_map.get(printavo_status, 'QUOTE')
        
        # Get line items summary
        line_items = order.get('lineitems_attributes', [])
        items_summary = []
        for item in line_items[:10]:  # Limit items
            items_summary.append({
                "name": item.get('style_description', 'Item')[:100],
                "quantity": item.get('total_quantity', 1),
                "price": float(item.get('taxable_total', 0))
            })
        
        data = {
            "data": {
                "orderNumber": str(order.get('visual_id', order['id'])),
                "status": strapi_status,
                "totalAmount": float(order.get('total', 0)),
                "printavoId": str(order['id']),
                "notes": order.get('notes') or None,
                "dueDate": order.get('due_date') or None,
                "createdAt": order.get('created_at'),
                "lineItems": items_summary if items_summary else None
            }
        }
        
        # Remove None values
        data["data"] = {k: v for k, v in data["data"].items() if v is not None}
        
        if curl_post(f"{STRAPI_URL}/api/orders", data):
            success += 1
        else:
            failed += 1
        
        if (i + 1) % 50 == 0:
            print(f"   Progress: {i + 1}/{min(500, len(orders_2025))} ({success} success, {failed} failed)")
    
    print(f"   ✅ Imported: {success} | ❌ Failed: {failed}")
    return success

def main():
    print("=" * 60)
    print("  PrintShop OS - Full Data Import")
    print("=" * 60)
    print(f"  Strapi URL: {STRAPI_URL}")
    print(f"  Token: {'✅ Set' if STRAPI_TOKEN else '❌ Not set'}")
    
    if not STRAPI_TOKEN:
        print("\n⚠️  No API token set!")
        print("   1. Go to Strapi Admin → Settings → API Tokens")
        print("   2. Create a Full Access token")
        print("   3. Run: export STRAPI_TOKEN='your-token-here'")
        return
    
    # Test connection
    response = curl_get(f"{STRAPI_URL}/api/customers")
    if not response:
        print(f"\n❌ Cannot connect to Strapi at {STRAPI_URL}")
        return
    
    existing_customers = response.get('meta', {}).get('pagination', {}).get('total', 0)
    print(f"  Existing customers: {existing_customers}")
    
    response = curl_get(f"{STRAPI_URL}/api/orders")
    existing_orders = response.get('meta', {}).get('pagination', {}).get('total', 0) if response else 0
    print(f"  Existing orders: {existing_orders}")
    
    # Run imports
    customers_imported = import_customers()
    orders_imported = import_orders()
    
    print("\n" + "=" * 60)
    print("  IMPORT COMPLETE")
    print("=" * 60)
    print(f"  Customers imported: {customers_imported}")
    print(f"  Orders imported: {orders_imported}")
    print(f"\n  View in Strapi: {STRAPI_URL}/admin")
    print("=" * 60)

if __name__ == "__main__":
    main()
