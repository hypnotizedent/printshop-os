"""
Transform Printavo customers to Strapi customer format.
"""

from typing import Dict, List
from .utils import clean_email, clean_phone, parse_date, safe_get, generate_slug


def transform_customer(printavo_customer: Dict) -> Dict:
    """
    Transform a single Printavo customer to Strapi format.
    
    Args:
        printavo_customer: Raw customer data from Printavo
    
    Returns:
        Transformed customer data for Strapi
    """
    # Extract customer ID
    customer_id = safe_get(printavo_customer, 'id')
    
    # Build name from first_name + last_name
    first_name = (safe_get(printavo_customer, 'first_name') or '').strip()
    last_name = (safe_get(printavo_customer, 'last_name') or '').strip()
    company = (safe_get(printavo_customer, 'company') or '').strip()
    
    # Determine the Name field per mapping logic
    if first_name and last_name:
        name = f"{first_name} {last_name}"
    elif first_name:
        name = first_name
    elif last_name:
        name = last_name
    elif company:
        name = company
    else:
        name = "Unknown Customer"
    
    # Handle email - use email or customer_email, generate unique if both empty
    email = clean_email(safe_get(printavo_customer, 'email')) or \
            clean_email(safe_get(printavo_customer, 'customer_email'))
    
    if not email:
        email = f"customer_{customer_id}@imported.local"
    
    # Clean phone
    phone = clean_phone(safe_get(printavo_customer, 'phone'))
    
    # Get addresses
    billing_addr = safe_get(printavo_customer, 'billing_address_attributes', {})
    shipping_addr = safe_get(printavo_customer, 'shipping_address_attributes', {})
    
    # Store addresses in Notes temporarily (until Strapi schema extended)
    notes_parts = []
    if safe_get(printavo_customer, 'extra_notes'):
        notes_parts.append(safe_get(printavo_customer, 'extra_notes'))
    
    # Add billing address if present
    if billing_addr.get('address1'):
        billing_text = f"Billing: {billing_addr.get('address1')}"
        if billing_addr.get('address2'):
            billing_text += f" {billing_addr.get('address2')}"
        billing_text += f", {billing_addr.get('city', '')}, {billing_addr.get('state', '')} {billing_addr.get('zip', '')}"
        notes_parts.append(billing_text)
    
    # Add shipping address if present
    if shipping_addr.get('address1'):
        shipping_text = f"Shipping: {shipping_addr.get('address1')}"
        if shipping_addr.get('address2'):
            shipping_text += f" {shipping_addr.get('address2')}"
        shipping_text += f", {shipping_addr.get('city', '')}, {shipping_addr.get('state', '')} {shipping_addr.get('zip', '')}"
        notes_parts.append(shipping_text)
    
    notes = "\n".join(notes_parts) if notes_parts else None
    
    # Build transformed customer
    strapi_customer = {
        'data': {
            'Name': name,
            'Email': email,
            'Phone': phone,
            'Company': company if company else None,
            'Notes': notes,
        }
    }
    
    # Remove None values from data
    strapi_customer['data'] = {k: v for k, v in strapi_customer['data'].items() if v is not None}
    
    return strapi_customer


def transform_customers(printavo_customers: List[Dict]) -> List[Dict]:
    """
    Transform multiple Printavo customers to Strapi format.
    
    Args:
        printavo_customers: List of raw customer data from Printavo
    
    Returns:
        List of transformed customers for Strapi
    """
    transformed = []
    duplicate_emails = set()
    seen_emails = {}
    
    for customer in printavo_customers:
        strapi_customer = transform_customer(customer)
        email = strapi_customer['data'].get('Email')
        
        # Track duplicate emails
        if email and not email.endswith('@imported.local'):
            if email in seen_emails:
                duplicate_emails.add(email)
                # Add company/ID suffix to disambiguate
                company = strapi_customer['data'].get('Company', '')
                if company:
                    email_parts = email.split('@')
                    strapi_customer['data']['Email'] = f"{email_parts[0]}+{generate_slug(company)[:20]}@{email_parts[1]}"
                else:
                    # Just add the customer ID
                    email_parts = email.split('@')
                    strapi_customer['data']['Email'] = f"{email_parts[0]}+{customer.get('id')}@{email_parts[1]}"
            else:
                seen_emails[email] = customer.get('id')
        
        transformed.append(strapi_customer)
    
    # Log duplicate email info
    if duplicate_emails:
        print(f"⚠️  Found {len(duplicate_emails)} duplicate emails, added suffixes to disambiguate")
    
    return transformed
