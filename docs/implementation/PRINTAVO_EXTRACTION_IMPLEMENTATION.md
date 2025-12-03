# Printavo Complete Extraction - Implementation Guide

> **Purpose**: Persistent memory for implementing Printavo data extraction  
> **Last Updated**: December 2025  
> **Status**: Implementation Ready

## Quick Reference

### Commands
```bash
# Full extraction pipeline
npm run printavo:full-archive

# Individual steps
npm run printavo:extract-complete
npm run printavo:download-files
npm run printavo:sync-minio
```

### Key Files
| File | Purpose |
|------|---------|
| services/api/scripts/extract-printavo-v2.ts | Main extraction (GraphQL) |
| scripts/printavo-extract-all.py | Complete extraction (API + files) |
| scripts/lib/printavo_scraper.py | Web scraping for artwork |
| scripts/lib/minio_uploader.py | MinIO upload utilities |
| services/api/lib/printavo-mapper.ts | TypeScript types |

---

## Phase 1: Infrastructure Setup

### 1.1 Verify VM Resources

**Target System**: `docker-host` @ 100.92.156.118

```bash
ssh docker-host
free -h          # Should show 32GB RAM
nproc            # Should show 8 cores
df -h /mnt       # Should show 500GB+ available
```

**Expected Output**:
```
              total        used        free      shared  buff/cache   available
Mem:            31Gi       2.3Gi        27Gi       8.0Mi       2.1Gi        29Gi
Swap:          2.0Gi          0B       2.0Gi
```

### 1.2 Deploy MinIO

```bash
cd ~/stacks/printshop-os
docker compose up -d minio

# Wait for MinIO to start
docker compose logs -f minio

# Verify MinIO is running
curl http://localhost:9000/minio/health/live
```

**Expected Response**: `200 OK`

### 1.3 Initialize MinIO Buckets

```bash
# Install MinIO client in container
docker exec printshop-minio mc alias set local http://localhost:9000 minioadmin your-secret-key

# Create printshop bucket
docker exec printshop-minio mc mb local/printshop

# Verify bucket exists
docker exec printshop-minio mc ls local/
```

### 1.4 Configure Environment Variables

**File**: `services/api/.env`

```bash
# Printavo API Authentication
PRINTAVO_EMAIL=ronny@mintprints.com
PRINTAVO_PASSWORD=your-password-here
PRINTAVO_TOKEN=your-api-token-here

# MinIO Configuration
MINIO_ENDPOINT=docker-host:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=printshop
MINIO_USE_SSL=false

# Rate Limiting (optional)
PRINTAVO_RATE_LIMIT_MS=500
```

**Verify Configuration**:
```bash
cd services/api
cat .env | grep -E "PRINTAVO|MINIO"
```

---

## Phase 2: Data Extraction (GraphQL API)

### 2.1 Run Complete Extraction

**Method 1**: TypeScript GraphQL Extraction
```bash
cd services/api
npm run printavo:extract
```

**Method 2**: Python Complete Extraction
```bash
cd /home/runner/work/printshop-os/printshop-os
python3 scripts/printavo-extract-all.py --orders-only
```

**Expected Duration**: 4-6 hours for ~12,867 orders

**Expected Output**:
```
📦 PRINTAVO API DATA EXTRACTION
=====================================
🏢 Fetching account info...
   ✓ Account info saved

📊 Fetching reference data...
   ✓ 48 order statuses
   ✓ 19 categories
   ✓ 4 users

📦 Fetching orders...
   Fetched: 100/12867
   Fetched: 200/12867
   ...
   Fetched: 12867/12867
   ✓ 12,867 orders extracted

👥 Fetching customers...
   ✓ 3,358 customers extracted

✅ Extraction complete!
```

### 2.2 Verify Extraction

```bash
# For TypeScript extraction
cd services/api
ls -lh data/printavo-export/v2/

# View summary
cat data/printavo-export/v2/*/summary.json | jq

# Expected output:
{
  "extractedAt": "2025-12-03T...",
  "duration": 14235.6,
  "counts": {
    "customers": 3358,
    "orders": 12867,
    "quotes": 0,
    "products": 0,
    "invoices": 0
  },
  "errors": []
}
```

