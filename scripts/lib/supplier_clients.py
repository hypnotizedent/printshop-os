#!/usr/bin/env python3
"""
Unified Supplier Clients - Python wrapper for supplier API integrations

Provides a unified interface for:
- AS Colour (REST API with dual auth)
- S&S Activewear (REST API)
- SanMar (SFTP/CSV based)

Usage:
    from scripts.lib.supplier_clients import SupplierClients
    
    clients = SupplierClients()
    product = clients.get_product('NL3600', 'ssactivewear')
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class ProductInfo:
    """Normalized product information from any supplier"""
    sku: str
    name: str
    brand: str
    description: str = ""
    category: str = "other"
    supplier: str = "unknown"
    base_price: float = 0.0
    colors: List[str] = field(default_factory=list)
    sizes: List[str] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    supplier_product_id: str = ""
    in_stock: bool = True
    specifications: Dict[str, Any] = field(default_factory=dict)
    price_breaks: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_strapi_format(self) -> Dict[str, Any]:
        """Convert to Strapi API format"""
        return {
            'sku': self.sku,
            'name': self.name,
            'brand': self.brand,
            'description': self.description,
            'category': self._normalize_category(),
            'supplier': self._normalize_supplier(),
            'basePrice': self.base_price,
            'colors': self.colors,
            'sizes': self.sizes,
            'images': self.images,
            'supplierProductId': self.supplier_product_id,
            'isActive': self.in_stock,
            'specifications': self.specifications,
            'priceBreaks': self.price_breaks,
            'lastSyncedAt': datetime.now(timezone.utc).isoformat()
        }
        
    def _normalize_category(self) -> str:
        """Normalize category to Strapi enum values"""
        category_map = {
            't-shirts': 't-shirts',
            'tees': 't-shirts',
            't-shirt': 't-shirts',
            'polo shirts': 'polos',
            'polos': 'polos',
            'polo': 'polos',
            'sweatshirts': 'sweatshirts',
            'hoodies': 'hoodies',
            'hoodie': 'hoodies',
            'fleece': 'sweatshirts',
            'jackets': 'jackets',
            'jacket': 'jackets',
            'outerwear': 'outerwear',
            'pants': 'pants',
            'shorts': 'shorts',
            'hats': 'hats',
            'caps': 'hats',
            'headwear': 'hats',
            'bags': 'bags',
            'accessories': 'accessories',
            'workwear': 'workwear',
            'athletic': 'athletic',
            'youth': 'youth',
        }
        normalized = self.category.lower().strip()
        return category_map.get(normalized, 'other')
        
    def _normalize_supplier(self) -> str:
        """Normalize supplier to Strapi enum values"""
        supplier_map = {
            'as-colour': 'ascolour',
            'ascolour': 'ascolour',
            'as colour': 'ascolour',
            's&s-activewear': 'ssactivewear',
            'ssactivewear': 'ssactivewear',
            's&s activewear': 'ssactivewear',
            'ss-activewear': 'ssactivewear',
            'sanmar': 'sanmar',
        }
        normalized = self.supplier.lower().strip()
        return supplier_map.get(normalized, 'sanmar')


class ASColourClient:
    """
    AS Colour API client.
    Requires dual authentication:
    - Subscription-Key header for catalog/inventory
    - JWT Bearer token for pricing
    """
    
    BASE_URL = 'https://api.ascolour.com'
    
    def __init__(self):
        self.api_key = os.getenv('ASCOLOUR_API_KEY') or os.getenv('ASCOLOUR_SUBSCRIPTION_KEY')
        self.email = os.getenv('ASCOLOUR_EMAIL')
        self.password = os.getenv('ASCOLOUR_PASSWORD')
        self.jwt_token: Optional[str] = None
        
        if not self.api_key:
            raise ValueError("ASCOLOUR_API_KEY environment variable not set")
            
        self.session = requests.Session()
        self.session.headers.update({
            'Subscription-Key': self.api_key,
            'Accept': 'application/json'
        })
        
    def authenticate(self) -> bool:
        """Authenticate to get JWT token for pricing access"""
        if not self.email or not self.password:
            return False
            
        try:
            response = self.session.post(
                f'{self.BASE_URL}/v1/api/authentication',
                json={'email': self.email, 'password': self.password}
            )
            response.raise_for_status()
            data = response.json()
            
            self.jwt_token = data.get('token') or data.get('accessToken')
            if self.jwt_token:
                self.session.headers['Authorization'] = f'Bearer {self.jwt_token}'
                return True
                
        except requests.RequestException as e:
            print(f"AS Colour authentication failed: {e}")
            
        return False
        
    def get_products(self, page: int = 1, page_size: int = 100) -> List[Dict[str, Any]]:
        """Get products from catalog"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v1/catalog/products',
                params={'pageNumber': page, 'pageSize': page_size}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data') or data.get('products') or data or []
        except requests.RequestException as e:
            print(f"Failed to get AS Colour products: {e}")
            return []
            
    def get_product(self, style_code: str) -> Optional[Dict[str, Any]]:
        """Get a single product by style code"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v1/catalog/products/{style_code}'
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data') or data.get('product') or data
        except requests.RequestException:
            return None
            
    def get_inventory(self, sku: str) -> Optional[Dict[str, Any]]:
        """Get inventory for a specific SKU"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v1/inventory/items/{sku}'
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return None
            
    def health_check(self) -> bool:
        """Check if API is accessible"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v1/catalog/colours',
                params={'pageNumber': 1, 'pageSize': 1}
            )
            return response.status_code == 200
        except requests.RequestException:
            return False


class SSActivewearClient:
    """
    S&S Activewear API client.
    Uses Basic Auth with account number and API key.
    """
    
    BASE_URL = 'https://api.ssactivewear.com'
    
    def __init__(self):
        self.api_key = os.getenv('SS_ACTIVEWEAR_API_KEY')
        self.account_number = os.getenv('SS_ACTIVEWEAR_ACCOUNT_NUMBER')
        
        if not self.api_key or not self.account_number:
            raise ValueError("SS_ACTIVEWEAR_API_KEY and SS_ACTIVEWEAR_ACCOUNT_NUMBER required")
            
        self.session = requests.Session()
        self.session.auth = (self.account_number, self.api_key)
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
        
    def get_products(self, page: int = 1, per_page: int = 100) -> Dict[str, Any]:
        """Get products with pagination"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v2/products',
                params={'page': page, 'perPage': per_page}
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Failed to get S&S products: {e}")
            return {'products': [], 'total': 0, 'hasMore': False}
            
    def get_product(self, style_id: str) -> Optional[Dict[str, Any]]:
        """Get a single product by style ID"""
        try:
            response = self.session.get(f'{self.BASE_URL}/v2/products/{style_id}')
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return None
            
    def get_inventory(self, style_id: str) -> List[Dict[str, Any]]:
        """Get inventory for a product"""
        try:
            response = self.session.get(f'{self.BASE_URL}/v2/products/{style_id}/inventory')
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return []
            
    def get_pricing(self, style_id: str) -> List[Dict[str, Any]]:
        """Get pricing for a product"""
        try:
            response = self.session.get(f'{self.BASE_URL}/v2/products/{style_id}/pricing')
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return []
            
    def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search for products"""
        try:
            response = self.session.get(
                f'{self.BASE_URL}/v2/products/search',
                params={'q': query}
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return []
            
    def health_check(self) -> bool:
        """Check if API is accessible"""
        try:
            response = self.session.get(f'{self.BASE_URL}/v2/categories')
            return response.status_code == 200
        except requests.RequestException:
            return False


class SanMarClient:
    """
    SanMar API client.
    Uses SFTP for catalog data and CSV parsing.
    Product data is cached from EPDD.csv file.
    """
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir) if data_dir else self._find_data_dir()
        self.products: Dict[str, Dict[str, Any]] = {}
        self._load_cache()
        
    def _find_data_dir(self) -> Path:
        """Find supplier-sync data directory"""
        # Try relative to this script
        script_dir = Path(__file__).parent.parent.parent
        data_dir = script_dir / 'services' / 'supplier-sync' / 'data' / 'sanmar'
        
        if data_dir.exists():
            return data_dir
            
        # Try from current working directory
        cwd_data = Path.cwd() / 'services' / 'supplier-sync' / 'data' / 'sanmar'
        if cwd_data.exists():
            return cwd_data
            
        return script_dir / 'data' / 'products'
        
    def _load_cache(self):
        """Load products from JSONL cache"""
        jsonl_path = self.data_dir / 'products.jsonl'
        
        if not jsonl_path.exists():
            print(f"SanMar product cache not found at {jsonl_path}")
            return
            
        try:
            with open(jsonl_path, 'r') as f:
                for line in f:
                    if line.strip():
                        product = json.loads(line)
                        sku = product.get('sku', '').upper()
                        if sku:
                            self.products[sku] = product
                            
            print(f"Loaded {len(self.products)} SanMar products from cache")
        except Exception as e:
            print(f"Failed to load SanMar cache: {e}")
            
    def get_product(self, style_id: str) -> Optional[Dict[str, Any]]:
        """Get product from cache by style ID"""
        return self.products.get(style_id.upper())
        
    def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search products in cache"""
        query_lower = query.lower()
        results = []
        
        for product in self.products.values():
            name = (product.get('name') or '').lower()
            sku = (product.get('sku') or '').lower()
            brand = (product.get('brand') or '').lower()
            
            if query_lower in name or query_lower in sku or query_lower in brand:
                results.append(product)
                
        return results
        
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'products': len(self.products),
            'dataDir': str(self.data_dir),
            'loaded': len(self.products) > 0
        }
        
    def health_check(self) -> bool:
        """Check if cache is available"""
        return len(self.products) > 0


