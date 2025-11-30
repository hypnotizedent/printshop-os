#!/usr/bin/env python3
"""
Artwork Upload to MinIO v2 - Using MinIO Python SDK
====================================================
ISSUE FIXES:
1. Original script used mc inside container - too slow
2. Direct rsync to volume - MinIO doesn't recognize files

SOLUTION: Use MinIO Python SDK to upload directly via S3 API.
This is the correct way to upload files to MinIO.

Configuration:
- MinIO endpoint: 100.92.156.118:9000 (via Tailscale)
- Bucket: printshop-artwork
- Path format: orders/{order_id}/filename.ext

Known Issues Solved:
- Permission denied on rsync: Not an issue with SDK
- mc not seeing rsync'd files: SDK uploads properly
- Connection drops: Checkpoint/resume handles this

Usage:
    caffeinate -dims python scripts/sync-artwork-minio-v2.py

Install dependencies:
    pip install minio tqdm
"""

import json
import time
import sys
import signal
import os
from pathlib import Path
from datetime import datetime
from tqdm import tqdm
from minio import Minio
from minio.error import S3Error

# =============================================================================
# CONFIGURATION
# =============================================================================
ARTWORK_DIR = Path("data/artwork/by_order")
CHECKPOINT_FILE = Path("data/artwork-upload-checkpoint.json")

# MinIO connection (via Tailscale to docker-host)
MINIO_ENDPOINT = "100.92.156.118:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "00ab9d9e1e9b806fb9323d0db5b2106e"
MINIO_SECURE = False  # HTTP not HTTPS

BUCKET_NAME = "printshop-artwork"
UPLOAD_PREFIX = "orders"  # Files go to: orders/{order_id}/file.ext

# =============================================================================
# GRACEFUL SHUTDOWN
# =============================================================================
shutdown_requested = False

def signal_handler(sig, frame):
    global shutdown_requested
    print("\n⏸️  Shutdown requested, saving checkpoint...")
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


# =============================================================================
# CHECKPOINT MANAGEMENT
# =============================================================================
def load_checkpoint():
    """Load progress from checkpoint file"""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("⚠️  Corrupted checkpoint, starting fresh")
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


# =============================================================================
# HELPERS
# =============================================================================
def format_bytes(size):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} PB"


def get_order_folders():
    """Get list of order folders to upload"""
    orders = []
    if not ARTWORK_DIR.exists():
        print(f"❌ Artwork directory not found: {ARTWORK_DIR}")
        return orders
    
    for order_dir in sorted(ARTWORK_DIR.iterdir()):
        if order_dir.is_dir() and not order_dir.name.startswith('.'):
            files = [f for f in order_dir.glob("*") if f.is_file()]
            if files:  # Only include folders with files
                total_size = sum(f.stat().st_size for f in files)
                orders.append({
                    "order_id": order_dir.name,
                    "path": str(order_dir),
                    "file_count": len(files),
                    "size": total_size
                })
    return orders


def check_minio_connection(client):
    """Check if MinIO is accessible"""
    try:
        client.list_buckets()
        return True
    except Exception as e:
        print(f"❌ MinIO connection failed: {e}")
        return False


def ensure_bucket(client):
    """Ensure bucket exists"""
    try:
        if not client.bucket_exists(BUCKET_NAME):
            client.make_bucket(BUCKET_NAME)
            print(f"✅ Created bucket: {BUCKET_NAME}")
        return True
    except S3Error as e:
        print(f"❌ Bucket error: {e}")
        return False