### 2.3 Data Structure

```
data/printavo-export/v2/{timestamp}/
├── customers.json        # 3,358 customers with addresses & contacts
├── orders.json          # 12,867 orders with line items & tasks
├── quotes.json          # All quotes
├── products.json        # Product catalog
├── invoices.json        # Invoices with payments
└── summary.json         # Extraction metadata
```

---

## Phase 3: File Downloads (Artwork & Production Files)

### 3.1 Run Artwork Scraper

```bash
cd /home/runner/work/printshop-os/printshop-os
python3 scripts/printavo-extract-all.py --artwork-only
```

**Expected Duration**: 12-24 hours  
**Expected Size**: ~260GB total
- Artwork (PNG, JPG): ~115,000 files, ~200GB
- Production (DST, EPS, AI): ~10,000 files, ~50GB
- Documents (PDF): ~15,000 files, ~10GB

### 3.2 Monitor Progress

```bash
# Watch download progress
tail -f data/printavo-archive/artwork/download.log

# Check disk usage
watch -n 60 'du -sh data/printavo-archive/'

# View checkpoint
cat data/artwork-checkpoint.json | jq
```

### 3.3 Resume Interrupted Downloads

```bash
# The script automatically resumes from checkpoint
python3 scripts/printavo-extract-all.py --artwork-only --resume
```

### 3.4 File Storage Structure

```
data/printavo-archive/
├── exports/
│   └── {timestamp}/
│       ├── orders.json
│       ├── customers.json
│       └── summary.json
│
├── artwork/
│   └── by_customer/
│       └── {customer-slug}-{id}/
│           └── {year}/
│               └── {visual_id}_{order-slug}/
│                   ├── artwork_0.png
│                   ├── mockup_1.jpg
│                   ├── proof_2.pdf
│                   └── manifest.json
│
├── production-files/
│   └── by_order/
│       └── {visual_id}/
│           ├── front_logo.dst
│           ├── back_design.eps
│           └── manifest.json
│
└── index/
    ├── orders_index.json
    ├── customers_index.json
    └── artwork_index.json
```

---

## Phase 4: MinIO Sync

### 4.1 Upload to MinIO

```bash
cd /home/runner/work/printshop-os/printshop-os
python3 scripts/printavo-extract-all.py --sync-to-minio
```

**Expected Duration**: 2-4 hours

**Progress Indicators**:
```
📤 SYNCING TO MINIO
=====================================
Uploading: data/printavo-archive/exports/...
   ✓ Uploaded: orders.json (52.3 MB)
   ✓ Uploaded: customers.json (10.1 MB)

Uploading: data/printavo-archive/artwork/...
   Progress: 1,000/115,000 files (10.2 GB)
   Progress: 2,000/115,000 files (20.5 GB)
   ...
```

### 4.2 Verify Upload

```bash
# List MinIO contents
docker exec printshop-minio mc ls local/printshop/printavo-archive/

# Check bucket size
docker exec printshop-minio mc du local/printshop/printavo-archive/

# Expected output:
260.5 GB    printshop/printavo-archive/
```

### 4.3 MinIO Storage Structure

```
minio://printshop/printavo-archive/
├── exports/
│   └── 2025-12-03_14-30-00/
│       ├── orders.json
│       ├── customers.json
│       ├── line_items.json
│       ├── tasks.json
│       └── summary.json
│
├── artwork/
│   └── by_customer/
│       └── {customer-slug}/
│           └── {year}/
│               └── {order}/
│                   └── *.{png,jpg,pdf}
│
├── production-files/
│   └── by_order/
│       └── {visual_id}/
│           └── *.{dst,eps,ai,svg}
│
└── index/
    ├── orders_index.json
    ├── customers_index.json
    └── artwork_index.json
```

---

## Phase 5: Verification Checklist

### Before Canceling Printavo, Verify:

- [ ] **API Data Extraction**
  - [ ] orders.json contains 12,867+ records
  - [ ] customers.json contains 3,358+ records
  - [ ] All orders have line items
  - [ ] Customer relationships intact
  - [ ] Tasks and payments extracted

