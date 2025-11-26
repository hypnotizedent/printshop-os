#!/usr/bin/env python3
"""
Sync supplier products from JSONL files to Strapi CMS.

Usage:
  python sync-products-to-strapi.py [--supplier sanmar|ascolour|ssactivewear] [--limit N]
  
Example:
  python sync-products-to-strapi.py --supplier sanmar --limit 100
  python sync-products-to-strapi.py  # Sync all suppliers
"""

import json
import os
import sys
import argparse
import requests
from datetime import datetime
from pathlib import Path
from typing import Generator, Dict, Any

# Configuration
STRAPI_URL = os.getenv('STRAPI_URL', 'http://localhost:1337')
STRAPI_API_TOKEN = os.getenv('STRAPI_API_TOKEN', '')

# Supplier data paths
SUPPLIER_DATA_PATHS = {
    'sanmar': 'services/supplier-sync/data/ascolour/products.jsonl',  # SanMar data is in the same file
    'ascolour': 'services/supplier-sync/data/ascolour/products.jsonl',
    'ssactivewear': 'services/supplier-sync/data/ssactivewear/products.jsonl',
}

# Category mapping from supplier categories to Strapi enum
CATEGORY_MAP = {
    't-shirts': 't-shirts',
    'tees': 't-shirts',
    'polo shirts': 'polos',
    'polos': 'polos',
    'sweatshirts': 'sweatshirts',
    'hoodies': 'sweatshirts',
    'fleece': 'sweatshirts',
    'jackets': 'jackets',
    'outerwear': 'jackets',
    'pants': 'pants',
    'shorts': 'shorts',
    'hats': 'hats',
    'caps': 'hats',
    'headwear': 'hats',
    'bags': 'bags',
    'accessories': 'accessories',
    'other': 'other',
}


def read_jsonl_products(filepath: str) -> Generator[Dict[str, Any], None, None]:
    """Read products from a JSONL file."""
    with open(filepath, 'r') as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def normalize_category(category: str) -> str:
    """Normalize supplier category to Strapi enum value."""
    if not category:
        return 'other'
    normalized = category.lower().strip()
    return CATEGORY_MAP.get(normalized, 'other')


def normalize_supplier(supplier: str) -> str:
    """Normalize supplier name to Strapi enum value."""
    supplier_lower = supplier.lower()
    if 'sanmar' in supplier_lower:
        return 'sanmar'
    elif 'ascolour' in supplier_lower or 'as colour' in supplier_lower:
        return 'ascolour'
    elif 'ssactivewear' in supplier_lower or 's&s' in supplier_lower:
        return 'ssactivewear'
    return 'sanmar'  # default


def transform_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """Transform supplier product format to Strapi format."""
    # Clean HTML entities from name
    name = product.get('name', '')
    name = name.replace('&#174;', '®').replace('&#169;', '©').replace('&reg;', '®')
    name = name.replace('&amp;', '&').replace('&#x27;', "'")
    
    return {
        'sku': product.get('sku', ''),
        'name': name,
        'brand': product.get('brand', ''),
        'category': normalize_category(product.get('category', 'other')),
        'supplier': normalize_supplier(product.get('supplier', 'sanmar')),
        'description': product.get('description', ''),
        'variants': product.get('variants', []),
        'pricing': product.get('pricing', {}),
        'images': product.get('images', []),
        'availability': product.get('availability', {}),
        'supplierProductId': product.get('metadata', {}).get('supplierProductId', ''),
        'lastSyncedAt': datetime.now().isoformat(),
        'isActive': product.get('availability', {}).get('inStock', True),
    }


def check_product_exists(sku: str) -> int | None:
    """Check if product already exists in Strapi by SKU."""
    try:
        response = requests.get(
            f'{STRAPI_URL}/api/products',
            params={'filters[sku][$eq]': sku},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        if data.get('data') and len(data['data']) > 0:
            return data['data'][0]['id']
        return None
    except Exception as e:
        print(f'  ⚠️  Error checking product {sku}: {e}')
        return None


def create_product(product_data: Dict[str, Any]) -> bool:
    """Create a new product in Strapi."""
    try:
        response = requests.post(
            f'{STRAPI_URL}/api/products',
            json={'data': product_data},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        response.raise_for_status()
        return True
    except requests.exceptions.HTTPError as e:
        if e.response is not None:
            print(f'  ❌ Failed to create {product_data["sku"]}: {e.response.text[:200]}')
        return False
    except Exception as e:
        print(f'  ❌ Error creating {product_data["sku"]}: {e}')
        return False


def update_product(product_id: int, product_data: Dict[str, Any]) -> bool:
    """Update an existing product in Strapi."""
    try:
        response = requests.put(
            f'{STRAPI_URL}/api/products/{product_id}',
            json={'data': product_data},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        response.raise_for_status()
        return True
    except requests.exceptions.HTTPError as e:
        if e.response is not None:
            print(f'  ❌ Failed to update {product_data["sku"]}: {e.response.text[:200]}')
        return False
    except Exception as e:
        print(f'  ❌ Error updating {product_data["sku"]}: {e}')
        return False


def sync_products(supplier: str = None, limit: int = None):
    """Sync products from JSONL files to Strapi."""
    print('🔄 Starting product sync to Strapi...')
    print(f'   Strapi URL: {STRAPI_URL}')
    
    # Determine which files to process
    if supplier:
        paths = {supplier: SUPPLIER_DATA_PATHS.get(supplier)}
        if not paths[supplier]:
            print(f'❌ Unknown supplier: {supplier}')
            return
    else:
        paths = SUPPLIER_DATA_PATHS
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    stats = {
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'errors': 0,
    }
    
    for supplier_name, rel_path in paths.items():
        filepath = project_root / rel_path
        if not filepath.exists():
            print(f'⚠️  File not found: {filepath}')
            continue
            
        print(f'\n📦 Processing {supplier_name} from {rel_path}...')
        
        count = 0
        for product in read_jsonl_products(str(filepath)):
            if limit and count >= limit:
                print(f'   Reached limit of {limit} products')
                break
            
            count += 1
            strapi_product = transform_product(product)
            
            # Check if product exists
            existing_id = check_product_exists(strapi_product['sku'])
            
            if existing_id:
                # Update existing product
                if update_product(existing_id, strapi_product):
                    stats['updated'] += 1
                    if count % 50 == 0:
                        print(f'   ⬆️  Updated {count} products...')
                else:
                    stats['errors'] += 1
            else:
                # Create new product
                if create_product(strapi_product):
                    stats['created'] += 1
                    if count % 50 == 0:
                        print(f'   ➕ Created {count} products...')
                else:
                    stats['errors'] += 1
        
        print(f'   ✅ Processed {count} products from {supplier_name}')
    
    # Print summary
    print('\n' + '=' * 50)
    print('📊 Sync Summary')
    print('=' * 50)
    print(f'   Created: {stats["created"]}')
    print(f'   Updated: {stats["updated"]}')
    print(f'   Errors:  {stats["errors"]}')
    print(f'   Total:   {stats["created"] + stats["updated"] + stats["errors"]}')


def main():
    parser = argparse.ArgumentParser(description='Sync supplier products to Strapi CMS')
    parser.add_argument(
        '--supplier', 
        choices=['sanmar', 'ascolour', 'ssactivewear'],
        help='Sync only products from this supplier'
    )
    parser.add_argument(
        '--limit',
        type=int,
        help='Maximum number of products to sync per supplier'
    )
    
    args = parser.parse_args()
    
    # Run sync
    sync_products(supplier=args.supplier, limit=args.limit)


if __name__ == '__main__':
    main()
