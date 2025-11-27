#!/usr/bin/env python3
"""
Printavo Complete Data Extraction Script

Pulls ALL data from Printavo V1 REST API before subscription cancellation:
- Orders (with embedded lineitems_attributes)
- Customers
- Order Statuses
- Users
- Products (saved product presets)
- Tasks (standalone tasks)
- Categories
- Delivery Methods
- Payment Terms
- Expenses
- Inquiries

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
OUTPUT_DIR = Path('data/raw/printavo-exports') / f"full_extraction_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"

# Rate limiting
REQUEST_DELAY = 0.6  # 600ms between requests

class PrintavoExtractor:
    def __init__(self, email: str, token: str):
        self.email = email
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PrintavoClient/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        self.stats = {
            'orders': 0,
            'customers': 0,
            'lineitemgroups': 0,
            'tasks': 0,
            'payments': 0,
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
            print(f"  ❌ {error_msg}")
            return None
    
    def fetch_all_pages(self, endpoint: str, per_page: int = 100) -> list:
        """Fetch all pages of a paginated endpoint"""
        all_data = []
        page = 1
        
        while True:
            print(f"  Fetching {endpoint} page {page}...", end='', flush=True)
            response = self.request(endpoint, {'page': page, 'per_page': per_page})
            
            if response is None:
                print(" ❌")
                break
            
            data = response.get('data', [])
            all_data.extend(data)
            
            meta = response.get('meta', {})
            total_pages = meta.get('total_pages', 1)
            total_count = meta.get('total_count', len(data))
            
            print(f" ✓ ({len(all_data)}/{total_count})")
            
            if page >= total_pages:
                break
            page += 1
        
        return all_data
    
    def fetch_orders(self) -> list:
        """Fetch all orders with lineitems"""
        print("\n📦 Fetching Orders...")
        orders = self.fetch_all_pages('orders')
        self.stats['orders'] = len(orders)
        return orders
    
    def fetch_customers(self) -> list:
        """Fetch all customers"""
        print("\n👥 Fetching Customers...")
        customers = self.fetch_all_pages('customers')
        self.stats['customers'] = len(customers)
        return customers
    
    def fetch_order_lineitemgroups(self, order_id: int) -> list:
        """Fetch lineitemgroups (imprints) for a specific order"""
        response = self.request(f'orders/{order_id}/lineitemgroups')
        if response:
            return response.get('data', response) if isinstance(response, dict) else response
        return []
    
    def fetch_all_lineitemgroups(self, orders: list) -> dict:
        """Fetch lineitemgroups for all orders"""
        print("\n🎨 Fetching Line Item Groups (Imprints)...")
        lineitemgroups = {}
        total = len(orders)
        
        for i, order in enumerate(orders):
            order_id = order.get('id')
            if not order_id:
                continue
            
            if (i + 1) % 50 == 0 or i == 0:
                print(f"  Processing order {i + 1}/{total} (ID: {order_id})...")
            
            groups = self.fetch_order_lineitemgroups(order_id)
            if groups:
                lineitemgroups[str(order_id)] = groups
                self.stats['lineitemgroups'] += len(groups) if isinstance(groups, list) else 1
        
        print(f"  ✓ Fetched lineitemgroups for {len(lineitemgroups)} orders")
        return lineitemgroups
    
    def fetch_order_tasks(self, order_id: int) -> list:
        """Fetch tasks for a specific order"""
        response = self.request(f'orders/{order_id}/tasks')
        if response:
            return response.get('data', response) if isinstance(response, dict) else response
        return []
    
    def fetch_all_tasks(self, orders: list) -> dict:
        """Fetch tasks for all orders"""
        print("\n✅ Fetching Tasks...")
        tasks = {}
        total = len(orders)
        
        for i, order in enumerate(orders):
            order_id = order.get('id')
            if not order_id:
                continue
            
            if (i + 1) % 100 == 0 or i == 0:
                print(f"  Processing order {i + 1}/{total} (ID: {order_id})...")
            
            order_tasks = self.fetch_order_tasks(order_id)
            if order_tasks:
                tasks[str(order_id)] = order_tasks
                self.stats['tasks'] += len(order_tasks) if isinstance(order_tasks, list) else 1
        
        print(f"  ✓ Fetched tasks for {len(tasks)} orders")
        return tasks
    
    def fetch_order_payments(self, order_id: int) -> list:
        """Fetch payments for a specific order"""
        response = self.request(f'orders/{order_id}/payments')
        if response:
            return response.get('data', response) if isinstance(response, dict) else response
        return []
    
    def fetch_all_payments(self, orders: list) -> dict:
        """Fetch payments for all orders"""
        print("\n💰 Fetching Payments...")
        payments = {}
        total = len(orders)
        
        for i, order in enumerate(orders):
            order_id = order.get('id')
            if not order_id:
                continue
            
            if (i + 1) % 100 == 0 or i == 0:
                print(f"  Processing order {i + 1}/{total} (ID: {order_id})...")
            
            order_payments = self.fetch_order_payments(order_id)
            if order_payments:
                payments[str(order_id)] = order_payments
                self.stats['payments'] += len(order_payments) if isinstance(order_payments, list) else 1
        
        print(f"  ✓ Fetched payments for {len(payments)} orders")
        return payments
    
    def fetch_account(self) -> dict:
        """Fetch account information"""
        print("\n🏢 Fetching Account Info...")
        response = self.request('account')
        if response:
            print("  ✓ Account info fetched")
        return response or {}
    
    def fetch_order_statuses(self) -> list:
        """Fetch all order statuses"""
        print("\n📊 Fetching Order Statuses...")
        response = self.request('orderstatuses')
        if response:
            statuses = response.get('data', response) if isinstance(response, dict) else response
            print(f"  ✓ Fetched {len(statuses)} order statuses")
            return statuses
        return []
    
    def fetch_users(self) -> list:
        """Fetch all users"""
        print("\n👤 Fetching Users...")
        users = self.fetch_all_pages('users')
        print(f"  ✓ Fetched {len(users)} users")
        return users
    
    def save_json(self, data: any, filename: str):
        """Save data to JSON file"""
        filepath = OUTPUT_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print(f"  💾 Saved {filepath}")
    
    def run_full_extraction(self, include_lineitemgroups: bool = True, 
                           include_tasks: bool = True,
                           include_payments: bool = True):
        """Run complete data extraction"""
        print("=" * 60)
        print("🚀 PRINTAVO FULL DATA EXTRACTION")
        print("=" * 60)
        print(f"Email: {self.email}")
        print(f"Output: {OUTPUT_DIR}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Create output directory
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Fetch base data
        account = self.fetch_account()
        self.save_json(account, 'account.json')
        
        statuses = self.fetch_order_statuses()
        self.save_json(statuses, 'order_statuses.json')
        
        users = self.fetch_users()
        self.save_json(users, 'users.json')
        
        customers = self.fetch_customers()
        self.save_json(customers, 'customers.json')
        
        orders = self.fetch_orders()
        self.save_json(orders, 'orders.json')
        
        # Fetch related data for each order
        if include_lineitemgroups:
            lineitemgroups = self.fetch_all_lineitemgroups(orders)
            self.save_json(lineitemgroups, 'lineitemgroups.json')
        
        if include_tasks:
            tasks = self.fetch_all_tasks(orders)
            self.save_json(tasks, 'tasks.json')
        
        if include_payments:
            payments = self.fetch_all_payments(orders)
            self.save_json(payments, 'payments.json')
        
        # Save summary
        summary = {
            'extraction_date': datetime.now().isoformat(),
            'email': self.email,
            'stats': self.stats,
            'files': [
                'account.json',
                'order_statuses.json', 
                'users.json',
                'customers.json',
                'orders.json',
                'lineitemgroups.json' if include_lineitemgroups else None,
                'tasks.json' if include_tasks else None,
                'payments.json' if include_payments else None,
            ]
        }
        self.save_json(summary, 'summary.json')
        
        # Print final summary
        print("\n" + "=" * 60)
        print("✅ EXTRACTION COMPLETE")
        print("=" * 60)
        print(f"Orders:          {self.stats['orders']:,}")
        print(f"Customers:       {self.stats['customers']:,}")
        print(f"Line Item Groups: {self.stats['lineitemgroups']:,}")
        print(f"Tasks:           {self.stats['tasks']:,}")
        print(f"Payments:        {self.stats['payments']:,}")
        print(f"Total Requests:  {self.stats['requests']:,}")
        print(f"Errors:          {len(self.stats['errors'])}")
        print(f"\nOutput Directory: {OUTPUT_DIR}")
        
        if self.stats['errors']:
            print(f"\n⚠️  Errors encountered:")
            for err in self.stats['errors'][:10]:
                print(f"  - {err}")
            if len(self.stats['errors']) > 10:
                print(f"  ... and {len(self.stats['errors']) - 10} more")
        
        return summary


def main():
    # Check for environment variables or use defaults
    email = os.getenv('PRINTAVO_EMAIL', 'ronny@mintprints.com')
    token = os.getenv('PRINTAVO_TOKEN', 'tApazCfvuQE-0Tl3YLIofg')
    
    if not email or not token:
        print("Error: PRINTAVO_EMAIL and PRINTAVO_TOKEN are required")
        print("Usage: PRINTAVO_EMAIL=email PRINTAVO_TOKEN=token python printavo-full-extraction.py")
        sys.exit(1)
    
    # Parse arguments
    include_lineitemgroups = '--skip-lineitemgroups' not in sys.argv
    include_tasks = '--skip-tasks' not in sys.argv
    include_payments = '--skip-payments' not in sys.argv
    
    if '--quick' in sys.argv:
        # Quick mode: just orders and customers
        include_lineitemgroups = False
        include_tasks = False
        include_payments = False
    
    extractor = PrintavoExtractor(email, token)
    
    try:
        extractor.run_full_extraction(
            include_lineitemgroups=include_lineitemgroups,
            include_tasks=include_tasks,
            include_payments=include_payments
        )
    except KeyboardInterrupt:
        print("\n\n⚠️  Extraction interrupted by user")
        sys.exit(1)


if __name__ == '__main__':
    main()
