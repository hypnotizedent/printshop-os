#!/usr/bin/env python3
"""
Canonical Configuration for PrintShop OS Scripts
=================================================
SINGLE SOURCE OF TRUTH for all import/export scripts.
Update values here ONLY - do not hardcode in individual scripts.

Last Updated: 2025-11-28
"""

import os
from pathlib import Path

# =============================================================================
# STRAPI CONFIGURATION
# =============================================================================
STRAPI_URL = os.getenv("STRAPI_URL", "http://100.92.156.118:1337")
STRAPI_TOKEN = os.getenv("STRAPI_TOKEN", "dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e")

# =============================================================================
# DATA PATHS
# =============================================================================
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PRINTAVO_EXPORTS = DATA_DIR / "raw" / "printavo-exports"
LATEST_EXPORT = PRINTAVO_EXPORTS / "complete_2025-11-27_14-20-05"

# Export files
CUSTOMERS_FILE = LATEST_EXPORT / "customers.json"
ORDERS_FILE = LATEST_EXPORT / "orders.json"
LINE_ITEMS_FILE = LATEST_EXPORT / "lineitems.json"
PRODUCTS_FILE = LATEST_EXPORT / "products.json"

# Checkpoint files for resumable imports
CHECKPOINT_DIR = DATA_DIR
CUSTOMER_CHECKPOINT = CHECKPOINT_DIR / "customer-import-checkpoint.json"
ORDER_CHECKPOINT = CHECKPOINT_DIR / "order-import-checkpoint.json"
LINE_ITEM_CHECKPOINT = CHECKPOINT_DIR / "line-item-import-checkpoint.json"

# =============================================================================
# IMPORT SETTINGS
# =============================================================================
BATCH_SIZE = 100  # Records per batch for progress updates
PARALLEL_WORKERS = 5  # Concurrent API requests
RETRY_ATTEMPTS = 3  # Retries on failure
RETRY_DELAY = 1.0  # Seconds between retries (exponential backoff)
REQUEST_TIMEOUT = 30  # Seconds per request

# =============================================================================
# STATUS MAPPINGS
# =============================================================================
PRINTAVO_STATUS_MAP = {
    'Pending': 'QUOTE',
    'Pending Approval': 'QUOTE_SENT',
    'Quote Sent': 'QUOTE_SENT',
    'Approved': 'QUOTE_APPROVED',
    'Quote Approved': 'QUOTE_APPROVED',
    'Payment Received': 'INVOICE_PAID',
    'In Production': 'IN_PRODUCTION',
    'Waiting for Pickup': 'READY_FOR_PICKUP',
    'Ready for Pickup': 'READY_FOR_PICKUP',
    'Complete': 'COMPLETE',
    'Delivered': 'COMPLETE',
    'Shipped': 'SHIPPED',
    'Cancelled': 'CANCELLED',
    'CANCELLED': 'CANCELLED'
}

# =============================================================================
# NOTIFICATIONS (ntfy)
# =============================================================================
NTFY_URL = os.getenv("NTFY_URL", "http://100.92.156.118:8088")
NTFY_TOPIC = os.getenv("NTFY_TOPIC", "printshop-os")

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def get_headers():
    """Return standard API headers."""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {STRAPI_TOKEN}"
    }

def validate_config():
    """Validate configuration before running scripts."""
    errors = []
    
    if not STRAPI_TOKEN or len(STRAPI_TOKEN) < 100:
        errors.append("STRAPI_TOKEN appears invalid (too short)")
    
    if not LATEST_EXPORT.exists():
        errors.append(f"Export directory not found: {LATEST_EXPORT}")
    
    if not CUSTOMERS_FILE.exists():
        errors.append(f"Customers file not found: {CUSTOMERS_FILE}")
    
    if not ORDERS_FILE.exists():
        errors.append(f"Orders file not found: {ORDERS_FILE}")
    
    return errors

if __name__ == "__main__":
    print("=" * 60)
    print("PrintShop OS Configuration")
    print("=" * 60)
    print(f"  Strapi URL: {STRAPI_URL}")
    print(f"  Token: {STRAPI_TOKEN[:20]}...{STRAPI_TOKEN[-10:]}")
    print(f"  Export Dir: {LATEST_EXPORT}")
    print()
    
    errors = validate_config()
    if errors:
        print("❌ Configuration Errors:")
        for e in errors:
            print(f"   - {e}")
    else:
        print("✅ Configuration Valid")
