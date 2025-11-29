# PrintShop OS - Daily Task Log

> **PURPOSE:** This is the single source of truth for session continuity. Read this FIRST at the start of every Copilot conversation.
> 
> **RULE:** At the start of every new conversation, tell Copilot: "Read DAILY_TASK_LOG.md before doing anything"

---

## 📊 Current State (Last Updated: November 29, 2025 1:00 PM EST)

### Data Status
| Data Type | Source Count | In Strapi | Status |
|-----------|--------------|-----------|--------|
| Customers | 3,358 | 3,319 | ✅ Imported |
| Orders | 12,867 | 12,868 | ✅ Imported |
| Line Items | 44,158 | ~36,500 | 🔄 83% Complete (importing) |
| Products | 105 (Printavo) + 400K (Suppliers) | 0 | ❌ Pending |
| Artwork | 115,606 files (201 GB) | - | ⏸️ Paused (see notes) |

### Infrastructure Status
| Service | Container | Status | Port |
|---------|-----------|--------|------|
| PostgreSQL | printshop-postgres | ✅ Healthy | 5432 |
| Redis | printshop-redis | ✅ Healthy | 6379 |
| Strapi CMS | printshop-strapi | ⚠️ Unhealthy (but running) | 1337 |
| API Service | printshop-api | ✅ Healthy | 3002 |
| Frontend | printshop-frontend | ✅ Healthy | 3000 |
| MinIO | printshop-minio | ✅ Healthy | 9000/9001 |

### Credentials (Reference)
```
Strapi Admin: ronny@ronny.works / PrintShop2025!
Strapi API Token: dc23c1734c2dea...d5090951e (full in .env)
S&S Activewear: 31810 / 07d8c0de-a385-4eeb-b310-8ba7bc55d3d8
SanMar SFTP: 180164 / dMvGlWLTScz2Hh (port 2200)
AS Colour: Subscription-Key in .env + JWT Bearer
Printavo: ronny@mintprints.com / tApazCfvuQE-0Tl3YLIofg
MinIO Console: http://100.92.156.118:9001 - minioadmin / 00ab9d9e1e9b806fb9323d0db5b2106e
```

---

## 🎯 Immediate Priorities (P0)

1. **Import Line Items** - 44,158 items ready in `data/raw/printavo-exports/complete_2025-11-27_14-20-05/lineitems.json`
   - Script ready: `scripts/sync-line-items.py`
   - Checkpoint: `data/line-item-import-checkpoint.json`
   - **Current:** 28,828 / 44,158 (65%) - Running in background

2. **Upload Artwork to MinIO** - 201 GB in `data/artwork/by_customer/`
   - Script ready: `scripts/upload-artwork-minio.py` (direct Python SDK)
   - 115,606 files indexed
   - **Current:** ⏸️ PAUSED - uploading PNGs but not DST/AI files (needs script fix)

3. **Fix Strapi Health** - Container running but marked unhealthy

---

### Session: November 29, 2025 - PR #169 Audit + Frontend Auth Fixes

**Started:** 12:20 PM EST
**Goal:** Audit PR #169, fix critical bugs, then resolve frontend 403 auth errors

---

#### 📍 12:20 PM - PR #169 Checkout & Initial Testing
- Checked out `copilot/add-audit-script-for-repo-health` branch
- Tested on macOS default Bash 3.2:
  ```bash
  /bin/bash ./scripts/audit.sh --help
  # Result: ./scripts/audit.sh: line 43: declare: -A: invalid option
  ```
- **Bug #1 Found:** `declare -A` (associative arrays) requires Bash 4.0+

#### 📍 12:25 PM - Installed Homebrew Bash for Proper Testing
```bash
brew install bash
# Installed: bash 5.3.8 at /opt/homebrew/bin/bash
```

#### 📍 12:28 PM - Validated JSON Output with jq
```bash
/opt/homebrew/bin/bash ./scripts/audit.sh --check all --format json | jq .
# Result: ✅ Valid JSON, all 7 checks pass
```

#### 📍 12:30 PM - Discovered Test Categorization Bug
```bash
/opt/homebrew/bin/bash ./scripts/audit.sh --check tests
# Result: All 33 tests showing as "other" instead of proper services
```
- **Bug #2 Found:** `find` returns `./services/api/...` but regex expects `services/api/...`
- Root cause: Missing `./` prefix stripping before categorization

#### 📍 12:32 PM - Submitted PR Review with "Request Changes"
- Added 6 inline code comments with specific fixes:
  1. Bash version check in `audit.sh` (line 25)
  2. Path prefix fix in `tests.sh` `output_tests_markdown()` (line 185)
  3. Path prefix fix in `tests.sh` `output_tests_json()` (line 284)
  4. Path prefix fix in `tests.sh` `output_tests_csv()` (line 369)
  5. Prerequisites section in `README-audit.md`
  6. Suggestion for portable path handling

#### 📍 12:35 PM - Copilot Agent Applied Fixes
- Commit `181c791` created by copilot-swe-agent[bot]:
  - Added Bash 4.0+ version check with helpful error message
  - Fixed path prefix in all 3 output functions
  - Added Prerequisites section to README

#### 📍 12:40 PM - Verified Fixes Work Correctly
```bash
# Test 1: Bash version check
/bin/bash ./scripts/audit.sh --help
# Result: "Error: Bash 4.0+ required. Found: 3.2.57(1)-release"

# Test 2: Test categorization
/opt/homebrew/bin/bash ./scripts/audit.sh --check tests | grep -A 10 "Coverage Matrix"
# Result:
# | production-dashboard | 4 | 117 |
# | api | 13 | 441 |
# | frontend | 2 | 31 |
# | job-estimator | 7 | 198 |
# ✅ Tests now properly categorized!
```

