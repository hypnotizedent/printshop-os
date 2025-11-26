#!/usr/bin/env python3
"""
Import 2025 Printavo Customers to Strapi
A minimal test import to validate the system before full migration.
"""

import json
import requests
from datetime import datetime

STRAPI_URL = "http://localhost:1337"
DATA_FILE = "data/processed/orders_with_images.json"

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
        
        try:
            response = requests.post(
                f"{STRAPI_URL}/api/customers",
                json={"data": clean_data},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                success += 1
                if success % 50 == 0:
                    print(f"  Progress: {success}/{len(customers)} customers imported...")
            else:
                failed += 1
                if failed <= 3:  # Show first 3 errors
                    print(f"  ❌ Failed: {customer.get('name')} - {response.text[:100]}")
                    
        except Exception as e:
            failed += 1
            if failed <= 3:
                print(f"  ❌ Error: {customer.get('name')} - {str(e)[:100]}")
    
    return success, failed

def main():
    print("=" * 60)
    print("  PrintShop OS - 2025 Customer Import")
    print("=" * 60)
    print()
    
    # Check Strapi is running
    try:
        response = requests.get(f"{STRAPI_URL}/api/customers", timeout=5)
        if response.status_code != 200:
            print("❌ Strapi not responding properly")
            return
        existing = response.json().get('meta', {}).get('pagination', {}).get('total', 0)
        print(f"✅ Strapi is running ({existing} existing customers)")
    except Exception as e:
        print(f"❌ Cannot connect to Strapi: {e}")
        return
    
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
