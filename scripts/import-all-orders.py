#!/usr/bin/env python3
"""
Import ALL historical orders from Printavo to Strapi.
Skips orders already imported (by printavoId).
"""
import json
import requests
from datetime import datetime

STRAPI_URL = 'http://localhost:1337'
STRAPI_TOKEN = '73b35f5663a72296c3ca825d4f8e2a1af016aaeff8b252f1f80dc2cc99669919a94a0e1d982861470846a08ebd3ed7146093e86b9823814e939903de99524ea9e7e778de5317fd070f0d2ced8d22010d49b1815fe40eaefd7d78dceb27753112869b1b90351174efa710fc0958d2b08405d266bb79a68d7dc23f22686bff4c3d'
ORDERS_FILE = '/home/docker-host/printshop-data/raw/orders.json'

HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {STRAPI_TOKEN}'
}

# Map Printavo orderstatus names to Strapi enum values
# Strapi values: QUOTE, QUOTE_SENT, QUOTE_APPROVED, IN_PRODUCTION, COMPLETE, 
#                READY_FOR_PICKUP, PAYMENT_NEEDED, INVOICE_PAID, CANCELLED
STATUS_MAP = {
    'QUOTE': 'QUOTE',
    'Quote Out For Approval - Email': 'QUOTE_SENT',
    'MATERIALS PENDING': 'IN_PRODUCTION',
    'EMB - Need to Make Sew Out': 'IN_PRODUCTION',
    'SP - Need Film Files Made': 'IN_PRODUCTION',
    'COMPLETE': 'COMPLETE',
    'READY FOR PICK UP': 'READY_FOR_PICKUP',
    'SHIPPED - TRACKING UPDATED': 'COMPLETE',
    'PAYMENT NEEDED': 'PAYMENT_NEEDED',
    'INVOICE PAID': 'INVOICE_PAID',
}

def map_status(printavo_status):
    """Map Printavo orderstatus to valid Strapi enum"""
    return STATUS_MAP.get(printavo_status, 'QUOTE')

def get_existing_order_ids():
    """Get all printavoIds already in Strapi"""
    existing = set()
    page = 1
    page_size = 100
    
    while True:
        resp = requests.get(
            f'{STRAPI_URL}/api/orders',
            params={'pagination[page]': page, 'pagination[pageSize]': page_size, 'fields[0]': 'printavoId'},
            headers=HEADERS
        )
        data = resp.json()
        orders = data.get('data', [])
        
        for order in orders:
            pid = order.get('printavoId')
            if pid:
                existing.add(str(pid))
        
        if len(orders) < page_size:
            break
        page += 1
        
        if page % 10 == 0:
            print(f"  Scanned {page * page_size} existing orders...")
    
    return existing

def import_orders(limit=None):
    # Load orders
    print(f"📂 Loading orders from {ORDERS_FILE}...")
    with open(ORDERS_FILE, 'r') as f:
        orders = json.load(f)
    
    print(f"   Total orders in file: {len(orders)}")
    
    # Get existing
    print("🔍 Fetching existing orders from Strapi...")
    existing_ids = get_existing_order_ids()
    print(f"   Already imported: {len(existing_ids)}")
    
    # Filter to new orders only
    new_orders = [o for o in orders if str(o.get('id', '')) not in existing_ids]
    print(f"   New orders to import: {len(new_orders)}")
    
    if limit:
        new_orders = new_orders[:limit]
        print(f"   Limited to: {len(new_orders)}")
    
    imported = 0
    failed = 0
    
    for i, order in enumerate(new_orders):
        # Build payload
        order_number = order.get('visual_id') or order.get('orderId') or str(order.get('id'))
        
        # Get status from orderstatus object
        printavo_status = ''
        if order.get('orderstatus') and isinstance(order['orderstatus'], dict):
            printavo_status = order['orderstatus'].get('name', '')
        status = map_status(printavo_status)
        
        payload = {
            'data': {
                'orderNumber': str(order_number),
                'status': status,
                'totalAmount': float(order.get('total', 0) or 0),
                'amountPaid': float(order.get('amount_paid', 0) or 0),
                'amountOutstanding': float(order.get('amount_outstanding', 0) or 0),
                'salesTax': float(order.get('sales_tax', 0) or 0),
                'discount': float(order.get('discount', 0) or 0),
                'dueDate': order.get('due_date'),
                'notes': order.get('notes'),
                'productionNotes': order.get('production_notes'),
                'customerPO': order.get('customer_po') or order.get('visual_po_number'),
                'printavoId': str(order.get('id')),
                'items': order.get('line_items', [])
            }
        }
        
        # Clean None values
        payload['data'] = {k: v for k, v in payload['data'].items() if v is not None}
        
        try:
            resp = requests.post(f'{STRAPI_URL}/api/orders', json=payload, headers=HEADERS)
            if resp.status_code in (200, 201):
                imported += 1
            else:
                failed += 1
                if failed <= 5:
                    print(f"   ❌ Order {order_number}: {resp.text[:100]}")
        except Exception as e:
            failed += 1
            if failed <= 5:
                print(f"   ❌ Order {order_number}: {str(e)[:100]}")
        
        # Progress
        if (i + 1) % 500 == 0:
            print(f"   Progress: {i+1}/{len(new_orders)} (✅ {imported} | ❌ {failed})")
    
    return imported, failed

if __name__ == '__main__':
    print("=" * 50)
    print("PRINTAVO ALL ORDERS IMPORT")
    print("=" * 50)
    
    # Verify connection
    try:
        resp = requests.get(f'{STRAPI_URL}/api/orders?pagination[pageSize]=1', headers=HEADERS)
        current = resp.json().get('meta', {}).get('pagination', {}).get('total', 0)
        print(f"✅ Strapi connection verified - {current} orders exist")
    except Exception as e:
        print(f"❌ Cannot connect to Strapi: {e}")
        exit(1)
    
    print()
    imported, failed = import_orders()
    
    print()
    print("=" * 50)
    print("IMPORT COMPLETE")
    print(f"  ✅ Imported: {imported}")
    print(f"  ❌ Failed: {failed}")
    print("=" * 50)
