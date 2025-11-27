#!/usr/bin/env python3
"""
Import Sample Supplier Products to Strapi

Creates sample products for each supplier so the frontend has data to work with.
This is test data - replace with real sync once supplier APIs are working.
"""

import os
import json
import requests
from datetime import datetime

STRAPI_URL = os.getenv('STRAPI_URL', 'http://100.92.156.118:1337')
STRAPI_TOKEN = os.getenv('STRAPI_TOKEN')

HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {STRAPI_TOKEN}'
}

# Sample products representing each supplier's catalog
SAMPLE_PRODUCTS = [
    # AS Colour Products
    {
        "sku": "AC-5001",
        "name": "Staple Tee",
        "brand": "AS Colour",
        "category": "t-shirts",
        "supplier": "ascolour",
        "description": "The quintessential plain tee. Constructed from premium combed cotton, this tee offers superior softness, comfort and durability.",
        "supplierProductId": "5001",
        "variants": [
            {"sku": "AC-5001-WHT-S", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "S", "inStock": True, "quantity": 1250},
            {"sku": "AC-5001-WHT-M", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "M", "inStock": True, "quantity": 2340},
            {"sku": "AC-5001-WHT-L", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "L", "inStock": True, "quantity": 1890},
            {"sku": "AC-5001-WHT-XL", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "XL", "inStock": True, "quantity": 980},
            {"sku": "AC-5001-BLK-S", "color": {"name": "Black", "hex": "#000000"}, "size": "S", "inStock": True, "quantity": 1450},
            {"sku": "AC-5001-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 2680},
            {"sku": "AC-5001-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 2120},
            {"sku": "AC-5001-BLK-XL", "color": {"name": "Black", "hex": "#000000"}, "size": "XL", "inStock": True, "quantity": 1150},
            {"sku": "AC-5001-NVY-M", "color": {"name": "Navy", "hex": "#1F2937"}, "size": "M", "inStock": True, "quantity": 890},
            {"sku": "AC-5001-NVY-L", "color": {"name": "Navy", "hex": "#1F2937"}, "size": "L", "inStock": True, "quantity": 720},
        ],
        "pricing": {
            "basePrice": 7.50,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 7.50},
                {"quantity": 24, "price": 6.75},
                {"quantity": 72, "price": 6.25},
                {"quantity": 144, "price": 5.75}
            ]
        },
        "images": [
            "https://www.ascolour.com/content/products/5001_staple_tee_white.jpg",
            "https://www.ascolour.com/content/products/5001_staple_tee_black.jpg"
        ],
        "availability": {"inStock": True, "totalQuantity": 15480}
    },
    {
        "sku": "AC-5102",
        "name": "Supply Hood",
        "brand": "AS Colour",
        "category": "sweatshirts",
        "supplier": "ascolour",
        "description": "A regular fit hood featuring a kangaroo pocket and drawcord with metal tipping. Made from premium cotton fleece.",
        "supplierProductId": "5102",
        "variants": [
            {"sku": "AC-5102-BLK-S", "color": {"name": "Black", "hex": "#000000"}, "size": "S", "inStock": True, "quantity": 340},
            {"sku": "AC-5102-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 520},
            {"sku": "AC-5102-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 450},
            {"sku": "AC-5102-GRY-M", "color": {"name": "Grey Marle", "hex": "#9CA3AF"}, "size": "M", "inStock": True, "quantity": 280},
            {"sku": "AC-5102-GRY-L", "color": {"name": "Grey Marle", "hex": "#9CA3AF"}, "size": "L", "inStock": True, "quantity": 310},
        ],
        "pricing": {
            "basePrice": 24.00,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 24.00},
                {"quantity": 24, "price": 22.00},
                {"quantity": 72, "price": 20.50}
            ]
        },
        "images": ["https://www.ascolour.com/content/products/5102_supply_hood.jpg"],
        "availability": {"inStock": True, "totalQuantity": 1900}
    },
    # SanMar Products
    {
        "sku": "SM-PC61",
        "name": "Essential-T",
        "brand": "Port & Company",
        "category": "t-shirts",
        "supplier": "sanmar",
        "description": "An everyday go-to, this tried and true Essential Tee comes in endless colors and delivers comfort every time.",
        "supplierProductId": "PC61",
        "variants": [
            {"sku": "SM-PC61-WHT-S", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "S", "inStock": True, "quantity": 4500},
            {"sku": "SM-PC61-WHT-M", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "M", "inStock": True, "quantity": 8200},
            {"sku": "SM-PC61-WHT-L", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "L", "inStock": True, "quantity": 6800},
            {"sku": "SM-PC61-WHT-XL", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "XL", "inStock": True, "quantity": 3900},
            {"sku": "SM-PC61-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 7400},
            {"sku": "SM-PC61-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 6100},
            {"sku": "SM-PC61-RED-M", "color": {"name": "Red", "hex": "#DC2626"}, "size": "M", "inStock": True, "quantity": 1200},
            {"sku": "SM-PC61-RED-L", "color": {"name": "Red", "hex": "#DC2626"}, "size": "L", "inStock": True, "quantity": 980},
        ],
        "pricing": {
            "basePrice": 3.98,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 3.98},
                {"quantity": 72, "price": 3.48},
                {"quantity": 144, "price": 3.18}
            ]
        },
        "images": ["https://cdnm.sanmar.com/catalog/images/PC61.jpg"],
        "availability": {"inStock": True, "totalQuantity": 39080}
    },
    {
        "sku": "SM-ST350",
        "name": "PosiCharge Competitor Tee",
        "brand": "Sport-Tek",
        "category": "t-shirts",
        "supplier": "sanmar",
        "description": "Moisture-wicking performance tee perfect for athletic activities and custom team uniforms.",
        "supplierProductId": "ST350",
        "variants": [
            {"sku": "SM-ST350-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 2100},
            {"sku": "SM-ST350-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 1800},
            {"sku": "SM-ST350-NVY-M", "color": {"name": "True Navy", "hex": "#1E3A5F"}, "size": "M", "inStock": True, "quantity": 950},
            {"sku": "SM-ST350-RYL-L", "color": {"name": "True Royal", "hex": "#1D4ED8"}, "size": "L", "inStock": True, "quantity": 720},
        ],
        "pricing": {
            "basePrice": 6.98,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 6.98},
                {"quantity": 72, "price": 6.28},
                {"quantity": 144, "price": 5.88}
            ]
        },
        "images": ["https://cdnm.sanmar.com/catalog/images/ST350.jpg"],
        "availability": {"inStock": True, "totalQuantity": 5570}
    },
    {
        "sku": "SM-F170",
        "name": "Ultimate Cotton Pullover Hooded Sweatshirt",
        "brand": "Hanes",
        "category": "sweatshirts",
        "supplier": "sanmar",
        "description": "A 9-ounce, 90/10 cotton/poly blend sweatshirt with a two-ply hood and front pouch pocket.",
        "supplierProductId": "F170",
        "variants": [
            {"sku": "SM-F170-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 1400},
            {"sku": "SM-F170-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 1200},
            {"sku": "SM-F170-ASH-L", "color": {"name": "Ash", "hex": "#6B7280"}, "size": "L", "inStock": True, "quantity": 680},
        ],
        "pricing": {
            "basePrice": 18.98,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 18.98},
                {"quantity": 24, "price": 17.48},
                {"quantity": 72, "price": 16.18}
            ]
        },
        "images": ["https://cdnm.sanmar.com/catalog/images/F170.jpg"],
        "availability": {"inStock": True, "totalQuantity": 3280}
    },
    # S&S Activewear Products
    {
        "sku": "SS-G500",
        "name": "Heavy Cotton Tee",
        "brand": "Gildan",
        "category": "t-shirts",
        "supplier": "ssactivewear",
        "description": "The classic Gildan Heavy Cotton tee. Preshrunk 100% cotton (some colors contain polyester). Seamless collar.",
        "supplierProductId": "G500",
        "variants": [
            {"sku": "SS-G500-WHT-S", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "S", "inStock": True, "quantity": 12500},
            {"sku": "SS-G500-WHT-M", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "M", "inStock": True, "quantity": 18200},
            {"sku": "SS-G500-WHT-L", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "L", "inStock": True, "quantity": 15800},
            {"sku": "SS-G500-WHT-XL", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "XL", "inStock": True, "quantity": 9200},
            {"sku": "SS-G500-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 14600},
            {"sku": "SS-G500-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 12400},
            {"sku": "SS-G500-NVY-L", "color": {"name": "Navy", "hex": "#1F2937"}, "size": "L", "inStock": True, "quantity": 4200},
        ],
        "pricing": {
            "basePrice": 2.62,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 2.62},
                {"quantity": 72, "price": 2.42},
                {"quantity": 144, "price": 2.22}
            ]
        },
        "images": ["https://www.ssactivewear.com/images/products/G500.jpg"],
        "availability": {"inStock": True, "totalQuantity": 86900}
    },
    {
        "sku": "SS-BC3001",
        "name": "Unisex Jersey Short Sleeve Tee",
        "brand": "Bella+Canvas",
        "category": "t-shirts",
        "supplier": "ssactivewear",
        "description": "The retail fit Bella+Canvas 3001. Made from 100% Airlume combed and ring-spun cotton for an ultra-soft feel.",
        "supplierProductId": "BC3001",
        "variants": [
            {"sku": "SS-BC3001-WHT-S", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "S", "inStock": True, "quantity": 8400},
            {"sku": "SS-BC3001-WHT-M", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "M", "inStock": True, "quantity": 12600},
            {"sku": "SS-BC3001-WHT-L", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "L", "inStock": True, "quantity": 10200},
            {"sku": "SS-BC3001-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 9800},
            {"sku": "SS-BC3001-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 8200},
            {"sku": "SS-BC3001-HTH-M", "color": {"name": "Heather Grey", "hex": "#9CA3AF"}, "size": "M", "inStock": True, "quantity": 4500},
        ],
        "pricing": {
            "basePrice": 4.28,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 4.28},
                {"quantity": 72, "price": 3.88},
                {"quantity": 144, "price": 3.58}
            ]
        },
        "images": ["https://www.ssactivewear.com/images/products/BC3001.jpg"],
        "availability": {"inStock": True, "totalQuantity": 53700}
    },
    {
        "sku": "SS-18500",
        "name": "Heavy Blend Hooded Sweatshirt",
        "brand": "Gildan",
        "category": "sweatshirts",
        "supplier": "ssactivewear",
        "description": "Classic fit Gildan hoodie. 8.0 oz, 50/50 cotton/polyester blend with double-lined hood.",
        "supplierProductId": "18500",
        "variants": [
            {"sku": "SS-18500-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 3200},
            {"sku": "SS-18500-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 2800},
            {"sku": "SS-18500-BLK-XL", "color": {"name": "Black", "hex": "#000000"}, "size": "XL", "inStock": True, "quantity": 1900},
            {"sku": "SS-18500-NVY-L", "color": {"name": "Navy", "hex": "#1F2937"}, "size": "L", "inStock": True, "quantity": 1400},
            {"sku": "SS-18500-RED-L", "color": {"name": "Red", "hex": "#DC2626"}, "size": "L", "inStock": True, "quantity": 650},
        ],
        "pricing": {
            "basePrice": 12.86,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 12.86},
                {"quantity": 24, "price": 11.86},
                {"quantity": 72, "price": 10.86}
            ]
        },
        "images": ["https://www.ssactivewear.com/images/products/18500.jpg"],
        "availability": {"inStock": True, "totalQuantity": 9950}
    },
    # Hats/Headwear
    {
        "sku": "SM-C112",
        "name": "Snapback Trucker Cap",
        "brand": "Port Authority",
        "category": "hats",
        "supplier": "sanmar",
        "description": "A classic trucker cap featuring mesh back panels and an adjustable snapback closure.",
        "supplierProductId": "C112",
        "variants": [
            {"sku": "SM-C112-BLK-OS", "color": {"name": "Black/Black", "hex": "#000000"}, "size": "One Size", "inStock": True, "quantity": 2400},
            {"sku": "SM-C112-NVY-OS", "color": {"name": "Navy/Navy", "hex": "#1F2937"}, "size": "One Size", "inStock": True, "quantity": 1800},
            {"sku": "SM-C112-GRY-OS", "color": {"name": "Grey/Black", "hex": "#6B7280"}, "size": "One Size", "inStock": True, "quantity": 1200},
        ],
        "pricing": {
            "basePrice": 7.48,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 7.48},
                {"quantity": 24, "price": 6.98},
                {"quantity": 72, "price": 6.48}
            ]
        },
        "images": ["https://cdnm.sanmar.com/catalog/images/C112.jpg"],
        "availability": {"inStock": True, "totalQuantity": 5400}
    },
    # Polo
    {
        "sku": "SM-K500",
        "name": "Silk Touch Polo",
        "brand": "Port Authority",
        "category": "polos",
        "supplier": "sanmar",
        "description": "Our value polo with a soft, silky hand and wrinkle-resistance. 5-ounce, 65/35 poly/cotton pique.",
        "supplierProductId": "K500",
        "variants": [
            {"sku": "SM-K500-WHT-M", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "M", "inStock": True, "quantity": 1800},
            {"sku": "SM-K500-WHT-L", "color": {"name": "White", "hex": "#FFFFFF"}, "size": "L", "inStock": True, "quantity": 1600},
            {"sku": "SM-K500-BLK-M", "color": {"name": "Black", "hex": "#000000"}, "size": "M", "inStock": True, "quantity": 2200},
            {"sku": "SM-K500-BLK-L", "color": {"name": "Black", "hex": "#000000"}, "size": "L", "inStock": True, "quantity": 1900},
            {"sku": "SM-K500-NVY-L", "color": {"name": "Navy", "hex": "#1F2937"}, "size": "L", "inStock": True, "quantity": 1100},
        ],
        "pricing": {
            "basePrice": 11.98,
            "currency": "USD",
            "breaks": [
                {"quantity": 1, "price": 11.98},
                {"quantity": 24, "price": 10.98},
                {"quantity": 72, "price": 9.98}
            ]
        },
        "images": ["https://cdnm.sanmar.com/catalog/images/K500.jpg"],
        "availability": {"inStock": True, "totalQuantity": 8600}
    },
]


