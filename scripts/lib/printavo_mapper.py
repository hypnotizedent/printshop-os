#!/usr/bin/env python3
"""
Printavo to Strapi Field Mapper
================================
Maps Printavo export data to Strapi schema fields.

Handles:
- Customer mapping
- Order mapping
- Line item mapping
- Imprint mapping
- Status translations
- Date formatting
- Address normalization

Usage:
    from lib.printavo_mapper import PrintavoMapper
    mapper = PrintavoMapper()
    strapi_customer = mapper.map_customer(printavo_customer)
    strapi_order = mapper.map_order(printavo_order)
"""

from typing import Dict, Optional, Any, List, Tuple
from datetime import datetime
import re


class PrintavoMapper:
    """Maps Printavo data to Strapi schemas."""
    
    # Status mapping from Printavo to Strapi enum
    STATUS_MAP = {
        'Pending': 'QUOTE',
        'Pending Approval': 'QUOTE_SENT',
        'Quote Sent': 'QUOTE_SENT',
        'Approved': 'QUOTE_APPROVED',
        'Quote Approved': 'QUOTE_APPROVED',
        'Payment Received': 'INVOICE_PAID',
        'In Production': 'IN_PRODUCTION',
        'Waiting for Pickup': 'READY_FOR_PICKUP',
        'Ready for Pickup': 'READY_FOR_PICKUP',
        'Ready For Pickup': 'READY_FOR_PICKUP',
        'Complete': 'COMPLETE',
        'Delivered': 'COMPLETE',
        'Shipped': 'SHIPPED',
        'Cancelled': 'CANCELLED',
        'CANCELLED': 'CANCELLED',
        'QUOTE': 'QUOTE',
        'QUOTE_SENT': 'QUOTE_SENT',
        'QUOTE_APPROVED': 'QUOTE_APPROVED',
        'IN_PRODUCTION': 'IN_PRODUCTION',
        'COMPLETE': 'COMPLETE',
        'READY_FOR_PICKUP': 'READY_FOR_PICKUP',
        'SHIPPED': 'SHIPPED',
        'PAYMENT_NEEDED': 'PAYMENT_NEEDED',
        'INVOICE_PAID': 'INVOICE_PAID'
    }
    
    # Delivery method mapping
    DELIVERY_MAP = {
        'pickup': 'pickup',
        'ship': 'ship',
        'delivery': 'delivery',
        'Pickup': 'pickup',
        'Ship': 'ship',
        'Delivery': 'delivery',
        'shipping': 'ship',
        'Shipping': 'ship'
    }
    
    # Imprint location mapping
    LOCATION_MAP = {
        'front': 'Full Front',
        'full front': 'Full Front',
        'back': 'Full Back',
        'full back': 'Full Back',
        'left chest': 'Left Chest',
        'lc': 'Left Chest',
        'right chest': 'Right Chest',
        'rc': 'Right Chest',
        'left sleeve': 'Left Sleeve',
        'ls': 'Left Sleeve',
        'right sleeve': 'Right Sleeve',
        'rs': 'Right Sleeve',
        'nape': 'Nape',
        'neck': 'Nape',
        'pocket': 'Pocket',
        'left leg': 'Left Leg',
        'right leg': 'Right Leg'
    }
    
    # Decoration type mapping
    DECORATION_MAP = {
        'screen print': 'Screen Print',
        'screen printing': 'Screen Print',
        'screenprint': 'Screen Print',
        'embroidery': 'Embroidery',
        'emb': 'Embroidery',
        'dtg': 'DTG',
        'direct to garment': 'DTG',
        'dtf': 'DTF',
        'direct to film': 'DTF',
        'vinyl': 'Vinyl',
        'htv': 'Vinyl',
        'heat transfer vinyl': 'Vinyl',
        'sublimation': 'Sublimation',
        'sub': 'Sublimation',
        'dye sublimation': 'Sublimation'
    }
    
    # Size field mappings (Printavo key -> Strapi field)
    SIZE_FIELDS = {
        'size_xs': 'sizeXS',
        'size_s': 'sizeS',
        'size_m': 'sizeM',
        'size_l': 'sizeL',
        'size_xl': 'sizeXL',
        'size_2xl': 'size2XL',
        'size_3xl': 'size3XL',
        'size_4xl': 'size4XL',
        'size_5xl': 'size5XL',
        'size_other': 'sizeOther',
        # Youth sizes
        'size_yxs': 'sizeYXS',
        'size_ys': 'sizeYS',
        'size_ym': 'sizeYM',
        'size_yl': 'sizeYL',
        'size_yxl': 'sizeYXL',
        # Infant/Toddler sizes
        'size_6m': 'size6M',
        'size_12m': 'size12M',
        'size_18m': 'size18M',
        'size_24m': 'size24M',
        'size_2t': 'size2T',
        'size_3t': 'size3T',
        'size_4t': 'size4T',
        'size_5t': 'size5T'
    }
    
    def __init__(self):
        """Initialize the mapper."""
        pass
    
    @staticmethod
    def _safe_str(value: Any, max_length: int = 255) -> Optional[str]:
        """Safely convert value to string with max length."""
        if value is None:
            return None
        s = str(value).strip()
        if not s:
            return None
        return s[:max_length]
    
    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        """Safely convert value to float."""
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def _safe_int(value: Any, default: int = 0) -> int:
        """Safely convert value to integer."""
        if value is None:
            return default
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def _safe_bool(value: Any, default: bool = False) -> bool:
        """Safely convert value to boolean."""
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', 'yes', '1')
        return bool(value)
    
    @staticmethod
    def _format_date(value: Any) -> Optional[str]:
        """
        Format date to YYYY-MM-DD format.
        
        Handles:
        - ISO format: 2025-11-21T18:35:47.684-05:00
        - Simple format: 2025-11-21
        """
        if value is None:
            return None
        
        if isinstance(value, str):
            # Remove timezone info and time for date-only field
            if 'T' in value:
                value = value.split('T')[0]
            # Validate it looks like a date
            if re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                return value
        
        return None
    
    @staticmethod
    def _clean_email(email: Any) -> Optional[str]:
        """Clean and validate email address."""
        if email is None:
            return None
        
        email = str(email).strip().lower()
        
        # Basic email validation
        if '@' in email and '.' in email and len(email) >= 5:
            return email[:255]
        
        return None
    
    def _normalize_address(self, addr_data: Dict) -> Optional[Dict]:
        """
        Normalize address data to consistent format.
        
        Returns None if address is essentially empty.
        """
        if not addr_data:
            return None
        
        address = {
            'address1': self._safe_str(addr_data.get('address1')),
            'address2': self._safe_str(addr_data.get('address2')),
            'city': self._safe_str(addr_data.get('city')),
            'state': self._safe_str(addr_data.get('state_iso') or addr_data.get('state')),
            'zip': self._safe_str(addr_data.get('zip')),
            'country': self._safe_str(addr_data.get('country_iso') or addr_data.get('country')) or 'US'
        }
        
        # Check if address has any meaningful content
        if not any([address['address1'], address['city'], address['zip']]):
            return None
        
        return {k: v for k, v in address.items() if v is not None}
    
    def map_status(self, printavo_status: str) -> str:
        """Map Printavo status to Strapi enum."""
        if not printavo_status:
            return 'QUOTE'
        return self.STATUS_MAP.get(printavo_status, 'QUOTE')
    
    def map_delivery_method(self, delivery_method: Any) -> Optional[str]:
        """Map delivery method to Strapi enum."""
        if not delivery_method:
            return None
        method = str(delivery_method).lower().strip()
        return self.DELIVERY_MAP.get(method, 'other')
    
    def map_location(self, location: str) -> str:
        """Map imprint location to Strapi enum."""
        if not location:
            return 'Other'
        loc = location.lower().strip()
        return self.LOCATION_MAP.get(loc, 'Other')
    
    def map_decoration_type(self, dec_type: str, category: str = None) -> str:
        """
        Map decoration type to Strapi enum.
        
        Falls back to category if decoration type not specified.
        """
        # Try decoration type first
        if dec_type:
            dt = dec_type.lower().strip()
            if dt in self.DECORATION_MAP:
                return self.DECORATION_MAP[dt]
        
        # Fall back to category
        if category:
            cat = category.lower().strip()
            if cat in self.DECORATION_MAP:
                return self.DECORATION_MAP[cat]
        
        return 'Other'
    
    def map_customer(self, printavo_customer: Dict) -> Dict:
        """
        Map Printavo customer to Strapi customer schema.
        
        Args:
            printavo_customer: Raw Printavo customer data
            
        Returns:
            Dict matching Strapi customer schema
        """
        # Get name components
        first_name = self._safe_str(printavo_customer.get('first_name'), 100) or ''
        last_name = self._safe_str(printavo_customer.get('last_name'), 100) or ''
        company = self._safe_str(printavo_customer.get('company'), 255)
        
        # Build full name
        name = f"{first_name} {last_name}".strip()
        if not name:
            name = company or f"Customer {printavo_customer.get('id', 'Unknown')}"
        
        # Get email (try multiple fields)
        email = (
            self._clean_email(printavo_customer.get('email')) or
            self._clean_email(printavo_customer.get('customer_email'))
        )
        
        # Get address info (prefer shipping, fall back to billing)
        shipping = printavo_customer.get('shipping_address_attributes', {}) or {}
        billing = printavo_customer.get('billing_address_attributes', {}) or {}
        addr = shipping if shipping.get('address1') else billing
        
        result = {
            'name': name[:255],
            'email': email,
            'phone': self._safe_str(printavo_customer.get('phone'), 50),
            'company': company,
            'address': self._safe_str(addr.get('address1'), 255),
            'city': self._safe_str(addr.get('city'), 100),
            'state': self._safe_str(addr.get('state_iso') or addr.get('state'), 50),
            'zipCode': self._safe_str(addr.get('zip'), 20),
            'country': self._safe_str(addr.get('country_iso')) or 'US',
            'notes': self._safe_str(printavo_customer.get('extra_notes'), 5000),
            'printavoId': str(printavo_customer.get('id'))
        }
        
        # Remove None values
        return {k: v for k, v in result.items() if v is not None}
    
    def validate_customer(self, customer: Dict) -> Tuple[bool, List[str]]:
        """
        Validate customer data for import.
        
        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []
        
        if not customer.get('name'):
            errors.append("Name is required")
        
        if not customer.get('email'):
            errors.append("Email is required")
        
        return len(errors) == 0, errors
    
    def map_order(self, printavo_order: Dict) -> Dict:
        """
        Map Printavo order to Strapi order schema.
        
        Args:
            printavo_order: Raw Printavo order data
            
        Returns:
            Dict matching Strapi order schema
        """
        # Get status from nested orderstatus object
        orderstatus = printavo_order.get('orderstatus', {}) or {}
        status_name = orderstatus.get('name', 'QUOTE')
        
        # Get addresses from order_addresses_attributes
        addresses = printavo_order.get('order_addresses_attributes', []) or []
        billing_addr = None
        shipping_addr = None
        
        for addr in addresses:
            addr_name = (addr.get('name') or '').lower()
            if 'billing' in addr_name:
                billing_addr = self._normalize_address(addr)
            elif 'shipping' in addr_name:
                shipping_addr = self._normalize_address(addr)
        
        # Calculate fees from order_fees_attributes
        fees = 0.0
        fees_attrs = printavo_order.get('order_fees_attributes', []) or []
        for fee in fees_attrs:
            fees += self._safe_float(fee.get('amount'))
        
        result = {
            'orderNumber': str(printavo_order.get('visual_id', printavo_order.get('id'))),
            'orderNickname': self._safe_str(printavo_order.get('order_nickname'), 255),
            'status': self.map_status(status_name),
            'totalAmount': self._safe_float(printavo_order.get('order_total')),
            'amountPaid': self._safe_float(printavo_order.get('amount_paid')),
            'amountOutstanding': self._safe_float(printavo_order.get('amount_outstanding')),
            'salesTax': self._safe_float(printavo_order.get('sales_tax')),
            'discount': self._safe_float(printavo_order.get('discount')),
            'fees': fees,
            'dueDate': self._format_date(printavo_order.get('due_date')),
            'customerDueDate': self._format_date(printavo_order.get('customer_due_date')),
            'productionDueDate': self._format_date(printavo_order.get('production_due_date')),
            'invoiceDate': self._format_date(printavo_order.get('invoice_date')),
            'paymentDueDate': self._format_date(printavo_order.get('payment_due_date')),
            'notes': self._safe_str(printavo_order.get('notes'), 10000),
            'productionNotes': self._safe_str(printavo_order.get('production_notes'), 10000),
            'customerPO': self._safe_str(printavo_order.get('visual_po_number'), 100),
            'printavoId': str(printavo_order.get('id')),
            'printavoCustomerId': str(printavo_order.get('customer_id')) if printavo_order.get('customer_id') else None,
            'visualId': str(printavo_order.get('visual_id', '')),
            'publicHash': self._safe_str(printavo_order.get('public_hash'), 100),
            'billingAddress': billing_addr,
            'shippingAddress': shipping_addr,
            'approved': self._safe_bool(printavo_order.get('approved'))
        }
        
        # Handle delivery method if present
        if printavo_order.get('delivery_method_id'):
            # Map delivery method ID if known
            result['deliveryMethod'] = 'other'
        
        # Remove None values
        return {k: v for k, v in result.items() if v is not None}
    
    def validate_order(self, order: Dict) -> Tuple[bool, List[str]]:
        """
        Validate order data for import.
        
        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []
        
        if not order.get('orderNumber'):
            errors.append("Order number is required")
        
        return len(errors) == 0, errors
    
    def map_line_item(self, printavo_item: Dict, order_id: int = None, order_visual_id: str = None) -> Dict:
        """
        Map Printavo line item to Strapi line-item schema.
        
        Args:
            printavo_item: Raw Printavo line item data
            order_id: Printavo order ID
            order_visual_id: Order visual ID
            
        Returns:
            Dict matching Strapi line-item schema
        """
        result = {
            'printavoId': str(printavo_item.get('id')),
            'orderId': order_id,
            'orderVisualId': order_visual_id,
            'category': self._safe_str(printavo_item.get('category'), 100),
            'styleNumber': self._safe_str(printavo_item.get('style_number'), 100),
            'styleDescription': self._safe_str(printavo_item.get('style_description'), 1000),
            'color': self._safe_str(printavo_item.get('color'), 100),
            'totalQuantity': self._safe_int(printavo_item.get('total_quantities')),
            'unitCost': self._safe_float(printavo_item.get('unit_cost')),
            'totalCost': (
                self._safe_float(printavo_item.get('unit_cost')) * 
                self._safe_int(printavo_item.get('total_quantities'))
            ),
            'taxable': self._safe_bool(printavo_item.get('taxable'), True),
            'goodsStatus': self._safe_str(printavo_item.get('goods_status'), 50)
        }
        
        # Map size fields
        for printavo_key, strapi_field in self.SIZE_FIELDS.items():
            value = printavo_item.get(printavo_key)
            if value is not None:
                result[strapi_field] = self._safe_int(value)
        
        # Remove None values (but keep 0 for numeric fields)
        return {k: v for k, v in result.items() if v is not None}
    
    def validate_line_item(self, item: Dict) -> Tuple[bool, List[str]]:
        """
        Validate line item data for import.
        
        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []
        
        if not item.get('printavoId'):
            errors.append("printavoId is required")
        
        return len(errors) == 0, errors
    
    def map_imprint(
        self,
        printavo_imprint: Dict,
        line_item_id: int = None,
        order_id: int = None
    ) -> Dict:
        """
        Map Printavo imprint to Strapi imprint schema.
        
        Args:
            printavo_imprint: Raw Printavo imprint data
            line_item_id: Strapi line item ID (for relation)
            order_id: Strapi order ID (for relation)
            
        Returns:
            Dict matching Strapi imprint schema
        """
        result = {
            'imprintNumber': str(printavo_imprint.get('id', 'unknown')),
            'location': self.map_location(printavo_imprint.get('location', '')),
            'width': self._safe_float(printavo_imprint.get('width')),
            'height': self._safe_float(printavo_imprint.get('height')),
            'colorCount': self._safe_int(printavo_imprint.get('color_count', 1)),
            'colors': self._safe_str(printavo_imprint.get('colors'), 1000),
            'description': self._safe_str(printavo_imprint.get('description'), 2000),
            'decorationType': self.map_decoration_type(
                printavo_imprint.get('decoration_type'),
                printavo_imprint.get('category')
            ),
            'stitchCount': self._safe_int(printavo_imprint.get('stitch_count')),
            'artworkUrl': self._safe_str(printavo_imprint.get('artwork_url'), 500),
            'printavoId': str(printavo_imprint.get('id')) if printavo_imprint.get('id') else None
        }
        
        # Add relations if provided
        if line_item_id:
            result['lineItem'] = line_item_id
        if order_id:
            result['order'] = order_id
        
        # Remove None values
        return {k: v for k, v in result.items() if v is not None}
    
    def extract_line_items_from_order(self, printavo_order: Dict) -> List[Dict]:
        """
        Extract and map all line items from a Printavo order.
        
        Args:
            printavo_order: Raw Printavo order with lineitems_attributes
            
        Returns:
            List of mapped line items
        """
        items = []
        order_id = printavo_order.get('id')
        order_visual_id = str(printavo_order.get('visual_id', ''))
        
        lineitems = printavo_order.get('lineitems_attributes', []) or []
        
        for item in lineitems:
            mapped = self.map_line_item(item, order_id, order_visual_id)
            items.append(mapped)
        
        return items
