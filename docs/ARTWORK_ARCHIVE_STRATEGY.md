# Artwork Archive Strategy

> **Purpose:** Long-term artwork storage for customer reorders  
> **Primary Use:** Admin lookup when customer reorders (even years later)  
> **NOT for:** Production floor daily operations (Appsmith)

---

## Storage Structure

### Physical Layout (on disk)

```
data/artwork/
├── by_customer/                    # PRIMARY INDEX - for customer reorders
│   ├── acme-corporation-8479753/   # {slug}-{printavo_customer_id}
│   │   ├── 2019/
│   │   │   ├── 13245_softball-tournament/
│   │   │   │   ├── front-logo.png
│   │   │   │   ├── back-design.png
│   │   │   │   └── order.json
│   │   │   └── 13301_team-hoodies/
│   │   ├── 2020/
│   │   ├── 2023/
│   │   └── customer.json           # Customer metadata
│   │
│   └── first-baptist-church-9123456/
│       └── ...
│
├── by_order/                       # SECONDARY INDEX - direct order lookup
│   ├── 13245/
│   │   └── → symlink to by_customer/.../13245_softball-tournament/
│   └── 13301/
│       └── → symlink to by_customer/.../13301_team-hoodies/
│
└── index.json                      # Master searchable index
```

### Why This Structure?

| Lookup Type | Use Case | How to Find |
|-------------|----------|-------------|
| **By Customer** | "ABC Corp wants to reorder" | Browse `by_customer/abc-corp/` |
| **By Order #** | "Pull artwork for order 13245" | Direct to `by_order/13245/` |
| **By Year** | "What did we do for them in 2021?" | `by_customer/abc-corp/2021/` |
| **Search** | "Find all softball designs" | Query `index.json` |

---

## Folder Naming Convention

### Customer Folders
```
{company-slug}-{printavo_id}/
```
- `acme-corporation-8479753/`
- `first-baptist-church-9123456/`
- `john-doe-7654321/` (if no company name)

### Order Folders
```
{visual_id}_{order-nickname-slug}/
```
- `13245_softball-tournament/`
- `13301_team-hoodies/`
- `13456_rush-order/` (if no nickname)

---

## Index Structure

### `index.json` - Searchable Master Index
```json
{
  "generated_at": "2025-11-27T19:30:00Z",
  "total_customers": 2847,
  "total_orders": 10234,
  "total_files": 45678,
  "total_size_gb": 12.3,
  
  "customers": {
    "8479753": {
      "name": "Acme Corporation",
      "slug": "acme-corporation",
      "order_count": 47,
      "latest_order": "2025-11-15",
      "path": "by_customer/acme-corporation-8479753"
    }
  },
  
  "orders": {
    "13245": {
      "visual_id": 13245,
      "customer_id": "8479753",
      "nickname": "Softball Tournament",
      "date": "2019-03-15",
      "file_count": 3,
      "path": "by_customer/acme-corporation-8479753/2019/13245_softball-tournament"
    }
  }
}
```

### Per-Order `order.json`
```json
{
  "order_id": 15234567,
  "visual_id": 13245,
  "customer_id": 8479753,
  "customer_name": "Acme Corporation",
  "nickname": "Softball Tournament",
  "created_at": "2019-03-15",
  "scraped_at": "2025-11-27T19:30:00Z",
  "files": [
    {
      "filename": "front-logo.png",
      "original_url": "https://cdn.filepicker.io/...",
      "size_bytes": 2957859,
      "type": "artwork"
    }
  ],
  "line_items": [
    {
      "style": "NL3600",
      "description": "Next Level Unisex Cotton Tee",
      "quantity": 48
    }
  ]
}
```

---

## UI Access Options

### Option 1: Simple File Browser (Recommended for Admin)

**MinIO + Web UI** - Already running on docker-host!

```
http://docker-host:9001  (MinIO Console)
```

Upload artwork to MinIO bucket organized by customer:
```
printshop-artwork/
  ├── acme-corporation/
  │   ├── 2019/
  │   └── 2023/
  └── ...
```

**Pros:** Already deployed, S3-compatible, web UI built-in  
**Cons:** Basic file browser, no search

### Option 2: Strapi Media Library (Future)

Link artwork to orders in Strapi:
- Add `artworkFiles` relation to Order content type
- Upload to Strapi media library
- Access via Strapi admin panel

