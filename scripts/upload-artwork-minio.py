import os
import sys

# Emergency pause: if set, exit immediately to prevent uploads
if os.environ.get("ARTWORK_UPLOAD_PAUSED") == "1":
    print("Artwork upload paused by env flag. Exiting.")
    sys.exit(0)
#!/usr/bin/env python3
"""
Direct Artwork Upload to MinIO (from Mac)
- Uses MinIO Python client directly over network
- Progress bar with ETA
- Checkpoint/resume
- Parallel uploads
"""

import json
import time
import sys
import signal
import os
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    print("Installing minio...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "minio", "-q"])
    from minio import Minio
    from minio.error import S3Error

# Configuration
ARTWORK_DIR = Path("data/artwork/by_customer")
CHECKPOINT_FILE = Path("data/artwork-minio-checkpoint.json")
MINIO_ENDPOINT = "100.92.156.118:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "00ab9d9e1e9b806fb9323d0db5b2106e"
MINIO_BUCKET = "printshop-artwork"
PARALLEL_UPLOADS = 8  # Concurrent uploads

# Graceful shutdown
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
    return {
        "uploaded_files": [],
        "failed_files": [],
        "total_bytes": 0,
        "started_at": datetime.now().isoformat()
    }


def save_checkpoint(checkpoint):
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)


def get_all_artwork_files():
    """Get list of all artwork files to upload"""
    files = []
    # Structure: by_customer/{customer-slug}/{year}/{order_folder}/files
    for customer_dir in ARTWORK_DIR.iterdir():
        if not customer_dir.is_dir():
            continue
        for year_dir in customer_dir.iterdir():
            if not year_dir.is_dir():
                continue
            for order_dir in year_dir.iterdir():
                if not order_dir.is_dir():
                    continue
                for f in order_dir.iterdir():
                    if f.is_file() and f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.pdf', '.psd', '.ai', '.eps', '.json']:
                        # Object name: customers/{customer}/{year}/{order}/{filename}
                        object_name = f"customers/{customer_dir.name}/{year_dir.name}/{order_dir.name}/{f.name}"
                        files.append((f, object_name, f.stat().st_size))
    return files


def upload_file(client, file_path, object_name):
    """Upload single file to MinIO"""
    try:
        client.fput_object(
            MINIO_BUCKET, 
            object_name, 
            str(file_path),
            content_type=get_content_type(file_path)
        )
        return True, object_name, file_path.stat().st_size, None
    except Exception as e:
        return False, object_name, 0, str(e)


def get_content_type(file_path):
    ext = file_path.suffix.lower()
    return {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.pdf': 'application/pdf',
        '.psd': 'image/vnd.adobe.photoshop',
        '.ai': 'application/illustrator',
        '.eps': 'application/postscript',
    }.get(ext, 'application/octet-stream')


def main():
    print("=" * 60)
    print("🎨 ARTWORK UPLOAD TO MINIO")
    print("=" * 60)
    
    # Connect to MinIO
    print(f"\n🔗 Connecting to MinIO at {MINIO_ENDPOINT}...")
    client = Minio(MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, secure=False)
    
    # Ensure bucket exists
    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)
        print(f"   Created bucket: {MINIO_BUCKET}")
    else:
        print(f"   Bucket exists: {MINIO_BUCKET}")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    uploaded_set = set(checkpoint.get("uploaded_files", []))
    print(f"📍 Already uploaded: {len(uploaded_set):,} files")
    
    # Get all artwork files
    print(f"\n📂 Scanning {ARTWORK_DIR}...")
    all_files = get_all_artwork_files()
    print(f"   Found {len(all_files):,} files")
    
    # Filter already uploaded
    pending = [(f, obj, size) for f, obj, size in all_files if obj not in uploaded_set]
    print(f"   Pending upload: {len(pending):,} files")
    
    if not pending:
        print("\n✅ All files already uploaded!")
        return
    
    # Calculate total size
    total_size = sum(size for _, _, size in pending)
    print(f"   Total size: {total_size / (1024**3):.2f} GB")
    
    # Upload with progress bar
    print(f"\n🚀 Starting upload ({PARALLEL_UPLOADS} parallel)...")
    
    uploaded = 0
    failed = 0
    bytes_uploaded = checkpoint.get("total_bytes", 0)
    
    with tqdm(total=len(pending), unit="files", desc="Uploading") as pbar:
        with ThreadPoolExecutor(max_workers=PARALLEL_UPLOADS) as executor:
            futures = {}
            
            for file_path, object_name, size in pending:
                if shutdown_requested:
                    break
                    
                future = executor.submit(upload_file, client, file_path, object_name)
                futures[future] = (object_name, size)
            
            for future in as_completed(futures):
                if shutdown_requested:
                    break
                    
                object_name, expected_size = futures[future]
                success, obj, size, error = future.result()
                
                if success:
                    uploaded += 1
                    bytes_uploaded += size
                    checkpoint["uploaded_files"].append(obj)
                else:
                    failed += 1
                    checkpoint["failed_files"].append({"file": obj, "error": error})
                
                pbar.update(1)
                pbar.set_postfix({
                    "uploaded": uploaded,
                    "failed": failed,
                    "GB": f"{bytes_uploaded/(1024**3):.1f}"
                })
                
                # Save checkpoint every 100 files
                if (uploaded + failed) % 100 == 0:
                    checkpoint["total_bytes"] = bytes_uploaded
                    save_checkpoint(checkpoint)
    
    # Final save
    checkpoint["total_bytes"] = bytes_uploaded
    save_checkpoint(checkpoint)
    
    print("\n" + "=" * 60)
    print("✅ UPLOAD COMPLETE")
    print("=" * 60)
    print(f"   Uploaded: {uploaded:,} files")
    print(f"   Failed: {failed:,} files")
    print(f"   Total size: {bytes_uploaded / (1024**3):.2f} GB")
    print(f"   Checkpoint: {CHECKPOINT_FILE}")


if __name__ == "__main__":
    main()
