#!/bin/bash
#
# Import 2025 Printavo Orders to Strapi
# Links orders to existing customers
#

STRAPI_URL="${STRAPI_URL:-http://100.92.156.118:1337}"
DATA_FILE="data/processed/orders_with_images.json"

echo "============================================================"
echo "  PrintShop OS - 2025 Order Import"
echo "============================================================"
echo ""

# Check Strapi
echo "Checking Strapi connection..."
EXISTING=$(curl -s "$STRAPI_URL/api/orders" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ -z "$EXISTING" ]; then
    echo "❌ Cannot connect to Strapi at $STRAPI_URL"
    exit 1
fi
echo "✅ Strapi is running ($EXISTING existing orders)"
echo ""

# Extract and import orders using Python (stdlib only)
echo "📊 Extracting 2025 orders and importing..."
python3 << 'PYTHON_SCRIPT'
import json
import os
import subprocess
from datetime import datetime

STRAPI_URL = os.environ.get("STRAPI_URL", "http://100.92.156.118:1337")
DATA_FILE = "data/processed/orders_with_images.json"

def get_customer_map():
    """Get mapping of printavoId to Strapi documentId for customers."""
    result = subprocess.run([
        'curl', '-s',
        f'{STRAPI_URL}/api/customers?pagination[pageSize]=500&fields[0]=printavoId'
    ], capture_output=True, text=True)
    
    try:
        data = json.loads(result.stdout)
        customers = {}
        for c in data.get('data', []):
            pid = c.get('printavoId')
            if pid:
                customers[pid] = c.get('documentId')
        return customers
    except:
        return {}

def extract_2025_orders():
    """Extract orders from 2025."""
    with open(DATA_FILE, 'r') as f:
        orders = json.load(f)
    
    orders_2025 = []
    
    for order in orders:
        created = order.get('created_at', '')
        if not created.startswith('2025'):
            continue
        
        # Extract line items
        items = []
        for li in order.get('lineitems_attributes', []):
            items.append({
                'description': li.get('style_description', ''),
                'styleNumber': li.get('style_number', ''),
                'color': li.get('color', ''),
                'quantity': li.get('quantity', 0),
                'price': li.get('price', 0),
                'sizes': [{'name': s.get('name'), 'qty': s.get('quantity')} 
                         for s in li.get('lineitem_sizes_attributes', [])]
            })
        
        orders_2025.append({
            'orderNumber': str(order.get('visual_id', '')),
            'status': order.get('orderstatus', {}).get('name', 'QUOTE'),
            'totalAmount': order.get('order_total', 0) or 0,
            'dueDate': (order.get('due_date') or '')[:10] or None,  # Extract date part
            'notes': order.get('notes', '') or order.get('production_notes', ''),
            'items': items if items else None,
            'printavoId': str(order.get('id', '')),
            'customer_printavo_id': str(order.get('customer_id', ''))
        })
    
    return orders_2025

def upload_order(order, customer_map):
    """Upload a single order to Strapi."""
    # Get customer documentId
    customer_doc_id = customer_map.get(order.pop('customer_printavo_id', ''))
    
    # Clean the data - remove None values
    clean_data = {k: v for k, v in order.items() if v is not None}
    
    # Add customer relation if found
    if customer_doc_id:
        clean_data['customer'] = customer_doc_id
    
    payload = json.dumps({"data": clean_data})
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'{STRAPI_URL}/api/orders',
        '-H', 'Content-Type: application/json',
        '-d', payload
    ], capture_output=True, text=True)
    
    return '"id":' in result.stdout

# Get customer mapping
print("   Loading customer mapping...")
customer_map = get_customer_map()
print(f"   Found {len(customer_map)} customers with printavoId")
print("")

# Extract orders
orders = extract_2025_orders()
print(f"   Found {len(orders)} orders from 2025")
print("")
print("📤 Uploading orders to Strapi...")

success = 0
failed = 0
skipped = 0

for i, order in enumerate(orders):
    if upload_order(order.copy(), customer_map):
        success += 1
    else:
        failed += 1
    
    if (i + 1) % 100 == 0:
        print(f"   Progress: {i + 1}/{len(orders)} processed...")

print("")
print("============================================================")
print("  IMPORT COMPLETE")
print("============================================================")
print(f"  ✅ Success: {success}")
print(f"  ❌ Failed:  {failed}")
print(f"  📊 Total:   {len(orders)}")
print("")
print(f"  View in Strapi: {STRAPI_URL}/admin")
print("============================================================")
PYTHON_SCRIPT
