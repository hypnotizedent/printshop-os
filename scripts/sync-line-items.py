#!/usr/bin/env python3
"""
Resilient Line Items Import to Strapi
- Progress bar with ETA
- Checkpoint/resume on disconnect
- Retry with exponential backoff
- Connection monitoring
"""

import json
import time
import sys
import signal
from pathlib import Path
from datetime import datetime, timedelta
import requests
from tqdm import tqdm

# Configuration
STRAPI_URL = "http://100.92.156.118:1337"
STRAPI_TOKEN = "dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e"
LINE_ITEMS_FILE = Path("data/raw/printavo-exports/complete_2025-11-27_14-20-05/lineitems.json")
CHECKPOINT_FILE = Path("data/line-item-import-checkpoint.json")
BATCH_SIZE = 10
MAX_RETRIES = 5
RETRY_DELAY = 2

# Graceful shutdown
shutdown_requested = False

def signal_handler(sig, frame):
    global shutdown_requested
    print("\n⏸️  Shutdown requested, saving checkpoint...")
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def load_checkpoint():
    """Load progress from checkpoint file"""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"last_index": 0, "imported_ids": [], "failed_ids": [], "started_at": datetime.now().isoformat()}

def save_checkpoint(checkpoint):
    """Save progress to checkpoint file"""
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)

def check_connection():
    """Check if Strapi is reachable"""
    try:
        r = requests.get(f"{STRAPI_URL}/api/line-items?pagination[pageSize]=1", 
                        headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                        timeout=10)
        return r.status_code == 200
    except:
        return False

def wait_for_connection():
    """Wait for connection to be restored"""
    print("🔌 Connection lost. Waiting for reconnection...")
    attempt = 0
    while not check_connection():
        attempt += 1
        wait_time = min(60, 5 * attempt)  # Max 60 seconds
        print(f"   Retry {attempt}: waiting {wait_time}s...")
        time.sleep(wait_time)
        if shutdown_requested:
            return False
    print("✅ Connection restored!")
    return True

def import_line_item(item, session):
    """Import a single line item with retry logic"""
    # Parse size_other if it's a string with quantity
    size_other = 0
    if item.get("size_other"):
        try:
            size_other = int(item.get("size_other", 0))
        except (ValueError, TypeError):
            size_other = 0
    
    data = {
        "data": {
            "printavoId": str(item.get("id", "")),
            "orderId": int(item.get("order_id", 0)) if item.get("order_id") else None,
            "orderVisualId": str(item.get("order_visual_id", "")),
            "styleDescription": item.get("style_description", "")[:500] if item.get("style_description") else None,
            "styleNumber": item.get("style_number", "")[:100] if item.get("style_number") else None,
            "color": item.get("color", "")[:100] if item.get("color") else None,
            "category": item.get("category", "")[:100] if item.get("category") else None,
            "unitCost": float(item.get("unit_cost", 0)) if item.get("unit_cost") else 0,
            "totalQuantity": int(item.get("total_quantities", 0)) if item.get("total_quantities") else 0,
            "goodsStatus": item.get("goods_status", "")[:50] if item.get("goods_status") else None,
            "taxable": bool(item.get("taxable", False)),
            # Size breakdown - all integers
            "sizeXS": int(item.get("size_xs", 0) or 0),
            "sizeS": int(item.get("size_s", 0) or 0),
            "sizeM": int(item.get("size_m", 0) or 0),
            "sizeL": int(item.get("size_l", 0) or 0),
            "sizeXL": int(item.get("size_xl", 0) or 0),
            "size2XL": int(item.get("size_2xl", 0) or 0),
            "size3XL": int(item.get("size_3xl", 0) or 0),
            "sizeOther": size_other,
        }
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            r = session.post(f"{STRAPI_URL}/api/line-items",
                           json=data,
                           headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                           timeout=30)
            if r.status_code in [200, 201]:
                return True, None
            elif r.status_code == 400:
                # Bad data, skip
                return False, f"Bad request: {r.text[:100]}"
            else:
                # Retry
                time.sleep(RETRY_DELAY * (attempt + 1))
        except requests.exceptions.ConnectionError:
            if not wait_for_connection():
                return False, "Connection lost"
        except requests.exceptions.Timeout:
            time.sleep(RETRY_DELAY * (attempt + 1))
        except Exception as e:
            return False, str(e)
    
    return False, "Max retries exceeded"

def get_current_count(session):
    """Get current line item count in Strapi"""
    try:
        r = session.get(f"{STRAPI_URL}/api/line-items?pagination[pageSize]=1&pagination[withCount]=true",
                       headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                       timeout=10)
        if r.ok:
            return r.json().get("meta", {}).get("pagination", {}).get("total", 0)
    except:
        pass
    return 0

def main():
    print("=" * 60)
    print("📦 LINE ITEMS IMPORT TO STRAPI")
    print("=" * 60)
    
    # Load source data
    print(f"\n📂 Loading line items from {LINE_ITEMS_FILE}...")
    with open(LINE_ITEMS_FILE, 'r') as f:
        line_items = json.load(f)
    total = len(line_items)
    print(f"   Found {total:,} line items")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    start_index = checkpoint.get("last_index", 0)
    imported_ids = set(checkpoint.get("imported_ids", []))
    failed_ids = checkpoint.get("failed_ids", [])
    
    if start_index > 0:
        print(f"📍 Resuming from index {start_index:,} ({len(imported_ids):,} already imported)")
    
    # Check connection
    print("\n🔌 Checking Strapi connection...")
    if not check_connection():
        print("❌ Cannot connect to Strapi. Please check the server.")
        sys.exit(1)
    print("✅ Connected!")
    
    # Get current count
    session = requests.Session()
    current_count = get_current_count(session)
    print(f"📊 Current line items in Strapi: {current_count:,}")
    
    # Progress bar
    remaining = total - start_index
    pbar = tqdm(
        total=remaining,
        desc="Importing",
        unit="items",
        ncols=100,
        bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]'
    )
    
    success_count = 0
    fail_count = 0
    last_save = time.time()
    
    try:
        for i in range(start_index, total):
            if shutdown_requested:
                break
            
            item = line_items[i]
            item_id = str(item.get("id", i))
            
            # Skip if already imported
            if item_id in imported_ids:
                pbar.update(1)
                continue
            
            success, error = import_line_item(item, session)
            
            if success:
                success_count += 1
                imported_ids.add(item_id)
            else:
                fail_count += 1
                failed_ids.append({"id": item_id, "error": error})
            
            pbar.update(1)
            checkpoint["last_index"] = i + 1
            checkpoint["imported_ids"] = list(imported_ids)
            checkpoint["failed_ids"] = failed_ids[-100:]  # Keep last 100 failures
            
            # Save checkpoint every 30 seconds
            if time.time() - last_save > 30:
                save_checkpoint(checkpoint)
                last_save = time.time()
            
            # Small delay to avoid overwhelming the server
            if (i + 1) % BATCH_SIZE == 0:
                time.sleep(0.1)
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        pbar.close()
        save_checkpoint(checkpoint)
        
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"✅ Successfully imported: {success_count:,}")
        print(f"❌ Failed: {fail_count}")
        print(f"📍 Progress: {checkpoint['last_index']:,} / {total:,} ({100*checkpoint['last_index']/total:.1f}%)")
        
        final_count = get_current_count(session)
        print(f"📦 Total line items in Strapi: {final_count:,}")
        
        if checkpoint['last_index'] < total:
            print(f"\n⏸️  Import paused. Run again to resume from index {checkpoint['last_index']:,}")
        else:
            print("\n🎉 Import complete!")

if __name__ == "__main__":
    main()
