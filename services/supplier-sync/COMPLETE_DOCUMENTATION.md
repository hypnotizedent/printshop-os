# Supplier Sync Service - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Suppliers](#suppliers)
4. [Setup & Installation](#setup--installation)
5. [Usage Guide](#usage-guide)
6. [API Clients](#api-clients)
7. [Transformers](#transformers)
8. [CLI Tools](#cli-tools)
9. [Data Models](#data-models)
10. [Caching Strategy](#caching-strategy)
11. [Error Handling](#error-handling)
12. [Testing](#testing)
13. [Adding New Suppliers](#adding-new-suppliers)
14. [Troubleshooting](#troubleshooting)

---

## Overview

The Supplier Sync Service is a unified integration layer that synchronizes product catalogs, pricing, and inventory from multiple apparel suppliers into PrintShop OS. It normalizes disparate supplier APIs into a single `UnifiedProduct` schema and provides intelligent caching to optimize API usage.

### Key Features

- **Multi-Supplier Support**: S&S Activewear, AS Colour, SanMar (with more planned)
- **Unified Schema**: Single `UnifiedProduct` format for all suppliers
- **Smart Caching**: Redis-backed 3-tier cache (24h products, 1h pricing, 15min inventory)
- **Rate Limiting**: Automatic rate limit detection and retry with exponential backoff
- **Incremental Syncs**: Only fetch products updated since last sync
- **CLI Tools**: Command-line tools for manual syncs and automation
- **Variant Enrichment**: Optional deep enrichment with size/color inventory data
- **Price Integration**: Optional price list fetching with bearer token authentication
- **JSONL Persistence**: Append-only file storage for incremental sync tracking

### Cost Savings

Intelligent caching reduces API calls by ~85%, saving approximately **$500/month** in API overage costs.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Quote UI, Pricing Engine, Production Dashboard)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Strapi API Layer                            │
│         (Products, Variants, Prices, Inventory)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Redis Caching Layer (TTL: 1-24h)                │
│    - Product Catalog Cache (24h)                             │
│    - Pricing Cache (1h)                                      │
│    - Inventory Cache (15min)                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Supplier Sync Service                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CLI Layer (sync-ss.ts, sync-as-colour.ts)          │    │
│  └──────────────────┬──────────────────────────────────┘    │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Transformer Layer (normalize to UnifiedProduct)    │    │
│  └──────────────────┬──────────────────────────────────┘    │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Client Layer (API wrappers with retry logic)       │    │
│  └──────────────────┬──────────────────────────────────┘    │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Persistence Layer (JSONL storage)                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────┬────────────────┬────────────────┬─────────────────────┘
      │                │                │
┌─────▼─────┐   ┌──────▼──────┐   ┌────▼──────┐
│ S&S API   │   │ AS Colour   │   │  SanMar   │
│ REST      │   │ REST + Auth │   │  SFTP     │
└───────────┘   └─────────────┘   └───────────┘
```

### Layer Responsibilities

1. **CLI Layer**: Argument parsing, orchestration, dry-run logic
2. **Transformer Layer**: Normalize supplier-specific formats to UnifiedProduct
3. **Client Layer**: HTTP requests, authentication, pagination, retry logic
4. **Persistence Layer**: JSONL file storage for incremental sync tracking

---

## Suppliers

### Currently Integrated

| Supplier | Status | Features | Authentication |
|----------|--------|----------|----------------|
| **S&S Activewear** | ✅ Production | Catalog, Pricing, Inventory, Search | API Key + Account Number |
| **AS Colour** | ✅ Production | Catalog, Variants, Inventory, Prices, Incremental | Subscription-Key + Bearer Token |
| **SanMar** | 🚧 In Progress | SFTP CSV (495 MB file) | SFTP Username/Password |

### Roadmap

- **Alphabroder**: Planned Q1 2026
- **Bella+Canvas**: Planned Q2 2026
- **Gildan**: Planned Q2 2026

---

## Setup & Installation

### Prerequisites

- **Node.js**: 18+ (tested on 18.x and 20.x)
- **Redis**: Running on localhost:6379 or configured via `REDIS_URL`
- **Supplier Credentials**: API keys/tokens from each supplier
- **TypeScript**: 5.9+ (installed via npm)

### Installation

```bash
cd services/supplier-sync
npm install
```

### Configuration

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# S&S Activewear
SS_ACTIVEWEAR_API_KEY=your_api_key_here
SS_ACTIVEWEAR_ACCOUNT_NUMBER=your_account_number
SS_ACTIVEWEAR_BASE_URL=https://api.ssactivewear.com

# AS Colour
ASCOLOUR_SUBSCRIPTION_KEY=1c27d1d97d234616923e7f8f275c66d1
ASCOLOUR_API_KEY=1c27d1d97d234616923e7f8f275c66d1
ASCOLOUR_BASE_URL=https://api.ascolour.com
ASCOLOUR_EMAIL=info@mintprints.com
ASCOLOUR_PASSWORD=2022MintTeam!
ASCOLOUR_DATA_DIR=./data/ascolour

# SanMar
SANMAR_SFTP_HOST=ftp.sanmar.com
SANMAR_SFTP_PORT=2200
SANMAR_SFTP_USERNAME=your_username
SANMAR_SFTP_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# Strapi (optional)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token

# Logging
LOG_LEVEL=info
```

### Verify Setup

**Test Redis connection:**
```bash
redis-cli ping
# Expected: PONG
```

**Test S&S API:**
```bash
npm run sync:ss -- --dry-run --limit=5
# Should fetch 5 products and display JSON
```

**Test AS Colour API:**
```bash
npm run sync:ascolour -- --dry-run --limit=5
# Should authenticate and fetch 5 products
```

---

## Usage Guide

### Quick Start

**Full sync (all suppliers):**
```bash
npm run sync:all
```

**Sync individual supplier:**
```bash
npm run sync:ss           # S&S Activewear
npm run sync:ascolour     # AS Colour
npm run sync:sanmar       # SanMar (when ready)
```

### Common Workflows

#### 1. Initial Setup Sync (First Time)

```bash
# Fetch all products with full enrichment
npm run sync:ascolour:full
```

#### 2. Daily Incremental Sync (Scheduled)

```bash
# Fetch only products updated in last 7 days
npm run sync:ascolour:incremental
```

#### 3. Testing Changes (Development)

```bash
# Dry run with 10 products
npm run sync:ascolour -- --dry-run --limit=10
```

#### 4. Price Update Only

```bash
# Fetch products and enrich with price list
npm run sync:ascolour -- --enrich-prices --limit=50
```

#### 5. Full Inventory Sync

```bash
# Fetch products with variant + inventory enrichment
npm run sync:ascolour -- --enrich-variants --limit=100
```

---

## API Clients

### SSActivewearClient

**Location:** `src/clients/ss-activewear.client.ts`

**Features:**
- Paginated product fetching (120 requests/minute rate limit)
- Category and brand filtering
- Search functionality
- Incremental sync by date
- Automatic retry with exponential backoff

**Usage:**

```typescript
import { SSActivewearClient } from './clients/ss-activewear.client';

const client = new SSActivewearClient({
  apiKey: process.env.SS_ACTIVEWEAR_API_KEY,
  accountNumber: process.env.SS_ACTIVEWEAR_ACCOUNT_NUMBER,
});

// Get all products (auto-paginated)
const { products, hasMore } = await client.getAllProducts({ 
  page: 1, 
  perPage: 100 
});

// Get single product
const product = await client.getProduct('G200');

// Search products
const results = await client.searchProducts('gildan');

// Get updated products (incremental)
const updated = await client.getUpdatedProducts(new Date('2024-11-20'));

// Health check
const isHealthy = await client.healthCheck();
```

**Rate Limits:**
- 120 requests per minute
- Automatically enforced with retry logic
- 429 responses trigger exponential backoff (1s, 2s, 4s delays)

---

### ASColourClient

**Location:** `src/clients/as-colour.client.ts`

**Features:**
- Dual authentication (Subscription-Key + Bearer token)
- Paginated fetching (max 250 per page)
- Variant enrichment (fetch size/color combinations)
- Inventory tracking per variant
- Price list integration (requires bearer token)
- Incremental sync via `updatedAt:min` parameter
- Rate limit detection (429/503) with exponential backoff

**Authentication Flow:**

```typescript
import { ASColourClient } from './clients/as-colour.client';

const client = new ASColourClient({
  apiKey: process.env.ASCOLOUR_SUBSCRIPTION_KEY,
  baseURL: process.env.ASCOLOUR_BASE_URL,
});

// Step 1: Authenticate (sets Bearer token internally)
await client.authenticate(
  process.env.ASCOLOUR_EMAIL,
  process.env.ASCOLOUR_PASSWORD
);

// Step 2: Now all protected endpoints work
const products = await client.listProducts(1, 100);
const prices = await client.listPriceList(1, 100);
```

**Usage:**

```typescript
// List products (paginated)
const products = await client.listProducts(pageNumber, pageSize);

// Get all products (auto-paginated)
const allProducts = await client.getAllProducts();

// Get single product
const product = await client.getProduct('1000');

// Get product variants
const variants = await client.listVariants('1000');

// Get variant inventory
const inventory = await client.getVariantInventory('1000', '1000-BLACK-P-OS');

// List colours (no auth required)
const colours = await client.listColours();

// List inventory items (with filters)
const items = await client.listInventoryItems({
  skuFilter: '1000',
  updatedAtMin: '2024-11-20T00:00:00',
  pageNumber: 1,
  pageSize: 100
});

// Get price list (requires bearer token)
const prices = await client.listPriceList(1, 250);

// Health check
const isHealthy = await client.healthCheck();
```

**Endpoints:**

| Endpoint | Auth Required | Description |
|----------|---------------|-------------|
| `GET /v1/catalog/colours` | Subscription-Key only | List all colours |
| `POST /v1/api/authentication` | Subscription-Key only | Get bearer token |
| `GET /v1/catalog/products` | Bearer token | List products |
| `GET /v1/catalog/products/{styleCode}` | Bearer token | Get product details |
| `GET /v1/catalog/products/{styleCode}/variants` | Bearer token | List product variants |
| `GET /v1/catalog/products/{styleCode}/variants/{variantCode}` | Bearer token | Get variant details |
| `GET /v1/inventory/items/{styleCode}/{variantCode}` | Bearer token | Get variant inventory |
| `GET /v1/catalog/pricelist` | Bearer token | List price list |
| `GET /v1/inventory/items` | Bearer token | List inventory items |

**Rate Limits:**
- Documented limit: Not specified (conservative approach recommended)
- Implemented retry: 429 (rate limit) and 503 (service unavailable) with exponential backoff
- Max retries: 3 attempts
- Delays: 1s, 2s, 4s (exponential)
- Respects `Retry-After` header when present

**Response Structure:**
```json
{
  "data": [
    {
      "styleCode": "1000",
      "styleName": "Parcel Tote | 1000",
      "description": "Heavy weight, 9.4 oz, 100% cotton canvas parcel tote...",
      "fabricWeight": "320 GSM",
      "composition": "Heavy weight, 9.4 oz, 100% cotton canvas",
      "productType": "Bags",
      "websiteURL": "https://www.ascolour.com/1000-parcel-tote",
      "updatedAt": "2024-11-20T10:30:00Z"
    }
  ]
}
```

---

### SanMarClient

**Location:** `src/clients/sanmar-sftp.client.ts`

**Status:** 🚧 In Progress

**Features:**
- SFTP connection to ftp.sanmar.com:2200
- CSV download (SanMar_EPDD.csv, ~495 MB)
- Streaming parser (memory-efficient for large files)
- CSV-to-JSON transformation

**Known Issues:**
- Large file size (495 MB) requires streaming parser
- Download time: 2-5 minutes
- Need to implement pagination/chunking strategy

**Planned Usage:**
```typescript
import { SanMarSFTPClient } from './clients/sanmar-sftp.client';

const client = new SanMarSFTPClient({
  host: 'ftp.sanmar.com',
  port: 2200,
  username: process.env.SANMAR_SFTP_USERNAME,
  password: process.env.SANMAR_SFTP_PASSWORD,
});

// Download CSV file
await client.downloadFile('/SanMarPDD/SanMar_EPDD.csv', '/tmp/sanmar.csv');

// Parse CSV to products (streaming)
const products = await client.parseCSVToProducts('/tmp/sanmar.csv');
```

---

## Transformers

Transformers normalize supplier-specific API responses into the `UnifiedProduct` schema.

### SSActivewearTransformer

**Location:** `src/transformers/ss-activewear.transformer.ts`

**Responsibilities:**
- Map S&S fields to UnifiedProduct
- Generate variants from color/size combinations
- Parse price breaks
- Aggregate inventory across variants
- Extract image URLs

**Usage:**

```typescript
import { SSActivewearTransformer } from './transformers/ss-activewear.transformer';

const ssProduct = await client.getProduct('G200');
const unified = SSActivewearTransformer.transformProduct(ssProduct);
```

**Field Mapping:**

| S&S Field | UnifiedProduct Field | Notes |
|-----------|----------------------|-------|
| `styleID` | `sku` | Prefixed with "SS-" |
| `styleName` | `name` | - |
| `brandName` | `brand` | - |
| `styleDescription` | `description` | - |
| `categoryName` | `category` | Mapped via heuristics |
| `colors` + `sizes` | `variants[]` | Cross-product combinations |
| `casePrice` | `pricing.basePrice` | Default price |
| `priceBreaks` | `pricing.breaks[]` | Quantity-based discounts |
| `inventory` | `availability.totalQuantity` | Sum across variants |

---

### ASColourTransformer

**Location:** `src/transformers/as-colour.transformer.ts`

**Responsibilities:**
- Map AS Colour fields to UnifiedProduct
- Enrich with variant data (optional)
- Enrich with inventory data (optional)
- Enrich with price list (optional)
- Preserve metadata (updatedAt timestamp)

**Usage:**

```typescript
import { ASColourTransformer } from './transformers/as-colour.transformer';

// Basic transformation
const unified = ASColourTransformer.transformProduct(rawProduct);

// With variant enrichment
const variants = await client.listVariants('1000');
const inventory = await Promise.all(
  variants.map(v => client.getVariantInventory('1000', v.sku))
);
const prices = await client.listPriceList();

const enriched = ASColourTransformer.transformProduct(
  rawProduct,
  variants,
  inventory,
  prices
);
```

**Field Mapping:**

| AS Colour Field | UnifiedProduct Field | Notes |
|-----------------|----------------------|-------|
| `styleCode` | `sku` | Prefixed with "AC-" |
| `styleName` | `name` | - |
| `productType` | `category` | Mapped via `mapCategory()` |
| `description` | `description` | - |
| `fabricWeight` | `specifications.weight` | e.g., "320 GSM" |
| `composition` | `specifications.fabric` | e.g., "100% cotton canvas" |
| `updatedAt` | `metadata.lastUpdated` | ISO 8601 timestamp |

**Variant Enrichment:**

When `variants` array is provided, transformer merges:
- Variant SKU (e.g., "1000-BLACK-P-OS")
- Color name (e.g., "Black")
- Size (e.g., "One Size")
- Inventory quantity (from `getVariantInventory()`)
- Price (from price list matching SKU)

**Example Enriched Variant:**

```typescript
{
  sku: "1000-BLACK-P-OS",
  color: { name: "Black" },
  size: "One Size",
  inStock: true,
  quantity: 4549,
  pricing: { basePrice: 12.50, currency: "USD" }
}
```

---

## CLI Tools

### sync-ss.ts

**Location:** `src/cli/sync-ss.ts`

**Purpose:** Sync S&S Activewear products to local storage or Strapi.

**Flags:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | boolean | false | Preview without saving |
| `--limit` | number | undefined | Max products to fetch |
| `--category` | number | undefined | Filter by category ID |
| `--brand` | number | undefined | Filter by brand ID |
| `--incremental` | boolean | false | Fetch only updated products |
| `--since` | string | 24h ago | Start date for incremental (ISO 8601) |

**Usage:**

```bash
# Dry run with 10 products
npm run sync:ss -- --dry-run --limit=10

# Full sync
npm run sync:ss

# Incremental sync (last 7 days)
npm run sync:ss -- --incremental --since=2024-11-18

# Sync specific category
npm run sync:ss -- --category=1 --limit=50

# List categories
npm run sync:ss:categories

# List brands
npm run sync:ss:brands
```

---

### sync-as-colour.ts

**Location:** `src/cli/sync-as-colour.ts`

**Purpose:** Sync AS Colour products with optional variant/price enrichment.

**Flags:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | boolean | false | Preview without saving |
| `--limit` | number | undefined | Max products to fetch |
| `--enrich-variants` | boolean | false | Fetch variants + inventory per product |
| `--enrich-prices` | boolean | false | Fetch and merge price list |
| `--updated-since` | string | undefined | Filter by updatedAt (ISO 8601) |

**Usage:**

```bash
# Quick dry run
npm run sync:ascolour

# Full sync with enrichment
npm run sync:ascolour:full

# Incremental sync (7 days)
npm run sync:ascolour:incremental

# Custom incremental
npx ts-node src/cli/sync-as-colour.ts --updated-since=2024-11-20T00:00:00 --enrich-variants

# Test variant enrichment
npx ts-node src/cli/sync-as-colour.ts --dry-run --limit=2 --enrich-variants
```

**Authentication:**

Automatically authenticates using `ASCOLOUR_EMAIL` and `ASCOLOUR_PASSWORD` before fetching protected endpoints.

**Enrichment Details:**

**Variant Enrichment (`--enrich-variants`):**
- Calls `/v1/catalog/products/{styleCode}/variants` for each product
- For each variant, calls `/v1/inventory/items/{styleCode}/{variantCode}`
- Merges variant + inventory data into `ProductVariant[]`
- **Warning:** Increases API calls by ~10x (use `--limit` during testing)

**Price Enrichment (`--enrich-prices`):**
- Calls `/v1/catalog/pricelist` once (fetches all prices)
- Filters prices by styleCode and merges into product
- Minimal API overhead (single request)

---

## Data Models

### UnifiedProduct

**Location:** `src/types/product.ts`

The canonical product schema used across all suppliers.

```typescript
interface UnifiedProduct {
  sku: string;                    // Supplier-specific style ID (e.g., "AC-1000")
  name: string;                   // Product name
  brand: string;                  // Supplier brand (e.g., "AS Colour")
  description: string;            // Full product description
  category: ProductCategory;      // Normalized category enum
  supplier: SupplierName;         // "ss-activewear" | "as-colour" | "sanmar"
  
  variants: ProductVariant[];     // Color/size combinations
  images: string[];               // Product image URLs
  
  pricing: {
    basePrice: number;            // Default unit price
    currency: string;             // "USD" | "AUD" | "CAD"
    breaks?: PriceBreak[];        // Quantity-based discounts
  };
  
  specifications?: {
    weight?: string;              // e.g., "320 GSM"
    fabric?: {
      type: string;               // e.g., "Cotton Canvas"
      content: string;            // e.g., "100% cotton"
    };
    features?: string[];          // e.g., ["Heavy weight", "Reinforced handles"]
  };
  
  availability: {
    inStock: boolean;             // Any variant in stock
    totalQuantity: number;        // Sum across all variants
  };
  
  metadata: {
    supplierProductId: string;    // Original supplier ID (e.g., "1000")
    lastUpdated: Date;            // Sync timestamp
  };
}
```

---

### ProductVariant

Individual SKU for each color/size combination.

```typescript
interface ProductVariant {
  sku: string;                    // e.g., "1000-BLACK-P-OS"
  color: {
    name: string;                 // e.g., "Black"
    hex?: string;                 // e.g., "#000000"
  };
  size: string;                   // e.g., "Large", "One Size"
  inStock: boolean;               // Availability flag
  quantity: number;               // Current stock level
  imageUrl?: string;              // Variant-specific image
  pricing?: {
    basePrice: number;
    currency: string;
  };
}
```

---

### ProductCategory

Normalized category enum.

```typescript
enum ProductCategory {
  TSHIRTS = 'tshirts',
  POLOS = 'polos',
  HOODIES = 'hoodies',
  JACKETS = 'jackets',
  PANTS = 'pants',
  SHORTS = 'shorts',
  BAGS = 'bags',
  HATS = 'hats',
  ACCESSORIES = 'accessories',
  OTHER = 'other',
}
```

---

## Caching Strategy

**Technology:** Redis 7.x

**Cache Tiers:**

| Tier | TTL | Use Case | Key Pattern |
|------|-----|----------|-------------|
| **Product Catalog** | 24 hours | Full product details (rarely change) | `product:{supplier}:{sku}` |
| **Pricing** | 1 hour | Price breaks, volume discounts | `pricing:{supplier}:{sku}` |
| **Inventory** | 15 minutes | Real-time stock levels | `inventory:{supplier}:{sku}` |

**Key Examples:**

```
product:as-colour:AC-1000
pricing:ss-activewear:SS-G200
inventory:sanmar:SM-PC54
products:as-colour:all
```

**Cache Invalidation:**

- Manual: `npm run cache:clear`
- Automatic: TTL expiration
- Incremental sync: Updates only changed products

**Benefits:**

- Reduces API calls by ~85%
- Saves ~$500/month in API costs
- Improves response time (Redis < 1ms vs API 200-500ms)
- Provides fallback during API downtime

---

## Error Handling

### Retry Logic

All API clients implement exponential backoff retry:

```typescript
// Pseudo-code
async function requestWithRetry(url) {
  let attempts = 0;
  const maxRetries = 3;
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  while (attempts < maxRetries) {
    try {
      return await axios.get(url);
    } catch (err) {
      if (err.response.status === 429 || err.response.status === 503) {
        const delay = err.response.headers['retry-after'] 
          ? parseInt(err.response.headers['retry-after']) * 1000
          : delays[attempts];
        
        logger.warn(`Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
        attempts++;
      } else {
        throw err;
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Rate Limit Handling

**Detection:**
- HTTP 429 (Rate Limit Exceeded)
- HTTP 503 (Service Unavailable)

**Response:**
- Check `Retry-After` header
- Fall back to exponential delays: 1s, 2s, 4s
- Log warning with retry timing
- Throw error after 3 failed attempts

**Example Log:**

```
2024-11-25T10:30:45.123Z [WARN] Rate limited by AS Colour API, retrying in 2000ms... (attempt 2/3)
```

### Authentication Errors

**401 Unauthorized:**
- Check API key/credentials in `.env`
- Verify bearer token is obtained (AS Colour)
- Ensure subscription key is valid

**403 Forbidden:**
- Check account permissions
- Verify API endpoint access rights

### Network Errors

**ECONNREFUSED:**
- Check supplier API status
- Verify baseURL in `.env`

**ETIMEDOUT:**
- Increase timeout: `axios.defaults.timeout = 30000`
- Check network connectivity

---

## Testing

### Test Structure

```
tests/
├── integration/
│   ├── test-ascolour-auth.ts      # AS Colour authentication flow
│   ├── test-ss-api.spec.ts        # S&S API integration (Jest)
│   └── test-sanmar-sftp.spec.ts   # SanMar SFTP (Jest)
├── unit/
│   ├── transformers.spec.ts       # Transformer logic
│   └── clients.spec.ts            # Client methods (mocked)
└── fixtures/
    ├── ss-product.json            # Sample S&S product
    ├── ascolour-product.json      # Sample AS Colour product
    └── sanmar-csv-sample.csv      # Sample SanMar CSV
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Manual Integration Tests

**AS Colour:**
```bash
npx ts-node src/test-scripts/test-ascolour-auth.ts
```

**S&S Activewear:**
```bash
npm run sync:ss -- --dry-run --limit=5
```

---

## Adding New Suppliers

See [docs/ADDING_NEW_SUPPLIER.md](./docs/ADDING_NEW_SUPPLIER.md) for complete guide.

### Quick Checklist

1. **Create client:** `src/clients/{supplier}.client.ts`
   - Implement authentication
   - Add pagination logic
   - Handle rate limiting
   - Add health check

2. **Create transformer:** `src/transformers/{supplier}.transformer.ts`
   - Map fields to UnifiedProduct
   - Generate variants
   - Parse pricing
   - Aggregate inventory

3. **Create CLI:** `src/cli/sync-{supplier}.ts`
   - Parse arguments
   - Orchestrate sync flow
   - Handle dry-run mode
   - Add persistence

4. **Add package scripts:** `package.json`
   ```json
   {
     "scripts": {
       "sync:{supplier}": "ts-node src/cli/sync-{supplier}.ts --dry-run --limit=10",
       "sync:{supplier}:full": "ts-node src/cli/sync-{supplier}.ts"
     }
   }
   ```

5. **Document:** `docs/suppliers/{SUPPLIER}.md`
   - API endpoints
   - Authentication flow
   - Rate limits
   - Pagination strategy
   - Known issues

6. **Add tests:** `tests/integration/test-{supplier}.spec.ts`
   - Authentication test
   - Product fetch test
   - Pagination test
   - Error handling test

---

## Troubleshooting

### Common Issues

#### "Missing credentials" error

**Symptom:**
```
Error: Missing required environment variables: ASCOLOUR_EMAIL, ASCOLOUR_PASSWORD
```

**Solution:**
1. Check `.env` file exists
2. Verify all required variables are set
3. Restart terminal/IDE to reload env

#### "Rate limit exceeded" error

**Symptom:**
```
Error: Rate limit exceeded, max retries (3) reached
```

**Solution:**
1. Wait 1-5 minutes before retrying
2. Use `--limit` flag to reduce requests
3. Enable caching to reduce API calls
4. Check supplier API status page

#### "401 Unauthorized" error

**Symptom:**
```
Error: Request failed with status code 401
```

**Solution (AS Colour):**
1. Verify `ASCOLOUR_SUBSCRIPTION_KEY` is correct
2. Check `ASCOLOUR_EMAIL` and `ASCOLOUR_PASSWORD`
3. Ensure authentication completes before protected endpoint calls

**Solution (S&S):**
1. Verify `SS_ACTIVEWEAR_API_KEY` is correct
2. Check `SS_ACTIVEWEAR_ACCOUNT_NUMBER` is correct

#### "Redis connection failed" error

**Symptom:**
```
Error: Could not connect to Redis at localhost:6379
```

**Solution:**
1. Start Redis: `redis-server`
2. Verify Redis is running: `redis-cli ping` → `PONG`
3. Check `REDIS_URL` in `.env`

#### "API health check failed" error

**Symptom:**
```
Warning: API health check failed
```

**Solution:**
1. Verify API credentials
2. Check supplier API status
3. Test network connectivity: `curl https://api.ascolour.com`

#### Large file download timeout (SanMar)

**Symptom:**
```
Error: ETIMEDOUT downloading SanMar_EPDD.csv
```

**Solution:**
1. Increase timeout: Set `axios.defaults.timeout = 300000` (5 minutes)
2. Use streaming parser to handle 495 MB file
3. Download during off-peak hours

### Debug Mode

Enable detailed logging:

```bash
export LOG_LEVEL=debug
npm run sync:ascolour -- --dry-run --limit=5
```

### Contact

For issues not covered here:
- Check GitHub issues: https://github.com/hypnotizedent/printshop-os/issues
- Review supplier API documentation
- Contact supplier support for API-specific issues

---

## Appendix

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SS_ACTIVEWEAR_API_KEY` | Yes | - | S&S API key |
| `SS_ACTIVEWEAR_ACCOUNT_NUMBER` | Yes | - | S&S account number |
| `SS_ACTIVEWEAR_BASE_URL` | No | `https://api.ssactivewear.com` | S&S API base URL |
| `ASCOLOUR_SUBSCRIPTION_KEY` | Yes | - | AS Colour subscription key |
| `ASCOLOUR_EMAIL` | Yes | - | AS Colour account email |
| `ASCOLOUR_PASSWORD` | Yes | - | AS Colour account password |
| `ASCOLOUR_BASE_URL` | No | `https://api.ascolour.com` | AS Colour API base URL |
| `ASCOLOUR_DATA_DIR` | No | `./data/ascolour` | JSONL storage directory |
| `SANMAR_SFTP_HOST` | Yes | - | SanMar SFTP host |
| `SANMAR_SFTP_PORT` | No | `2200` | SanMar SFTP port |
| `SANMAR_SFTP_USERNAME` | Yes | - | SanMar SFTP username |
| `SANMAR_SFTP_PASSWORD` | Yes | - | SanMar SFTP password |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `STRAPI_URL` | No | - | Strapi API URL (optional) |
| `STRAPI_API_TOKEN` | No | - | Strapi API token (optional) |
| `LOG_LEVEL` | No | `info` | Logging level (debug/info/warn/error) |

### Package Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run sync:ss` | Sync S&S Activewear (dry-run, 10 products) |
| `npm run sync:ss:categories` | List S&S categories |
| `npm run sync:ss:brands` | List S&S brands |
| `npm run sync:ascolour` | Sync AS Colour (dry-run, 10 products) |
| `npm run sync:ascolour:full` | Full AS Colour sync with enrichment |
| `npm run sync:ascolour:incremental` | Incremental AS Colour sync (7 days) |
| `npm run sync:all` | Sync all suppliers |
| `npm run cache:clear` | Clear Redis cache |

---

**Last Updated:** November 25, 2024  
**Version:** 1.0.0  
**Maintainer:** PrintShop OS Team
