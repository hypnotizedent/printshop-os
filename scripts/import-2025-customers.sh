#!/bin/bash
#
# Import 2025 Printavo Customers to Strapi
# Uses curl instead of Python requests
#

STRAPI_URL="http://localhost:1337"
DATA_FILE="data/processed/orders_with_images.json"

echo "============================================================"
echo "  PrintShop OS - 2025 Customer Import"
echo "============================================================"
echo ""

# Check Strapi
echo "Checking Strapi connection..."
EXISTING=$(curl -s "$STRAPI_URL/api/customers" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ -z "$EXISTING" ]; then
    echo "❌ Cannot connect to Strapi at $STRAPI_URL"
    exit 1
fi
echo "✅ Strapi is running ($EXISTING existing customers)"
echo ""

# Extract and import customers using Python (stdlib only)
echo "📊 Extracting 2025 customers and importing..."
python3 << 'PYTHON_SCRIPT'
import json
import subprocess
from datetime import datetime

STRAPI_URL = "http://localhost:1337"
DATA_FILE = "data/processed/orders_with_images.json"

def extract_2025_customers():
    with open(DATA_FILE, 'r') as f:
        orders = json.load(f)
    
    customers = {}
    
    for order in orders:
        created = order.get('created_at', '')
        if not created.startswith('2025'):
            continue
        
        customer = order.get('customer', {})
        cust_id = order.get('customer_id')
        
        if cust_id and cust_id not in customers:
            addresses = order.get('order_addresses_attributes', [])
            shipping = next((a for a in addresses if 'Shipping' in a.get('name', '')), {})
            
            customers[cust_id] = {
                'name': (customer.get('full_name') or '').strip() or f"Customer {cust_id}",
                'email': (customer.get('email') or '').split(',')[0].strip() or None,
                'company': customer.get('company') or None,
                'address': shipping.get('address1') or None,
                'city': shipping.get('city') or None,
                'state': shipping.get('state') or None,
                'zipCode': shipping.get('zip') or None,
                'country': shipping.get('country') or 'US',
                'printavoId': str(cust_id),
                'notes': f"Imported from Printavo on {datetime.now().strftime('%Y-%m-%d')}"
            }
    
    return list(customers.values())

def upload_customer(customer):
    clean_data = {k: v for k, v in customer.items() if v is not None}
    payload = json.dumps({"data": clean_data})
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'{STRAPI_URL}/api/customers',
        '-H', 'Content-Type: application/json',
        '-d', payload
    ], capture_output=True, text=True)
    
    return '"id":' in result.stdout

customers = extract_2025_customers()
print(f"   Found {len(customers)} unique customers from 2025")
print("")
print("📤 Uploading customers to Strapi...")

success = 0
failed = 0

for i, customer in enumerate(customers):
    if upload_customer(customer):
        success += 1
    else:
        failed += 1
    
    if (i + 1) % 50 == 0:
        print(f"   Progress: {i + 1}/{len(customers)} processed...")

print("")
print("============================================================")
print("  IMPORT COMPLETE")
print("============================================================")
print(f"  ✅ Success: {success}")
print(f"  ❌ Failed:  {failed}")
print(f"  📊 Total:   {len(customers)}")
print("")
print(f"  View in Strapi: {STRAPI_URL}/admin")
print("============================================================")
PYTHON_SCRIPT
