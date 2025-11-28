#!/usr/bin/env python3
"""
Import Top 500 Products to Strapi.
These are the most frequently ordered products from Printavo history.
"""

import json
import os
import time
import requests
from pathlib import Path

# Configuration
STRAPI_URL = os.environ.get("STRAPI_URL", "http://100.92.156.118:1337")
STRAPI_TOKEN = os.environ.get("STRAPI_TOKEN", "")
PRODUCTS_FILE = Path(__file__).parent.parent / "data" / "products" / "top_500_products.json"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {STRAPI_TOKEN}"
}

# Brand detection patterns
BRAND_PATTERNS = {
    "NL": "Next Level",
    "G": "Gildan",
    "B3": "Bella+Canvas",
    "3001": "Bella+Canvas",
    "BC": "Bella+Canvas",
    "AL": "Alstyle",
    "IND": "Independent Trading Co",
    "1801": "Los Angeles Apparel",
    "LAA": "Los Angeles Apparel",
    "SM": "Paragon",
    "CC": "Comfort Colors",
    "1717": "Comfort Colors",
    "C9": "Champion",
    "AA": "American Apparel",
    "1301": "American Apparel",
    "H": "Hanes",
    "PC": "Port & Company",
    "DT": "District",
    "SS": "S&S Activewear",
    "AS": "AS Colour",
    "5000": "Gildan",
    "18500": "Gildan",
}

# Category detection
CATEGORY_PATTERNS = {
    "tee": "t-shirts",
    "t-shirt": "t-shirts",
    "shirt": "t-shirts",
    "polo": "polos",
    "hoodie": "sweatshirts",
    "hooded": "sweatshirts",
    "sweat": "sweatshirts",
    "crew": "sweatshirts",
    "fleece": "sweatshirts",
    "jacket": "jackets",
    "coat": "jackets",
    "pant": "pants",
    "short": "shorts",
    "hat": "hats",
    "cap": "hats",
    "beanie": "hats",
    "bag": "bags",
    "tote": "bags",
    "tank": "t-shirts",
    "racerback": "t-shirts",
}

def detect_brand(style_code, description):
    """Detect brand from style code or description."""
    style_upper = style_code.upper()
    
    # Check style code prefixes
    for prefix, brand in BRAND_PATTERNS.items():
        if style_upper.startswith(prefix):
            return brand
    
    # Check description
    desc_lower = description.lower()
    for keyword, brand in {
        "gildan": "Gildan",
        "next level": "Next Level",
        "bella": "Bella+Canvas",
        "canvas": "Bella+Canvas",
        "comfort colors": "Comfort Colors",
        "champion": "Champion",
        "hanes": "Hanes",
        "independent": "Independent Trading Co",
        "los angeles": "Los Angeles Apparel",
        "american apparel": "American Apparel",
        "port & company": "Port & Company",
        "district": "District",
        "paragon": "Paragon",
        "as colour": "AS Colour",
    }.items():
        if keyword in desc_lower:
            return brand
    
    return "Unknown"

def detect_category(description):
    """Detect category from description."""
    desc_lower = description.lower()
    for keyword, category in CATEGORY_PATTERNS.items():
        if keyword in desc_lower:
            return category
    return "other"

def detect_supplier(style_code, brand):
    """Detect supplier from style code or brand."""
    style_upper = style_code.upper()
    
    # AS Colour products
    if style_upper.startswith("AS") or brand == "AS Colour":
        return "ascolour"
    
    # Most US brands are through S&S or SanMar
    sanmar_brands = ["SanMar", "Port & Company", "District", "Nike", "OGIO"]
    if brand in sanmar_brands:
        return "sanmar"
    
    # Default to S&S Activewear (largest distributor)
    return "ssactivewear"

def create_product(product_data):
    """Create a product in Strapi."""
    try:
        response = requests.post(
            f"{STRAPI_URL}/api/products",
            headers=headers,
            json={"data": product_data},
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return True, None
        elif "unique" in response.text.lower():
            return "duplicate", None
        else:
            return False, response.text[:200]
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("📦 Top 500 Products → Strapi Import")
    print("=" * 60)
    
    if not STRAPI_TOKEN:
        print("❌ STRAPI_TOKEN not set!")
        print("   export STRAPI_TOKEN='your-token-here'")
        return
    
    # Load products
    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
    
    print(f"   Loaded {len(products)} products from {PRODUCTS_FILE.name}")
    
    # Check existing products
    try:
        response = requests.get(
            f"{STRAPI_URL}/api/products?pagination[pageSize]=1",
            headers=headers,
            timeout=10
        )
        if response.ok:
            existing = response.json().get('meta', {}).get('pagination', {}).get('total', 0)
            print(f"   Existing products in Strapi: {existing}")
    except:
        print("   Could not check existing products")
    
    # Import
    success = 0
    skipped = 0
    failed = 0
    errors = []
    
    print(f"\n🚀 Importing products...\n")
    
    for i, product in enumerate(products):
        style_code = product['styleCode']
        description = product['description']
        
        # Detect metadata
        brand = detect_brand(style_code, description)
        category = detect_category(description)
        supplier = detect_supplier(style_code, brand)
        
        # Build Strapi data
        data = {
            "sku": style_code,
            "name": description[:255] if description else f"Product {style_code}",
            "brand": brand,
            "category": category,
            "supplier": supplier,
            "description": description,
            "isActive": True,
        }
        
        result, error = create_product(data)
        
        if result == True:
            success += 1
        elif result == "duplicate":
            skipped += 1
        else:
            failed += 1
            if len(errors) < 5:
                errors.append(f"{style_code}: {error}")
        
        # Progress every 50
        if (i + 1) % 50 == 0:
            print(f"   [{i + 1}/{len(products)}] ✅ {success} | ⏭️ {skipped} | ❌ {failed}")
        
        time.sleep(0.02)  # Rate limit
    
    print(f"\n" + "=" * 60)
    print("✅ Import Complete")
    print(f"   Imported: {success}")
    print(f"   Skipped (duplicates): {skipped}")
    print(f"   Failed: {failed}")
    
    if errors:
        print(f"\n   First {len(errors)} errors:")
        for e in errors:
            print(f"     - {e}")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
