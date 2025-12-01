#!/usr/bin/env python3
"""
Strapi API Client with Retry Logic
===================================
Reusable client for Strapi API with:
- Exponential backoff retry
- Health checks
- Connection management
- Batch operations

Usage:
    from lib.strapi_client import StrapiClient
    client = StrapiClient(url, token)
    client.wait_for_healthy()
    ok, response = client.post('/api/customers', {'data': {...}})
"""

import os
import time
import requests
from typing import Dict, List, Optional, Tuple, Any
from functools import wraps


class StrapiClient:
    """Strapi API client with retry logic and health checks."""
    
    DEFAULT_TIMEOUT = 30
    DEFAULT_RETRY_ATTEMPTS = 3
    DEFAULT_RETRY_DELAY = 1.0
    
    def __init__(
        self,
        url: Optional[str] = None,
        token: Optional[str] = None,
        timeout: int = DEFAULT_TIMEOUT,
        retry_attempts: int = DEFAULT_RETRY_ATTEMPTS,
        retry_delay: float = DEFAULT_RETRY_DELAY
    ):
        """
        Initialize Strapi client.
        
        Args:
            url: Strapi URL (defaults to STRAPI_URL env var)
            token: API token (defaults to STRAPI_TOKEN env var)
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts
            retry_delay: Base delay between retries (exponential backoff)
        """
        self.url = url or os.getenv("STRAPI_URL", "http://localhost:1337")
        self.token = token or os.getenv("STRAPI_TOKEN", "")
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        })
    
    def health_check(self) -> bool:
        """Check if Strapi is reachable and responding."""
        try:
            r = self.session.get(
                f"{self.url}/api/customers?pagination[limit]=1",
                timeout=10
            )
            return r.status_code == 200
        except Exception as e:
            return False
    
    def wait_for_healthy(self, max_wait: int = 300, interval: int = 5) -> bool:
        """
        Wait for Strapi to become healthy.
        
        Args:
            max_wait: Maximum time to wait in seconds
            interval: Time between checks in seconds
            
        Returns:
            True if healthy, False if timeout
        """
        start = time.time()
        while time.time() - start < max_wait:
            if self.health_check():
                return True
            time.sleep(interval)
        return False
    
    def _retry_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Execute request with exponential backoff retry.
        
        Returns:
            Tuple of (success, response_data or error)
        """
        for attempt in range(self.retry_attempts):
            try:
                kwargs['timeout'] = self.timeout
                
                response = self.session.request(
                    method,
                    f"{self.url}{endpoint}",
                    **kwargs
                )
                
                if response.status_code in (200, 201):
                    return True, response.json()
                elif response.status_code == 400:
                    # Validation error, don't retry
                    try:
                        return False, response.json()
                    except:
                        return False, {"error": {"message": response.text}}
                elif response.status_code in (401, 403):
                    # Auth error, don't retry
                    return False, {"error": {"message": f"Authentication error: {response.status_code}"}}
                elif response.status_code == 404:
                    return False, {"error": {"message": f"Not found: {endpoint}"}}
                else:
                    # Retry on 5xx errors
                    if attempt < self.retry_attempts - 1:
                        delay = self.retry_delay * (2 ** attempt)
                        time.sleep(delay)
                        
            except requests.exceptions.Timeout:
                if attempt < self.retry_attempts - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    time.sleep(delay)
            except requests.exceptions.ConnectionError:
                if attempt < self.retry_attempts - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    time.sleep(delay)
                    # Re-check health
                    if not self.wait_for_healthy(60):
                        return False, {"error": {"message": "Connection lost"}}
            except Exception as e:
                return False, {"error": {"message": str(e)}}
        
        return False, {"error": {"message": "Max retries exceeded"}}
    
    def post(self, endpoint: str, data: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        POST request with retry.
        
        Args:
            endpoint: API endpoint (e.g., '/api/customers')
            data: Request body
            
        Returns:
            Tuple of (success, response_data or error)
        """
        return self._retry_request('POST', endpoint, json=data)
    
    def put(self, endpoint: str, data: Dict) -> Tuple[bool, Optional[Dict]]:
        """
        PUT request with retry.
        
        Args:
            endpoint: API endpoint (e.g., '/api/customers/1')
            data: Request body
            
        Returns:
            Tuple of (success, response_data or error)
        """
        return self._retry_request('PUT', endpoint, json=data)
    
    def get(self, endpoint: str, params: Optional[Dict] = None) -> Tuple[bool, Optional[Dict]]:
        """
        GET request with retry.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            
        Returns:
            Tuple of (success, response_data or error)
        """
        return self._retry_request('GET', endpoint, params=params)
    
    def get_count(self, endpoint: str) -> int:
        """
        Get total count for a collection.
        
        Args:
            endpoint: API endpoint (e.g., '/api/customers')
            
        Returns:
            Total count or 0 on error
        """
        ok, data = self.get(f"{endpoint}?pagination[limit]=1")
        if ok and data:
            return data.get("meta", {}).get("pagination", {}).get("total", 0)
        return 0
    
    def find_by_field(
        self,
        endpoint: str,
        field: str,
        value: str,
        page_size: int = 1
    ) -> Tuple[bool, Optional[List[Dict]]]:
        """
        Find records by field value.
        
        Args:
            endpoint: API endpoint
            field: Field name to filter by
            value: Value to match
            page_size: Number of results to return
            
        Returns:
            Tuple of (success, list of records)
        """
        ok, data = self.get(
            endpoint,
            params={
                f"filters[{field}][$eq]": value,
                "pagination[pageSize]": page_size
            }
        )
        if ok and data:
            return True, data.get("data", [])
        return False, None
    
    def exists_by_field(self, endpoint: str, field: str, value: str) -> bool:
        """
        Check if a record exists by field value.
        
        Args:
            endpoint: API endpoint
            field: Field name to check
            value: Value to match
            
        Returns:
            True if exists, False otherwise
        """
        ok, records = self.find_by_field(endpoint, field, value, page_size=1)
        return ok and records is not None and len(records) > 0
    
    def get_all_paginated(
        self,
        endpoint: str,
        page_size: int = 100,
        fields: Optional[List[str]] = None,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Get all records with pagination.
        
        Args:
            endpoint: API endpoint
            page_size: Records per page
            fields: Fields to include (for optimization)
            filters: Filter criteria
            
        Returns:
            List of all records
        """
        all_records = []
        page = 1
        
        while True:
            params = {
                "pagination[page]": page,
                "pagination[pageSize]": page_size
            }
            
            if fields:
                for i, field in enumerate(fields):
                    params[f"fields[{i}]"] = field
            
            if filters:
                for key, value in filters.items():
                    params[f"filters[{key}][$eq]"] = value
            
            ok, data = self.get(endpoint, params)
            
            if not ok or not data:
                break
            
            records = data.get("data", [])
            if not records:
                break
            
            all_records.extend(records)
            
            pagination = data.get("meta", {}).get("pagination", {})
            if page >= pagination.get("pageCount", 1):
                break
            
            page += 1
        
        return all_records
    
    def batch_create(
        self,
        endpoint: str,
        records: List[Dict],
        progress_callback: Optional[callable] = None
    ) -> Tuple[int, int, List[Dict]]:
        """
        Create multiple records.
        
        Args:
            endpoint: API endpoint
            records: List of records to create
            progress_callback: Optional callback(current, total) for progress
            
        Returns:
            Tuple of (success_count, failed_count, failed_records)
        """
        success = 0
        failed = 0
        failed_records = []
        
        for i, record in enumerate(records):
            ok, response = self.post(endpoint, {"data": record})
            
            if ok:
                success += 1
            else:
                failed += 1
                failed_records.append({
                    "record": record,
                    "error": response
                })
            
            if progress_callback:
                progress_callback(i + 1, len(records))
        
        return success, failed, failed_records
