#!/usr/bin/env python3
"""
Import Printavo line items to Strapi.
Uses the complete extraction data from data/raw/printavo-exports/complete_*/lineitems.json
"""

import json
import requests
import time
from pathlib import Path

# Configuration
STRAPI_URL = "http://100.92.156.118:1337"
STRAPI_TOKEN = "73b35f5663a72296c3ca825d4f8e2a1af016aaeff8b252f1f80dc2cc99669919a94a0e1d982861470846a08ebd3ed7146093e86b9823814e939903de99524ea9e7e778de5317fd070f0d2ced8d22010d49b1815fe40eaefd7d78dceb27753112869b1b90351174efa710fc0958d2b08405d266bb79a68d7dc23f22686bff4c3d"
DATA_DIR = Path(__file__).parent.parent / "data" / "raw" / "printavo-exports"
BATCH_SIZE = 50  # Items per batch
CHECKPOINT_FILE = Path(__file__).parent.parent / "data" / "line-item-import-checkpoint.json"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {STRAPI_TOKEN}"
}

def get_latest_export_dir():
    """Find the latest complete extraction directory."""
    dirs = [d for d in DATA_DIR.iterdir() if d.is_dir() and d.name.startswith("complete_")]
    if not dirs:
        raise FileNotFoundError(f"No complete extraction directories found in {DATA_DIR}")
    return sorted(dirs)[-1]

def load_line_items():
    """Load line items from the complete extraction."""
    export_dir = get_latest_export_dir()
    lineitems_file = export_dir / "lineitems.json"
    
    if not lineitems_file.exists():
        raise FileNotFoundError(f"Line items file not found: {lineitems_file}")
    
    print(f"📖 Loading from {lineitems_file}")
    with open(lineitems_file, 'r') as f:
        return json.load(f)

def load_checkpoint():
    """Load checkpoint of already imported items."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"imported_ids": [], "last_index": 0}

def save_checkpoint(checkpoint):
    """Save checkpoint."""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f)

def transform_line_item(item):
    """Transform Printavo line item to Strapi format."""
    return {
        "printavoId": str(item.get("id", "")),
        "orderId": item.get("order_id"),
        "orderVisualId": str(item.get("order_visual_id", "")),
        "styleDescription": item.get("style_description", ""),
        "styleNumber": item.get("style_number", ""),
        "color": item.get("color", ""),
        "category": item.get("category", ""),
        "unitCost": float(item.get("unit_cost", 0) or 0),
        "totalQuantity": int(item.get("total_quantities", 0) or 0),
        "sizeXS": int(item.get("size_xs") or 0),
        "sizeS": int(item.get("size_s") or 0),
        "sizeM": int(item.get("size_m") or 0),
        "sizeL": int(item.get("size_l") or 0),
        "sizeXL": int(item.get("size_xl") or 0),
        "size2XL": int(item.get("size_2xl") or 0),
        "size3XL": int(item.get("size_3xl") or 0),
        "size4XL": int(item.get("size_4xl") or 0),
        "sizeOther": int(item.get("size_other") or 0),
        "taxable": bool(item.get("taxable", True)),
        "goodsStatus": item.get("goods_status", ""),
    }

def create_line_item(data):
    """Create a line item in Strapi."""
    try:
        response = requests.post(
            f"{STRAPI_URL}/api/line-items",
            headers=headers,
            json={"data": data},
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return True, response.json()
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("📦 Printavo Line Items → Strapi Import")
    print("=" * 60)
    
    # Load data
    line_items = load_line_items()
    print(f"   Total line items: {len(line_items):,}")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    imported_ids = set(checkpoint.get("imported_ids", []))
    start_index = checkpoint.get("last_index", 0)
    
    print(f"   Already imported: {len(imported_ids):,}")
    print(f"   Starting from index: {start_index}")
    
    # Filter out already imported
    items_to_import = []
    for i, item in enumerate(line_items):
        if i < start_index:
            continue
        item_id = str(item.get("id", ""))
        if item_id and item_id not in imported_ids:
            items_to_import.append((i, item))
    
    print(f"   Items to import: {len(items_to_import):,}")
    print()
    
    if not items_to_import:
        print("✅ All items already imported!")
        return
    
    # Import
    success_count = 0
    error_count = 0
    
    try:
        for batch_num, batch_start in enumerate(range(0, len(items_to_import), BATCH_SIZE)):
            batch = items_to_import[batch_start:batch_start + BATCH_SIZE]
            
            print(f"Batch {batch_num + 1}: Importing {len(batch)} items...")
            
            for idx, item in batch:
                item_id = str(item.get("id", ""))
                
                data = transform_line_item(item)
                success, result = create_line_item(data)
                
                if success:
                    success_count += 1
                    imported_ids.add(item_id)
                else:
                    error_count += 1
                    if "unique" in str(result).lower():
                        # Already exists, count as success
                        success_count += 1
                        imported_ids.add(item_id)
                    elif error_count <= 5:
                        print(f"   ❌ Item {item_id}: {result[:100]}")
                
                # Rate limiting
                time.sleep(0.02)  # 50 req/sec max
            
            # Save checkpoint after each batch
            checkpoint = {
                "imported_ids": list(imported_ids),
                "last_index": idx + 1
            }
            save_checkpoint(checkpoint)
            
            print(f"   ✓ Batch complete. Total: {success_count:,} success, {error_count:,} errors")
            
            # Small delay between batches
            time.sleep(0.5)
    
    except KeyboardInterrupt:
        print("\n🛑 Interrupted. Saving checkpoint...")
        checkpoint = {
            "imported_ids": list(imported_ids),
            "last_index": idx if 'idx' in locals() else start_index
        }
        save_checkpoint(checkpoint)
    
    print()
    print("=" * 60)
    print("✅ Import Complete")
    print(f"   Successful: {success_count:,}")
    print(f"   Errors: {error_count:,}")
    print(f"   Checkpoint saved to: {CHECKPOINT_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()