- [ ] **File Downloads**
  - [ ] Artwork files: ~115,000 files downloaded
  - [ ] Production files: ~10,000 files downloaded
  - [ ] PDFs: ~15,000 files downloaded
  - [ ] Total size: ~260GB

- [ ] **MinIO Upload**
  - [ ] All JSON files synced to MinIO
  - [ ] All artwork files synced to MinIO
  - [ ] Bucket size matches local size (~260GB)
  - [ ] Index files generated

- [ ] **Data Integrity**
  - [ ] Random spot check: Pick 5 orders
  - [ ] For each order, verify:
    - [ ] Order details match Printavo
    - [ ] Customer info correct
    - [ ] Line items present
    - [ ] Artwork files downloadable
    - [ ] Production files (if any) downloadable

- [ ] **Access Testing**
  - [ ] Can query orders via MinIO client
  - [ ] Can download artwork via presigned URLs
  - [ ] n8n can access MinIO data (if configured)

### Verification Script

```bash
#!/bin/bash
# verify-extraction.sh

echo "🔍 PRINTAVO EXTRACTION VERIFICATION"
echo "===================================="

# 1. Check JSON files
echo -e "\n📊 JSON Data:"
cat data/printavo-export/v2/*/summary.json | jq '.counts'

# 2. Check file counts
echo -e "\n📁 File Counts:"
find data/printavo-archive/artwork -type f | wc -l
find data/printavo-archive/production-files -type f | wc -l

# 3. Check disk usage
echo -e "\n💾 Disk Usage:"
du -sh data/printavo-archive/

# 4. Check MinIO
echo -e "\n☁️  MinIO Status:"
docker exec printshop-minio mc du local/printshop/printavo-archive/

# 5. Random order check
echo -e "\n🎲 Random Order Check:"
ORDER_ID=$(cat data/printavo-export/v2/*/orders.json | jq -r '.[0].id')
echo "Checking order: $ORDER_ID"
cat data/printavo-export/v2/*/orders.json | jq ".[] | select(.id==\"$ORDER_ID\")"
```

---

## Troubleshooting

### Extraction Fails with 401 Unauthorized

```bash
# Verify credentials
curl -X POST https://www.printavo.com/api/v2/auth \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ronny@mintprints.com\",\"password\":\"...\"}"

# Expected response:
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

**Solutions**:
- Verify PRINTAVO_EMAIL in .env
- Verify PRINTAVO_PASSWORD in .env
- Check if password has special characters (escape in .env)
- Try logging in manually at printavo.com

### Rate Limited (429 Too Many Requests)

**Symptoms**:
```
Error: Request failed with status code 429
Retrying in 5 seconds...
```

**Solutions**:
- Script automatically retries with backoff
- If persistent, increase rate limit delay:
  ```bash
  PRINTAVO_RATE_LIMIT_MS=1000 npm run printavo:extract
  ```
- Check Printavo rate limits: 10 req/5 sec = 120 req/min

### Disk Full During Download

```bash
# Check disk usage
df -h /mnt

# Free up space - clean old exports
rm -rf data/printavo-archive/exports/2025-11-*

# Or move to external storage
rsync -av data/printavo-archive/ /mnt/backup/printavo-archive/
```

### MinIO Connection Failed

```bash
# Verify MinIO is running
docker ps | grep minio

# Check MinIO logs
docker compose logs minio

# Test MinIO health
curl http://docker-host:9000/minio/health/live

# Restart MinIO
docker compose restart minio
```

### Artwork Scraper Hangs

**Symptoms**:
- Progress stops at specific order
- No error messages
- Checkpoint not updating

**Solutions**:
```bash
# 1. Check checkpoint file
cat data/artwork-checkpoint.json | jq

# 2. Kill and restart with resume
pkill -f printavo-extract-all.py
python3 scripts/printavo-extract-all.py --artwork-only --resume

# 3. Skip problematic order (if identified)
# Edit checkpoint file to skip past stuck order
```

### JSON Parse Error in Orders

**Error**:
```
JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

