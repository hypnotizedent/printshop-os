#!/usr/bin/env python3
"""
Sync Printavo Tasks to Strapi
- Imports all 1,463 tasks from Printavo export
- Links tasks to orders where possible
- Checkpoint/resume support
"""

import json
import time
import sys
import signal
from pathlib import Path
from datetime import datetime
import requests

# Configuration
STRAPI_URL = "http://100.92.156.118:1337"
STRAPI_TOKEN = "dc23c1734c2dea6fbbf0d57a96a06c91b72a868ffae261400be8b9dbe70b960fed09c0d53b6930b02f9315b1cce53b57d6155baf3019e366b419c687427306cf685421fd945f1b2ebb3cabd46fda2d209256a95ffedc3769bd9eeda29216925145b735e7ea6699792a47c15914d1548d8412284bd076cdf2f15250dd5090951e"
TASKS_FILE = Path("data/raw/printavo-exports/complete_2025-11-27_14-20-05/tasks.json")
CHECKPOINT_FILE = Path("data/task-import-checkpoint.json")
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
        r = requests.get(f"{STRAPI_URL}/api/jobs?pagination[pageSize]=1", 
                        headers={"Authorization": f"Bearer {STRAPI_TOKEN}"},
                        timeout=10)
        return r.status_code == 200
    except:
        return False

def import_task(task, session):
    """Import a task as a Job in Strapi"""
    # Map Printavo task to Strapi job
    data = {
        "data": {
            "printavoId": str(task.get("id", "")),
            "printavoOrderId": str(task.get("order_id", "")) if task.get("order_id") else None,
            "name": task.get("name", "")[:200] if task.get("name") else "Task",
            "description": task.get("description", "")[:2000] if task.get("description") else None,
            "status": "pending",  # Default status
            "dueDate": task.get("due_at") if task.get("due_at") else None,
            "completedAt": task.get("completed_at") if task.get("completed_at") else None,
            "priority": "medium",
            "source": "printavo",
        }
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            r = session.post(f"{STRAPI_URL}/api/jobs",
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
    print("📋 PRINTAVO TASKS SYNC TO STRAPI (as Jobs)")
    print("=" * 60)
    
    # Check for tasks file
    tasks_file = TASKS_FILE
    if not tasks_file.exists():
        print(f"⚠️  Tasks file not found: {tasks_file}")
        # Try alternate location
        alt_path = Path("data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z/tasks.json")
        if alt_path.exists():
            tasks_file = alt_path
            print(f"✓ Using alternate: {alt_path}")
        else:
            print("❌ No tasks file found")
            sys.exit(1)
    
    print(f"\n📂 Loading tasks from {tasks_file}...")
    with open(tasks_file, 'r') as f:
        tasks = json.load(f)
    
    total = len(tasks)
    print(f"   Found {total} tasks")
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    imported_set = set(checkpoint.get("imported_ids", []))
    
    pending = [t for t in tasks if str(t.get("id", "")) not in imported_set]
    
    if imported_set:
        print(f"📍 Resuming: {len(imported_set)} already imported, {len(pending)} remaining")
    
    if not pending:
        print("\n🎉 All tasks already imported!")
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
    last_save = time.time()
    
    try:
        for i, task in enumerate(pending):
            if shutdown_requested:
                break
            
            task_id = str(task.get("id", ""))
            success, error = import_task(task, session)
            
            if success:
                success_count += 1
                imported_set.add(task_id)
            else:
                fail_count += 1
                checkpoint.setdefault("failed_ids", []).append({"id": task_id, "error": error})
            
            # Progress
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i + 1}/{len(pending)} ({success_count} ok, {fail_count} failed)")
            
            checkpoint["imported_ids"] = list(imported_set)
            
            # Save every 30 seconds
            if time.time() - last_save > 30:
                save_checkpoint(checkpoint)
                last_save = time.time()
                
    finally:
        save_checkpoint(checkpoint)
        
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"✅ Imported: {success_count}")
        print(f"❌ Failed: {fail_count}")
        print(f"📋 Total in Strapi: {len(imported_set)}")

if __name__ == "__main__":
    main()
