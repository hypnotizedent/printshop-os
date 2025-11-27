#!/usr/bin/env python3
"""
Printavo Complete Data Extraction Script

Pulls ALL data from Printavo V1 REST API before subscription cancellation.
Discovered endpoints via API testing and Apiary documentation.

Available data:
- orders: 12,867+ (with embedded lineitems_attributes)
- customers: 3,358+
- orderstatuses: 48
- users: 4
- products: 105 (saved product presets)
- tasks: 1,463 (standalone tasks across all orders)
- categories: 19
- delivery_methods: 2
- payment_terms: 4
- expenses: 297
- inquiries: 4

Rate limit: 10 requests per 5 seconds (600ms between requests)
API Docs: https://printavo.docs.apiary.io/
"""
import json
import os
import sys
import time
import requests
from datetime import datetime
from pathlib import Path

# Configuration
PRINTAVO_EMAIL = os.getenv('PRINTAVO_EMAIL', 'ronny@mintprints.com')
PRINTAVO_TOKEN = os.getenv('PRINTAVO_TOKEN', 'tApazCfvuQE-0Tl3YLIofg')
BASE_URL = 'https://www.printavo.com/api/v1'

# Rate limiting
REQUEST_DELAY = 0.6  # 600ms between requests


class PrintavoExtractor:
    def __init__(self, email: str, token: str, output_dir: Path):
        self.email = email
        self.token = token
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PrintavoExtractor/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        self.stats = {
            'requests': 0,
            'errors': []
        }
    
    def request(self, endpoint: str, params: dict = None) -> dict:
        """Make authenticated request with rate limiting"""
        if params is None:
            params = {}
        params['email'] = self.email
        params['token'] = self.token
        
        url = f"{BASE_URL}/{endpoint}"
        
        try:
            self.stats['requests'] += 1
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = f"Error fetching {endpoint}: {str(e)}"
            self.stats['errors'].append(error_msg)
            return None
    
    def fetch_paginated(self, endpoint: str, per_page: int = 100) -> list:
        """Fetch all pages of a paginated endpoint"""
        all_data = []
        page = 1
        
        while True:
            print(f"    Page {page}...", end='', flush=True)
            response = self.request(endpoint, {'page': page, 'per_page': per_page})
            
            if response is None:
                print(" ❌")
                break
            
            # Handle different response formats
            if isinstance(response, list):
                data = response
                total_pages = 1
            elif isinstance(response, dict):
                data = response.get('data', [])
                meta = response.get('meta', {})
                total_pages = meta.get('total_pages', 1)
            else:
                break
            
            all_data.extend(data)
            count = len(all_data)
            
            if isinstance(response, dict) and 'meta' in response:
                total = response['meta'].get('total_count', count)
                print(f" ✓ ({count}/{total})")
            else:
                print(f" ✓ ({count})")
            
            if page >= total_pages:
                break
            page += 1
        
        return all_data
    
    def fetch_simple(self, endpoint: str) -> list:
        """Fetch a non-paginated endpoint"""
        response = self.request(endpoint)
        if response is None:
            return []
        
        if isinstance(response, list):
            return response
        elif isinstance(response, dict):
            return response.get('data', [response])
        return []
    
    def save_json(self, data: any, filename: str):
        """Save data to JSON file"""
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        size_kb = filepath.stat().st_size / 1024
        print(f"    💾 Saved {filename} ({size_kb:.1f} KB)")
    
    def run(self):
        """Run the complete extraction"""
        print("=" * 70)
        print("🚀 PRINTAVO COMPLETE DATA EXTRACTION")
        print("=" * 70)
        print(f"Email: {self.email}")
        print(f"Output: {self.output_dir}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        results = {}
        
        # 1. Orders (paginated, largest dataset)
        print("📦 Orders...")
        orders = self.fetch_paginated('orders')
        self.save_json(orders, 'orders.json')
        results['orders'] = len(orders)
        
        # Extract lineitems from orders
        all_lineitems = []
        for order in orders:
            for li in order.get('lineitems_attributes', []):
                li['order_id'] = order.get('id')
                li['order_visual_id'] = order.get('visual_id')
                all_lineitems.append(li)
        self.save_json(all_lineitems, 'lineitems.json')
        results['lineitems'] = len(all_lineitems)
        print(f"    📝 Extracted {len(all_lineitems)} line items from orders")
        
        # 2. Customers (paginated)
        print("\n👥 Customers...")
        customers = self.fetch_paginated('customers')
        self.save_json(customers, 'customers.json')
        results['customers'] = len(customers)
        
        # 3. Tasks (paginated - standalone tasks)
        print("\n✅ Tasks...")
        tasks = self.fetch_paginated('tasks')
        self.save_json(tasks, 'tasks.json')
        results['tasks'] = len(tasks)
        
        # 4. Products (paginated - saved products)
        print("\n🏷️ Products...")
        products = self.fetch_paginated('products')
        self.save_json(products, 'products.json')
        results['products'] = len(products)
        
        # 5. Expenses (paginated)
        print("\n💸 Expenses...")
        expenses = self.fetch_paginated('expenses')
        self.save_json(expenses, 'expenses.json')
        results['expenses'] = len(expenses)
        
        # 6. Order Statuses (simple)
        print("\n📊 Order Statuses...")
        statuses = self.fetch_simple('orderstatuses')
        self.save_json(statuses, 'order_statuses.json')
        results['order_statuses'] = len(statuses)
        print(f"    ✓ {len(statuses)} statuses")
        
        # 7. Users (small, paginated)
        print("\n👤 Users...")
        users = self.fetch_paginated('users')
        self.save_json(users, 'users.json')
        results['users'] = len(users)
        
        # 8. Categories (simple)
        print("\n📂 Categories...")
        categories = self.fetch_simple('categories')
        self.save_json(categories, 'categories.json')
        results['categories'] = len(categories)
        print(f"    ✓ {len(categories)} categories")
        
        # 9. Delivery Methods (simple)
        print("\n🚚 Delivery Methods...")
        delivery_methods = self.fetch_simple('delivery_methods')
        self.save_json(delivery_methods, 'delivery_methods.json')
        results['delivery_methods'] = len(delivery_methods)
        print(f"    ✓ {len(delivery_methods)} delivery methods")
        
        # 10. Payment Terms (simple)
        print("\n💳 Payment Terms...")
        payment_terms = self.fetch_simple('payment_terms')
        self.save_json(payment_terms, 'payment_terms.json')
        results['payment_terms'] = len(payment_terms)
        print(f"    ✓ {len(payment_terms)} payment terms")
        
        # 11. Inquiries (small, paginated)
        print("\n📧 Inquiries...")
        inquiries = self.fetch_paginated('inquiries')
        self.save_json(inquiries, 'inquiries.json')
        results['inquiries'] = len(inquiries)
        
        # Save summary
        summary = {
            'extraction_date': datetime.now().isoformat(),
            'email': self.email,
            'results': results,
            'total_requests': self.stats['requests'],
            'errors': self.stats['errors'],
            'files': [
                'orders.json',
                'lineitems.json',
                'customers.json',
                'tasks.json',
                'products.json',
                'expenses.json',
                'order_statuses.json',
                'users.json',
                'categories.json',
                'delivery_methods.json',
                'payment_terms.json',
                'inquiries.json',
            ]
        }
        self.save_json(summary, 'summary.json')
        
        # Print final summary
        print("\n" + "=" * 70)
        print("✅ EXTRACTION COMPLETE")
        print("=" * 70)
        for key, count in results.items():
            print(f"  {key:20s}: {count:,}")
        print(f"\n  Total Requests: {self.stats['requests']:,}")
        print(f"  Errors: {len(self.stats['errors'])}")
        print(f"\n  Output Directory: {self.output_dir}")
        
        if self.stats['errors']:
            print(f"\n⚠️  Errors encountered:")
            for err in self.stats['errors'][:10]:
                print(f"    - {err}")
        
        return summary


def main():
    email = os.getenv('PRINTAVO_EMAIL', 'ronny@mintprints.com')
    token = os.getenv('PRINTAVO_TOKEN', 'tApazCfvuQE-0Tl3YLIofg')
    
    if not email or not token:
        print("Error: PRINTAVO_EMAIL and PRINTAVO_TOKEN are required")
        sys.exit(1)
    
    output_dir = Path('data/raw/printavo-exports') / f"complete_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"
    
    extractor = PrintavoExtractor(email, token, output_dir)
    
    try:
        extractor.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Extraction interrupted by user")
        sys.exit(1)


if __name__ == '__main__':
    main()