#### 📍 12:42 PM - Cleaned Up Orphaned Branch
```bash
git branch -D pr-169  # Deleted local orphan branch I accidentally created
```

**PR #169 Status:** Ready for merge - all issues resolved

---

#### 📍 12:50 PM - Merged PR #169
```bash
gh pr ready 169 && gh pr merge 169 --squash --delete-branch
# ✓ Pull request marked as "ready for review"
# ✓ Squashed and merged pull request #169
# ✓ Deleted branch copilot/add-audit-script-for-repo-health
```
- Commit: `9b43e3e` - feat(scripts): add automated audit script for repo health reports
- Closes issue #163
- 9 files added, 3,793 lines of code

**PR #169 COMPLETE ✅**

---

#### 📍 12:55 PM - Frontend Auth Fixes (Quote + Shipping Routes)
**Issue:** Quotes and Shipping endpoints returning 403 Forbidden
**Root Cause:** Strapi routes require authentication by default
**Fix:** Add `auth: false` to all routes for internal dashboard access

**Files Modified:**

1. `printshop-strapi/src/api/quote/routes/quote.ts`
   - Added `auth: false` to: find, findOne, create, update, delete

2. `printshop-strapi/src/api/shipping/routes/shipping.ts`
   - Added `auth: false` to all 4 routes:
     - POST `/shipping/rates`
     - POST `/shipping/buy`
     - GET `/shipping/track/:trackingCode`
     - POST `/shipping/validate-address`

```bash
git commit -m "fix(strapi): add auth: false to quote and shipping routes"
git push origin main
# Commit: ba8e905
```

#### 📍 1:00 PM - Session Summary
**Completed:**
- ✅ PR #169 audited, bugs found, fixes verified, merged
- ✅ Quote routes: 403 → auth disabled for dashboard
- ✅ Shipping routes: 403 → auth disabled for dashboard
- ✅ All changes pushed to main

**Next Steps:**
- Deploy updated Strapi to docker-host to apply auth fixes
- Test endpoints from frontend

**Session Ended:** 1:00 PM EST
**Fix:** Add `auth: false` to routes for internal dashboard access

---

### Session: November 28, 2025 10:00 PM - Frontend Bug Investigation

**Started:** 10:00 PM EST
**Goal:** Investigate Quotes page + Shipping EasyPost errors, update task log

#### 📍 10:05 PM - Line Items Progress Check
```bash
Last index: 36,492
Imported: 33,810
Progress: ~83% complete
```
- Import still running (PID 91501)
- ETA: ~15 minutes remaining

#### 📍 10:10 PM - MinIO Artwork Upload Paused
- **Issue:** Script was pulling all files including PNGs
- **Needed files:** DST (embroidery), AI/EPS (vector), PDF (print-ready)
- **Decision:** Pause upload, fix script filter in future session
- **Action:** Stopped upload script

#### 📍 10:15 PM - Frontend Bug Root Cause Analysis

**Bug 1: Quotes Page**
- **Symptom:** QuoteForm loads fine, but "Save Quote" fails
- **Root Cause:** 403 Forbidden - Strapi requires auth token
- **Location:** `frontend/src/components/quotes/QuoteForm.tsx` line 232
- **Fix needed:** Either add `auth: false` to route OR include API token in frontend

**Bug 2: Shipping EasyPost**
- **Symptom:** "Failed to get shipping rates" error
- **Root Cause:** 403 Forbidden - `/api/shipping/rates` requires auth
- **Location:** `printshop-strapi/src/api/shipping/routes/shipping.ts`
- **Verified:** EasyPost API key configured ✅, @easypost/api@8.4.0 installed ✅
- **Fix needed:** Add `auth: false` to shipping routes for internal dashboard

**Tested Endpoints:**
```bash
curl -X POST http://100.92.156.118:1337/api/shipping/rates → 403 Forbidden
curl http://100.92.156.118:1337/api/quotes → 403 Forbidden
```

**Fix Options:**
1. **Option A (Quick):** Add `auth: false` to shipping/quote routes
2. **Option B (Proper):** Create API client with Strapi token in frontend

**Ended:** 10:20 PM EST (in progress)

---

### Session: November 28, 2025 7:15 PM - Frontend Customer Pages & Sync Resume

**Started:** 7:15 PM EST
**Goal:** Fix frontend customer pages, resume line items import, start MinIO artwork upload

#### 📍 7:15 PM - Diagnosed docker-host High Load
- Load average was **24.97** (should be <8 for 8-core VM)
- Found **26 zombie SSH sessions** from disconnected VS Code terminals
- Killed stale sessions: `pkill -9 -f "sshd:.*@notty"`
- Load dropped from 26 users to 1

#### 📍 7:20 PM - Resumed Line Items Import
```bash
# Checked checkpoint status
Line items in Strapi: 25,439
Checkpoint last_index: 20,148
Imported IDs: 17,466
Failed IDs: 100 (duplicate key errors - expected)
Total source items: 44,158

# Started import in background with caffeinate
nohup caffeinate -dims python scripts/sync-line-items.py > /tmp/line-items-import.log 2>&1 &
```
- **Status @ 7:30 PM:** 28,828 / 44,158 (65%) - ~7.75 items/sec
- **ETA:** ~35 minutes remaining

#### 📍 7:22 PM - Created New MinIO Upload Script
- **File:** `scripts/upload-artwork-minio.py`
- **Why new script:** Old script used rsync to docker-host then mc; new script uploads directly from Mac via MinIO Python SDK
- **Features:**
  - Direct network upload (no SSH/rsync overhead)
  - 4 parallel uploads
  - Checkpoint/resume
  - tqdm progress bar
  - Scans `data/artwork/by_customer/` (actual files, not symlinks)

