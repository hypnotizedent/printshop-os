"""
Transform Printavo orders to Strapi job/order format.
"""

from typing import Dict, List, Optional
from .utils import parse_date, parse_decimal, safe_get
from .config import PRINTAVO_STATUS_TO_STRAPI, DEFAULT_STATUS


def map_status(printavo_status: Optional[str]) -> str:
    """
    Map Printavo status to Strapi status enum.
    
    Args:
        printavo_status: Status from Printavo
    
    Returns:
        Mapped Strapi status
    """
    if not printavo_status:
        return DEFAULT_STATUS
    
    # Normalize status (lowercase)
    normalized = printavo_status.lower().strip()
    
    return PRINTAVO_STATUS_TO_STRAPI.get(normalized, DEFAULT_STATUS)


def extract_ink_colors(lineitems: List[Dict]) -> List[str]:
    """
    Extract and aggregate ink colors from line items.
    
    Args:
        lineitems: List of line item dictionaries
    
    Returns:
        List of unique ink color names
    """
    ink_colors = []
    for item in lineitems:
        colors = safe_get(item, 'ink_colors', [])
        if colors:
            ink_colors.extend(colors)
    
    # Return unique colors
    return list(set(ink_colors))


def transform_job(printavo_order: Dict, customer_id_map: Dict[int, str]) -> Dict:
    """
    Transform a single Printavo order to Strapi job format.
    
    Args:
        printavo_order: Raw order data from Printavo
        customer_id_map: Mapping of Printavo customer_id to Strapi customer ID
    
    Returns:
        Transformed job data for Strapi
    """
    # Extract order ID
    order_id = safe_get(printavo_order, 'id')
    visual_id = safe_get(printavo_order, 'visual_id')
    
    # Map customer
    printavo_customer_id = safe_get(printavo_order, 'customer_id')
    strapi_customer_id = customer_id_map.get(printavo_customer_id)
    
    # Map status from orderstatus object
    orderstatus = safe_get(printavo_order, 'orderstatus', {})
    printavo_status = safe_get(orderstatus, 'name')
    strapi_status = map_status(printavo_status)
    
    # Extract ink colors from line items
    lineitems = safe_get(printavo_order, 'lineitems_attributes', [])
    ink_colors = extract_ink_colors(lineitems)
    
    # Build JobID with prefix
    job_id = f"P-{visual_id}" if visual_id else f"P-{order_id}"
    
    # Build transformed job
    strapi_job = {
        'data': {
            'JobID': job_id,
            'Status': strapi_status,
            'InkColors': ink_colors if ink_colors else None,
            'Customer': strapi_customer_id,
        }
    }
    
    # Remove None values from data
    strapi_job['data'] = {k: v for k, v in strapi_job['data'].items() if v is not None}
    
    return strapi_job


def transform_jobs(printavo_orders: List[Dict], customer_id_map: Dict[int, str]) -> List[Dict]:
    """
    Transform multiple Printavo orders to Strapi job format.
    
    Args:
        printavo_orders: List of raw order data from Printavo
        customer_id_map: Mapping of Printavo customer_id to Strapi customer IDs
    
    Returns:
        List of transformed jobs for Strapi
    """
    transformed = []
    missing_customers = 0
    
    for order in printavo_orders:
        strapi_job = transform_job(order, customer_id_map)
        
        # Track orders without matched customers
        if not strapi_job['data'].get('Customer'):
            missing_customers += 1
        
        transformed.append(strapi_job)
    
    # Log missing customer info
    if missing_customers:
        print(f"⚠️  {missing_customers} orders could not be matched to customers")
        print(f"   These jobs will need manual customer assignment in Strapi")
    
    return transformed
