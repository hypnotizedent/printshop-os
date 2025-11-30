#!/usr/bin/env python3
"""
Sync supplier products directly to Strapi CMS.

Usage:
    python scripts/sync-suppliers-to-strapi.py --supplier ascolour --limit 50
    python scripts/sync-suppliers-to-strapi.py --supplier ssactivewear --limit 100
    python scripts/sync-suppliers-to-strapi.py --all --limit 200

Environment:
    STRAPI_URL - Strapi base URL (default: http://100.92.156.118:1337)
    STRAPI_TOKEN - Strapi API token
    
    AS Colour:
    ASCOLOUR_SUBSCRIPTION_KEY - API subscription key
    
    S&S Activewear:
    SS_ACTIVEWEAR_ACCOUNT_NUMBER - Account number
    SS_ACTIVEWEAR_API_KEY - API key
"""

import os
import sys
import json
import argparse
import requests
from base64 import b64encode
from datetime import datetime
from pathlib import Path

# Load .env from supplier-sync service
env_path = Path(__file__).parent.parent / "services" / "supplier-sync" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip())

# Config - use production Strapi by default
STRAPI_URL = os.environ.get('STRAPI_URL', 'http://100.92.156.118:1337')
if STRAPI_URL == 'http://localhost:1337':
    STRAPI_URL = 'http://100.92.156.118:1337'  # Force production
STRAPI_TOKEN = os.environ.get('STRAPI_TOKEN', '')

# AS Colour
ASCOLOUR_KEY = os.environ.get('ASCOLOUR_SUBSCRIPTION_KEY', '')
ASCOLOUR_BASE = 'https://api.ascolour.com'

# S&S Activewear  
SS_ACCOUNT = os.environ.get('SS_ACTIVEWEAR_ACCOUNT_NUMBER', '')
SS_KEY = os.environ.get('SS_ACTIVEWEAR_API_KEY', '')
SS_BASE = 'https://api.ssactivewear.com'

# Category mapping
CATEGORY_MAP = {
    # AS Colour productType -> Strapi category
    'T-Shirts': 't-shirts',
    'Tees': 't-shirts',
    'Tank': 't-shirts',
    'Singlets': 't-shirts',
    'Polos': 'polos',
    'Sweatshirts': 'sweatshirts',
    'Hoodies': 'sweatshirts',
    'Sweats': 'sweatshirts',
    'Jackets': 'jackets',
    'Outerwear': 'jackets',
    'Pants': 'pants',
    'Shorts': 'shorts',
    'Hats': 'hats',
    'Headwear': 'hats',
    'Caps': 'hats',
    'Bags': 'bags',
    'Totes': 'bags',
    'Accessories': 'accessories',
    # S&S categories
    'T-Shirt': 't-shirts',
    'Polo': 'polos',
    'Fleece': 'sweatshirts',
    'Sweatshirt': 'sweatshirts',
    'Jacket': 'jackets',
    'Cap': 'hats',
    'Hat': 'hats',
    'Bag': 'bags',
}

def get_category(product_type: str) -> str:
    """Map supplier category to Strapi enum."""
    if not product_type:
        return 'other'
    
    # Check exact match
    if product_type in CATEGORY_MAP:
        return CATEGORY_MAP[product_type]
    
    # Check partial match
    product_lower = product_type.lower()
    for key, val in CATEGORY_MAP.items():
        if key.lower() in product_lower or product_lower in key.lower():
            return val
    
    return 'other'


