# Printavo Complete Extraction System

> **Purpose:** Complete backup of all Printavo data before migration  
> **Last Updated:** December 3, 2025  
> **Status:** ✅ Ready for Use

---

## 🚀 Quick Links

**For Complete Implementation Guide, see:**  
📘 [**PRINTAVO_EXTRACTION_IMPLEMENTATION.md**](implementation/PRINTAVO_EXTRACTION_IMPLEMENTATION.md)

**Related Documentation:**
- 📖 [Printavo V2 Schema Reference](implementation/PRINTAVO_V2_SCHEMA_REFERENCE.md)
- 🗄️ [MinIO Storage Guide](implementation/MINIO_STORAGE_GUIDE.md)
- 🔄 [n8n Workflow Templates](implementation/N8N_PRINTAVO_WORKFLOWS.md)

---

## Overview

The Printavo Extraction System downloads EVERYTHING from Printavo and stores it in MinIO for permanent archival. This ensures a complete backup of all data before fully migrating away from Printavo.

### Two Approaches Available

**1. TypeScript/Node.js Approach (NEW - Recommended)**
- Located in `services/api/scripts/`
- Uses Printavo's v2 GraphQL API
- Integrated with the PrintShop OS API service
- Built-in checkpoint/resume support
- See [TypeScript Extraction](#typescript-extraction-new) section below

**2. Python Approach (Legacy)**
- Located in `scripts/`
- Uses web scraping for file downloads
- Standalone scripts
- See sections below for details

### Why This Exists

- Existing scrapers only get orders/customers, missing line items, imprints, artwork files
- Previous artwork scraper only downloaded PNGs, missing DST (embroidery), EPS, AI, PDF files
- No organized storage in MinIO
- Data was scattered across multiple export directories

### What Gets Extracted

| Data Type | Source | Count (Est.) | Priority |
|-----------|--------|--------------|----------|
| Orders | API | 12,867+ | Critical |
| Customers | API | 3,317+ | Critical |
| Line Items | API | 49,216+ | Critical |
| Tasks | API | 1,463+ | High |
| Payments | API | Variable | High |
| Expenses | API | 297+ | Medium |
| Artwork (PNG, JPG) | Web | ~115,000 files | High |
| Production (DST, EPS, AI) | Web | Variable | Critical |
| Documents (PDF) | Web | Variable | High |

---

## TypeScript Extraction (NEW)

### Quick Start

#### 1. Prerequisites

```bash
# Start MinIO service
cd /path/to/printshop-os
docker compose up -d minio

# Initialize MinIO buckets
./scripts/init-minio.sh

# Set environment variables in services/api/.env
PRINTAVO_EMAIL=your@email.com
PRINTAVO_PASSWORD=your_password
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=secure_password_change_this
MINIO_BUCKET=printshop
MINIO_USE_SSL=false
```

#### 2. Run Extraction

```bash
cd services/api

# Option 1: Run complete archive (extract + download + upload to MinIO)
npm run printavo:full-archive

# Option 2: Run each step separately
npm run printavo:extract           # Extract data via GraphQL API
npm run printavo:download-files    # Download artwork/production files
npm run printavo:sync-minio        # Upload everything to MinIO
```

#### 3. Access Results

- **MinIO Console**: http://localhost:9001
- **Local Files**: `services/api/data/printavo-export/v2/{timestamp}/`
- **MinIO Archive**: `s3://printshop/printavo-archive/`

### Features

✅ **GraphQL API Integration**
- Uses official Printavo v2 API
- Cursor-based pagination
- Rate limiting (500ms between requests)
- Automatic authentication

✅ **File Download System**
- Parallel downloads (configurable concurrency, default: 5)
- Checkpoint/resume support
- Progress reporting with ETA
- Organized by order: `files/{visualId}/artwork/`, `files/{visualId}/production/`, etc.

✅ **MinIO Integration**
- Automatic bucket creation
- Upload integrity verification
- Searchable index files
- Presigned URL generation for temporary access

### Storage Structure

```
minio://printshop/printavo-archive/
├── exports/{timestamp}/
│   ├── orders.json
│   ├── customers.json
│   ├── quotes.json
│   ├── products.json
│   ├── invoices.json
│   ├── files_manifest.json
│   └── summary.json
│
├── files/by_order/{visualId}/
│   ├── artwork/
│   │   ├── front_design.png
│   │   └── back_design.jpg
│   ├── production/
│   │   ├── front.dst
│   │   ├── back.eps
│   │   └── sleeve.ai
│   └── pdfs/
│       ├── invoice.pdf
│       ├── workorder.pdf
│       └── packing_slip.pdf
│
└── index/
    ├── archive_{timestamp}.json
    └── latest.json
```

---

## Python Extraction (Legacy)

### Prerequisites

```bash
# Install dependencies
pip install minio beautifulsoup4 requests

# Set environment variables
export PRINTAVO_EMAIL="ronny@mintprints.com"
export PRINTAVO_TOKEN="your_api_token"
export PRINTAVO_PASSWORD="your_web_password"
export MINIO_ENDPOINT="100.92.156.118:9000"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="your_secret_key"
```

### Basic Usage

```bash
# Full extraction (everything)
python scripts/printavo-extract-all.py

# Extract only API data (orders, customers, etc.)
python scripts/printavo-extract-all.py --orders-only

# Scrape only artwork files
python scripts/printavo-extract-all.py --artwork-only

# Resume interrupted extraction
python scripts/printavo-extract-all.py --resume

# Sync existing data to MinIO
python scripts/printavo-extract-all.py --sync-to-minio

# Dry run (show what would be downloaded)
python scripts/printavo-extract-all.py --dry-run

# Limit orders processed (for testing)
python scripts/printavo-extract-all.py --limit 100
```

---

## MinIO Storage Structure

```
minio://printshop/
└── printavo-archive/
    ├── exports/
    │   └── {timestamp}/
    │       ├── orders.json
    │       ├── customers.json
    │       ├── line_items.json
    │       ├── lineitemgroups.json
    │       ├── tasks.json
    │       ├── payments.json
    │       ├── expenses.json
    │       ├── products.json
    │       ├── users.json
    │       ├── order_statuses.json
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

## File Types

### Priority Levels

| Priority | Type | Extensions | Description |
|----------|------|------------|-------------|
| Critical | Embroidery | DST, PES, EXP | Machine-readable embroidery files |
| Critical | Orders | JSON | Complete order data with line items |
| High | Vector | AI, EPS, SVG | Scalable artwork for production |
| High | Documents | PDF | Proofs and approvals |
| High | Artwork | PNG, JPG | Print-ready raster images |
| Medium | Source | PSD, INDD | Editable source files |

### File Detection

The system automatically detects file types using:
1. URL path analysis
2. MIME type headers
3. Magic bytes (file signatures)
4. Filestack/Filepicker CDN patterns

---

## Architecture

### Components

```
scripts/
├── printavo-extract-all.py    # Main orchestrator
└── lib/
    ├── __init__.py
    ├── printavo_api.py        # Printavo REST API client
    ├── printavo_scraper.py    # Web scraper for artwork
    ├── minio_uploader.py      # MinIO upload utilities
    └── file_detector.py       # File type detection
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Printavo API   │────▶│  printavo_api.py │────▶│  exports/   │
│  (REST)         │     │  Rate limited    │     │  JSON files │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                                        │
┌─────────────────┐     ┌──────────────────┐            │
│  Printavo Web   │────▶│ printavo_scraper │────▶┌──────────────┐
│  (HTML)         │     │ Parallel DL      │     │   artwork/   │
└─────────────────┘     └──────────────────┘     │   by_customer│
                                                  └──────────────┘
                                                        │
                                                        ▼
                                                  ┌─────────────┐
                                                  │   MinIO     │
                                                  │  Uploader   │
                                                  └─────────────┘
                                                        │
                                                        ▼
                                                  ┌─────────────┐
                                                  │ printshop   │
                                                  │ bucket      │
                                                  └─────────────┘
```

---

## Features

### Resume Support

All extraction operations support resume from checkpoints:

```bash
# If extraction is interrupted, just run again
python scripts/printavo-extract-all.py --resume

# Checkpoints are saved every 20 orders
# Checkpoint files:
#   data/printavo-api-checkpoint.json
#   data/printavo-artwork-checkpoint.json
```

### Rate Limiting

- **API requests:** 600ms delay between requests (10 req/5 sec)
- **Web scraping:** 2 second delay between pages
- **File downloads:** 0.5 second delay between files
- **Parallel downloads:** Max 5 concurrent

### Error Handling

- Automatic retry with exponential backoff (3 attempts)
- Rate limit detection (429 responses)
- Connection recovery
- Partial data saving on errors

### Progress Reporting

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
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRINTAVO_EMAIL` | Printavo account email | Required |
| `PRINTAVO_TOKEN` | Printavo API token | Required |
| `PRINTAVO_PASSWORD` | Printavo web password | Required for artwork |
| `MINIO_ENDPOINT` | MinIO server:port | `100.92.156.118:9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | Required |
| `MINIO_BUCKET` | Target bucket | `printshop` |

### Command Line Options

| Option | Description |
|--------|-------------|
| `--orders-only` | Only extract API data |
| `--artwork-only` | Only scrape artwork |
| `--production-files-only` | Only scrape production files |
| `--resume` | Resume from checkpoint |
| `--sync-to-minio` | Sync to MinIO |
| `--dry-run` | Show what would be done |
| `--limit N` | Process only N orders |
| `--output-dir PATH` | Custom output directory |
| `--skip-details` | Skip order details (tasks, payments) |

---

## API Reference

### PrintavoAPI

```python
from scripts.lib import PrintavoAPI

api = PrintavoAPI(
    email="...",
    token="...",
    checkpoint_file=Path("checkpoint.json")
)

# Fetch all orders
orders = api.get_orders()

# Fetch with pagination callback
def on_page(data, current, total):
    print(f"Fetched {current}/{total}")

orders = api.fetch_paginated('orders', per_page=100, on_page=on_page)

# Fetch order details
details = api.extract_all_order_details(orders)
```

### PrintavoScraper

```python
from scripts.lib import PrintavoScraper

scraper = PrintavoScraper(
    email="...",
    password="...",
    output_dir=Path("data/artwork"),
    max_workers=5
)

# Login required for web scraping
scraper.login()

# Scrape artwork from orders
def on_progress(current, total, result):
    print(f"Order {current}/{total}: {result.get('files_found', 0)} files")

result = scraper.scrape_orders(orders, on_progress=on_progress)
```

### MinIOUploader

```python
from scripts.lib import MinIOUploader

uploader = MinIOUploader(
    endpoint="100.92.156.118:9000",
    access_key="minioadmin",
    secret_key="...",
    bucket="printshop"
)

uploader.connect()

# Upload export directory
uploader.upload_export(export_dir, timestamp="2025-12-01")

# Upload artwork
uploader.upload_artwork_directory(artwork_dir)

# Generate and upload index
orders_index = uploader.generate_orders_index(orders)
uploader.upload_index(orders_index, 'orders_index')
```

### FileDetector

```python
from scripts.lib import FileDetector, FileType

# Detect from URL
ext, file_type = FileDetector.detect_from_url("https://cdn.filepicker.io/abc123")

# Detect from file content
with open("file.dst", "rb") as f:
    ext, file_type = FileDetector.detect_from_content(f.read(512))

# Check if production file
is_prod = FileDetector.is_production_file("logo.dst")  # True

# Get storage path
path = FileDetector.get_storage_path(FileType.EMBROIDERY)
# Returns: 'production-files/embroidery'
```

---

## Troubleshooting

### Common Issues

**API returns 401 Unauthorized**
- Check PRINTAVO_EMAIL and PRINTAVO_TOKEN
- Token may have expired, get new one from Printavo

**Web scraping fails with "Invalid credentials"**
- Check PRINTAVO_PASSWORD
- Password is different from API token
- Try logging in manually at printavo.com

**MinIO connection refused**
- Check MINIO_ENDPOINT is correct
- Verify container is running: `docker ps | grep minio`
- Check Tailscale VPN is connected

**Rate limited (429 errors)**
- System automatically retries with backoff
- If persistent, increase REQUEST_DELAY in code

**Artwork not downloading**
- Check network connectivity
- Some files may require login, ensure `login()` succeeded
- Check for CDN URL changes

### Logs and Debugging

```bash
# Verbose output
python scripts/printavo-extract-all.py 2>&1 | tee extraction.log

# Check checkpoint files
cat data/printavo-api-checkpoint.json | jq .

# View MinIO contents
mc ls minio/printshop/printavo-archive/
```

---

## Expected Results

After full extraction:

| Data | Count | Size (Est.) |
|------|-------|-------------|
| Orders | 12,867+ | ~50 MB JSON |
| Customers | 3,317+ | ~10 MB JSON |
| Line Items | 49,216+ | ~100 MB JSON |
| Artwork Files | ~115,000 | ~200 GB |
| Production Files | ~10,000 | ~50 GB |
| Total | | ~250 GB |

---

## Related Files

| File | Purpose |
|------|---------|
| `scripts/printavo-extract-all.py` | Main orchestrator |
| `scripts/lib/printavo_api.py` | API client |
| `scripts/lib/printavo_scraper.py` | Web scraper |
| `scripts/lib/minio_uploader.py` | MinIO utilities |
| `scripts/lib/file_detector.py` | File type detection |
| `scripts/printavo-artwork-scraper-v2.py` | Legacy artwork scraper |
| `scripts/printavo-complete-extraction.py` | Legacy API extractor |

---

## Security Notes

- API token stored in environment variable, not in code
- Credentials never logged or saved to files
- MinIO uses access key/secret key authentication
- All connections use Tailscale VPN for network security

---

## Next Steps

1. ✅ Complete extraction system built
2. ⏳ Run full extraction
3. ⏳ Verify data integrity in MinIO
4. ⏳ Build search/browse UI for archived data
5. ⏳ Disconnect from Printavo

---

## 📚 Complete Implementation Documentation

This document provides an overview and quick reference for the Printavo extraction system.

**For complete step-by-step implementation instructions, see:**

### [📘 PRINTAVO_EXTRACTION_IMPLEMENTATION.md](implementation/PRINTAVO_EXTRACTION_IMPLEMENTATION.md)
Complete guide including:
- Infrastructure setup (VM resources, MinIO deployment)
- Phase-by-phase extraction steps
- Verification checklist before canceling Printavo
- Troubleshooting common issues
- Timeline estimates (20-36 hours end-to-end)

### [📖 PRINTAVO_V2_SCHEMA_REFERENCE.md](implementation/PRINTAVO_V2_SCHEMA_REFERENCE.md)
Complete API reference:
- All GraphQL types (Invoice, Customer, LineItem, Imprint, etc.)
- 51+ fields per order with descriptions
- GraphQL query examples
- Type mappings to Strapi

### [🗄️ MINIO_STORAGE_GUIDE.md](implementation/MINIO_STORAGE_GUIDE.md)
MinIO configuration and usage:
- Docker deployment instructions
- Bucket structure and path conventions
- S3 API access patterns (Python, Node.js)
- Presigned URL generation
- Backup and security configurations

### [🔄 N8N_PRINTAVO_WORKFLOWS.md](implementation/N8N_PRINTAVO_WORKFLOWS.md)
Ready-to-use n8n workflows:
- Query orders by customer
- Search by date range
- Get artwork files for orders
- Customer analytics dashboard
- LLM integration for natural language queries
- Automated daily reports

---

<small>Generated by PrintShop OS | December 2025</small>