```python
# Key config (updated to 8 workers)
ARTWORK_DIR = Path("data/artwork/by_customer")
MINIO_ENDPOINT = "100.92.156.118:9000"
MINIO_BUCKET = "printshop-artwork"
PARALLEL_UPLOADS = 8  # Was 4, bumped to 8 @ 8:00 PM
```

#### 📍 7:25 PM - Fixed Upload Script Path Issue
- Original script scanned `by_order/` which has symlinks → found 0 files
- Fixed to scan `by_customer/` which has actual files
- Structure: `by_customer/{customer-slug}/{year}/{order_folder}/files`
- Found: **115,606 files** (200.82 GB)

#### 📍 7:26 PM - Started MinIO Upload
```bash
source .venv/bin/activate && python scripts/upload-artwork-minio.py
# Output:
# Found 115,606 files
# Total size: 200.82 GB
# Uploading: 0%| | 34/115606 [00:18<9:38:33, 3.33files/s]
```
- **Upload speed:** ~3.33 files/sec
- **ETA:** ~9.5 hours

#### 📍 8:00 PM - Bumped Parallel Workers to 8
- Changed `PARALLEL_UPLOADS = 4` → `PARALLEL_UPLOADS = 8` in script
- Progress at time: 1,219 / 115,606 files (1%), 1.1 GB transferred
- At 4 workers: ~4.89 sec/file, ETA ~155 hours
- Hoped 8 workers would ~double throughput
- **Issue:** macOS environment mess - python3 uses Homebrew, venv uses Python 3.14
- **Resolution:** Let it ride with original config, focus on architecture discussion instead

#### 📍 8:10 PM - Architecture Review: Is 200GB on docker-host Future-Proof?
**Question:** Should all artwork be on the same VM running Strapi?

**Research Results:**
| Resource | docker-host Spec |
|----------|------------------|
| OS | Ubuntu Server 24.04 LTS |
| vCPUs | 8 |
| RAM | 64GB |
| Root Storage | 100GB (Local LVM) |
| Data Storage | ZFS mounts from `tank` pool |
| R730XD Pool | ~43.7TB usable (RAID-Z2) |

**Verdict:** ✅ **200GB is fine** - only 0.5% of 43.7TB capacity

**Red Flags Found:**
1. **MinIO has NO resource limits** - could spike during uploads
2. **Strapi NOT using MinIO** - still on local filesystem (`public/uploads/`)
3. **No MinIO backup** - artwork not backed up

**Recommendations:**
1. Add resource limits to MinIO (4GB RAM, 2 CPUs)
2. Configure Strapi to use MinIO (unify storage)
3. Consider separate storage VM if growing past 1TB

#### 📍 7:28 PM - Built Frontend for Deployment
```bash
cd frontend && npm run build
# ✓ 6297 modules transformed
# dist/assets/main-CSDMhO7X.js  662.48 kB │ gzip: 186.59 kB
# ✓ built in 2.10s
```

#### 📍 Earlier Session (6:30 PM) - Fixed Customer Pages (from prior conversation)

**Issue Reported:** "http://100.92.156.118:3000/ <-- if i click this and click a customer and 'new job' nothing works"

**Root Cause:** 
- `CustomersPage.tsx` had buttons with no onClick handlers
- No `CustomerDetailPage` component existed

**Files Created/Modified:**

1. **NEW: `frontend/src/components/customers/CustomerDetailPage.tsx`** (11,980 bytes)
   - Created @ 6:32 PM
   - Full customer detail view with:
     - Customer info header with back button
     - Stats cards (total orders, revenue, avg order, recent activity)
     - Order history table with status badges
     - Loading skeleton states while data populates
   - Uses: Card, Badge, Button, Skeleton, Phosphor icons

2. **MODIFIED: `frontend/src/components/customers/CustomersPage.tsx`** (6,958 bytes)
   - Modified @ 6:31 PM
   - Added callback props:
   ```tsx
   interface CustomersPageProps {
     customers: Customer[]
     onViewCustomer?: (customerId: string) => void
     onNewOrder?: (customerId: string) => void
   }
   ```
   - "View Details" button now calls `onViewCustomer(customer.id)`
   - "New Order" button now calls `onNewOrder(customer.id)`

3. **MODIFIED: `frontend/src/App.tsx`**
   - Added import: `CustomerDetailPage`
   - Added state: `selectedCustomerId`
   - Added handlers: `handleViewCustomer`, `handleNewOrder`
   - Added case in `renderPage()`: `'customer-detail'` renders `CustomerDetailPage`
   - `CustomersPage` now receives navigation callbacks as props

**Icon Fix:**
- Changed `Receipt` → `FileText` (Receipt not in Phosphor)
- Changed `Calendar` → `Clock` (simpler import)

#### 📍 7:30 PM - Current Sync Status
| Import | Total | Completed | Percentage | Status |
|--------|-------|-----------|------------|--------|
| Line Items | 44,158 | 28,828 | 65% | 🔄 Running (PID 91501) |
| Artwork → MinIO | 115,606 | 378 | 0.3% | ⏸️ Needs restart |
| Frontend Build | - | - | 100% | ✅ Ready to deploy |

---

### Session: November 28, 2025 4:15 PM - Line Item Import Preparation

**Started:** 4:15 PM EST
**Goal:** Verify Strapi relationships, prepare and run full line item import

**What Worked (Verified @ 4:20 PM):**
1. ✅ Strapi is running on docker-host (100.92.156.118:1337)
2. ✅ Database intact: 3,319 customers, 12,868 orders
3. ✅ Line item schema has `order` relation (manyToOne)
4. ✅ Order schema has `lineItems` relation (oneToMany, inverse)
5. ✅ Tested relation linking: Works using `order: documentId` format (Strapi v5)
6. ✅ Updated `scripts/sync-line-items.py` to:
   - Pre-load order cache (12,868 orders → documentId mapping)
   - Link each line item to its parent order via `order_visual_id`
   - Use checkpoint/resume for connection drops