**Pros:** Integrated with orders, searchable  
**Cons:** Large storage, needs setup

### Option 3: Dedicated Artwork Browser (Custom)

Build simple React app for artwork search:
- Search by customer name
- Filter by date range
- Preview images inline
- Download originals

**Pros:** Purpose-built for your workflow  
**Cons:** Development time

---

## Implementation Plan

### Phase 1: Enhanced Scraper (Now)
Modify scraper to organize by customer + year:
```python
# Output path:
# data/artwork/by_customer/{customer_slug}/YYYY/{visual_id}_{order_slug}/
```

### Phase 2: Symlink Index
Create order-based symlinks for quick lookup:
```bash
# After scraping, run:
python scripts/create-artwork-index.py
```

### Phase 3: MinIO Upload (Optional)
Sync to MinIO for web access:
```bash
mc mirror data/artwork/ minio/printshop-artwork/
```

### Phase 4: Strapi Integration (Future)
When ready, link artwork URLs to orders in Strapi.

---

## Relationship to Current Data

```
┌─────────────────────────────────────────────────────────────┐
│                    STRAPI (Primary DB)                       │
├─────────────────────────────────────────────────────────────┤
│  Customers ─────┬────── Orders ─────── Line Items           │
│  (3,317)        │       (12,854)       (44,158)             │
│                 │                                            │
│  Products ──────┘       ↓ visual_id                         │
│  (500)                  │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              ARTWORK ARCHIVE (File Storage)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  data/artwork/by_customer/{customer}/YYYY/{order}/          │
│       └── Linked via printavoId + visual_id                 │
│                                                              │
│  Lookup: customer.printavoId → folder path                  │
│          order.visualId → folder path                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### How to Find Artwork from Strapi:

1. **From Order:** `order.visualId` → `data/artwork/by_order/{visualId}/`
2. **From Customer:** `customer.printavoId` → `data/artwork/by_customer/*-{printavoId}/`

---

## Storage Estimates

| Orders | Artwork Rate | Avg Files | Avg Size | Total |
|--------|-------------|-----------|----------|-------|
| 12,867 | ~70% | 12 files | 1.7MB | ~100-150 GB |

**Test Results:** 8 orders = 57 files = 98.2 MB → ~150 GB estimated for full scrape

---

## Current Status (2025-11-27)

| Phase | Status | Notes |
|-------|--------|-------|
| ✅ Artwork Scraper v2 | **COMPLETE** | Customer-organized, dual-indexed |
| 🔄 Full Scrape | **IN PROGRESS** | Started ~19:30, ~7 hours to complete |
| ✅ MinIO Bucket | **READY** | `artwork-archive` bucket created |
| 🔄 MinIO Sync | **SCRIPT READY** | Run after scrape completes |

### Scripts Available

| Script | Purpose |
|--------|---------|
| `scripts/printavo-artwork-scraper-v2.py` | Enhanced scraper (running) |
| `scripts/sync-artwork-to-minio.sh` | Sync to MinIO |

---

## Recommended Next Steps

1. ✅ **Artwork scraper v2 works** - Customer-organized, dual-indexed
2. 🔄 **Full scrape running** - Started 2025-11-27 ~19:30
3. 🔄 **Monitor progress:** `tail -f data/artwork/scrape.log`
4. ⏳ **After scrape:** Run `scripts/sync-artwork-to-minio.sh`
5. ⏳ **Access:** Browse at http://docker-host:9001 (MinIO console)

---

## Commands

### Monitor Scrape Progress
```bash
tail -f data/artwork/scrape.log
cat data/artwork/checkpoint.json | jq '{processed: .last_order_index, total: 12867}'
```

### Sync to MinIO (after scrape completes)
```bash
./scripts/sync-artwork-to-minio.sh

# Or watch mode (syncs every 5 minutes)
./scripts/sync-artwork-to-minio.sh --watch
```

### Access Artwork
- **MinIO Web Console:** http://docker-host:9001
- **Direct S3 API:** http://docker-host:9000/artwork-archive/
- **Local:** `data/artwork/by_customer/` or `data/artwork/by_order/`

### Search Artwork
```bash
# Find customer artwork
ls data/artwork/by_customer/ | grep -i "acme"

# Find order artwork  
ls data/artwork/by_order/13245/

# Search index
cat data/artwork/index.json | jq '.customers | to_entries[] | select(.value.name | test("Acme"; "i"))'
```