**Solutions**:
- File may be corrupted during download
- Re-run extraction (will overwrite)
- Check disk space wasn't full during extraction

---

## Performance Optimization

### Parallel Downloads

Edit `scripts/printavo-extract-all.py`:
```python
# Increase max workers (default: 5)
scraper = PrintavoScraper(
    max_workers=10  # Increase to 10 concurrent downloads
)
```

**Warning**: Higher concurrency may trigger rate limits.

### Rate Limiting

Adjust delays:
```python
# In scripts/lib/printavo_api.py
REQUEST_DELAY = 0.3  # Decrease from 0.6 (faster but riskier)

# In scripts/lib/printavo_scraper.py
DOWNLOAD_DELAY = 0.2  # Decrease from 0.5
```

### Checkpointing

Checkpoint saves every:
- 20 orders (API extraction)
- 100 files (artwork downloads)

To increase checkpoint frequency (slower but safer):
```python
# In scripts/printavo-extract-all.py
CHECKPOINT_INTERVAL = 10  # Save every 10 orders instead of 20
```

---

## Data Schema Reference

See: [PRINTAVO_V2_SCHEMA_REFERENCE.md](PRINTAVO_V2_SCHEMA_REFERENCE.md)

---

## n8n Integration

See: [N8N_PRINTAVO_WORKFLOWS.md](N8N_PRINTAVO_WORKFLOWS.md)

---

## MinIO Storage Guide

See: [MINIO_STORAGE_GUIDE.md](MINIO_STORAGE_GUIDE.md)

---

## Post-Extraction Steps

### 1. Backup to External Storage

```bash
# Create encrypted backup
tar czf - data/printavo-archive/ | \
  gpg --symmetric --cipher-algo AES256 \
  > printavo-backup-$(date +%Y%m%d).tar.gz.gpg

# Upload to cloud storage (optional)
aws s3 cp printavo-backup-*.tar.gz.gpg s3://your-backup-bucket/
```

### 2. Verify Data Integrity

```bash
# Generate checksums
find data/printavo-archive -type f -exec sha256sum {} \; > checksums.txt

# Verify against checksums later
sha256sum -c checksums.txt
```

### 3. Document Cancellation Date

```bash
# Record when Printavo was canceled
echo "Printavo subscription canceled: $(date)" > PRINTAVO_CANCELLATION.txt
echo "Last extraction: $(date)" >> PRINTAVO_CANCELLATION.txt
echo "Total orders: $(cat data/printavo-export/v2/*/summary.json | jq '.counts.orders')" >> PRINTAVO_CANCELLATION.txt
```

---

## Success Criteria

✅ **Extraction Successful When**:

1. All JSON files contain expected record counts
2. All artwork files downloaded (no 404s)
3. All data synced to MinIO
4. Random spot checks pass
5. Total size matches expected (~260GB)
6. Can query data from MinIO
7. Can regenerate Printavo reports from archived data

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Infrastructure Setup | 30 min | VM access, MinIO deployed |
| API Data Extraction | 4-6 hours | Printavo API credentials |
| File Downloads | 12-24 hours | Network speed, Printavo access |
| MinIO Sync | 2-4 hours | Local storage complete |
| Verification | 1-2 hours | All data present |
| **Total** | **20-36 hours** | End-to-end |

**Recommendation**: Start on Friday evening, verify Sunday afternoon, cancel Monday.

---

## Frequently Asked Questions

### Q: Can I pause and resume?
**A**: Yes! The script uses checkpoints. Just re-run with `--resume` flag.

### Q: What if my API token expires?
**A**: Regenerate token in Printavo, update `.env`, resume extraction.

### Q: How do I verify artwork files are complete?
**A**: Check `manifest.json` in each order directory. It lists expected vs downloaded files.

### Q: Can I extract only recent orders?
**A**: Yes, modify script to filter by date:
```python
# In scripts/printavo-extract-all.py
orders = [o for o in orders if o['created_at'] > '2024-01-01']
```

### Q: What if I need to re-extract later?
**A**: Keep credentials valid for 30 days after cancellation (Printavo policy). Re-run script with new timestamp.

---

<small>Generated by PrintShop OS | December 2025</small>