class ASColourSync:
    """AS Colour API client and transformer."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers['Subscription-Key'] = ASCOLOUR_KEY
        self.session.headers['Accept'] = 'application/json'
    
    def get_products(self, limit: int = 100) -> list:
        """Fetch products from AS Colour API."""
        products = []
        page = 1
        
        while len(products) < limit:
            resp = self.session.get(
                f'{ASCOLOUR_BASE}/v1/catalog/products',
                params={'pageNumber': page, 'pageSize': 100}
            )
            resp.raise_for_status()
            data = resp.json()
            
            batch = data.get('data') or data.get('products') or data or []
            if not batch:
                break
            
            products.extend(batch)
            print(f"  AS Colour: Fetched page {page} ({len(batch)} products)")
            
            if len(batch) < 100:
                break
            page += 1
        
        return products[:limit]
    
    def transform(self, product: dict) -> dict:
        """Transform AS Colour product to Strapi format."""
        return {
            'data': {
                'sku': f"AC-{product.get('styleCode', '')}",
                'name': product.get('styleName', ''),
                'brand': 'AS Colour',
                'category': get_category(product.get('productType', '')),
                'supplier': 'ascolour',
                'description': product.get('description', ''),
                'variants': [],  # Would need separate API call
                'pricing': {
                    'basePrice': 0,
                    'currency': 'USD',
                    'breaks': []
                },
                'images': [
                    product.get('websiteURL', ''),
                    product.get('productSpecURL', '')
                ],
                'availability': {
                    'inStock': True,
                    'totalQuantity': 0
                },
                'supplierProductId': product.get('styleCode', ''),
                'lastSyncedAt': datetime.utcnow().isoformat() + 'Z',
                'isActive': True
            }
        }


class SSActivewearSync:
    """S&S Activewear API client and transformer."""
    
    def __init__(self):
        self.session = requests.Session()
        auth = b64encode(f"{SS_ACCOUNT}:{SS_KEY}".encode()).decode()
        self.session.headers['Authorization'] = f'Basic {auth}'
        self.session.headers['Accept'] = 'application/json'
        self.session.timeout = 60  # S&S is slow
    
    def get_popular_brand_ids(self) -> list:
        """Get IDs for popular brands."""
        resp = self.session.get(f'{SS_BASE}/v2/brands/', timeout=30)
        resp.raise_for_status()
        brands = resp.json()
        
        popular_names = ['GILDAN', 'BELLA+CANVAS', 'NEXT LEVEL', 'HANES', 'JERZEES', 'PORT & COMPANY', 'FRUIT OF THE LOOM']
        popular = []
        for b in brands:
            name = b.get('name', '').upper()
            for pn in popular_names:
                if pn in name:
                    popular.append(b['brandID'])
                    break
        return popular[:5]  # Limit to 5 brands
    
    def get_products(self, limit: int = 100) -> list:
        """Fetch styles from S&S Activewear API (faster than products)."""
        products = []
        
        # Get styles from popular brands only (faster)
        brand_ids = self.get_popular_brand_ids()
        print(f"  Using brand IDs: {brand_ids}")
        
        if not brand_ids:
            # Fallback: just get first page of all styles
            resp = self.session.get(
                f'{SS_BASE}/v2/styles/',
                timeout=60
            )
            resp.raise_for_status()
            return resp.json()[:limit]
        
        # Fetch from each brand
        for bid in brand_ids:
            if len(products) >= limit:
                break
                
            try:
                resp = self.session.get(
                    f'{SS_BASE}/v2/styles/',
                    params={'brandIDs': bid},
                    timeout=60
                )
                resp.raise_for_status()
                batch = resp.json()
                
                # Take only what we need
                needed = limit - len(products)
                products.extend(batch[:needed])
                print(f"  S&S Activewear: Fetched {min(len(batch), needed)} styles from brand {bid}")
                
            except Exception as e:
                print(f"  Warning: Failed to fetch brand {bid}: {e}")
        
        return products[:limit]
    
    def transform(self, product: dict) -> dict:
        """Transform S&S Activewear style to Strapi format."""
        style_id = str(product.get('styleID', ''))
        
        return {
            'data': {
                'sku': f"SS-{style_id}",
                'name': product.get('title', product.get('styleName', '')),
                'brand': product.get('brandName', ''),
                'category': get_category(product.get('baseCategory', '')),
                'supplier': 'ssactivewear',
                'description': product.get('description', ''),
                'variants': [],  # Would need separate API call for colors/sizes
                'pricing': {
                    'basePrice': float(product.get('basePrice', 0) or 0),
                    'currency': 'USD',
                    'breaks': []
                },
                'images': [
                    product.get('colorFrontImage', ''),
                    product.get('colorBackImage', '')
                ],
                'availability': {
                    'inStock': True,
                    'totalQuantity': 0
                },
                'supplierProductId': style_id,
                'lastSyncedAt': datetime.utcnow().isoformat() + 'Z',
                'isActive': True
            }
        }


def create_or_update_product(product_data: dict) -> bool:
    """Create or update product in Strapi."""
    sku = product_data['data']['sku']
    
    # Check if exists
    resp = requests.get(
        f'{STRAPI_URL}/api/products',
        headers={'Authorization': f'Bearer {STRAPI_TOKEN}'},
        params={'filters[sku][$eq]': sku}
    )
    
    if resp.ok:
        existing = resp.json().get('data', [])
        if existing:
            # Update existing
            doc_id = existing[0]['documentId']
            resp = requests.put(
                f'{STRAPI_URL}/api/products/{doc_id}',
                headers={
                    'Authorization': f'Bearer {STRAPI_TOKEN}',
                    'Content-Type': 'application/json'
                },
                json=product_data
            )
            return resp.ok
    
    # Create new
    resp = requests.post(
        f'{STRAPI_URL}/api/products',
        headers={
            'Authorization': f'Bearer {STRAPI_TOKEN}',
            'Content-Type': 'application/json'
        },
        json=product_data
    )
    
    if not resp.ok:
        print(f"    Error creating {sku}: {resp.text[:200]}")
        return False
    
    return True


def sync_ascolour(limit: int = 100) -> tuple:
    """Sync AS Colour products to Strapi."""
    print(f"\n📦 Syncing AS Colour products (limit: {limit})...")
    
    if not ASCOLOUR_KEY:
        print("  ❌ Missing ASCOLOUR_SUBSCRIPTION_KEY")
        return 0, 0
    
    client = ASColourSync()
    products = client.get_products(limit)
    print(f"  Fetched {len(products)} products from AS Colour API")
    
    success = 0
    failed = 0
    
    for i, product in enumerate(products, 1):
        try:
            strapi_data = client.transform(product)
            if create_or_update_product(strapi_data):
                success += 1
            else:
                failed += 1
            
            if i % 25 == 0:
                print(f"  Progress: {i}/{len(products)} ({success} success, {failed} failed)")
        except Exception as e:
            print(f"  Error processing {product.get('styleCode')}: {e}")
            failed += 1
    
    print(f"  ✅ AS Colour: {success} synced, {failed} failed")
    return success, failed


def sync_ssactivewear(limit: int = 100) -> tuple:
    """Sync S&S Activewear products to Strapi."""
    print(f"\n📦 Syncing S&S Activewear products (limit: {limit})...")
    
    if not SS_ACCOUNT or not SS_KEY:
        print("  ❌ Missing S&S Activewear credentials")
        return 0, 0
    
    client = SSActivewearSync()
    products = client.get_products(limit)
    print(f"  Fetched {len(products)} products from S&S Activewear API")
    
    success = 0
    failed = 0
    
    for i, product in enumerate(products, 1):
        try:
            strapi_data = client.transform(product)
            if create_or_update_product(strapi_data):
                success += 1
            else:
                failed += 1
            
            if i % 25 == 0:
                print(f"  Progress: {i}/{len(products)} ({success} success, {failed} failed)")
        except Exception as e:
            print(f"  Error processing {product.get('styleID')}: {e}")
            failed += 1
    
    print(f"  ✅ S&S Activewear: {success} synced, {failed} failed")
    return success, failed


def main():
    parser = argparse.ArgumentParser(description='Sync supplier products to Strapi')
    parser.add_argument('--supplier', choices=['ascolour', 'ssactivewear'], help='Specific supplier')
    parser.add_argument('--all', action='store_true', help='Sync all suppliers')
    parser.add_argument('--limit', type=int, default=100, help='Max products per supplier')
    args = parser.parse_args()
    
    if not STRAPI_TOKEN:
        print("❌ Missing STRAPI_TOKEN environment variable")
        sys.exit(1)
    
    print("=" * 60)
    print("🚀 Supplier Product Sync to Strapi")
    print("=" * 60)
    print(f"Strapi: {STRAPI_URL}")
    print(f"Limit: {args.limit} products per supplier")
    
    total_success = 0
    total_failed = 0
    
    if args.all or args.supplier == 'ascolour':
        s, f = sync_ascolour(args.limit)
        total_success += s
        total_failed += f
    
    if args.all or args.supplier == 'ssactivewear':
        s, f = sync_ssactivewear(args.limit)
        total_success += s
        total_failed += f
    
    print("\n" + "=" * 60)
    print(f"✅ COMPLETE: {total_success} products synced, {total_failed} failed")
    print("=" * 60)


if __name__ == '__main__':
    main()