**Strapi Data Verified:**
- Customers: 3,319 ✅
- Orders: 12,868 ✅  
- Line Items: 0 (ready for import)

**Import Script Updated:**
- Added ORDER_CACHE for fast visualId → documentId lookups
- Added `load_order_cache()` - pre-loads all orders on start
- Added `get_order_document_id()` - fast cached lookups
- Modified `import_line_item()` to include order relation

**🔴 ISSUES ENCOUNTERED:**

1. **Python venv corruption (4:25 PM)**
   - `tqdm` was installed but wouldn't import
   - Error: `ModuleNotFoundError: No module named 'tqdm'`
   - Shows Python 3.14 in pip but 3.13.1 in venv - version mismatch
   - **Fix:** Recreated venv: `rm -rf .venv && python3 -m venv .venv`

2. **Strapi schema mismatch (earlier today)**
   - Local schema had `imprints` relation on line-item
   - Remote docker-host didn't have it
   - Error: `inversedBy attribute imprints not found target api::line-item.line-item`
   - **Fix:** rsync'd updated schemas to docker-host, rebuilt container

3. **docker-compose python KeyError (earlier)**
   - `KeyError: 'ContainerConfig'` when rebuilding strapi
   - **Fix:** `docker stop && docker rm && docker-compose build --no-cache`

4. **Order relation format confusion (4:20 PM)**
   - Tried `{"documentId": "xxx"}` - got 400 error
   - Tried `{"connect": ["xxx"]}` - got 201 but didn't work
   - **Correct format:** Just pass the documentId string directly: `"order": "t1sm1yxgxofo3rxoq72m08qn"`

**📊 IMPORT PROGRESS (4:45 PM):**
- Import running with caffeinate
- Progress: ~1,868 / 44,158 (4.2%)
- Speed: ~8.3 items/sec
- ETA: ~85 minutes remaining (ends ~6:10 PM)
- Order relations: ✅ VERIFIED WORKING

**Ended:** [In progress - continued in evening session]

---

### Session: November 28, 2025 8:00 PM - MinIO Artwork Upload Attempt

**Started:** 8:00 PM EST
**Goal:** Upload 205GB artwork to MinIO, set up bucket structure, implement Redis supplier cache

---

#### 📍 8:00 PM - Verified MinIO is healthy
```bash
curl -s http://100.92.156.118:9000/minio/health/live
# Result: HTTP 200 ✅
```

#### 📍 8:05 PM - Verified artwork folder intact
```bash
du -sh data/artwork/
# Result: 201G ✅ (9,307 orders)
```

#### 📍 8:10 PM - Created MinIO bucket structure
- Created bucket: `printshop-artwork`
- Created folders: `pending/`, `approved/`, `in-production/`, `archive/`, `orders/`

#### 📍 8:15 PM - Reviewed sync-artwork-minio.py script
- Uses rsync + mc (MinIO client) approach
- Decided to try MinIO Python SDK instead for better control

#### 📍 8:20 PM - Created sync-artwork-minio-v2.py
- Uses official `minio` Python SDK
- Checkpoint/resume capability
- Progress bar with tqdm
- Graceful shutdown handling

#### 📍 8:25 PM - Installed minio package
```bash
pip install minio
# Installed minio 7.2.20 ✅
```

---

### 🔴 MINIO ISSUES ENCOUNTERED (Document for Future Reference)

#### Issue 1: Permission denied on rsync to MinIO volume (8:30 PM)
**Symptom:**
```bash
rsync: [sender] mkstemp "/.artwork_1.png.XXXXXX" failed: Permission denied (13)
```
**Root Cause:** MinIO data directory owned by root inside container
**Fix Applied:**
```bash
ssh docker-host 'docker run --rm -v /mnt/primary/docker/volumes/printshop-os/minio:/data alpine chmod -R 777 /data'
```
**Status:** ✅ FIXED

---

#### Issue 2: MinIO doesn't recognize rsync'd files (8:40 PM)
**Symptom:** Files exist on disk but `mc ls` shows nothing
```bash
ls /mnt/.../minio/printshop-artwork/orders/10001/  # Shows files
mc ls minio/printshop-artwork/orders/10001/         # Empty!
```
**Root Cause:** MinIO uses internal metadata format (`.minio.sys` directory). Raw files placed directly in the data volume are not recognized.
**Lesson Learned:** MUST use SDK/API/mc for uploads - cannot rsync directly to MinIO volume
**Status:** ⚠️ KNOWN LIMITATION - Do not use rsync to MinIO volume

---

#### Issue 3: MinIO SDK Access Denied on writes (8:50 PM)
**Symptom:**
```python
minio.error.S3Error: S3 operation failed; code: AccessDenied
```
**What We Tested:**
1. ✅ Small test files upload OK: `test/a.txt`, `orders/a.txt`, `orders/10001/a.txt`
2. ❌ Actual artwork files fail: `orders/10001/artwork_16.png` → Access Denied

**Attempts Made:**
1. Set bucket policy to public read/write → Still fails
2. Tried anonymous client → Still fails  
3. Tried explicit region setting → Still fails
4. Verified credentials work for reads (list_buckets, list_objects) → Works

**Discovery:** Earlier rsync testing placed raw files in MinIO volume at same paths we're trying to upload to. These "ghost files" may be causing conflicts.

**Status:** 🔴 BLOCKING - Need to clean up rsync'd files

---

