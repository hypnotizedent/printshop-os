#!/usr/bin/env python3
"""
Remove duplicate customers and orders from Strapi.
Keeps the FIRST entry for each printavoId, deletes duplicates.
"""
import requests
from collections import defaultdict

STRAPI_URL = 'http://localhost:1337'
STRAPI_TOKEN = '73b35f5663a72296c3ca825d4f8e2a1af016aaeff8b252f1f80dc2cc99669919a94a0e1d982861470846a08ebd3ed7146093e86b9823814e939903de99524ea9e7e778de5317fd070f0d2ced8d22010d49b1815fe40eaefd7d78dceb27753112869b1b90351174efa710fc0958d2b08405d266bb79a68d7dc23f22686bff4c3d'

HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {STRAPI_TOKEN}'
}

def fetch_all(endpoint, fields):
    """Fetch all records from an endpoint"""
    records = []
    page = 1
    page_size = 100
    
    while True:
        params = {
            'pagination[page]': page,
            'pagination[pageSize]': page_size,
        }
        for i, f in enumerate(fields):
            params[f'fields[{i}]'] = f
        
        resp = requests.get(f'{STRAPI_URL}/api/{endpoint}', params=params, headers=HEADERS)
        data = resp.json()
        batch = data.get('data', [])
        records.extend(batch)
        
        if len(batch) < page_size:
            break
        page += 1
        
        if page % 20 == 0:
            print(f"  Fetched {len(records)} {endpoint}...")
    
    return records

def find_duplicates(records, key_field):
    """Find duplicate records by key_field, keeping first occurrence"""
    seen = {}
    duplicates = []
    
    for rec in records:
        key = rec.get(key_field)
        if not key:
            continue
        
        if key in seen:
            duplicates.append(rec['documentId'])
        else:
            seen[key] = rec['documentId']
    
    return duplicates

def delete_records(endpoint, document_ids):
    """Delete records by documentId"""
    deleted = 0
    failed = 0
    
    for i, doc_id in enumerate(document_ids):
        try:
            resp = requests.delete(f'{STRAPI_URL}/api/{endpoint}/{doc_id}', headers=HEADERS)
            if resp.status_code in (200, 204):
                deleted += 1
            else:
                failed += 1
                if failed <= 3:
                    print(f"  ❌ Failed to delete {doc_id}: {resp.status_code}")
        except Exception as e:
            failed += 1
        
        if (i + 1) % 500 == 0:
            print(f"  Progress: {i+1}/{len(document_ids)} (deleted: {deleted})")
    
    return deleted, failed

def cleanup_collection(name, endpoint, key_field):
    print(f"\n{'='*50}")
    print(f"CLEANING {name.upper()}")
    print('='*50)
    
    # Fetch all
    print(f"📂 Fetching all {name}...")
    records = fetch_all(endpoint, ['printavoId', 'documentId'])
    print(f"   Total: {len(records)}")
    
    # Find duplicates
    print(f"🔍 Finding duplicates by {key_field}...")
    duplicates = find_duplicates(records, key_field)
    print(f"   Duplicates found: {len(duplicates)}")
    
    if not duplicates:
        print("   ✅ No duplicates to remove!")
        return 0
    
    # Delete
    print(f"🗑️  Deleting duplicates...")
    deleted, failed = delete_records(endpoint, duplicates)
    print(f"   ✅ Deleted: {deleted}")
    print(f"   ❌ Failed: {failed}")
    
    return deleted

if __name__ == '__main__':
    print("STRAPI DUPLICATE CLEANUP")
    print("="*50)
    
    # Verify connection
    try:
        resp = requests.get(f'{STRAPI_URL}/api/customers?pagination[pageSize]=1', headers=HEADERS)
        if resp.status_code != 200:
            print(f"❌ Cannot connect to Strapi: {resp.status_code}")
            exit(1)
        print("✅ Connected to Strapi")
    except Exception as e:
        print(f"❌ Cannot connect to Strapi: {e}")
        exit(1)
    
    # Cleanup customers
    customers_deleted = cleanup_collection('customers', 'customers', 'printavoId')
    
    # Cleanup orders
    orders_deleted = cleanup_collection('orders', 'orders', 'printavoId')
    
    # Final counts
    print("\n" + "="*50)
    print("CLEANUP COMPLETE")
    print("="*50)
    
    resp = requests.get(f'{STRAPI_URL}/api/customers?pagination[pageSize]=1', headers=HEADERS)
    cust_total = resp.json().get('meta', {}).get('pagination', {}).get('total', 0)
    
    resp = requests.get(f'{STRAPI_URL}/api/orders?pagination[pageSize]=1', headers=HEADERS)
    order_total = resp.json().get('meta', {}).get('pagination', {}).get('total', 0)
    
    print(f"  Customers removed: {customers_deleted}")
    print(f"  Orders removed: {orders_deleted}")
    print(f"  Final counts:")
    print(f"    Customers: {cust_total}")
    print(f"    Orders: {order_total}")
