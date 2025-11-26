#!/usr/bin/env python3
"""
Update Orders with Line Items and Customer Links
This script adds line items and ensures customer links for all orders
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

def fetch_all_paginated(endpoint, page_size=100):
    """Fetch all records with pagination"""
    all_data = []
    page = 1
    while True:
        url = f"{STRAPI_URL}/api/{endpoint}?pagination[page]={page}&pagination[pageSize]={page_size}"
        result = fetch_json(url)
        if not result or not result.get('data'):
            break
        all_data.extend(result['data'])
        if len(result['data']) < page_size:
            break
        page += 1
    return all_data

print("=" * 60)
print("  PrintShop OS - Update Orders with Line Items")
print("=" * 60)

# 1. Test Strapi
test = fetch_json(f"{STRAPI_URL}/api/orders?pagination[pageSize]=1")
if not test:
    print("❌ Strapi is not running")
    exit(1)
print("✅ Strapi is running")

# 2. Get ALL customers
print("\n📋 Fetching all customers...")
all_customers = fetch_all_paginated("customers")
customer_map = {}
for c in all_customers:
    pid = c.get('printavoId')
    if pid:
        customer_map[str(pid)] = c['documentId']
print(f"   Found {len(customer_map)} customers with printavoId")

# 3. Get ALL orders from Strapi
print("\n📋 Fetching all orders from Strapi...")
all_orders = fetch_all_paginated("orders")
order_map = {}
for o in all_orders:
    pid = o.get('printavoId')
    if pid:
        order_map[str(pid)] = {
            'documentId': o['documentId'],
            'has_items': o.get('items') is not None and len(str(o.get('items', ''))) > 2
        }
print(f"   Found {len(order_map)} orders with printavoId")

# 4. Load source data
print("\n📋 Loading source order data...")
with open(DATA_FILE, 'r') as f:
    source_orders = json.load(f)

# Filter 2025 orders
source_2025 = {str(o['id']): o for o in source_orders if o.get('created_at', '').startswith('2025')}
print(f"   Found {len(source_2025)} orders from 2025 in source")

# 5. Update orders with line items and customer links
print("\n🔗 Updating orders with line items and customer links...")
success = 0
failed = 0
skipped = 0

for order_pid, order_info in order_map.items():
    source = source_2025.get(order_pid)
    if not source:
        skipped += 1
        continue
    
    doc_id = order_info['documentId']
    
    # Build update payload
    update_data = {}
    
    # Add customer link if available
    cust_pid = str(source.get('customer_id', ''))
    cust_doc_id = customer_map.get(cust_pid)
    if cust_doc_id:
        update_data['customer'] = cust_doc_id
    
    # Add line items if available
    line_items = source.get('lineitems_attributes', [])
    if line_items:
        # Transform line items to our schema
        items = []
        for li in line_items:
            item = {
                'description': li.get('style_description', ''),
                'styleNumber': li.get('style_number', ''),
                'color': li.get('color', ''),
                'category': li.get('category', ''),
                'quantity': li.get('total_quantities', 0),
                'unitPrice': li.get('unit_cost', 0),
                'sizes': {}
            }
            # Add size breakdown
            for size in ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl']:
                key = f'size_{size}'
                if li.get(key):
                    item['sizes'][size.upper()] = li[key]
            if li.get('size_other'):
                item['sizes']['OTHER'] = li['size_other']
            
            items.append(item)
        
        update_data['items'] = items
    
    # Update order
    if update_data:
        result = put_json(
            f"{STRAPI_URL}/api/orders/{doc_id}",
            {"data": update_data}
        )
        if result and result.get('data'):
            success += 1
        else:
            failed += 1
    else:
        skipped += 1
    
    if (success + failed) % 100 == 0 and (success + failed) > 0:
        print(f"   Progress: {success + failed}/{len(order_map)} processed...")

print("\n" + "=" * 60)
print("  UPDATE COMPLETE")
print("=" * 60)
print(f"  ✅ Success: {success}")
print(f"  ⏭️  Skipped: {skipped}")
print(f"  ❌ Failed:  {failed}")
print(f"  📊 Total:   {len(order_map)}")
print("=" * 60)

# 6. Verify
print("\n📋 Verifying updates...")
sample = fetch_json(f"{STRAPI_URL}/api/orders?populate=customer&pagination[pageSize]=3")
if sample and sample['data']:
    for order in sample['data'][:3]:
        cust = order.get('customer')
        items = order.get('items')
        cust_name = cust.get('name') if cust else 'None'
        item_count = len(items) if items else 0
        print(f"   Order #{order.get('orderNumber')}: Customer={cust_name}, Items={item_count}")

print(f"\n✅ Done! View in Strapi: {STRAPI_URL}/admin")