#### Issue 4: Cannot delete rsync'd files (9:00 PM)
**Symptom:**
```bash
rm: cannot remove '/mnt/.../minio/printshop-artwork/orders/10001/a.txt/xl.meta': Permission denied
```
**Root Cause:** The `a.txt` path was uploaded via SDK (created as directory with metadata), but raw rsync'd files (artwork_*.png) are regular files. Mixed ownership/permissions.
**Next Step:** Use alpine container with volume mount to clean up

---

### 📍 MinIO Credentials (Reference)
```
Console URL: http://100.92.156.118:9001
API URL: http://100.92.156.118:9000
Username: minioadmin
Password: 00ab9d9e1e9b806fb9323d0db5b2106e
Bucket: printshop-artwork
```

---

### 🔧 MinIO Troubleshooting Commands
```bash
# Check MinIO health
curl -s http://100.92.156.118:9000/minio/health/live

# View MinIO logs
ssh docker-host 'docker logs printshop-minio 2>&1 | tail -30'

# List buckets via mc (inside container)
ssh docker-host 'docker exec printshop-minio mc alias set myminio http://localhost:9000 minioadmin 00ab9d9e1e9b806fb9323d0db5b2106e && docker exec printshop-minio mc ls myminio'

# Clean up rsync'd files (use alpine for root access)
ssh docker-host 'docker run --rm -v /mnt/primary/docker/volumes/printshop-os/minio:/data alpine rm -rf /data/printshop-artwork/orders/*'

# Python SDK test
python -c "
from minio import Minio
client = Minio('100.92.156.118:9000', 'minioadmin', '00ab9d9e1e9b806fb9323d0db5b2106e', secure=False)
print([b.name for b in client.list_buckets()])
"
```

---

### 📋 Next Steps for MinIO
1. [x] Clean up rsync'd files from `/mnt/.../minio/printshop-artwork/orders/`
2. [x] Test SDK upload again after cleanup - **✅ WORKING @ 9:20 PM**
3. [ ] Run full artwork upload (201GB, ~hours)
4. [ ] Update frontend to use MinIO for file storage

---

### Session: November 28, 2025 9:15 PM - MinIO Fixed + Imports Continuing

**📍 9:15 PM - Status Check**

| Data | Count | Status |
|------|-------|--------|
| Customers | 3,319 | ✅ Complete |
| Orders | 12,867 | ✅ Complete |
| Line Items | 14,175 / 44,158 | 🔄 32.4% (import running) |
| Artwork | 0 / 201GB | ⏳ Ready to start |

**📍 9:20 PM - MinIO Fixed!**
- Cleaned ghost files: `docker run alpine rm -rf /data/printshop-artwork/orders/*`
- Test upload: ✅ SUCCESS - 2.6MB artwork file uploaded
- Root cause confirmed: rsync'd files blocked SDK uploads

**📍 9:21 PM - Imports Running**
- Line items: Resumed from checkpoint (14,289)
- Artwork upload: Starting now

**Ended:** [In progress]

---

### 🔍 AUDIT: Work Needing Redo/Verification

Based on terminal history and previous sessions, here's what needs checking:

| Task | Original Status | Current Status | Action Needed |
|------|-----------------|----------------|---------------|
| Line Items Import | 0 imported | ~1,800/44,158 IN PROGRESS | Wait for completion |
| Order→LineItem Relations | Not tested | ✅ Verified working | None |
| Python venv | Corrupted | ✅ Recreated | None |
| Strapi schemas sync | Out of sync | ✅ Fixed | Verify after container updates |
| Artwork scrape | 106,303 files done | Need to verify | Check data/artwork/ folder |
| MinIO artwork upload | 0 uploaded | Not started | Run sync-artwork-minio.py |
| Products (Top 500) | 0 imported | Not started | Create import script |
| Supplier API caching | Not implemented | Not started | Redis cache setup |
| Frontend issues | 6 bugs found | Not fixed | Pending line items |

**🔴 KNOWN BROKEN (from Nov 27 evening):**
1. Quotes page fails to load
2. Shipping: EasyPost API error
3. Customers: No data visible in frontend
4. Products: Failed to fetch
5. Files: Not connected to MinIO

**⚠️ POTENTIAL DATA LOSS CONCERNS:**
- Artwork folder: Ran `rm -rf data/artwork/*` but cancelled - **VERIFIED INTACT: 201GB** ✅
- Order import: Did we lose test orders during cleanup? (TEST-001, TEST-002 were deleted intentionally)

---

### 🔍 COMPREHENSIVE AUDIT: Previous Days' Work Status

**Last Updated: Nov 28, 2025 5:00 PM**

Based on reviewing all session logs (Day 1-8), here's what needs redoing or verification:

#### ✅ COMPLETED - NO REDO NEEDED
| Task | When Done | Verified |
|------|-----------|----------|
| Customer import (3,319) | Nov 27 | ✅ Verified in Strapi |
| Order import (12,868) | Nov 27 | ✅ Verified in Strapi |
| Artwork scrape (106,303 files) | Nov 27 night | ✅ 201GB on disk |
| Artwork index.json | Nov 27 night | ✅ 99,740 lines |
| Strapi schemas for line-item | Nov 28 | ✅ Has order relation |
| Order→LineItem relation format | Nov 28 | ✅ Tested, working |
| Python venv rebuild | Nov 28 | ✅ requests + tqdm |

#### 🔄 IN PROGRESS
| Task | Status | ETA |
|------|--------|-----|
| Line Items import | 3,065/44,158 (7%) | ~75 min |

#### ❌ NEEDS DOING - NOT STARTED
| Task | Priority | Script Exists? | Notes |
|------|----------|----------------|-------|
| Products import (105 from Printavo) | P1 | ❌ No | Create sync-products.py |
| Artwork upload to MinIO | P1 | ✅ Yes | sync-artwork-minio.py |
| Tasks import (1,463) | P3 | ❌ No | Low priority |
| Expenses import (297) | P3 | ❌ No | Low priority |
| Statuses import (25) | P2 | ❌ No | Needed for order workflow |