def import_product(product: dict) -> bool:
    """Import a single product to Strapi"""
    payload = {
        "data": {
            "sku": product["sku"],
            "name": product["name"],
            "brand": product["brand"],
            "category": product["category"],
            "supplier": product["supplier"],
            "description": product["description"],
            "supplierProductId": product["supplierProductId"],
            "variants": product["variants"],
            "pricing": product["pricing"],
            "images": product["images"],
            "availability": product["availability"],
            "lastSyncedAt": datetime.now().isoformat(),
            "isActive": True
        }
    }
    
    try:
        # Check if product exists
        check_url = f"{STRAPI_URL}/api/products?filters[sku][$eq]={product['sku']}"
        check_resp = requests.get(check_url, headers=HEADERS)
        existing = check_resp.json().get('data', [])
        
        if existing:
            # Update existing
            doc_id = existing[0]['documentId']
            resp = requests.put(
                f"{STRAPI_URL}/api/products/{doc_id}",
                headers=HEADERS,
                json=payload
            )
        else:
            # Create new
            resp = requests.post(
                f"{STRAPI_URL}/api/products",
                headers=HEADERS,
                json=payload
            )
        
        if resp.ok:
            return True
        else:
            print(f"  Error: {resp.status_code} - {resp.text[:200]}")
            return False
            
    except Exception as e:
        print(f"  Exception: {e}")
        return False