class SupplierClients:
    """
    Unified supplier client manager.
    
    Provides a single interface to query all supplier APIs.
    """
    
    SUPPLIER_SKU_PATTERNS = {
        'ascolour': [r'^\d{4,5}$', r'^AC-?\d+'],  # 5001, AC-5001
        'ssactivewear': [r'^[A-Z]{1,2}\d+', r'^[A-Z]+-?\d+'],  # G500, BC3001, NL3600
        'sanmar': [r'^[A-Z]{2,4}\d+', r'^SM-'],  # PC54, K110P, SM-
    }
    
    def __init__(self):
        self.clients: Dict[str, Any] = {}
        self._init_clients()
        
    def _init_clients(self):
        """Initialize available supplier clients"""
        # AS Colour
        try:
            self.clients['ascolour'] = ASColourClient()
        except ValueError as e:
            print(f"AS Colour client not available: {e}")
            
        # S&S Activewear
        try:
            self.clients['ssactivewear'] = SSActivewearClient()
        except ValueError as e:
            print(f"S&S Activewear client not available: {e}")
            
        # SanMar (CSV-based, always available)
        try:
            self.clients['sanmar'] = SanMarClient()
        except Exception as e:
            print(f"SanMar client not available: {e}")
            
    def detect_supplier(self, sku: str) -> str:
        """Detect supplier from SKU pattern"""
        import re
        
        sku_upper = sku.upper()
        
        # AS Colour: 4-5 digit style codes
        if re.match(r'^\d{4,5}$', sku_upper):
            return 'ascolour'
            
        # Common S&S patterns (Gildan, Bella, Next Level, etc.)
        ss_prefixes = ['G', 'BC', 'NL', 'CC', 'PC', 'DT', 'LPC', 'LST', 'B', 'IND', 'AL']
        for prefix in ss_prefixes:
            if sku_upper.startswith(prefix) and len(sku_upper) > len(prefix):
                return 'ssactivewear'
                
        # SanMar: alpha + numeric patterns
        if re.match(r'^[A-Z]{2,4}\d+[A-Z]?$', sku_upper):
            return 'sanmar'
            
        # Default to SanMar
        return 'sanmar'
        
    def get_product(self, sku: str, supplier: Optional[str] = None) -> Optional[ProductInfo]:
        """
        Get product information from supplier.
        
        Args:
            sku: Product SKU/style code
            supplier: Optional supplier name. Auto-detected if not provided.
            
        Returns:
            ProductInfo object or None if not found
        """
        if not supplier:
            supplier = self.detect_supplier(sku)
            
        supplier = supplier.lower()
        client = self.clients.get(supplier)
        
        if not client:
            print(f"No client available for supplier: {supplier}")
            return None
            
        raw_product = client.get_product(sku)
        if not raw_product:
            return None
            
        return self._transform_product(raw_product, supplier)
        
    def _transform_product(self, raw: Dict[str, Any], supplier: str) -> ProductInfo:
        """Transform raw supplier data to normalized ProductInfo"""
        if supplier == 'ascolour':
            return ProductInfo(
                sku=raw.get('styleCode') or raw.get('code', ''),
                name=raw.get('styleName') or raw.get('name', ''),
                brand='AS Colour',
                description=raw.get('description', ''),
                category=raw.get('productType', 'other'),
                supplier=supplier,
                base_price=raw.get('pricing', {}).get('wholesale', 0),
                specifications={
                    'fabric': raw.get('composition', ''),
                    'weight': raw.get('fabricWeight', ''),
                    'fit': raw.get('fit', '')
                },
                supplier_product_id=str(raw.get('webId', ''))
            )
        elif supplier == 'ssactivewear':
            colors = [c.get('colorName', '') for c in raw.get('colors', [])]
            sizes = raw.get('sizes', [])
            pricing = raw.get('pricing', [])
            
            return ProductInfo(
                sku=raw.get('styleID', ''),
                name=raw.get('styleName', ''),
                brand=raw.get('brandName', ''),
                description=raw.get('description', ''),
                category=raw.get('categoryName', 'other'),
                supplier=supplier,
                base_price=pricing[0].get('price', 0) if pricing else 0,
                colors=colors,
                sizes=sizes,
                specifications={
                    'fabric': raw.get('fabricContent', ''),
                    'weight': raw.get('pieceWeight', '')
                },
                price_breaks=[
                    {'quantity': p.get('quantity'), 'price': p.get('price')}
                    for p in pricing
                ],
                supplier_product_id=raw.get('styleID', '')
            )
        else:  # sanmar or unknown
            return ProductInfo(
                sku=raw.get('sku', ''),
                name=raw.get('name', ''),
                brand=raw.get('brand', ''),
                description=raw.get('description', ''),
                category=raw.get('category', 'other'),
                supplier=supplier,
                base_price=raw.get('pricing', {}).get('basePrice', 0),
                colors=raw.get('colors', []),
                sizes=raw.get('sizes', []),
                images=raw.get('images', []),
                supplier_product_id=raw.get('sku', '')
            )
            
    def health_check(self) -> Dict[str, bool]:
        """Check health of all supplier connections"""
        status = {}
        for name, client in self.clients.items():
            try:
                status[name] = client.health_check()
            except Exception:
                status[name] = False
        return status
        
    def get_available_suppliers(self) -> List[str]:
        """Get list of configured suppliers"""
        return list(self.clients.keys())


def main():
    """Command-line entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test supplier client connections')
    parser.add_argument('--sku', type=str, help='SKU to look up')
    parser.add_argument('--supplier', type=str, help='Specific supplier to query')
    parser.add_argument('--health', action='store_true', help='Run health checks')
    
    args = parser.parse_args()
    
    clients = SupplierClients()
    
    if args.health:
        print("\n🔍 Supplier Health Check:")
        print("-" * 40)
        for supplier, status in clients.health_check().items():
            emoji = "✅" if status else "❌"
            print(f"  {emoji} {supplier}: {'Connected' if status else 'Unavailable'}")
        print()
        
    if args.sku:
        print(f"\n🔍 Looking up SKU: {args.sku}")
        detected = clients.detect_supplier(args.sku)
        print(f"   Detected supplier: {detected}")
        
        product = clients.get_product(args.sku, supplier=args.supplier)
        if product:
            print(f"\n📦 Product Found:")
            print(f"   SKU: {product.sku}")
            print(f"   Name: {product.name}")
            print(f"   Brand: {product.brand}")
            print(f"   Category: {product.category}")
            print(f"   Base Price: ${product.base_price:.2f}")
        else:
            print(f"\n❌ Product not found")


if __name__ == '__main__':
    main()
