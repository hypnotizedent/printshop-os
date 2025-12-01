#!/usr/bin/env python3
"""
PrintShop OS - Supplier Sync CLI

Manages the two-tier product catalog:
1. Top Products in Strapi (~500-1000 SKUs for quick quoting)
2. Full Catalog API (500K-1M products for AI agents)

Usage:
    python3 scripts/supplier-sync.py analyze
    python3 scripts/supplier-sync.py sync-top-products [--limit 500]
    python3 scripts/supplier-sync.py sync-supplier --supplier as-colour
    python3 scripts/supplier-sync.py update-inventory
    python3 scripts/supplier-sync.py full-refresh
    python3 scripts/supplier-sync.py status

Environment Variables:
    STRAPI_URL - Strapi CMS URL (default: http://localhost:1337)
    STRAPI_API_TOKEN - Strapi API token for authentication
    
    # Suppliers
    ASCOLOUR_API_KEY - AS Colour subscription key
    ASCOLOUR_EMAIL - AS Colour account email
    ASCOLOUR_PASSWORD - AS Colour account password
    
    SS_ACTIVEWEAR_API_KEY - S&S Activewear API key
    SS_ACTIVEWEAR_ACCOUNT_NUMBER - S&S account number
    
    SANMAR_USERNAME - SanMar username
    SANMAR_PASSWORD - SanMar password
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add scripts directory to path for imports
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from lib.product_analyzer import ProductAnalyzer, TopProduct
from lib.supplier_clients import SupplierClients, ProductInfo


class StrapiClient:
    """Client for Strapi CMS API"""
    
    def __init__(self):
        self.base_url = os.getenv('STRAPI_URL', 'http://localhost:1337')
        self.token = os.getenv('STRAPI_API_TOKEN', '')
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
        if self.token:
            self.session.headers['Authorization'] = f'Bearer {self.token}'
            
    def get_product(self, sku: str) -> Optional[Dict[str, Any]]:
        """Get product by SKU"""
        try:
            response = self.session.get(
                f'{self.base_url}/api/products',
                params={'filters[sku][$eq]': sku}
            )
            response.raise_for_status()
            data = response.json()
            products = data.get('data', [])
            return products[0] if products else None
        except requests.RequestException:
            return None
            
    def create_product(self, product_data: Dict[str, Any]) -> bool:
        """Create a new product"""
        try:
            response = self.session.post(
                f'{self.base_url}/api/products',
                json={'data': product_data}
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"Failed to create product {product_data.get('sku')}: {e}")
            return False
            
    def update_product(self, document_id: str, product_data: Dict[str, Any]) -> bool:
        """Update an existing product"""
        try:
            response = self.session.put(
                f'{self.base_url}/api/products/{document_id}',
                json={'data': product_data}
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"Failed to update product: {e}")
            return False
            
    def upsert_product(self, product_data: Dict[str, Any]) -> bool:
        """Create or update a product"""
        existing = self.get_product(product_data['sku'])
        
        if existing:
            # Preserve certain fields
            product_data['usageCount'] = existing.get('usageCount', 0)
            return self.update_product(existing['documentId'], product_data)
        else:
            return self.create_product(product_data)
            
    def get_products(self, filters: Optional[Dict] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get products with optional filters"""
        try:
            params = {'pagination[limit]': limit}
            if filters:
                for key, value in filters.items():
                    params[f'filters[{key}]'] = value
                    
            response = self.session.get(f'{self.base_url}/api/products', params=params)
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.RequestException:
            return []
            
    def get_top_products(self, limit: int = 500) -> List[Dict[str, Any]]:
        """Get top products ordered by score"""
        try:
            response = self.session.get(
                f'{self.base_url}/api/products',
                params={
                    'filters[isTopProduct][$eq]': 'true',
                    'sort': 'topProductScore:desc',
                    'pagination[limit]': limit
                }
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.RequestException:
            return []
            
    def health_check(self) -> bool:
        """Check Strapi connection"""
        try:
            response = self.session.get(f'{self.base_url}/_health')
            return response.status_code == 204
        except requests.RequestException:
            # Try alternate health check
            try:
                response = self.session.get(f'{self.base_url}/api/products?pagination[limit]=1')
                return response.status_code == 200
            except:
                return False


class SupplierSync:
    """
    Main orchestrator for supplier sync operations.
    
    Manages the two-tier product catalog:
    1. Top Products (Strapi) - Curated SKUs for quick quoting
    2. Full Catalog (API) - Real-time supplier queries
    """
    
    def __init__(self):
        self.strapi = StrapiClient()
        self.supplier_clients = SupplierClients()
        self.analyzer = ProductAnalyzer()
        self.project_root = script_dir.parent
        
    def cmd_analyze(self, args):
        """Analyze order history to identify top products"""
        print("\n📊 Analyzing Order History")
        print("=" * 60)
        
        limit = getattr(args, 'limit', 500)
        products = self.analyzer.analyze(limit=limit)
        
        self.analyzer.print_summary(products)
        output_path = self.analyzer.save_results(products)
        
        print(f"\n✅ Analysis complete!")
        print(f"   Found {len(products)} top products")
        print(f"   Results saved to: {output_path}")
        
        return products
        
    def cmd_sync_top_products(self, args):
        """Sync top products to Strapi"""
        print("\n📦 Syncing Top Products to Strapi")
        print("=" * 60)
        
        limit = getattr(args, 'limit', 500)
        dry_run = getattr(args, 'dry_run', False)
        
        # First analyze to get top products
        print("\nStep 1: Analyzing order history...")
        top_products = self.analyzer.analyze(limit=limit)
        
        if not top_products:
            print("❌ No products found in analysis")
            return
            
        print(f"   Found {len(top_products)} top products")
        
        # Fetch product details from suppliers
        print("\nStep 2: Fetching product details from suppliers...")
        synced = 0
        errors = 0
        
        for i, top_product in enumerate(top_products, 1):
            try:
                sku = top_product.style_number
                
                # Try to get product info from suppliers
                product_info = self.supplier_clients.get_product(sku)
                
                if product_info:
                    # Build Strapi product data
                    product_data = product_info.to_strapi_format()
                    product_data.update({
                        'isTopProduct': True,
                        'orderCount': top_product.order_count,
                        'totalUnitsOrdered': top_product.total_quantity,
                        'topProductScore': top_product.score,
                        'lastOrderedAt': top_product.last_used,
                        'isCurated': True,
                        'priority': min(100, int(top_product.score))
                    })
                else:
                    # Create basic product from analysis data
                    product_data = {
                        'sku': sku,
                        'name': top_product.style_name,
                        'brand': self._extract_brand(top_product.style_name),
                        'description': '',
                        'category': 'other',
                        'supplier': self._detect_supplier_from_sku(sku),
                        'isTopProduct': True,
                        'orderCount': top_product.order_count,
                        'totalUnitsOrdered': top_product.total_quantity,
                        'topProductScore': top_product.score,
                        'lastOrderedAt': top_product.last_used,
                        'isCurated': True,
                        'priority': min(100, int(top_product.score)),
                        'colors': top_product.sample_colors,
                        'tags': top_product.categories,
                        'lastSyncedAt': datetime.now(timezone.utc).isoformat()
                    }
                    
                if dry_run:
                    print(f"   [DRY] Would sync: {sku} - {top_product.style_name[:40]}")
                else:
                    if self.strapi.upsert_product(product_data):
                        synced += 1
                    else:
                        errors += 1
                        
                # Progress indicator
                if i % 50 == 0:
                    print(f"   Progress: {i}/{len(top_products)}")
                    
            except Exception as e:
                errors += 1
                print(f"   ❌ Error syncing {top_product.style_number}: {e}")
                
        print(f"\n✅ Sync complete!")
        print(f"   Synced: {synced}")
        print(f"   Errors: {errors}")
        
    def cmd_sync_supplier(self, args):
        """Sync all products from a specific supplier"""
        supplier = getattr(args, 'supplier', '').lower()
        
        if not supplier:
            print("❌ --supplier is required")
            return
            
        print(f"\n📦 Syncing products from {supplier}")
        print("=" * 60)
        
        # This would typically call the TypeScript sync scripts
        # For now, we'll delegate to the existing npm commands
        
        supplier_map = {
            'as-colour': 'sync-as-colour.ts',
            'ascolour': 'sync-as-colour.ts',
            's&s-activewear': 'sync-ss-activewear.ts',
            'ssactivewear': 'sync-ss-activewear.ts',
            'sanmar': 'sync-sanmar.ts',
        }
        
        script_name = supplier_map.get(supplier)
        if not script_name:
            print(f"❌ Unknown supplier: {supplier}")
            print(f"   Available: {', '.join(supplier_map.keys())}")
            return
            
        # Point to the TypeScript CLI
        ts_path = self.project_root / 'services' / 'supplier-sync' / 'src' / 'cli' / script_name
        
        if ts_path.exists():
            print(f"   Run: npx ts-node {ts_path}")
            print("\n   Or use npm command:")
            print(f"   cd services/supplier-sync && npx ts-node src/cli/{script_name}")
        else:
            print(f"   Sync script not found: {ts_path}")
            
    def cmd_update_inventory(self, args):
        """Update inventory for top products"""
        print("\n🔄 Updating Inventory for Top Products")
        print("=" * 60)
        
        # Get current top products from Strapi
        top_products = self.strapi.get_top_products(limit=500)
        
        if not top_products:
            print("❌ No top products found in Strapi")
            return
            
        print(f"   Found {len(top_products)} top products")
        print("   Updating inventory from suppliers...")
        
        updated = 0
        for i, product in enumerate(top_products, 1):
            sku = product.get('sku')
            if not sku:
                continue
                
            try:
                # Get fresh product info
                product_info = self.supplier_clients.get_product(sku)
                
                if product_info:
                    update_data = {
                        'basePrice': product_info.base_price,
                        'isActive': product_info.in_stock,
                        'lastSyncedAt': datetime.now(timezone.utc).isoformat()
                    }
                    
                    if self.strapi.update_product(product['documentId'], update_data):
                        updated += 1
                        
            except Exception as e:
                print(f"   ⚠️  Error updating {sku}: {e}")
                
            if i % 50 == 0:
                print(f"   Progress: {i}/{len(top_products)}")
                
        print(f"\n✅ Inventory update complete!")
        print(f"   Updated: {updated}")
        
    def cmd_full_refresh(self, args):
        """Full refresh of all product data"""
        print("\n🔄 Full Product Refresh")
        print("=" * 60)
        
        # 1. Analyze order history
        print("\nStep 1: Analyzing order history...")
        self.cmd_analyze(args)
        
        # 2. Sync top products
        print("\nStep 2: Syncing top products to Strapi...")
        args.limit = 500
        self.cmd_sync_top_products(args)
        
        # 3. Update inventory
        print("\nStep 3: Updating inventory...")
        self.cmd_update_inventory(args)
        
        print("\n✅ Full refresh complete!")
        
    def cmd_status(self, args):
        """Show current sync status"""
        print("\n📊 Supplier Sync Status")
        print("=" * 60)
        
        # Check Strapi
        strapi_ok = self.strapi.health_check()
        print(f"\n{'✅' if strapi_ok else '❌'} Strapi CMS: {self.strapi.base_url}")
        
        # Check suppliers
        print("\n📦 Supplier Connections:")
        for supplier, status in self.supplier_clients.health_check().items():
            print(f"   {'✅' if status else '❌'} {supplier}")
            
        # Count products in Strapi
        if strapi_ok:
            try:
                all_products = self.strapi.get_products(limit=1)
                top_products = self.strapi.get_top_products(limit=1)
                
                # Get counts from Strapi
                response = requests.get(
                    f'{self.strapi.base_url}/api/products',
                    params={'pagination[limit]': 1, 'pagination[withCount]': 'true'},
                    headers=self.strapi.session.headers
                )
                total = response.json().get('meta', {}).get('pagination', {}).get('total', '?')
                
                response = requests.get(
                    f'{self.strapi.base_url}/api/products',
                    params={
                        'filters[isTopProduct][$eq]': 'true',
                        'pagination[limit]': 1,
                        'pagination[withCount]': 'true'
                    },
                    headers=self.strapi.session.headers
                )
                top_count = response.json().get('meta', {}).get('pagination', {}).get('total', '?')
                
                print(f"\n📋 Strapi Products:")
                print(f"   Total products: {total}")
                print(f"   Top products: {top_count}")
            except Exception as e:
                print(f"\n   ⚠️  Could not get product counts: {e}")
                
        # Check for top-500 analysis file
        analysis_file = self.project_root / 'data' / 'intelligence' / 'top-500-products.json'
        if analysis_file.exists():
            with open(analysis_file) as f:
                data = json.load(f)
            print(f"\n📊 Last Analysis:")
            print(f"   Date: {data.get('generatedAt', 'Unknown')}")
            print(f"   Total products analyzed: {data.get('totalUniqueProducts', '?')}")
            print(f"   Top products: {data.get('topProductCount', '?')}")
        else:
            print(f"\n⚠️  No analysis found. Run: python3 scripts/supplier-sync.py analyze")
            
    def _extract_brand(self, style_name: str) -> str:
        """Extract brand name from style name"""
        brand_patterns = [
            'Next Level', 'Gildan', 'Bella+Canvas', 'Bella Canvas',
            'Comfort Colors', 'Port & Company', 'District', 'JERZEES',
            'Hanes', 'Champion', 'American Apparel', 'AS Colour',
            'Independent Trading', 'Lane Seven', 'Los Angeles Apparel'
        ]
        
        for brand in brand_patterns:
            if brand.lower() in style_name.lower():
                return brand
                
        # Try to extract from beginning of name
        parts = style_name.split(' - ')
        if len(parts) > 1:
            return parts[0].strip()
            
        return 'Unknown'
        
    def _detect_supplier_from_sku(self, sku: str) -> str:
        """Detect supplier from SKU pattern"""
        return self.supplier_clients.detect_supplier(sku)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='PrintShop OS Supplier Sync CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  analyze           Analyze order history to identify top products
  sync-top-products Sync top products to Strapi CMS
  sync-supplier     Sync all products from a specific supplier
  update-inventory  Update inventory for existing top products
  full-refresh      Full refresh of all product data (weekly job)
  status            Show current sync status

Examples:
  # Analyze order history
  python3 scripts/supplier-sync.py analyze

  # Sync top 500 products to Strapi
  python3 scripts/supplier-sync.py sync-top-products --limit 500

  # Sync AS Colour products
  python3 scripts/supplier-sync.py sync-supplier --supplier as-colour

  # Update inventory for top products (daily job)
  python3 scripts/supplier-sync.py update-inventory

  # Full refresh (weekly job)
  python3 scripts/supplier-sync.py full-refresh
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze order history')
    analyze_parser.add_argument('--limit', type=int, default=500, help='Number of top products')
    analyze_parser.add_argument('--output', type=str, help='Output file path')
    
    # sync-top-products command
    sync_parser = subparsers.add_parser('sync-top-products', help='Sync top products to Strapi')
    sync_parser.add_argument('--limit', type=int, default=500, help='Number of products to sync')
    sync_parser.add_argument('--dry-run', action='store_true', help='Preview without syncing')
    
    # sync-supplier command
    supplier_parser = subparsers.add_parser('sync-supplier', help='Sync products from supplier')
    supplier_parser.add_argument('--supplier', type=str, required=True,
                                 choices=['as-colour', 'ascolour', 's&s-activewear', 
                                         'ssactivewear', 'sanmar'],
                                 help='Supplier to sync')
    supplier_parser.add_argument('--limit', type=int, help='Limit number of products')
    
    # update-inventory command
    inventory_parser = subparsers.add_parser('update-inventory', help='Update inventory')
    
    # full-refresh command
    refresh_parser = subparsers.add_parser('full-refresh', help='Full product refresh')
    refresh_parser.add_argument('--limit', type=int, default=500, help='Number of top products')
    
    # status command
    status_parser = subparsers.add_parser('status', help='Show sync status')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
        
    # Initialize sync
    sync = SupplierSync()
    
    # Run command
    command_map = {
        'analyze': sync.cmd_analyze,
        'sync-top-products': sync.cmd_sync_top_products,
        'sync-supplier': sync.cmd_sync_supplier,
        'update-inventory': sync.cmd_update_inventory,
        'full-refresh': sync.cmd_full_refresh,
        'status': sync.cmd_status,
    }
    
    handler = command_map.get(args.command)
    if handler:
        handler(args)
    else:
        print(f"Unknown command: {args.command}")
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
