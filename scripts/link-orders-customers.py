#!/usr/bin/env python3
"""
Link Orders to Customers in Strapi
This script links existing orders to their customers via printavoId
"""

import json
import urllib.request
import urllib.error

STRAPI_URL = "http://localhost:1337"
DATA_FILE = "/Users/ronnyworks/Projects/printshop-os/data/processed/orders_with_images.json"

def fetch_json(url):
    """Fetch JSON from URL"""
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except urllib.error.URLError as e:
        print(f"Error fetching {url}: {e}")
        return None

def put_json(url, data):
    """PUT JSON to URL"""
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, method='PUT')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.URLError as e:
        return None

print("=" * 60)
print("  PrintShop OS - Link Orders to Customers")
print("=" * 60)

# 1. Test Strapi connection
test = fetch_json(f"{STRAPI_URL}/api/customers?pagination[pageSize]=1")
if not test:
    print("❌ Strapi is not running")
    exit(1)
print("✅ Strapi is running")

# 2. Build customer lookup: printavoId -> documentId
print("\n📋 Building customer lookup table...")
customers = fetch_json(f"{STRAPI_URL}/api/customers?pagination[pageSize]=500")
customer_map = {}
for c in customers['data']:
    pid = c.get('printavoId')
    if pid:
        customer_map[str(pid)] = c['documentId']
print(f"   Found {len(customer_map)} customers with printavoId")

# 3. Build order lookup: printavoId -> documentId
print("\n📋 Building order lookup table...")
orders = fetch_json(f"{STRAPI_URL}/api/orders?pagination[pageSize]=1000")
order_map = {}
for o in orders['data']:
    pid = o.get('printavoId')
    if pid:
        order_map[str(pid)] = o['documentId']
print(f"   Found {len(order_map)} orders with printavoId")

# 4. Load source data for order->customer mapping
print("\n📋 Loading source order data...")
with open(DATA_FILE, 'r') as f:
    source_orders = json.load(f)

# Filter 2025 orders
orders_2025 = [o for o in source_orders if o.get('created_at', '').startswith('2025')]
print(f"   Found {len(orders_2025)} orders from 2025")

# 5. Link orders to customers
print("\n🔗 Linking orders to customers...")
success = 0
failed = 0
skipped = 0
already_linked = 0

for i, order in enumerate(orders_2025):
    order_pid = str(order.get('id', ''))
    cust_pid = str(order.get('customer_id', ''))
    
    # Get Strapi document IDs
    order_doc_id = order_map.get(order_pid)
    cust_doc_id = customer_map.get(cust_pid)
    
    if not order_doc_id:
        skipped += 1
        continue
    
    if not cust_doc_id:
        skipped += 1
        continue
    
    # Update order with customer relation
    result = put_json(
        f"{STRAPI_URL}/api/orders/{order_doc_id}",
        {"data": {"customer": cust_doc_id}}
    )
    
    if result and result.get('data'):
        success += 1
    else:
        failed += 1
    
    if (i + 1) % 100 == 0:
        print(f"   Progress: {i+1}/{len(orders_2025)} processed...")

print("\n" + "=" * 60)
print("  LINKING COMPLETE")
print("=" * 60)
print(f"  ✅ Success: {success}")
print(f"  ⏭️  Skipped: {skipped}")
print(f"  ❌ Failed:  {failed}")
print(f"  📊 Total:   {len(orders_2025)}")
print("=" * 60)

# 6. Verify a sample
print("\n📋 Verifying link...")
sample = fetch_json(f"{STRAPI_URL}/api/orders?populate=customer&pagination[pageSize]=1")
if sample and sample['data']:
    order = sample['data'][0]
    cust = order.get('customer')
    if cust:
        print(f"   ✅ Order #{order.get('orderNumber')} → Customer: {cust.get('name')}")
    else:
        print(f"   ⚠️  Order #{order.get('orderNumber')} has no customer linked yet")

print(f"\n✅ Done! View in Strapi: {STRAPI_URL}/admin")
