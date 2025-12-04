# Printavo Data Extraction - Single Source of Truth

> **Last Updated**: December 2025  
> **Status**: Production Ready  
> **Location**: `services/api/scripts/`

## Quick Start

```bash
# 1. Configure credentials
cd ~/stacks/printshop-os/services/api
cp .env.example .env
# Edit .env with:
#   PRINTAVO_EMAIL=ronny@mintprints.com
#   PRINTAVO_TOKEN=tApazCfvuQE-0Tl3YLIofg

# 2. Rebuild container (includes scripts)
cd ~/stacks/printshop-os
docker compose build api
docker compose up -d api

# 3. Run extraction
docker compose exec api npm run printavo:extract-complete

# 4. If interrupted, resume
docker compose exec api npm run printavo:extract-complete:resume
```

## What Gets Extracted

| Data | Count | Includes |
|------|-------|----------|
| Orders | ~12,867 | Full details, status, dates, notes |
| Customers | ~3,358 | Contacts, addresses, company info |
| Quotes | ~500+ | Line items, pricing |
| Imprints | ~40,000+ | Decoration details, colors, placement |
| Artwork Files | ~115,000 | URLs for PNG, DST, EPS, AI, PDF |
| Production Files | ~10,000 | URLs for production assets |

## Output Location

```
services/api/data/printavo-export/v2-complete/{timestamp}/
├── orders.json           # All orders with complete data
├── quotes.json           # All quotes
├── customers.json        # All customers
├── products.json         # Product catalog
├── imprints.json         # Normalized decoration details
├── files_manifest.json   # All file URLs for download
├── checkpoint.json       # Resume state
└── summary.json          # Extraction statistics
```

## After Extraction

```bash
# Download all files (artwork, production)
docker compose exec api npm run printavo:download-files

# Sync to MinIO
docker compose exec api npm run printavo:sync-minio

# Or all-in-one
docker compose exec api npm run printavo:full-archive
```

## Credentials

- **Email**: ronny@mintprints.com
- **Token**: Get from Printavo → My Account → API Key
- **Token Lifetime**: 6 months (expires periodically, regenerate as needed)

## Technical Details

### Authentication Method

Printavo V2 uses **header-based authentication** on every GraphQL request:

```typescript
headers: {
  'Content-Type': 'application/json',
  'email': 'your_email@example.com',
  'token': 'your_api_token_here'
}
```

There is **no separate /auth endpoint** - authentication happens via headers on each request.

### GraphQL API

The extraction uses Printavo's V2 GraphQL API at `https://www.printavo.com/api/v2/graphql`.

**Complete schema extracted includes:**
- Orders (Invoice type) with 50+ fields
- Quotes with line items
- Customers with contacts and addresses
- Line items with sizes and personalizations
- Imprints with artwork files
- Production files
- Tasks, payments, expenses, fees

### Rate Limiting

- Default: 500ms between requests
- Configurable via `PRINTAVO_RATE_LIMIT_MS`
- GraphQL pagination: 50 orders per page

### Checkpoint/Resume

Checkpoints saved every 50 orders in `checkpoint.json`:
```json
{
  "timestamp": "2025-12-04T12-00-00",
  "ordersProcessed": 1250,
  "currentPhase": "orders"
}
```

Resume with: `npm run printavo:extract-complete:resume`

## Troubleshooting

### "PRINTAVO_TOKEN is required" Error

You need to set the API token in `.env`:

1. Log in to Printavo
2. Go to My Account → API Key
3. Copy the token
4. Add to `services/api/.env`: `PRINTAVO_TOKEN=your_token_here`

### "Unauthorized" Error

- Token may have expired (regenerate in Printavo)
- Email may be incorrect
- Check both email and token are correct

### "Scripts directory not found in Docker"

Rebuild the container:
```bash
docker compose build api
docker compose up -d api
```

The Dockerfile now includes the scripts directory.

### Extraction Stops Midway

Use resume mode:
```bash
docker compose exec api npm run printavo:extract-complete:resume
```

This will continue from the last checkpoint.

## File Structure

```
services/api/
├── scripts/
│   ├── extract-printavo-v2-complete.ts    # ← Main extraction script
│   ├── download-printavo-files.ts          # File downloader
│   └── sync-to-minio.ts                    # MinIO uploader
├── lib/
│   └── printavo-v2-types.ts               # TypeScript types
├── .env.example                            # Environment template
└── package.json                            # npm scripts
```

## DO NOT USE

The following scripts are **DEPRECATED** and have been removed:

- ❌ `scripts/printavo-complete-extraction.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-full-extraction.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-extract-all.py` (v1 REST API, incomplete data)
- ❌ `scripts/printavo-artwork-scraper-v2.py` (web scraping, unreliable)
- ❌ Any Python Printavo scripts

**Only use**: `services/api/scripts/extract-printavo-v2-complete.ts`

This is the **single source of truth** for Printavo data extraction.

## Related Documentation

- [Printavo V2 Schema Reference](implementation/PRINTAVO_V2_SCHEMA_REFERENCE.md) - Complete GraphQL schema
- [MinIO Storage Guide](implementation/MINIO_STORAGE_GUIDE.md) - File storage setup
- [SERVICE_DIRECTORY.md](SERVICE_DIRECTORY.md) - All services overview

---

<small>Generated by PrintShop OS | December 2025</small>
