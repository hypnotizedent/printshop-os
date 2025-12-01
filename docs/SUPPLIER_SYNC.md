# Supplier Sync System

> **Purpose:** Maintain curated top products in Strapi while providing real-time access to full supplier catalogs  
> **Last Updated:** December 1, 2025  
> **Status:** ✅ Implemented

---

## Overview

PrintShop OS uses a two-tier product catalog architecture:

| Tier | Storage | Products | Use Case |
|------|---------|----------|----------|
| **Tier 1: Top Products** | Strapi CMS | ~500-1000 SKUs | Quick quoting, autocomplete |
| **Tier 2: Full Catalog** | Supplier APIs | 500K+ products | AI agent queries, real-time inventory |

### Why Two Tiers?

1. **Performance**: Strapi can't efficiently handle 500K+ products
2. **Relevance**: Most quotes use the same ~500 popular styles
3. **Real-time**: Inventory changes constantly; cache for 15 minutes only
4. **Cost**: Supplier APIs have rate limits; cache when possible

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRINTSHOP OS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌─────────────────────────┐     ┌──────────────┐  │
│  │   Frontend   │────▶│   Strapi CMS            │────▶│   Products   │  │
│  │  Autocomplete│     │   /api/products         │     │   ~500 SKUs  │  │
│  └──────────────┘     └─────────────────────────┘     │   (Tier 1)   │  │
│                                                        └──────────────┘  │
│  ┌──────────────┐     ┌─────────────────────────┐     ┌──────────────┐  │
│  │   AI Agents  │────▶│   Inventory API         │────▶│    Redis     │  │
│  │  Quote Engine│     │   /api/inventory        │     │   Cache      │  │
│  └──────────────┘     └─────────────────────────┘     │   (15-min)   │  │
│                                │                       └──────────────┘  │
│                                │                                         │
│                                ▼                                         │
│                   ┌─────────────────────────────┐                        │
│                   │    Supplier APIs            │                        │
│                   │  AS Colour, S&S, SanMar     │                        │
│                   │    500K+ Products (Tier 2)  │                        │
│                   └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Python CLI (`scripts/supplier-sync.py`)

Main orchestrator for all sync operations.

```bash
# Analyze order history to identify top products
python3 scripts/supplier-sync.py analyze

# Sync top 500 products to Strapi
python3 scripts/supplier-sync.py sync-top-products --limit 500

# Sync specific supplier catalog
python3 scripts/supplier-sync.py sync-supplier --supplier as-colour

# Update inventory for top products (daily)
python3 scripts/supplier-sync.py update-inventory

# Full refresh (weekly)
python3 scripts/supplier-sync.py full-refresh

# Check current status
python3 scripts/supplier-sync.py status
```

### 2. Product Analyzer (`scripts/lib/product_analyzer.py`)

Analyzes Printavo order history to calculate product scores.

**Scoring Formula:**
```
Score = (Frequency × 0.4) + (Volume × 0.3) + (Recency × 0.3)
```

- **Frequency**: Order count normalized to max
- **Volume**: Total units ordered normalized to max
- **Recency**: Linear decay over 90 days

### 3. Supplier Clients (`scripts/lib/supplier_clients.py`)

Unified Python interface to all supplier APIs.

| Supplier | API Type | Auth Method |
|----------|----------|-------------|
| AS Colour | REST | Subscription-Key + JWT |
| S&S Activewear | REST | Basic Auth |
| SanMar | SFTP/CSV | Cached JSONL files |

### 4. TypeScript Sync Service (`services/api/src/inventory/product-sync.ts`)

Node.js service for Strapi product management.

```typescript
import { createProductSyncService } from './inventory/product-sync';

const syncService = createProductSyncService();
await syncService.syncTopProducts(topProducts);
```

---

## Strapi Product Schema

The `products` collection includes fields for top product tracking:

```json
{
  "sku": "string (required, unique)",
  "name": "string",
  "brand": "string",
  "category": "enum",
  "supplier": "enum [sanmar, ascolour, ssactivewear]",
  "description": "text",
  "basePrice": "decimal",
  "colors": "json",
  "sizes": "json",
  "images": "json",
  "supplierProductId": "string",
  "lastSyncedAt": "datetime",
  "isActive": "boolean",
  "isFavorite": "boolean",
  "isCurated": "boolean",
  "usageCount": "integer",
  "priority": "integer (0-100)",
  "isTopProduct": "boolean",
  "orderCount": "integer",
  "totalUnitsOrdered": "integer",
  "lastOrderedAt": "datetime",
  "topProductScore": "decimal"
}
```

---

## Scheduled Jobs

