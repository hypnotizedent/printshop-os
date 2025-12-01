"""
Printavo API Client

Complete API client for Printavo V1 REST API with all endpoints.
Handles rate limiting, pagination, and error recovery.

API Docs: https://printavo.docs.apiary.io/
Rate Limit: 10 requests per 5 seconds (600ms between requests)
"""

import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, Generator, List, Optional
import requests


@dataclass
class APIStats:
    """Statistics for API usage tracking."""
    requests: int = 0
    errors: List[str] = field(default_factory=list)
    rate_limited: int = 0
    started_at: Optional[str] = None
    last_request_at: Optional[str] = None


class PrintavoAPI:
    """
    Printavo REST API client.
    
    Features:
    - All API endpoints (orders, customers, tasks, payments, etc.)
    - Automatic pagination
    - Rate limiting (600ms between requests)
    - Retry with exponential backoff
    - Checkpoint/resume support
    """
    
    BASE_URL = 'https://www.printavo.com/api/v1'
    REQUEST_DELAY = 0.6  # 600ms between requests
    MAX_RETRIES = 3
    
    def __init__(
        self,
        email: Optional[str] = None,
        token: Optional[str] = None,
        checkpoint_file: Optional[Path] = None
    ):
        """
        Initialize Printavo API client.
        
        Args:
            email: Printavo account email (or PRINTAVO_EMAIL env var)
            token: Printavo API token (or PRINTAVO_TOKEN env var)
            checkpoint_file: Path to checkpoint file for resume support
        """
        self.email = email or os.getenv('PRINTAVO_EMAIL', '')
        self.token = token or os.getenv('PRINTAVO_TOKEN', '')
        self.checkpoint_file = checkpoint_file
        
        if not self.email or not self.token:
            raise ValueError("PRINTAVO_EMAIL and PRINTAVO_TOKEN are required")
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PrintavoExtractor/2.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        self.stats = APIStats(started_at=datetime.now().isoformat())
        self._checkpoint: Dict[str, Any] = {}
        
        if checkpoint_file and checkpoint_file.exists():
            self._load_checkpoint()
    
    def _load_checkpoint(self) -> None:
        """Load checkpoint from file."""
        if self.checkpoint_file and self.checkpoint_file.exists():
            try:
                with open(self.checkpoint_file, 'r') as f:
                    self._checkpoint = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._checkpoint = {}
    
    def _save_checkpoint(self, key: str, value: Any) -> None:
        """Save checkpoint to file."""
        self._checkpoint[key] = value
        self._checkpoint['updated_at'] = datetime.now().isoformat()
        
        if self.checkpoint_file:
            with open(self.checkpoint_file, 'w') as f:
                json.dump(self._checkpoint, f, indent=2, default=str)
    
    def request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        method: str = 'GET'
    ) -> Optional[Dict[str, Any]]:
        """
        Make authenticated API request with rate limiting and retry.
        
        Args:
            endpoint: API endpoint (e.g., 'orders', 'customers/123')
            params: Query parameters
            method: HTTP method
            
        Returns:
            JSON response or None on error
        """
        if params is None:
            params = {}
        
        params['email'] = self.email
        params['token'] = self.token
        
        url = f"{self.BASE_URL}/{endpoint}"
        
        for attempt in range(self.MAX_RETRIES):
            try:
                self.stats.requests += 1
                self.stats.last_request_at = datetime.now().isoformat()
                
                if method.upper() == 'GET':
                    response = self.session.get(url, params=params, timeout=30)
                else:
                    response = self.session.post(url, params=params, timeout=30)
                
                # Handle rate limiting
                if response.status_code == 429:
                    self.stats.rate_limited += 1
                    wait_time = 5 * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                time.sleep(self.REQUEST_DELAY)
                return response.json()
                
            except requests.exceptions.Timeout:
                time.sleep(2 ** attempt)
                
            except requests.exceptions.RequestException as e:
                error_msg = f"Request error {endpoint}: {str(e)}"
                self.stats.errors.append(error_msg)
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)
                else:
                    return None
        
        return None
    
    def fetch_paginated(
        self,
        endpoint: str,
        per_page: int = 100,
        on_page: Optional[Callable[[List[Dict], int, int], None]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch all pages of a paginated endpoint.
        
        Args:
            endpoint: API endpoint
            per_page: Items per page (max 100)
            on_page: Callback function called after each page (items, current, total)
            
        Returns:
            List of all items
        """
        all_data = []
        page = 1
        
        # Check for resume point
        resume_key = f"{endpoint}_page"
        if resume_key in self._checkpoint:
            page = self._checkpoint[resume_key]
            # Reload previously fetched data if available
            data_key = f"{endpoint}_data"
            if data_key in self._checkpoint:
                all_data = self._checkpoint[data_key]
        
        while True:
            response = self.request(endpoint, {'page': page, 'per_page': per_page})
            
            if response is None:
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
            
            if on_page:
                total_count = len(all_data)
                if isinstance(response, dict) and 'meta' in response:
                    total_count = response['meta'].get('total_count', total_count)
                on_page(data, len(all_data), total_count)
            
            # Save checkpoint every 5 pages
            if page % 5 == 0:
                self._save_checkpoint(resume_key, page + 1)
                self._save_checkpoint(f"{endpoint}_data", all_data)
            
            if page >= total_pages:
                break
            page += 1
        
        return all_data
    
    def fetch_simple(self, endpoint: str) -> List[Dict[str, Any]]:
        """
        Fetch a non-paginated endpoint.
        
        Args:
            endpoint: API endpoint
            
        Returns:
            List of items
        """
        response = self.request(endpoint)
        
        if response is None:
            return []
        
        if isinstance(response, list):
            return response
        elif isinstance(response, dict):
            return response.get('data', [response])
        return []
    
    # =========================================================================
    # Core Data Endpoints
    # =========================================================================
    
    def get_orders(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all orders with embedded line items."""
        return self.fetch_paginated('orders', per_page=per_page)
    
    def get_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Fetch a single order by ID."""
        response = self.request(f'orders/{order_id}')
        if response and isinstance(response, dict):
            return response.get('data', response)
        return None
    
    def get_customers(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all customers."""
        return self.fetch_paginated('customers', per_page=per_page)
    
    def get_customer(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """Fetch a single customer by ID."""
        response = self.request(f'customers/{customer_id}')
        if response and isinstance(response, dict):
            return response.get('data', response)
        return None
    
    # =========================================================================
    # Order Detail Endpoints
    # =========================================================================
    
    def get_order_lineitems(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch line items for an order."""
        response = self.request(f'orders/{order_id}/lineitems')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    def get_order_lineitemgroups(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch line item groups (imprints) for an order."""
        response = self.request(f'orders/{order_id}/lineitemgroups')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    def get_order_tasks(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch tasks for an order."""
        response = self.request(f'orders/{order_id}/tasks')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    def get_order_payments(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch payments for an order."""
        response = self.request(f'orders/{order_id}/payments')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    def get_order_expenses(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch expenses for an order."""
        response = self.request(f'orders/{order_id}/expenses')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    def get_order_fees(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch fees for an order."""
        response = self.request(f'orders/{order_id}/fees')
        if response:
            if isinstance(response, list):
                return response
            return response.get('data', [])
        return []
    
    # =========================================================================
    # Reference Data Endpoints
    # =========================================================================
    
    def get_account(self) -> Dict[str, Any]:
        """Fetch account information."""
        return self.request('account') or {}
    
    def get_order_statuses(self) -> List[Dict[str, Any]]:
        """Fetch all order statuses."""
        return self.fetch_simple('orderstatuses')
    
    def get_users(self) -> List[Dict[str, Any]]:
        """Fetch all users."""
        return self.fetch_paginated('users', per_page=100)
    
    def get_categories(self) -> List[Dict[str, Any]]:
        """Fetch all categories."""
        return self.fetch_simple('categories')
    
    def get_delivery_methods(self) -> List[Dict[str, Any]]:
        """Fetch all delivery methods."""
        return self.fetch_simple('delivery_methods')
    
    def get_payment_terms(self) -> List[Dict[str, Any]]:
        """Fetch all payment terms."""
        return self.fetch_simple('payment_terms')
    
    def get_products(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all saved products."""
        return self.fetch_paginated('products', per_page=per_page)
    
    def get_tasks(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all standalone tasks."""
        return self.fetch_paginated('tasks', per_page=per_page)
    
    def get_expenses(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all expenses."""
        return self.fetch_paginated('expenses', per_page=per_page)
    
    def get_inquiries(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch all inquiries."""
        return self.fetch_paginated('inquiries', per_page=per_page)
    
    # =========================================================================
    # Bulk Data Extraction
    # =========================================================================
    
    def extract_all_order_details(
        self,
        orders: List[Dict[str, Any]],
        on_progress: Optional[Callable[[int, int], None]] = None
    ) -> Dict[str, Any]:
        """
        Extract detailed data for all orders.
        
        Args:
            orders: List of orders
            on_progress: Callback (current, total) for progress updates
            
        Returns:
            Dict with lineitemgroups, tasks, payments, expenses by order_id
        """
        result = {
            'lineitemgroups': {},
            'tasks': {},
            'payments': {},
            'expenses': {},
            'fees': {},
        }
        
        # Check for resume point
        start_index = self._checkpoint.get('order_details_index', 0)
        if start_index > 0:
            # Load previously extracted data
            for key in result.keys():
                if key in self._checkpoint:
                    result[key] = self._checkpoint[key]
        
        total = len(orders)
        
        for i, order in enumerate(orders[start_index:], start=start_index):
            order_id = order.get('id')
            if not order_id:
                continue
            
            if on_progress:
                on_progress(i + 1, total)
            
            # Fetch all details for this order
            order_id_str = str(order_id)
            
            groups = self.get_order_lineitemgroups(order_id)
            if groups:
                result['lineitemgroups'][order_id_str] = groups
            
            tasks = self.get_order_tasks(order_id)
            if tasks:
                result['tasks'][order_id_str] = tasks
            
            payments = self.get_order_payments(order_id)
            if payments:
                result['payments'][order_id_str] = payments
            
            expenses = self.get_order_expenses(order_id)
            if expenses:
                result['expenses'][order_id_str] = expenses
            
            fees = self.get_order_fees(order_id)
            if fees:
                result['fees'][order_id_str] = fees
            
            # Checkpoint every 20 orders
            if (i + 1) % 20 == 0:
                self._save_checkpoint('order_details_index', i + 1)
                for key, value in result.items():
                    self._save_checkpoint(key, value)
        
        return result
    
    def extract_line_items_from_orders(
        self,
        orders: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Extract all line items from orders (they're embedded in order data).
        
        Args:
            orders: List of orders
            
        Returns:
            Flat list of all line items
        """
        all_items = []
        
        for order in orders:
            order_id = order.get('id')
            visual_id = order.get('visual_id')
            
            for li in order.get('lineitems_attributes', []):
                li['order_id'] = order_id
                li['order_visual_id'] = visual_id
                all_items.append(li)
        
        return all_items
    
    # =========================================================================
    # Generator Methods for Memory-Efficient Processing
    # =========================================================================
    
    def iter_orders(self, per_page: int = 100) -> Generator[Dict[str, Any], None, None]:
        """
        Iterate over all orders without loading all into memory.
        
        Yields:
            Individual order dictionaries
        """
        page = 1
        
        while True:
            response = self.request('orders', {'page': page, 'per_page': per_page})
            
            if response is None:
                break
            
            if isinstance(response, list):
                data = response
            elif isinstance(response, dict):
                data = response.get('data', [])
            else:
                break
            
            if not data:
                break
            
            for order in data:
                yield order
            
            meta = response.get('meta', {}) if isinstance(response, dict) else {}
            if page >= meta.get('total_pages', 1):
                break
            
            page += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get API usage statistics."""
        return {
            'requests': self.stats.requests,
            'errors': len(self.stats.errors),
            'rate_limited': self.stats.rate_limited,
            'started_at': self.stats.started_at,
            'last_request_at': self.stats.last_request_at,
            'error_messages': self.stats.errors[-10:],  # Last 10 errors
        }
