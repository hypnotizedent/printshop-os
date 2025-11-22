"""
EasyPost Shipping Client for PrintShop OS

This module provides integration with EasyPost API for creating and managing
shipping labels. It handles authentication, shipment creation, label generation,
and tracking for orders in the PrintShop OS platform.

Documentation:
- EasyPost Python Library: https://github.com/EasyPost/easypost-python
- EasyPost API Docs: https://www.easypost.com/docs/api

Environment Variables:
- EASYPOST_API_KEY: Your EasyPost API key (required)
- EASYPOST_MODE: 'test' or 'production' (default: 'test')
"""

import os
from typing import Dict, Optional, Any
import easypost


class EasyPostClient:
    """
    Client for interacting with the EasyPost API.
    
    This class provides methods to create shipments, generate shipping labels,
    and track packages using the EasyPost service.
    
    Attributes:
        api_key (str): EasyPost API key for authentication
        client (easypost.EasyPostClient): Initialized EasyPost client instance
        mode (str): Operation mode - 'test' or 'production'
    """
    
    def __init__(self, api_key: Optional[str] = None, mode: Optional[str] = None):
        """
        Initialize the EasyPost client.
        
        Args:
            api_key: EasyPost API key. If not provided, reads from EASYPOST_API_KEY
                     environment variable.
            mode: Operation mode - 'test' or 'production'. If not provided, reads from
                  EASYPOST_MODE environment variable, defaulting to 'test'.
        
        Raises:
            ValueError: If API key is not provided and not found in environment.
        """
        self.api_key = api_key or os.getenv("EASYPOST_API_KEY")
        if not self.api_key:
            raise ValueError(
                "EasyPost API key is required. Provide it as an argument or "
                "set the EASYPOST_API_KEY environment variable."
            )
        
        self.mode = mode if mode is not None else os.getenv("EASYPOST_MODE", "test")
        self.client = easypost.EasyPostClient(self.api_key)
    
    def create_shipment(
        self,
        from_address: Dict[str, str],
        to_address: Dict[str, str],
        parcel: Dict[str, float],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a shipment with EasyPost.
        
        Args:
            from_address: Dictionary containing sender address information.
                Required keys: name, street1, city, state, zip, country
            to_address: Dictionary containing recipient address information.
                Required keys: name, street1, city, state, zip, country
            parcel: Dictionary containing package dimensions.
                Required keys: length, width, height, weight
            **kwargs: Additional optional parameters (customs_info, options, etc.)
        
        Returns:
            Dictionary containing shipment details including:
            - id: Shipment ID
            - rates: Available shipping rates
            - tracking_code: Tracking number (if available)
            - postage_label: Label information (if purchased)
        
        Raises:
            easypost.Error: If shipment creation fails
        
        Example:
            >>> client = EasyPostClient()
            >>> shipment = client.create_shipment(
            ...     from_address={
            ...         "name": "PrintShop OS",
            ...         "street1": "123 Main St",
            ...         "city": "San Francisco",
            ...         "state": "CA",
            ...         "zip": "94105",
            ...         "country": "US"
            ...     },
            ...     to_address={
            ...         "name": "John Doe",
            ...         "street1": "456 Market St",
            ...         "city": "Los Angeles",
            ...         "state": "CA",
            ...         "zip": "90001",
            ...         "country": "US"
            ...     },
            ...     parcel={
            ...         "length": 10,
            ...         "width": 8,
            ...         "height": 4,
            ...         "weight": 15.5
            ...     }
            ... )
        """
        # Create shipment with EasyPost
        shipment = self.client.shipment.create(
            to_address=to_address,
            from_address=from_address,
            parcel=parcel,
            **kwargs
        )
        
        return self._shipment_to_dict(shipment)
    
    def buy_shipment(
        self,
        shipment_id: str,
        rate_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Purchase a shipping label for a shipment.
        
        Args:
            shipment_id: The ID of the shipment to purchase
            rate_id: The ID of the rate to purchase. If not provided,
                    uses the lowest rate automatically.
        
        Returns:
            Dictionary containing updated shipment details with:
            - postage_label: Label URL and details
            - tracking_code: Package tracking number
            - selected_rate: The purchased rate information
        
        Raises:
            easypost.Error: If label purchase fails
        
        Example:
            >>> label = client.buy_shipment("shp_123456")
        """
        shipment = self.client.shipment.retrieve(shipment_id)
        
        # If no rate specified, use the lowest rate
        if not rate_id and shipment.rates:
            rate = shipment.lowest_rate()
        else:
            rate = next((r for r in shipment.rates if r.id == rate_id), None)
            if not rate:
                raise ValueError(f"Rate {rate_id} not found for shipment {shipment_id}")
        
        # Buy the shipment with selected rate
        bought_shipment = self.client.shipment.buy(shipment_id, rate=rate)
        
        return self._shipment_to_dict(bought_shipment)
    
    def get_label_url(self, shipment_id: str) -> Optional[str]:
        """
        Get the URL for a purchased shipping label.
        
        Args:
            shipment_id: The ID of the shipment
        
        Returns:
            URL string to download the label, or None if label not yet purchased
        
        Example:
            >>> url = client.get_label_url("shp_123456")
            >>> # Download or display the label at this URL
        """
        shipment = self.client.shipment.retrieve(shipment_id)
        
        if shipment.postage_label:
            return shipment.postage_label.label_url
        
        return None
    
    def track_shipment(self, tracking_code: str) -> Dict[str, Any]:
        """
        Get tracking information for a shipment.
        
        Args:
            tracking_code: The tracking code/number for the package
        
        Returns:
            Dictionary containing tracking information:
            - status: Current delivery status
            - tracking_details: List of tracking events
            - est_delivery_date: Estimated delivery date (if available)
        
        Raises:
            easypost.Error: If tracking lookup fails
        
        Example:
            >>> tracking = client.track_shipment("9400111899562539802544")
            >>> print(tracking['status'])
        """
        tracker = self.client.tracker.create(tracking_code=tracking_code)
        
        return {
            "id": tracker.id,
            "tracking_code": tracker.tracking_code,
            "status": tracker.status,
            "status_detail": tracker.status_detail,
            "est_delivery_date": tracker.est_delivery_date,
            "tracking_details": [
                {
                    "message": detail.message,
                    "status": detail.status,
                    "datetime": detail.datetime,
                    "tracking_location": {
                        "city": detail.tracking_location.city if detail.tracking_location else None,
                        "state": detail.tracking_location.state if detail.tracking_location else None,
                        "country": detail.tracking_location.country if detail.tracking_location else None,
                    } if detail.tracking_location else None
                }
                for detail in (tracker.tracking_details or [])
            ]
        }
    
    def list_rates(self, shipment_id: str) -> list:
        """
        Get available shipping rates for a shipment.
        
        Args:
            shipment_id: The ID of the shipment
        
        Returns:
            List of rate dictionaries, each containing:
            - id: Rate ID
            - carrier: Shipping carrier name
            - service: Service level
            - rate: Cost in dollars
            - delivery_days: Estimated delivery time
        
        Example:
            >>> rates = client.list_rates("shp_123456")
            >>> for rate in rates:
            ...     print(f"{rate['carrier']} {rate['service']}: ${rate['rate']}")
        """
        shipment = self.client.shipment.retrieve(shipment_id)
        
        return [
            {
                "id": rate.id,
                "carrier": rate.carrier,
                "service": rate.service,
                "rate": rate.rate,
                "currency": rate.currency,
                "delivery_days": rate.delivery_days,
                "delivery_date": rate.delivery_date,
                "delivery_date_guaranteed": rate.delivery_date_guaranteed,
            }
            for rate in (shipment.rates or [])
        ]
    
    def validate_address(self, address: Dict[str, str]) -> Dict[str, Any]:
        """
        Validate an address using EasyPost.
        
        Args:
            address: Dictionary containing address information to validate
        
        Returns:
            Dictionary containing:
            - valid: Boolean indicating if address is valid
            - address: Validated/corrected address if valid
            - errors: List of validation errors if invalid
        
        Example:
            >>> result = client.validate_address({
            ...     "street1": "123 Main St",
            ...     "city": "San Francisco",
            ...     "state": "CA",
            ...     "zip": "94105",
            ...     "country": "US"
            ... })
        """
        try:
            verified_address = self.client.address.create_and_verify(**address)
            
            return {
                "valid": True,
                "address": {
                    "street1": verified_address.street1,
                    "street2": verified_address.street2,
                    "city": verified_address.city,
                    "state": verified_address.state,
                    "zip": verified_address.zip,
                    "country": verified_address.country,
                },
                "errors": []
            }
        except easypost.Error as e:
            return {
                "valid": False,
                "address": address,
                "errors": [str(e)]
            }
    
    def _shipment_to_dict(self, shipment) -> Dict[str, Any]:
        """
        Convert an EasyPost shipment object to a dictionary.
        
        Args:
            shipment: EasyPost shipment object
        
        Returns:
            Dictionary representation of the shipment
        """
        result = {
            "id": shipment.id,
            "tracking_code": shipment.tracking_code,
            "status": shipment.status,
            "created_at": shipment.created_at,
            "updated_at": shipment.updated_at,
        }
        
        # Add rates if available
        if shipment.rates:
            result["rates"] = [
                {
                    "id": rate.id,
                    "carrier": rate.carrier,
                    "service": rate.service,
                    "rate": rate.rate,
                    "currency": rate.currency,
                    "delivery_days": rate.delivery_days,
                }
                for rate in shipment.rates
            ]
        
        # Add label information if purchased
        if shipment.postage_label:
            result["postage_label"] = {
                "id": shipment.postage_label.id,
                "label_url": shipment.postage_label.label_url,
                "label_pdf_url": shipment.postage_label.label_pdf_url,
                "label_size": shipment.postage_label.label_size,
                "label_type": shipment.postage_label.label_type,
            }
        
        # Add selected rate if purchased
        if shipment.selected_rate:
            result["selected_rate"] = {
                "id": shipment.selected_rate.id,
                "carrier": shipment.selected_rate.carrier,
                "service": shipment.selected_rate.service,
                "rate": shipment.selected_rate.rate,
            }
        
        return result
