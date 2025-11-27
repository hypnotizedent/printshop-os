#!/usr/bin/env python3
"""
Import 2025 Printavo Customers to Strapi
A minimal test import to validate the system before full migration.
Uses only stdlib (no requests dependency).
"""

import json
import os
import subprocess
from datetime import datetime

# Use environment variable or default to docker-host
STRAPI_URL = os.environ.get("STRAPI_URL", "http://100.92.156.118:1337")
DATA_FILE = "data/processed/orders_with_images.json"

def curl_get(url):
    """Make GET request using curl."""
    result = subprocess.run(
        ['curl', '-s', url],
        capture_output=True, text=True
    )
    return json.loads(result.stdout) if result.stdout else None

def curl_post(url, data):
    """Make POST request using curl."""
    result = subprocess.run(
        ['curl', '-s', '-X', 'POST', url,
         '-H', 'Content-Type: application/json',
         '-d', json.dumps(data)],
        capture_output=True, text=True
    )
    return '"id":' in result.stdout or '"documentId":' in result.stdout

def extract_2025_customers():
    """Extract unique customers from 2025 orders."""
    with open(DATA_FILE, 'r') as f:
        orders = json.load(f)
    
    customers = {}
    orders_2025 = []
    
    for order in orders:
        created = order.get('created_at', '')
        if not created.startswith('2025'):
            continue
        
        orders_2025.append(order)
        customer = order.get('customer', {})
        cust_id = order.get('customer_id')
        
        if cust_id and cust_id not in customers:
            # Get address from order
            addresses = order.get('order_addresses_attributes', [])
            shipping = next((a for a in addresses if 'Shipping' in a.get('name', '')), {})
            
            customers[cust_id] = {
                'name': (customer.get('full_name') or '').strip() or f"Customer {cust_id}",
                'email': (customer.get('email') or '').split(',')[0].strip() or None,
                'phone': None,  # Not in order data
                'company': customer.get('company') or None,
                'address': shipping.get('address1') or None,
                'city': shipping.get('city') or None,
                'state': shipping.get('state') or None,
                'zipCode': shipping.get('zip') or None,
                'country': shipping.get('country') or 'US',
                'printavoId': str(cust_id),
                'notes': f"Imported from Printavo on {datetime.now().isoformat()}"
            }
    
    return list(customers.values()), orders_2025

def upload_customers(customers):
    """Upload customers to Strapi."""
    success = 0
    failed = 0
    
    for i, customer in enumerate(customers):
        # Clean the data - remove None values
        clean_data = {k: v for k, v in customer.items() if v is not None}
        
        if curl_post(f"{STRAPI_URL}/api/customers", {"data": clean_data}):
            success += 1
            if success % 50 == 0:
                print(f"  Progress: {success}/{len(customers)} customers imported...")
        else:
            failed += 1
    
    return success, failed

def main():
    print("=" * 60)
    print("  PrintShop OS - 2025 Customer Import")
    print("=" * 60)
    print()
    
    # Check Strapi is running
    response = curl_get(f"{STRAPI_URL}/api/customers")
    if not response:
        print(f"❌ Cannot connect to Strapi at {STRAPI_URL}")
        print("   Make sure Strapi is running on docker-host")
        return
    
    existing = response.get('meta', {}).get('pagination', {}).get('total', 0)
    print(f"✅ Strapi is running ({existing} existing customers)")
    
    print()
    print("📊 Extracting 2025 data...")
    customers, orders = extract_2025_customers()
    print(f"   Found {len(customers)} unique customers from {len(orders)} orders")
    print()
    
    print("📤 Uploading customers to Strapi...")
    success, failed = upload_customers(customers)
    print()
    
    print("=" * 60)
    print("  IMPORT COMPLETE")
    print("=" * 60)
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Failed:  {failed}")
    print(f"  📊 Total:   {len(customers)}")
    print()
    print(f"  View in Strapi: {STRAPI_URL}/admin")
    print("=" * 60)

if __name__ == "__main__":
    main()
