"""
Configuration for Printavo to Strapi transformation.
"""

from pathlib import Path
import os

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PRINTAVO_EXPORTS_DIR = DATA_DIR / "raw" / "printavo-exports"
STRAPI_IMPORTS_DIR = DATA_DIR / "processed" / "strapi-imports"

# Ensure directories exist
STRAPI_IMPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Find the most recent Printavo export directory
def get_latest_export_dir():
    """Get the most recent Printavo export directory."""
    if not PRINTAVO_EXPORTS_DIR.exists():
        raise FileNotFoundError(f"Printavo exports directory not found: {PRINTAVO_EXPORTS_DIR}")
    
    # Find all timestamped export directories
    export_dirs = [d for d in PRINTAVO_EXPORTS_DIR.iterdir() if d.is_dir()]
    if not export_dirs:
        raise FileNotFoundError(f"No export directories found in {PRINTAVO_EXPORTS_DIR}")
    
    # Sort by name (timestamp) and get the latest
    latest = sorted(export_dirs)[-1]
    return latest

# Get latest export directory
LATEST_EXPORT_DIR = get_latest_export_dir()

# File paths
PRINTAVO_CUSTOMERS_FILE = LATEST_EXPORT_DIR / "customers.json"
PRINTAVO_ORDERS_FILE = LATEST_EXPORT_DIR / "orders.json"

STRAPI_CUSTOMERS_FILE = STRAPI_IMPORTS_DIR / "customers.json"
STRAPI_JOBS_FILE = STRAPI_IMPORTS_DIR / "jobs.json"

# Status mappings (from mapping document)
PRINTAVO_STATUS_TO_STRAPI = {
    # Quote/Pending stages
    "quote": "Pending Artwork",
    "pending": "Pending Artwork",
    "pending artwork": "Pending Artwork",
    
    # Production
    "in production": "In Production",
    "production": "In Production",
    
    # Complete
    "complete": "Complete",
    "completed": "Complete",
    "delivered": "Complete",
    "ready for pickup": "Complete",
    
    # Archived/Cancelled
    "archived": "Archived",
    "cancelled": "Archived",
}

# Default status for unknown values
DEFAULT_STATUS = "Pending Artwork"
