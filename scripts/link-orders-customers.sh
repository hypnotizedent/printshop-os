#!/bin/bash
# Link Orders to Customers in Strapi
# This script links existing orders to their customers via printavoId

set -e

STRAPI_URL="http://localhost:1337"
DATA_FILE="/Users/ronnyworks/Projects/printshop-os/data/processed/orders_with_images.json"

echo "============================================================"
echo "  PrintShop OS - Link Orders to Customers"
echo "============================================================"

# Check Strapi
if ! curl -s "$STRAPI_URL/api/customers" > /dev/null 2>&1; then
    echo "❌ Strapi is not running at $STRAPI_URL"
    exit 1
fi

echo "✅ Strapi is running"

# Get all customers with their printavoId and documentId
echo ""
echo "📋 Building customer lookup table..."

CUSTOMER_MAP=$(curl -s "$STRAPI_URL/api/customers?pagination[pageSize]=500" | python3 -c "
import sys, json
data = json.load(sys.stdin)
lookup = {}
for c in data['data']:
    pid = c.get('printavoId')
    if pid:
        lookup[str(pid)] = c['documentId']
print(json.dumps(lookup))
")

echo "Found $(echo $CUSTOMER_MAP | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" ) customers with printavoId"

# Get current orders from Strapi
echo ""
echo "📋 Getting existing orders..."

ORDERS_IN_STRAPI=$(curl -s "$STRAPI_URL/api/orders?pagination[pageSize]=1000" | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Map printavoId to documentId
lookup = {}
for o in data['data']:
    pid = o.get('printavoId')
    if pid:
        lookup[str(pid)] = o['documentId']
print(json.dumps(lookup))
")

echo "Found $(echo $ORDERS_IN_STRAPI | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" ) orders with printavoId"

# Link orders to customers
echo ""
echo "🔗 Linking orders to customers..."

SUCCESS=0
FAILED=0
SKIPPED=0

# Extract 2025 orders with customer info from source data
python3 << 'EOF' > /tmp/order_customer_links.json
import json

with open('/Users/ronnyworks/Projects/printshop-os/data/processed/orders_with_images.json', 'r') as f:
    orders = json.load(f)

# Filter 2025 orders
orders_2025 = [o for o in orders if o.get('created_at', '').startswith('2025')]

# Build links: order_id -> customer_id
links = []
for o in orders_2025:
    order_id = str(o.get('id'))
    customer_id = str(o.get('customer_id'))
    if order_id and customer_id:
        links.append({
            'order_printavo_id': order_id,
            'customer_printavo_id': customer_id,
            'visual_id': o.get('visual_id')
        })

print(json.dumps(links))
EOF

# Read customer map
CUSTOMER_MAP_JSON=$(curl -s "$STRAPI_URL/api/customers?pagination[pageSize]=500" | python3 -c "
import sys, json
data = json.load(sys.stdin)
lookup = {}
for c in data['data']:
    pid = c.get('printavoId')
    if pid:
        lookup[str(pid)] = c['documentId']
print(json.dumps(lookup))
")

# Read order map
ORDER_MAP_JSON=$(curl -s "$STRAPI_URL/api/orders?pagination[pageSize]=1000" | python3 -c "
import sys, json
data = json.load(sys.stdin)
lookup = {}
for o in data['data']:
    pid = o.get('printavoId')
    if pid:
        lookup[str(pid)] = o['documentId']
print(json.dumps(lookup))
")

# Process links
python3 << EOF
import json
import subprocess

customer_map = $CUSTOMER_MAP_JSON
order_map = $ORDER_MAP_JSON

with open('/tmp/order_customer_links.json', 'r') as f:
    links = json.load(f)

success = 0
failed = 0
skipped = 0

for i, link in enumerate(links):
    order_pid = link['order_printavo_id']
    cust_pid = link['customer_printavo_id']
    
    order_doc_id = order_map.get(order_pid)
    cust_doc_id = customer_map.get(cust_pid)
    
    if not order_doc_id:
        skipped += 1
        continue
    
    if not cust_doc_id:
        skipped += 1
        continue
    
    # Update order with customer relation
    payload = json.dumps({
        "data": {
            "customer": cust_doc_id
        }
    })
    
    cmd = [
        'curl', '-s', '-X', 'PUT',
        f'http://localhost:1337/api/orders/{order_doc_id}',
        '-H', 'Content-Type: application/json',
        '-d', payload
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if '"id":' in result.stdout:
        success += 1
    else:
        failed += 1
    
    if (i + 1) % 100 == 0:
        print(f"Progress: {i+1}/{len(links)} processed...")

print(f"\n============================================================")
print(f"  LINKING COMPLETE")
print(f"============================================================")
print(f"  ✅ Success: {success}")
print(f"  ⏭️  Skipped: {skipped}")
print(f"  ❌ Failed:  {failed}")
print(f"  📊 Total:   {len(links)}")
print(f"============================================================")
EOF

echo ""
echo "✅ Done! Orders are now linked to customers."
echo "View in Strapi: $STRAPI_URL/admin"
