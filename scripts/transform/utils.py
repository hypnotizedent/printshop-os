"""
Utility functions for data transformation.
"""

from datetime import datetime
from typing import Any, Optional
import re


def parse_date(date_string: Optional[str]) -> Optional[str]:
    """
    Parse Printavo date string to ISO 8601 format.
    
    Args:
        date_string: Date string from Printavo (e.g., "2023-11-22T10:30:00-05:00")
    
    Returns:
        ISO 8601 formatted date string or None
    """
    if not date_string:
        return None
    
    try:
        # Parse the date and convert to ISO format
        dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return dt.isoformat()
    except (ValueError, AttributeError):
        return None


def parse_decimal(value: Any) -> float:
    """
    Parse decimal/currency value to float.
    
    Args:
        value: String or numeric value
    
    Returns:
        Float value, defaults to 0.0 if parsing fails
    """
    if value is None:
        return 0.0
    
    try:
        # Remove currency symbols and commas
        if isinstance(value, str):
            value = value.replace('$', '').replace(',', '')
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def clean_phone(phone: Optional[str]) -> Optional[str]:
    """
    Clean and format phone number.
    
    Args:
        phone: Raw phone number string
    
    Returns:
        Cleaned phone number or None
    """
    if not phone:
        return None
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    if not digits:
        return None
    
    # Format as (XXX) XXX-XXXX if 10 digits
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    
    # Return as-is if different length
    return phone


def clean_email(email: Optional[str]) -> Optional[str]:
    """
    Clean and validate email address.
    
    Args:
        email: Raw email string
    
    Returns:
        Cleaned email or None
    """
    if not email:
        return None
    
    email = email.strip().lower()
    
    # Basic email validation
    if '@' in email and '.' in email.split('@')[1]:
        return email
    
    return None


def generate_slug(text: str) -> str:
    """
    Generate URL-friendly slug from text.
    
    Args:
        text: Input text
    
    Returns:
        Slugified text
    """
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug


def safe_get(data: dict, key: str, default: Any = None) -> Any:
    """
    Safely get value from dictionary with default.
    
    Args:
        data: Dictionary to query
        key: Key to retrieve
        default: Default value if key doesn't exist
    
    Returns:
        Value or default
    """
    return data.get(key, default)
