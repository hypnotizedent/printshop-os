#!/usr/bin/env python3
"""
Resilient Artwork Upload to MinIO
- Progress bar with ETA
- Checkpoint/resume on disconnect
- Retry with exponential backoff
- Connection monitoring
- Uploads in batches via rsync for efficiency
"""

import json
import time
import sys
import signal
import subprocess
import os
from pathlib import Path
from datetime import datetime
from tqdm import tqdm

# Configuration
ARTWORK_DIR = Path("data/artwork/by_order")
CHECKPOINT_FILE = Path("data/artwork-upload-checkpoint.json")
MINIO_BUCKET = "printshop-artwork"
DOCKER_HOST = "docker-host"
BATCH_SIZE = 50  # Orders per batch
MAX_RETRIES = 3

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
    return {
        "uploaded_orders": [],
        "failed_orders": [],
        "total_files": 0,
        "total_bytes": 0,
        "started_at": datetime.now().isoformat()
    }

def save_checkpoint(checkpoint):
    """Save progress to checkpoint file"""
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)

def check_ssh_connection():
    """Check if docker-host is reachable"""
    try:
        result = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=5", DOCKER_HOST, "echo ok"],
            capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0
    except:
        return False

def check_minio():
    """Check if MinIO bucket exists, create if not"""
    try:
        # Check/create bucket via mc inside minio container
        result = subprocess.run(
            ["ssh", DOCKER_HOST, 
             f"docker exec printshop-minio mc alias set local http://localhost:9000 minioadmin $MINIO_ROOT_PASSWORD 2>/dev/null; "
             f"docker exec printshop-minio mc mb --ignore-existing local/{MINIO_BUCKET} 2>/dev/null; "
             f"docker exec printshop-minio mc ls local/{MINIO_BUCKET} 2>/dev/null | wc -l"],
            capture_output=True, text=True, timeout=30
        )
        return result.returncode == 0
    except Exception as e:
        print(f"MinIO check error: {e}")
        return False

def wait_for_connection():
    """Wait for connection to be restored"""
    print("\n🔌 Connection lost. Waiting for reconnection...")
    attempt = 0
    while not check_ssh_connection():
        attempt += 1
        wait_time = min(60, 5 * attempt)
        print(f"   Retry {attempt}: waiting {wait_time}s...")
        time.sleep(wait_time)
        if shutdown_requested:
            return False
    print("✅ Connection restored!")
    return True

def get_order_folders():
    """Get list of order folders with their file counts"""
    orders = []
    if not ARTWORK_DIR.exists():
        return orders
    
    for order_dir in sorted(ARTWORK_DIR.iterdir()):
        if order_dir.is_dir():
            files = list(order_dir.glob("*"))
            file_count = len([f for f in files if f.is_file()])
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            orders.append({
                "order_id": order_dir.name,
                "path": str(order_dir),
                "file_count": file_count,
                "total_size": total_size
            })
    return orders

def upload_order_batch(orders, checkpoint):
    """Upload a batch of orders using rsync"""
    if not orders:
        return 0, 0
    
    # Create temp file list
    temp_list = Path("/tmp/artwork_upload_list.txt")
    with open(temp_list, 'w') as f:
        for order in orders:
            # Relative path from ARTWORK_DIR parent
            rel_path = f"by_order/{order['order_id']}/"
            f.write(f"{rel_path}\n")
    
    # rsync to docker-host staging area
    staging_dir = f"/tmp/artwork-staging"
    
    for attempt in range(MAX_RETRIES):
        try:
            # First rsync to staging on docker-host
            result = subprocess.run([
                "rsync", "-avz", "--progress", "--files-from", str(temp_list),
                str(ARTWORK_DIR.parent) + "/",
                f"{DOCKER_HOST}:{staging_dir}/"
            ], capture_output=True, text=True, timeout=600)  # 10 min timeout
            
            if result.returncode == 0:
                # Then copy from staging to MinIO via docker exec
                for order in orders:
                    order_id = order['order_id']
                    mc_cmd = (
                        f"docker exec printshop-minio mc cp --recursive "
                        f"/tmp/artwork-staging/by_order/{order_id}/ "
                        f"local/{MINIO_BUCKET}/{order_id}/ 2>/dev/null"
                    )
                    subprocess.run(["ssh", DOCKER_HOST, mc_cmd], 
                                 capture_output=True, timeout=120)
                
                uploaded = len(orders)
                bytes_uploaded = sum(o['total_size'] for o in orders)
                return uploaded, bytes_uploaded
            else:
                if "connection" in result.stderr.lower():
                    if not wait_for_connection():
                        return 0, 0
                time.sleep(2 ** attempt)
                
        except subprocess.TimeoutExpired:
            print(f"   Timeout on attempt {attempt + 1}")
            time.sleep(5)
        except Exception as e:
            print(f"   Error: {e}")
            time.sleep(2 ** attempt)
    
    return 0, 0