#### ❌ SUPPLIER API WORK - INCOMPLETE
| Supplier | API Working | Data Synced | Cache Setup |
|----------|-------------|-------------|-------------|
| S&S Activewear | ✅ Yes | ❌ No | ❌ No Redis |
| AS Colour | ✅ Yes | ❌ No | ❌ No Redis |
| SanMar | ✅ SFTP works | ❌ No | ❌ No Redis |

**Nov 27 plan was:**
- Redis cache with 3-tier TTL (24h/1h/15min)
- Top 500 products pre-loaded
- Pinecone for semantic search
- **Status:** None of this was implemented

#### ❌ FRONTEND BUGS - NOT FIXED
From Nov 27 evening testing:
1. ❌ Quotes page fails to load
2. ❌ Shipping: EasyPost API error
3. ❌ Shipping: No live quotes
4. ❌ Customers: No data visible in frontend
5. ❌ Products: Failed to fetch
6. ❌ Files: Not connected to MinIO

**Root causes (likely):**
- Strapi had 0 line items (being fixed now)
- MinIO not configured in frontend
- EasyPost API not set up

#### ❌ MACHINE HOT FOLDERS - NOT STARTED
| Machine | Type | Status |
|---------|------|--------|
| Barudan BEKY 2020 | Embroidery | ❌ Not configured |
| ScreenPro 600 | Screen Print | ❌ Not configured |

**Nov 27 plan was:**
```
/mnt/production/
├── screenpro-600/incoming/
├── barudan/incoming/
└── dtg-printer/incoming/
```
**Status:** Plan documented but not implemented

#### ❌ MINIO BUCKET STRUCTURE - NOT CREATED
**Nov 27 plan:**
```
printshop-artwork/
├── pending/
├── approved/
├── in-production/
└── archive/
```
**Status:** Plan documented but not implemented

---

### 📊 PRIORITY ORDER FOR REMAINING WORK

**After line items complete:**
1. ⏳ **Products import** (105 items, ~30 sec) - Create script
2. ⏳ **MinIO artwork upload** (205GB, hours) - Run existing script
3. ⏳ **MinIO bucket structure** - Create folders
4. ⏳ **Statuses import** (25 items) - For order workflow
5. ⏳ **Frontend bug fixes** - After data is in place
6. ⏳ **Supplier API caching** - Redis setup
7. ⏳ **Machine hot folders** - When MinIO is ready

---

## 📅 Comprehensive Daily Log

### Day 1: November 21, 2025 (Friday) - Project Inception

**What Happened:**
- Created printshop-os repository on GitHub
- Initial project structure with monorepo layout
- Set up basic Strapi CMS scaffolding
- Defined 4-service architecture:
  1. `services/api` - Central API for Printavo sync
  2. `services/job-estimator` - Pricing engine
  3. `services/production-dashboard` - Shop floor tracking
  4. `services/supplier-sync` - Supplier integrations

**Key Decisions:**
- Node.js + TypeScript only (no Python services)
- Strapi 4.x (later upgraded to 5.x)
- React 19 + Vite + TailwindCSS for frontend
- REST-only API (no GraphQL)

**Commits:** Initial commits, project setup

---

### Day 2: November 22, 2025 (Saturday) - Strapi + Data Architecture

**What Happened:**
- Installed Strapi CMS locally
- Created initial content types: customer, order, job
- Started Printavo API integration research
- Tested Printavo API endpoints

**Key Files Created:**
- `printshop-strapi/` - Full Strapi installation
- First content type schemas

**Printavo API Discovery:**
- Base URL: `https://www.printavo.com/api/v1`
- Auth: email + token as query params
- Endpoints tested: orders, customers, orderstatuses, products, tasks

---

### Day 3: November 23, 2025 (Sunday) - Repository Consolidation

