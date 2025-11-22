#!/usr/bin/env python3
"""
Printavo API Client - Phase 1: Discovery & Planning

This script provides a basic client for connecting to the Printavo API
to extract data for analysis and eventual migration to printshop-os.

Usage:
    1. Set your PRINTAVO_API_KEY environment variable or update the placeholder below
    2. Run: python3 api_client.py
    3. Review the exported data for schema analysis
    
Next Steps:
    - Export customers and invoices to JSON/CSV
    - Analyze the data schemas and relationships
    - Map Printavo data structure to printshop-os data models
    - Plan the migration strategy
    - Implement data transformation and import scripts
"""

import os
import requests
import json
from typing import Dict, List, Optional, Any


class APIClient:
    """
    Printavo API Client for data extraction and analysis.
    
    This client provides methods to connect to the Printavo API and
    fetch various resources like customers, invoices, orders, etc.
    
    Attributes:
        api_key (str): Your Printavo API key
        base_url (str): Base URL for the Printavo API
        email (str): Email associated with your Printavo account
    """
    
    def __init__(self, api_key: str, email: str, base_url: str = "https://www.printavo.com/api/v1"):
        """
        Initialize the Printavo API client.
        
        Args:
            api_key: Your Printavo API authentication key
            email: Email address associated with your Printavo account
            base_url: Base URL for the API (default: production URL)
        """
        self.api_key = api_key
        self.email = email
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'PrintShopOS-Migration/1.0'
        })
    
    def _make_request(self, endpoint: str, method: str = 'GET', params: Optional[Dict] = None, 
                     data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make an authenticated request to the Printavo API.
        
        Args:
            endpoint: API endpoint (e.g., '/customers')
            method: HTTP method (GET, POST, etc.)
            params: Query parameters
            data: Request body data
            
        Returns:
            JSON response as a dictionary
            
        Raises:
            requests.exceptions.RequestException: If the request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making request to {url}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            raise
    
    def fetch_customers(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Fetch customer records from Printavo.
        
        Args:
            limit: Number of records to fetch per request (max 100)
            offset: Number of records to skip
            
        Returns:
            List of customer dictionaries
            
        Example:
            >>> client = APIClient(api_key="your-key", email="you@example.com")
            >>> customers = client.fetch_customers(limit=50)
            >>> print(f"Retrieved {len(customers)} customers")
        """
        params = {
            'limit': limit,
            'offset': offset,
            'email': self.email
        }
        
        response = self._make_request('/customers', params=params)
        
        # The actual response structure may vary - adjust based on API documentation
        if isinstance(response, list):
            return response
        elif isinstance(response, dict) and 'data' in response:
            return response['data']
        else:
            return [response]
    
    def fetch_invoices(self, limit: int = 100, offset: int = 0, 
                       status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch invoice/order records from Printavo.
        
        Args:
            limit: Number of records to fetch per request (max 100)
            offset: Number of records to skip
            status: Filter by invoice status (e.g., 'pending', 'paid', 'completed')
            
        Returns:
            List of invoice dictionaries
            
        Example:
            >>> client = APIClient(api_key="your-key", email="you@example.com")
            >>> invoices = client.fetch_invoices(limit=50, status='paid')
            >>> print(f"Retrieved {len(invoices)} invoices")
        """
        params = {
            'limit': limit,
            'offset': offset,
            'email': self.email
        }
        
        if status:
            params['status'] = status
        
        response = self._make_request('/invoices', params=params)
        
        # The actual response structure may vary - adjust based on API documentation
        if isinstance(response, list):
            return response
        elif isinstance(response, dict) and 'data' in response:
            return response['data']
        else:
            return [response]
    
    def fetch_all_customers(self) -> List[Dict[str, Any]]:
        """
        Fetch all customers with pagination handling.
        
        Returns:
            List of all customer dictionaries
        """
        all_customers = []
        offset = 0
        limit = 100
        
        print("Fetching all customers...")
        while True:
            batch = self.fetch_customers(limit=limit, offset=offset)
            if not batch:
                break
            
            all_customers.extend(batch)
            print(f"  Retrieved {len(all_customers)} customers so far...")
            
            if len(batch) < limit:
                break
                
            offset += limit
        
        print(f"Total customers retrieved: {len(all_customers)}")
        return all_customers
    
    def fetch_all_invoices(self) -> List[Dict[str, Any]]:
        """
        Fetch all invoices with pagination handling.
        
        Returns:
            List of all invoice dictionaries
        """
        all_invoices = []
        offset = 0
        limit = 100
        
        print("Fetching all invoices...")
        while True:
            batch = self.fetch_invoices(limit=limit, offset=offset)
            if not batch:
                break
            
            all_invoices.extend(batch)
            print(f"  Retrieved {len(all_invoices)} invoices so far...")
            
            if len(batch) < limit:
                break
                
            offset += limit
        
        print(f"Total invoices retrieved: {len(all_invoices)}")
        return all_invoices
    
    def export_to_json(self, data: Any, filename: str) -> None:
        """
        Export data to a JSON file.
        
        Args:
            data: Data to export (will be JSON serialized)
            filename: Output filename
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Data exported to {filename}")


def main():
    """
    Main execution block demonstrating how to use the APIClient.
    
    Before running:
    1. Set PRINTAVO_API_KEY environment variable with your API key
    2. Set PRINTAVO_EMAIL environment variable with your account email
    3. Or update the placeholders below directly (not recommended for production)
    """
    
    # OPTION 1: Load from environment variables (recommended)
    api_key = os.getenv('PRINTAVO_API_KEY', 'YOUR_API_KEY_HERE')
    email = os.getenv('PRINTAVO_EMAIL', 'your-email@example.com')
    
    # OPTION 2: Set directly (for testing only - don't commit real keys!)
    # api_key = "your-actual-api-key"
    # email = "your-email@example.com"
    
    # Check if credentials are set
    if api_key == 'YOUR_API_KEY_HERE' or email == 'your-email@example.com':
        print("=" * 70)
        print("ERROR: API credentials not configured!")
        print("=" * 70)
        print("\nPlease set your Printavo API credentials:")
        print("\n  Option 1 (Recommended):")
        print("    export PRINTAVO_API_KEY='your-api-key'")
        print("    export PRINTAVO_EMAIL='your-email@example.com'")
        print("\n  Option 2 (Testing only):")
        print("    Edit this file and update the api_key and email variables")
        print("\n" + "=" * 70)
        return
    
    # Initialize the API client
    print("Initializing Printavo API Client...")
    client = APIClient(api_key=api_key, email=email)
    
    try:
        # Example 1: Fetch a sample of customers
        print("\n" + "=" * 70)
        print("EXAMPLE 1: Fetching sample customers (first 10)")
        print("=" * 70)
        customers = client.fetch_customers(limit=10)
        print(f"Retrieved {len(customers)} customers")
        
        if customers:
            print("\nSample customer structure:")
            print(json.dumps(customers[0], indent=2))
            
            # Export to file for analysis
            client.export_to_json(customers, 'printavo_customers_sample.json')
        
        # Example 2: Fetch a sample of invoices
        print("\n" + "=" * 70)
        print("EXAMPLE 2: Fetching sample invoices (first 10)")
        print("=" * 70)
        invoices = client.fetch_invoices(limit=10)
        print(f"Retrieved {len(invoices)} invoices")
        
        if invoices:
            print("\nSample invoice structure:")
            print(json.dumps(invoices[0], indent=2))
            
            # Export to file for analysis
            client.export_to_json(invoices, 'printavo_invoices_sample.json')
        
        # Example 3: Full data export (commented out - use when ready for full export)
        print("\n" + "=" * 70)
        print("FULL DATA EXPORT (currently disabled)")
        print("=" * 70)
        print("To export all data, uncomment the following lines:")
        print("  # all_customers = client.fetch_all_customers()")
        print("  # client.export_to_json(all_customers, 'printavo_customers_full.json')")
        print("  # all_invoices = client.fetch_all_invoices()")
        print("  # client.export_to_json(all_invoices, 'printavo_invoices_full.json')")
        
        # Uncomment these lines when ready to do a full export:
        # all_customers = client.fetch_all_customers()
        # client.export_to_json(all_customers, 'printavo_customers_full.json')
        # 
        # all_invoices = client.fetch_all_invoices()
        # client.export_to_json(all_invoices, 'printavo_invoices_full.json')
        
        print("\n" + "=" * 70)
        print("NEXT STEPS:")
        print("=" * 70)
        print("1. Review the exported JSON files to understand the data schema")
        print("2. Analyze relationships between customers, invoices, and other entities")
        print("3. Map Printavo fields to printshop-os data models (Strapi)")
        print("4. Identify any data transformation requirements")
        print("5. Plan the migration strategy (one-time vs. incremental)")
        print("6. Implement data transformation scripts")
        print("7. Test import into printshop-os development environment")
        print("=" * 70)
        
    except requests.exceptions.RequestException as e:
        print(f"\nError connecting to Printavo API: {e}")
        print("\nTroubleshooting:")
        print("  - Verify your API key is correct")
        print("  - Check your email is associated with a Printavo account")
        print("  - Ensure you have API access enabled in Printavo")
        print("  - Check your internet connection")
        print("  - Review Printavo API documentation for any changes")


if __name__ == "__main__":
    main()
