#!/usr/bin/env python3
"""
Sync Printavo Products to Strapi
- Imports all 105 products from Printavo export
- Creates product records with style numbers, categories, etc.
- Checkpoint/resume support
"""

import json
import time
import sys
import signal
from pathlib import Path
from datetime import datetime
import requests
from tqdm import tqdm

# Configuration
STRAPI_URL = "http://100.92.156.118:1337"
STRAPI_TOKEN = "dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e"
PRODUCTS_FILE = Path("data/raw/printavo-exports/complete_2025-11-27_14-20-05/products.json")
CHECKPOINT_FILE = Path("data/product-import-checkpoint.json")
MAX_RETRIES = 3

shutdown_requested = False

def signal_handler(sig, frame):
    global shutdown_requested
    print("\n⏸️  Shutdown requested, saving checkpoint...")
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def load_checkpoint():
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"imported_ids": [], "failed_ids": [], "started_at": datetime.now().isoformat()}

def save_checkpoint(checkpoint):
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)

def check_connection():
    try:
        r = requests.get(f"{STRAPI_URL}/api/products?pagination[pageSize]=1", 
                        headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                        timeout=10)
        return r.status_code == 200
    except:
        return False

def import_product(product, session):
    """Import a single product to Strapi"""
    data = {
        "data": {
            "printavoId": str(product.get("id", "")),
            "name": product.get("name", "")[:200] if product.get("name") else "Unknown",
            "styleNumber": product.get("style_number", "")[:100] if product.get("style_number") else None,
            "category": product.get("category_name", "")[:100] if product.get("category_name") else None,
            "description": product.get("description", "")[:1000] if product.get("description") else None,
            "cost": float(product.get("cost", 0)) if product.get("cost") else 0,
            "price": float(product.get("price", 0)) if product.get("price") else 0,
            "taxable": bool(product.get("taxable", True)),
            "weight": float(product.get("weight", 0)) if product.get("weight") else None,
            "active": True,
            "source": "printavo",
        }
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            r = session.post(f"{STRAPI_URL}/api/products",
                           json=data,
                           headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                           timeout=30)
            if r.status_code in [200, 201]:
                return True, None
            elif r.status_code == 400:
                return False, f"Bad request: {r.text[:100]}"
            else:
                time.sleep(1 * (attempt + 1))
        except Exception as e:
            time.sleep(1 * (attempt + 1))
    
    return False, "Max retries exceeded"

def main():
    print("=" * 60)
    print("📦 PRINTAVO PRODUCTS SYNC TO STRAPI")
    print("=" * 60)
    
    # Check for products file
    if not PRODUCTS_FILE.exists():
        print(f"❌ Products file not found: {PRODUCTS_FILE}")
        # Try alternate location
        alt_path = Path("data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z/products.json")
        if alt_path.exists():
            PRODUCTS_FILE = alt_path
            print(f"✓ Using alternate: {alt_path}")
        else:
            sys.exit(1)
    
    print(f"\n📂 Loading products from {PRODUCTS_FILE}...")
    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
    
    total = len(products)
    print(f"   Found {total} products")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    imported_set = set(checkpoint.get("imported_ids", []))
    
    pending = [p for p in products if str(p.get("id", "")) not in imported_set]
    
    if imported_set:
        print(f"📍 Resuming: {len(imported_set)} already imported, {len(pending)} remaining")
    
    if not pending:
        print("\n🎉 All products already imported!")
        return
    
    # Check connection
    print("\n🔌 Checking Strapi connection...")
    if not check_connection():
        print("❌ Cannot connect to Strapi")
        sys.exit(1)
    print("✓ Connected!")
    
    session = requests.Session()
    success_count = 0
    fail_count = 0
    
    pbar = tqdm(pending, desc="Importing", unit="products")
    
    try:
        for product in pbar:
            if shutdown_requested:
                break
            
            product_id = str(product.get("id", ""))
            success, error = import_product(product, session)
            
            if success:
                success_count += 1
                imported_set.add(product_id)
            else:
                fail_count += 1
                checkpoint.setdefault("failed_ids", []).append({"id": product_id, "error": error})
            
            checkpoint["imported_ids"] = list(imported_set)
            
            # Save every 10 products
            if (success_count + fail_count) % 10 == 0:
                save_checkpoint(checkpoint)
                
    finally:
        pbar.close()
        save_checkpoint(checkpoint)
        
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"✅ Imported: {success_count}")
        print(f"❌ Failed: {fail_count}")
        print(f"📦 Total in Strapi: {len(imported_set)}")

if __name__ == "__main__":
    main()
