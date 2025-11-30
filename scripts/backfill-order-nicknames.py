#!/usr/bin/env python3
"""
Backfill orderNickname from Printavo export data.
Updates orders in Strapi with their original nicknames.
"""
import json
import requests

STRAPI_URL = 'http://100.92.156.118:1337'
ORDERS_FILE = '/Users/ronnyworks/Projects/printshop-os/data/raw/printavo-exports/complete_2025-11-27_14-20-05/orders.json'

HEADERS = {
    'Content-Type': 'application/json'
}

def get_strapi_orders():
    """Get all orders from Strapi with their documentId and printavoId"""
    orders = {}
    page = 1
    page_size = 100
    
    while True:
        resp = requests.get(
            f'{STRAPI_URL}/api/orders',
            params={
                'pagination[page]': page, 
                'pagination[pageSize]': page_size, 
                'fields[0]': 'printavoId',
                'fields[1]': 'orderNickname',
                'fields[2]': 'orderNumber'
            },
            headers=HEADERS
        )
        data = resp.json()
        order_list = data.get('data') or []
        
        for order in order_list:
            pid = order.get('printavoId')
            if pid:
                orders[str(pid)] = {
                    'documentId': order.get('documentId'),
                    'orderNickname': order.get('orderNickname'),
                    'orderNumber': order.get('orderNumber')
                }
        
        if len(order_list) < page_size:
            break
        page += 1
        
        if page % 20 == 0:
            print(f"  Scanned {page * page_size} orders...")
    
    return orders

def backfill_nicknames():
    # Load Printavo orders
    print(f"📂 Loading Printavo orders from {ORDERS_FILE}...")
    with open(ORDERS_FILE, 'r') as f:
        printavo_orders = json.load(f)
    
    # Build lookup by id
    printavo_by_id = {}
    for order in printavo_orders:
        oid = str(order.get('id', ''))
        nickname = (order.get('order_nickname') or '').strip()
        if oid and nickname:
            printavo_by_id[oid] = nickname
    
    print(f"   Total orders with nicknames in Printavo: {len(printavo_by_id)}")
    
    # Get Strapi orders
    print("🔍 Fetching orders from Strapi...")
    strapi_orders = get_strapi_orders()
    print(f"   Total orders in Strapi: {len(strapi_orders)}")
    
    # Find orders needing update
    to_update = []
    for printavo_id, nickname in printavo_by_id.items():
        if printavo_id in strapi_orders:
            strapi_order = strapi_orders[printavo_id]
            # Only update if nickname is missing or different
            if not strapi_order.get('orderNickname'):
                to_update.append({
                    'documentId': strapi_order['documentId'],
                    'orderNumber': strapi_order.get('orderNumber'),
                    'nickname': nickname
                })
    
    print(f"   Orders to update: {len(to_update)}")
    
    if not to_update:
        print("✅ All orders already have nicknames!")
        return 0, 0
    
    updated = 0
    failed = 0
    
    for i, order in enumerate(to_update):
        try:
            resp = requests.put(
                f'{STRAPI_URL}/api/orders/{order["documentId"]}',
                json={'data': {'orderNickname': order['nickname']}},
                headers=HEADERS
            )
            if resp.status_code == 200:
                updated += 1
            else:
                failed += 1
                if failed <= 5:
                    print(f"   ❌ Order {order['orderNumber']}: {resp.status_code}")
        except Exception as e:
            failed += 1
            if failed <= 5:
                print(f"   ❌ Order {order['orderNumber']}: {str(e)[:50]}")
        
        # Progress
        if (i + 1) % 500 == 0:
            print(f"   Progress: {i+1}/{len(to_update)} (✅ {updated} | ❌ {failed})")
    
    return updated, failed

if __name__ == '__main__':
    print("=" * 50)
    print("BACKFILL ORDER NICKNAMES")
    print("=" * 50)
    
    updated, failed = backfill_nicknames()
    
    print()
    print("=" * 50)
    print("COMPLETE")
    print(f"  ✅ Updated: {updated}")
    print(f"  ❌ Failed: {failed}")
    print("=" * 50)