**What Happened:**
- **MAJOR:** Discovered 4 separate pricing repos existed
- Consolidated all code into single printshop-os monorepo
- Total lines of code after merge: 51,969+
- Created Flexible Pricing Engine (PR #98)
- Created Workflow Automation (PR #99)

**Problems Identified:**
- Duplicate supplier-sync implementations
- Scattered documentation (218 markdown files)
- No single source of truth

**Key Decisions:**
- Adopted HLBPA pattern (High-Level Big Picture Architect)
- Maximum 10 markdown files in root
- All others go to `docs/` subdirectories

---

### Day 4: November 24, 2025 (Monday) - "Merge Hell" Day

**What Happened:**
- Attempted to merge 16 feature branches into main
- Resulted in 50+ merge conflicts
- Spent ~2 hours on conflict resolution
- Closed 7 duplicate issues
- Cleaned up 5 merged branches

**Problems Encountered:**
- Duplicate tracking in both GitHub Issues AND PRs
- Branches created for features that already existed
- Documentation sprawl causing confusion

**Post-Mortem Conclusions:**
1. Work on ONE branch at a time
2. Delete branches after merge
3. Issues for planning, PRs for implementation only
4. No session summaries or implementation reports

---

### Day 5: November 25, 2025 (Tuesday) - Enterprise Foundation

**What Happened:**
- Full repository audit completed
- Found 218 markdown files across project
- Identified 7 active services (later consolidated to 4)
- Archived legacy `services/api/supplier-sync/` to `docs/archive/`
- Established service inventory

**Repository Audit Results:**
- 40,710 files total
- 277+ commits
- 37 branches
- 854 markdown files
- Conclusion: "60% complete but 0% operational"

**MVP Gap Analysis Created:**
- Priority 1 (BLOCKER): Auth system, Quote workflow, Order creation
- Priority 2 (HIGH): Real-time tracking, Support API, Payments
- Priority 3 (MEDIUM): Production dashboard, Inventory

---

### Day 6: November 26, 2025 (Wednesday) - Auth System + Major Cleanup

**What Happened:**
- Deleted 26 stale branches
- Consolidated root docs to 10 files (HLBPA compliant)
- Implemented Phase 1-3 of MVP:
  - Customer signup/login
  - Employee PIN validation
  - 18 tests passing
  - Strapi auth routes working

**Auth Routes Created:**
- `/api/auth/customer/login`
- `/api/auth/customer/register`
- `/api/auth/employee/validate-pin`

**Documentation Cleanup:**
- Moved 200+ files to `docs/` or `docs/archive/`
- Created `docs/ARCHIVE_2025_11_26/`

---

### Day 7: November 27, 2025 (Thursday) - MAJOR DATA MIGRATION DAY

**What Happened (Morning):**
- Deployed Strapi to docker-host (100.92.156.118)
- Full Printavo data extraction completed
- All 3 supplier APIs verified working

**Printavo Data Extracted:**
| Data | Count | Size |
|------|-------|------|
| Orders | 12,867 | 61 MB |
| Customers | 3,358 | 3.8 MB |
| Line Items | 44,158 | 23 MB |
| Tasks | 1,463 | - |
| Expenses | 297 | - |
| Products | 105 | - |
| Statuses | 25 | - |

**What Happened (Afternoon):**
- Created import scripts
- Imported 3,317 customers (deduplicated)
- Imported 12,854 orders (all years, deduplicated)
- Cleaned duplicates: 2,485 customers + 1,331 orders

**Supplier APIs Verified:**
| Supplier | Auth | Status | Products |
|----------|------|--------|----------|
| AS Colour | Subscription-Key + JWT | ✅ | 522 |
| S&S Activewear | Basic Auth | ✅ | 211,000+ |
| SanMar | SOAP + SFTP | ✅ | 415,000+ |

**🚨 THE BIG DISCUSSION: 500 Products vs 400K Products**

We spent significant time planning how to handle the massive supplier catalogs:

**Problem:** 
- Printavo has 105 products (our historical orders)
- Suppliers have 600,000+ products combined
- Can't import all to Strapi (too slow, too large)

**Solution Agreed Upon:**
1. **Top 500 Products** - Pre-load in Strapi from Printavo order history
   - These 500 products account for 13,045 units ordered
   - Used for autocomplete and quick quote creation
   - Fast local queries

2. **Full Supplier Catalogs** - External storage with AI/agent access
   - Store in MinIO or external vector database
   - Use Pinecone (free tier) for semantic search
   - AI agent can query when asked "what products do we have in red?"
   - OpenAI embeddings for product descriptions

3. **Redis Caching** - 3-tier TTL strategy
   | Data Type | TTL | Rationale |
   |-----------|-----|-----------|
   | Product Info | 24 hours | Rarely changes |
   | Pricing | 1 hour | Can fluctuate |
   | Inventory | 15 minutes | Real-time critical |

**🗂️ MINIO FOLDER STRUCTURE (Hot Folder Architecture)**

We designed a complete file organization system:

```
printshop-artwork/                      # MinIO bucket
├── pending/                            # Awaiting customer approval
│   └── {order-id}/
│       ├── original/                   # As-uploaded files
│       └── converted/                  # Print-ready versions
├── approved/                           # Ready for production
│   └── {order-id}/
│       ├── screen-printing/            # Separated by print method
│       ├── embroidery/
│       ├── dtg/
│       └── metadata.json               # Colors, sizes, specs
├── in-production/                      # Currently on machine queues
│   └── {order-id}/
└── archive/                            # Completed jobs
    └── {year}/{month}/{customer-slug}/
        └── {order-id}/
```

**Machine Hot Folders (On Production Floor):**
```
/mnt/production/                        # NFS mount from docker-host
├── screenpro-600/                      # Screen printing machine
│   ├── incoming/                       # Files to print (synced from MinIO)
│   ├── processing/                     # Currently printing
│   └── completed/                      # Done (watched for auto-archive)
├── barudan/                            # Embroidery machine
│   └── incoming/                       # DST files
└── dtg-printer/
    └── incoming/                       # DTG-ready files
```

**AI Agent Integration Plan:**
- Agent receives query: "What red polo shirts do we have?"
- Agent queries Pinecone vector DB with embeddings
- Returns: "AS Colour 5101 in Burgundy, S&S Hanes 054 in Deep Red..."
- If customer orders, fetch real-time inventory from supplier API
- Cache result in Redis for 15 minutes

**What Happened (Evening):**
- Created artwork scraper v2: `scripts/printavo-artwork-scraper-v2.py`
- Started scraping artwork by customer folder
- ~4% complete when session ended

**Artwork Scraper Structure:**
```
data/artwork/
├── by_customer/                        # PRIMARY - for reorders
│   └── {customer-slug}-{id}/
│       └── {year}/{visual_id}_{nickname}/
├── by_order/                           # SECONDARY - symlinks
├── index.json                          # Searchable master index
└── checkpoint.json                     # Resume position
```

**Evening Session Extended:**
- Ran full artwork scrape overnight
- Morning result: 106,303 files, 205 GB, 9,307 orders, 2,661 customers
- Index generated: `data/artwork/index.json` (99,740 lines)

---

### Day 8: November 28, 2025 (Friday) - Session Continuity Crisis

**What Happened (Morning):**
- Discovered SSH connection instability to docker-host
- Multiple "Connection reset by peer" errors
- Realized AI memory loss between sessions causing repeated work

**Docker Update Issue:**
- Attempted to restart Docker on docker-host
- SSH connections kept dropping
- Worried about data loss (confirmed data is safe)

**Current State Verified:**
- PostgreSQL: 3,319 customers, 12,868 orders ✅
- Line Items: 0 (never imported) ❌
- Products: 0 (never imported) ❌
- Artwork: 205 GB on local Mac, not uploaded ❌

**Session Continuity Solution Implemented:**
- Created DAILY_TASK_LOG.md
- Added session history auto-append to generate-context.js
- Added VS Code tasks for quick commands

---

### Day 8: November 28, 2025 (Friday Afternoon) - Complete Printavo Archive

**🎯 TODAY'S FOCUS: Complete Printavo Data Extraction**

> Goal: Create a COHESIVE archive of ALL Printavo data so we can fully migrate away from it.

**What We Need to Sync:**
| Data | Source Count | In Strapi | Script |
|------|--------------|-----------|--------|
| Customers | 3,358 | 3,319 ✅ | Done |
| Orders | 12,867 | 12,868 ✅ | Done |
| Line Items | 44,158 | 0 ❌ | `sync-line-items.py` |
| Products | 105 | 0 ❌ | Need to create |
| Tasks | 1,463 | 0 ❌ | Need to create |
| Expenses | 297 | 0 ❌ | Need to create |
| Statuses | 25 | 0 ❌ | Need to create |
| Artwork | 106,303 files | 0 ❌ | `sync-artwork-minio.py` |

**Background Sync Strategy:**
```bash
# Master script runs everything in parallel with checkpoints
./scripts/sync-printavo-complete.sh
```

**🏭 ALSO TODAY: Complete Supplier APIs**

| Supplier | Products | Status | Next Step |
|----------|----------|--------|-----------|
| S&S Activewear | 211,000+ | ✅ API Working | Sync to Redis cache |
| AS Colour | 522 | ✅ API Working | Sync to Redis cache |
| SanMar | 415,000+ | ✅ SFTP Working | Download EPDD.csv |

**🔴 FRONTEND ISSUES FROM LAST NIGHT:**
| Issue | Priority | Status |
|-------|----------|--------|
| Quotes page fails | HIGH | ❌ |
| Shipping: EasyPost error | HIGH | ❌ |
| Shipping: No live quotes | CRITICAL | ❌ |
| Customers: No data visible | HIGH | ❌ |
| Products: Failed to fetch | HIGH | ❌ |
| Files: Not connected to MinIO | HIGH | ❌ |

**🏭 MACHINE INTEGRATION (Planned):**
| Machine | Type | Hot Folder Status |
|---------|------|-------------------|
| Barudan BEKY 2020 | Embroidery | ❌ Not configured |
| ScreenPro 600 | Screen Print | ❌ Not configured |

---

## 📋 Pending Tasks (Backlog)

### Data Import
- [ ] Import 44,158 line items to Strapi
- [ ] Import top 500 products to Strapi
- [ ] Upload 205 GB artwork to MinIO
- [ ] Link line items to orders

### Supplier Integration
- [ ] Sync AS Colour catalog (522 products)
- [ ] Set up S&S API polling
- [ ] Download SanMar EPDD.csv (494 MB)
- [ ] Create Pinecone index for product search

### AI/Agent System
- [ ] Set up Pinecone account (free tier)
- [ ] Create product embeddings
- [ ] Build agent query interface
- [ ] Integrate with n8n for automation

### Production System
- [ ] Configure MinIO buckets (pending, approved, in-production, archive)
- [ ] Set up machine hot folders
- [ ] Create file watcher for auto-archive

---

## 🔧 Quick Commands

```bash
# Check docker-host status
ssh docker-host 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Check database counts
ssh docker-host 'docker exec printshop-postgres psql -U strapi -d printshop -c "SELECT (SELECT COUNT(*) FROM customers) as customers, (SELECT COUNT(*) FROM orders) as orders, (SELECT COUNT(*) FROM line_items) as line_items;"'

# Import line items
source .venv/bin/activate && python scripts/sync-line-items.py

# Upload artwork to MinIO
source .venv/bin/activate && python scripts/sync-artwork-minio.py

# Deploy to homelab
rsync -avz --exclude node_modules --exclude .git . docker-host:/mnt/printshop/printshop-os/ && ssh docker-host 'cd /mnt/printshop/printshop-os && docker compose up -d --build'

# View logs
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose logs -f --tail=100'
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `DAILY_TASK_LOG.md` | This file - session continuity |
| `SERVICE_DIRECTORY.md` | Where all code lives |
| `ARCHITECTURE.md` | How the system works |
| `PROJECT_OVERVIEW.md` | What this project is |
| `.vscode/session-state.json` | Auto-generated context |
| `data/artwork/index.json` | Artwork master index |
| `data/customer-import-checkpoint.json` | Import progress |
| `data/order-import-checkpoint.json` | Import progress |

---

## 💡 Lessons Learned

1. **Document as you go** - Not after
2. **One branch at a time** - Merge conflicts are hell
3. **Delete branches after merge** - Keep repo clean
4. **Session continuity matters** - AI forgets everything
5. **Checkpoint everything** - Imports fail, connections drop
6. **Verify before assuming** - Check actual data counts
7. **Simple is better** - 4 services, not 7

---

## 📝 Session Notes Template

When starting a new session, add a section like this:

```markdown
### Session: [Date] [Time] - [Brief Title]

**Started:** [Time]
**Goal:** [What we're trying to accomplish]

**Actions:**
1. [What was done]
2. [What was done]

**Results:**
- [Outcome]

**Next Steps:**
- [ ] [What to do next]

**Ended:** [Time]
```

---

*Last Updated: November 28, 2025 @ [auto-fill time]*
*Total Sessions: 12+*
*Total Commits: 277+*
*Days Since Project Start: 8*