### Daily Sync (2 AM)

```bash
# Crontab entry
0 2 * * * /path/to/scripts/overnight-supplier-sync.sh
```

**What it does:**
1. Analyzes order history for top products
2. Syncs top 500 products to Strapi
3. Downloads SanMar EPDD catalog via SFTP
4. Updates product inventory/pricing

### Weekly Full Refresh (Sunday 3 AM)

```bash
# Crontab entry
0 3 * * 0 python3 /path/to/scripts/supplier-sync.py full-refresh
```

**What it does:**
1. Complete re-analysis of all orders
2. Full product catalog refresh from suppliers
3. Cleans up stale products

---

## Environment Variables

```env
# Strapi Configuration
STRAPI_URL=http://100.92.156.118:1337
STRAPI_API_TOKEN=your-api-token-here

# AS Colour (Dual Auth Required)
ASCOLOUR_API_KEY=your-subscription-key
ASCOLOUR_EMAIL=your-email@example.com
ASCOLOUR_PASSWORD=your-password

# S&S Activewear
SS_ACTIVEWEAR_API_KEY=your-api-key
SS_ACTIVEWEAR_ACCOUNT_NUMBER=your-account-number

# SanMar
SANMAR_USERNAME=your-username
SANMAR_PASSWORD=your-password
SANMAR_SFTP_HOST=ftp.sanmar.com
SANMAR_SFTP_PORT=2200

# Redis Cache
REDIS_URL=redis://100.92.156.118:6379
```

---

## Top Products Data

Analysis output is saved to:
```
data/intelligence/top-500-products.json
```

**Example product entry:**
```json
{
  "style_number": "NL3600",
  "style_name": "Next Level Apparel - Unisex Cotton Tee",
  "order_count": 1994,
  "total_quantity": 41826,
  "last_used": "2025-09-09T10:26:56.047-04:00",
  "categories": ["DTG Printing on Light", "Screen Printing"],
  "sample_colors": ["White", "Black", "Light Gray"],
  "score": 69.7
}
```

---

## API Endpoints

### Inventory API (`/api/inventory`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check/:sku` | GET | Check inventory for SKU |
| `/check/:sku/color/:color` | GET | Check specific color |
| `/batch` | POST | Batch inventory check |
| `/colors/:sku` | GET | Get available colors |
| `/sizes/:sku` | GET | Get available sizes |
| `/pricing/:sku` | GET | Get pricing with volume breaks |
| `/health` | GET | Service health check |

### Strapi Products API (`/api/products`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | List products |
| `/products/:id` | GET | Get single product |
| `/products` | POST | Create product |
| `/products/:id` | PUT | Update product |

**Filter for top products:**
```bash
curl "http://strapi:1337/api/products?filters[isTopProduct]=true&sort=topProductScore:desc"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/supplier-sync.py` | Main CLI orchestrator |
| `scripts/lib/product_analyzer.py` | Order history analyzer |
| `scripts/lib/supplier_clients.py` | Unified supplier API client |
| `scripts/overnight-supplier-sync.sh` | Cron job script |
| `services/api/src/inventory/product-sync.ts` | TypeScript sync service |
| `services/api/src/inventory/router.ts` | Inventory API routes |
| `services/api/src/inventory/clients.ts` | Supplier API clients |
| `printshop-strapi/src/api/product/` | Strapi product content type |
| `data/intelligence/top-500-products.json` | Analysis results |

---

## Troubleshooting

### "Strapi CMS not accessible"

1. Check Strapi is running: `curl http://strapi:1337/_health`
2. Verify STRAPI_URL environment variable
3. Check STRAPI_API_TOKEN is set and valid

### "Supplier client not available"

1. Check environment variables are set for the supplier
2. For AS Colour, both API_KEY and EMAIL/PASSWORD are required
3. For S&S, both API_KEY and ACCOUNT_NUMBER are required

### "No products found in analysis"

1. Ensure order data exists in `data/raw/printavo-exports/`
2. Check orders have `lineitems_attributes` with `style_number`
3. Run discovery first: `node scripts/discover-top-products.js`

### "SanMar product cache not found"

1. Run overnight sync to download EPDD: `./scripts/overnight-supplier-sync.sh`
2. Or manually sync: `npx ts-node services/supplier-sync/src/cli/sync-sanmar.ts`

---

## Future Enhancements

- [ ] Add Alphabroder supplier integration
- [ ] Implement product image sync to MinIO
- [ ] Add webhook for real-time inventory updates
- [ ] Create admin dashboard for sync status
- [ ] Add product recommendation engine

---

<small>Generated by GitHub Copilot | PrintShop OS</small>