# =============================================================================
# UPLOAD LOGIC
# =============================================================================
def upload_order(client, order, max_retries=3):
    """
    Upload all files from an order folder to MinIO.
    
    Returns: (success: bool, files_uploaded: int, bytes_uploaded: int)
    """
    order_id = order['order_id']
    order_path = Path(order['path'])
    
    files_uploaded = 0
    bytes_uploaded = 0
    
    for file_path in order_path.glob("*"):
        if not file_path.is_file():
            continue
        
        object_name = f"{UPLOAD_PREFIX}/{order_id}/{file_path.name}"
        file_size = file_path.stat().st_size
        
        for attempt in range(max_retries):
            try:
                client.fput_object(
                    BUCKET_NAME,
                    object_name,
                    str(file_path),
                )
                files_uploaded += 1
                bytes_uploaded += file_size
                break
                
            except S3Error as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    print(f"\n⚠️  Failed to upload {file_path.name}: {e}")
                    return False, files_uploaded, bytes_uploaded
                    
            except Exception as e:
                if "connection" in str(e).lower() or "timeout" in str(e).lower():
                    print(f"\n🔌 Connection issue, retrying...")
                    time.sleep(5)
                else:
                    print(f"\n⚠️  Error uploading {file_path.name}: {e}")
                    return False, files_uploaded, bytes_uploaded
    
    return True, files_uploaded, bytes_uploaded


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("=" * 70)
    print("🎨 ARTWORK UPLOAD TO MINIO v2 (SDK)")
    print("=" * 70)
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Initialize MinIO client
    print(f"\n🔌 Connecting to MinIO at {MINIO_ENDPOINT}...")
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    
    if not check_minio_connection(client):
        print("❌ Cannot connect to MinIO!")
        print("   Check that docker-host is accessible via Tailscale")
        print("   Check that printshop-minio container is running")
        sys.exit(1)
    print("✅ Connected!")
    
    # Ensure bucket exists
    if not ensure_bucket(client):
        sys.exit(1)
    print(f"✅ Bucket '{BUCKET_NAME}' ready!")
    
    # Scan artwork folders
    print(f"\n📂 Scanning {ARTWORK_DIR}...")
    all_orders = get_order_folders()
    
    if not all_orders:
        print("❌ No artwork folders found!")
        sys.exit(1)
    
    total_orders = len(all_orders)
    total_files = sum(o['file_count'] for o in all_orders)
    total_size = sum(o['size'] for o in all_orders)
    
    print(f"   📦 {total_orders:,} orders")
    print(f"   📄 {total_files:,} files")
    print(f"   💾 {format_bytes(total_size)}")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    uploaded_set = set(checkpoint.get("uploaded_orders", []))
    
    # Filter pending
    pending = [o for o in all_orders if o['order_id'] not in uploaded_set]
    pending_size = sum(o['size'] for o in pending)
    
    if uploaded_set:
        print(f"\n📍 Resuming from checkpoint:")
        print(f"   ✅ Already uploaded: {len(uploaded_set):,} orders")
        print(f"   ⏳ Remaining: {len(pending):,} orders ({format_bytes(pending_size)})")
    
    if not pending:
        print("\n🎉 All artwork already uploaded!")
        return
    
    # Estimate time (rough: ~5 files/sec average)
    est_seconds = len(pending) * 5
    est_hours = est_seconds / 3600
    print(f"\n⏱️  Estimated time: {est_hours:.1f} hours")
    
    # Progress bar
    pbar = tqdm(
        total=len(pending),
        desc="Uploading",
        unit="orders",
        ncols=100,
        bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]'
    )
    
    last_save = time.time()
    session_uploaded = 0
    session_bytes = 0
    session_files = 0
    failed_orders = checkpoint.get("failed_orders", [])
    
    try:
        for order in pending:
            if shutdown_requested:
                break
            
            success, files, bytes_up = upload_order(client, order)
            
            if success:
                uploaded_set.add(order['order_id'])
                session_uploaded += 1
                session_files += files
                session_bytes += bytes_up
            else:
                if order['order_id'] not in failed_orders:
                    failed_orders.append(order['order_id'])
            
            pbar.update(1)
            
            # Update checkpoint periodically
            checkpoint["uploaded_orders"] = list(uploaded_set)
            checkpoint["failed_orders"] = failed_orders[-100:]  # Keep last 100 failures
            checkpoint["total_files"] = checkpoint.get("total_files", 0) + files
            checkpoint["total_bytes"] = checkpoint.get("total_bytes", 0) + bytes_up
            
            if time.time() - last_save > 30:
                save_checkpoint(checkpoint)
                last_save = time.time()
                
    except KeyboardInterrupt:
        shutdown_requested = True
    finally:
        pbar.close()
        save_checkpoint(checkpoint)
        
        print("\n" + "=" * 70)
        print("📊 UPLOAD SUMMARY")
        print("=" * 70)
        print(f"⏰ Ended: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"✅ Uploaded this session: {session_uploaded:,} orders ({session_files:,} files)")
        print(f"📦 Data transferred: {format_bytes(session_bytes)}")
        print(f"📁 Total in MinIO: {len(uploaded_set):,} orders")
        print(f"❌ Failed: {len(failed_orders)}")
        
        remaining = total_orders - len(uploaded_set)
        if remaining > 0:
            print(f"\n⏸️  Upload paused. {remaining:,} orders remaining.")
            print(f"   Run again with caffeinate to resume:")
            print(f"   caffeinate -dims python scripts/sync-artwork-minio-v2.py")
        else:
            print("\n🎉 ALL ARTWORK UPLOADED!")


if __name__ == "__main__":
    main()