def format_bytes(size):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} PB"

def main():
    print("=" * 60)
    print("🎨 ARTWORK UPLOAD TO MINIO")
    print("=" * 60)
    
    # Get all order folders
    print(f"\n📂 Scanning artwork folders...")
    all_orders = get_order_folders()
    total_orders = len(all_orders)
    total_files = sum(o['file_count'] for o in all_orders)
    total_size = sum(o['total_size'] for o in all_orders)
    
    print(f"   Found {total_orders:,} orders")
    print(f"   Total files: {total_files:,}")
    print(f"   Total size: {format_bytes(total_size)}")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    uploaded_set = set(checkpoint.get("uploaded_orders", []))
    
    # Filter out already uploaded
    pending_orders = [o for o in all_orders if o['order_id'] not in uploaded_set]
    pending_files = sum(o['file_count'] for o in pending_orders)
    pending_size = sum(o['total_size'] for o in pending_orders)
    
    if uploaded_set:
        print(f"\n📍 Resuming: {len(uploaded_set):,} orders already uploaded")
        print(f"   Remaining: {len(pending_orders):,} orders ({format_bytes(pending_size)})")
    
    if not pending_orders:
        print("\n🎉 All artwork already uploaded!")
        return
    
    # Check connections
    print("\n🔌 Checking SSH connection to docker-host...")
    if not check_ssh_connection():
        print("❌ Cannot connect to docker-host")
        sys.exit(1)
    print("✅ SSH connected!")
    
    print("🪣 Checking MinIO bucket...")
    if not check_minio():
        print("⚠️  MinIO check failed, but continuing...")
    else:
        print("✅ MinIO ready!")
    
    # Progress bar
    pbar = tqdm(
        total=len(pending_orders),
        desc="Uploading",
        unit="orders",
        ncols=100,
        bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]'
    )
    
    uploaded_count = 0
    uploaded_bytes = 0
    failed_orders = checkpoint.get("failed_orders", [])
    last_save = time.time()
    
    try:
        # Process in batches
        for i in range(0, len(pending_orders), BATCH_SIZE):
            if shutdown_requested:
                break
            
            batch = pending_orders[i:i + BATCH_SIZE]
            count, bytes_up = upload_order_batch(batch, checkpoint)
            
            if count > 0:
                uploaded_count += count
                uploaded_bytes += bytes_up
                for order in batch[:count]:
                    uploaded_set.add(order['order_id'])
                pbar.update(count)
            else:
                for order in batch:
                    failed_orders.append(order['order_id'])
                pbar.update(len(batch))
            
            # Update checkpoint
            checkpoint["uploaded_orders"] = list(uploaded_set)
            checkpoint["failed_orders"] = failed_orders[-100:]
            checkpoint["total_files"] = len(uploaded_set)
            checkpoint["total_bytes"] = uploaded_bytes
            
            # Save checkpoint every 30 seconds
            if time.time() - last_save > 30:
                save_checkpoint(checkpoint)
                last_save = time.time()
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        pbar.close()
        save_checkpoint(checkpoint)
        
        print("\n" + "=" * 60)
        print("📊 UPLOAD SUMMARY")
        print("=" * 60)
        print(f"✅ Uploaded: {len(uploaded_set):,} orders")
        print(f"📦 Data transferred: {format_bytes(uploaded_bytes)}")
        print(f"❌ Failed: {len(failed_orders)}")
        
        remaining = total_orders - len(uploaded_set)
        if remaining > 0:
            print(f"\n⏸️  Upload paused. {remaining:,} orders remaining.")
            print("   Run again to resume.")
        else:
            print("\n🎉 All artwork uploaded!")

if __name__ == "__main__":
    main()