def main():
    if not STRAPI_TOKEN:
        print("Error: STRAPI_TOKEN environment variable required")
        return
    
    print("=" * 60)
    print("Importing Sample Supplier Products to Strapi")
    print("=" * 60)
    print(f"Strapi URL: {STRAPI_URL}")
    print(f"Products to import: {len(SAMPLE_PRODUCTS)}")
    print()
    
    # Group by supplier
    by_supplier = {}
    for p in SAMPLE_PRODUCTS:
        supplier = p['supplier']
        if supplier not in by_supplier:
            by_supplier[supplier] = []
        by_supplier[supplier].append(p)
    
    success = 0
    failed = 0
    
    for supplier, products in by_supplier.items():
        print(f"\n[{supplier.upper()}] Importing {len(products)} products...")
        for product in products:
            print(f"  • {product['sku']} - {product['name']}...", end=" ")
            if import_product(product):
                print("✓")
                success += 1
            else:
                print("✗")
                failed += 1
    
    print("\n" + "=" * 60)
    print(f"Import Complete: {success} succeeded, {failed} failed")
    print("=" * 60)
    
    # Verify
    print("\nVerifying products in Strapi...")
    verify_url = f"{STRAPI_URL}/api/products?pagination[limit]=100"
    resp = requests.get(verify_url, headers=HEADERS)
    if resp.ok:
        data = resp.json()
        total = data.get('meta', {}).get('pagination', {}).get('total', 0)
        print(f"Total products in database: {total}")
        
        # Count by supplier
        products = data.get('data', [])
        counts = {}
        for p in products:
            s = p.get('supplier', 'unknown')
            counts[s] = counts.get(s, 0) + 1
        
        print("\nProducts by supplier:")
        for supplier, count in sorted(counts.items()):
            print(f"  • {supplier}: {count}")


if __name__ == "__main__":
    main()
