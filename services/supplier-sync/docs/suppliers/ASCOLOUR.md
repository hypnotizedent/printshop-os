# AS Colour Integration

**Status:** ✅ Production Ready

**Last Updated:** November 25, 2024

---

## Overview

AS Colour is an apparel supplier specializing in wholesale blank garments (tees, hoodies, bags, headwear). This integration synchronizes their product catalog, variants, inventory levels, and pricing into PrintShop OS via their REST API.

**Supplier Website:** https://www.ascolour.com  
**API Base URL:** https://api.ascolour.com  
**Support Contact:** Via supplier portal

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASCOLOUR_SUBSCRIPTION_KEY` | Yes | - | Primary API subscription key |
| `ASCOLOUR_API_KEY` | No | - | Legacy/fallback key (optional) |
| `ASCOLOUR_EMAIL` | Yes | - | Account email for bearer token auth |
| `ASCOLOUR_PASSWORD` | Yes | - | Account password for bearer token auth |
| `ASCOLOUR_BASE_URL` | No | `https://api.ascolour.com` | API base URL |
| `ASCOLOUR_DATA_DIR` | No | `./data/ascolour` | JSONL storage directory |

### Example `.env`

```env
ASCOLOUR_SUBSCRIPTION_KEY=1c27d1d97d234616923e7f8f275c66d1
ASCOLOUR_EMAIL=info@mintprints.com
ASCOLOUR_PASSWORD=2022MintTeam!
ASCOLOUR_BASE_URL=https://api.ascolour.com
ASCOLOUR_DATA_DIR=./data/ascolour
```

---

## API Details

### Authentication

AS Colour uses **dual authentication**:

1. **Subscription-Key Header** (required for all requests):
   ```
   Subscription-Key: 1c27d1d97d234616923e7f8f275c66d1
   ```

2. **Bearer Token** (required for protected endpoints):
   - Obtained via `POST /v1/api/authentication` with email/password
   - Set in `Authorization: Bearer {token}` header
   - Used for catalog products, price list, inventory endpoints

**Authentication Flow:**

```typescript
const client = new ASColourClient({ apiKey: subscriptionKey });

// Step 1: Authenticate (sets bearer token internally)
await client.authenticate(email, password);

// Step 2: Access protected endpoints
const products = await client.listProducts();
const prices = await client.listPriceList();
```

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/catalog/colours` | GET | Subscription-Key | List all colours (no bearer required) |
| `/v1/api/authentication` | POST | Subscription-Key | Get bearer token |
| `/v1/catalog/products` | GET | Bearer | List products (paginated) |
| `/v1/catalog/products/{styleCode}` | GET | Bearer | Get product details |
| `/v1/catalog/products/{styleCode}/variants` | GET | Bearer | List product variants |
| `/v1/catalog/products/{styleCode}/variants/{variantCode}` | GET | Bearer | Get variant details |
| `/v1/inventory/items/{styleCode}/{variantCode}` | GET | Bearer | Get variant inventory |
| `/v1/inventory/items` | GET | Bearer | List inventory items (supports filters) |
| `/v1/catalog/pricelist` | GET | Bearer | List price list |
| `/v1/catalog/products/{styleCode}/images` | GET | Bearer | Get product images |

### Rate Limits

- **Documented Limit:** Not explicitly stated (conservative approach recommended)
- **Observed Behavior:** No 429 errors during testing (522 products, 6 pages)
- **Implemented Retry:** 429 (rate limit) and 503 (service unavailable) detection
- **Backoff Strategy:** Exponential (1s, 2s, 4s) with max 3 retries
- **Retry-After Support:** Respects `Retry-After` header when present

### Pagination

- **Type:** Page-based
- **Parameters:** `pageNumber` (1-indexed), `pageSize` (max 250)
- **Safety Cap:** 50 pages
- **Example:** `GET /v1/catalog/products?pageNumber=2&pageSize=100`

**Pagination Logic:**

```typescript
let page = 1;
const allProducts = [];

while (page <= 50) {
  const products = await client.listProducts(page, 100);
  if (products.length === 0) break;
  
  allProducts.push(...products);
  if (products.length < 100) break; // Last page
  page++;
}
```

### Response Structure

All endpoints return JSON with nested `data` property:

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

## Data Transformation

### Field Mapping

| AS Colour Field | UnifiedProduct Field | Notes |
|-----------------|----------------------|-------|
| `styleCode` | `sku` | Prefixed with "AC-" (e.g., "AC-1000") |
| `styleName` | `name` | Full product name |
| `productType` | `category` | Mapped via `mapCategory()` heuristics |
| `description` | `description` | Full product description |
| `fabricWeight` | `specifications.weight` | e.g., "320 GSM" |
| `composition` | `specifications.fabric` | e.g., "100% cotton canvas" |
| `websiteURL` | `metadata.websiteURL` | Product page URL |
| `updatedAt` | `metadata.lastUpdated` | ISO 8601 timestamp |

### Category Mapping

`productType` values mapped to `ProductCategory` enum:

| AS Colour productType | ProductCategory |
|-----------------------|-----------------|
| "Bags" | `BAGS` |
| "T-Shirts", "Tees" | `TSHIRTS` |
| "Polos" | `POLOS` |
| "Hoodies", "Sweatshirts" | `HOODIES` |
| "Jackets" | `JACKETS` |
| "Pants", "Trousers" | `PANTS` |
| "Shorts" | `SHORTS` |
| "Hats", "Caps", "Headwear" | `HATS` |
| Other | `OTHER` |

### Sample Raw Product

```json
{
  "styleCode": "1000",
  "styleName": "Parcel Tote | 1000",
  "description": "Heavy weight, 9.4 oz, 100% cotton canvas parcel tote with leather look PU carry handles...",
  "fabricWeight": "320 GSM",
  "composition": "Heavy weight, 9.4 oz, 100% cotton canvas",
  "productType": "Bags",
  "websiteURL": "https://www.ascolour.com/1000-parcel-tote",
  "updatedAt": "2024-11-20T10:30:00Z"
}
```

### Sample Unified Product (Basic)

```json
{
  "sku": "AC-1000",
  "name": "Parcel Tote | 1000",
  "brand": "AS Colour",
  "description": "Heavy weight, 9.4 oz, 100% cotton canvas parcel tote...",
  "category": "bags",
  "supplier": "as-colour",
  "variants": [],
  "images": [],
  "pricing": {
    "basePrice": 0,
    "currency": "USD",
    "breaks": []
  },
  "specifications": {
    "weight": "320 GSM",
    "fabric": {
      "type": "Cotton Canvas",
      "content": "100% cotton"
    }
  },
  "availability": {
    "inStock": false,
    "totalQuantity": 0
  },
  "metadata": {
    "supplierProductId": "1000",
    "lastUpdated": "2024-11-25T10:30:00Z"
  }
}
```

### Sample Unified Product (With Variant Enrichment)

When `--enrich-variants` flag is used, variants are fetched and merged:

```json
{
  "sku": "AC-1000",
  "name": "Parcel Tote | 1000",
  "variants": [
    {
      "sku": "1000-BLACK-P-OS",
      "color": { "name": "Black" },
      "size": "One Size",
      "inStock": true,
      "quantity": 4549
    },
    {
      "sku": "1000-CREAM-P-OS",
      "color": { "name": "Cream" },
      "size": "One Size",
      "inStock": true,
      "quantity": 2341
    }
  ],
  "availability": {
    "inStock": true,
    "totalQuantity": 6890
  }
}
```

### Sample Unified Product (With Price Enrichment)

When `--enrich-prices` flag is used, price list is integrated:

```json
{
  "sku": "AC-1000",
  "pricing": {
    "basePrice": 12.50,
    "currency": "USD",
    "breaks": [
      { "quantity": 1, "price": 12.50 },
      { "quantity": 50, "price": 11.25 },
      { "quantity": 100, "price": 10.00 }
    ]
  }
}
```

---

## CLI Usage

### Package Scripts

```bash
# Quick dry run (10 products, no persistence)
npm run sync:ascolour

# Full sync with variant + price enrichment
npm run sync:ascolour:full

# Incremental sync (last 7 days, with variants)
npm run sync:ascolour:incremental
```

### Custom Invocations

```bash
# Dry run with 50 products
npx ts-node src/cli/sync-as-colour.ts --dry-run --limit=50

# Full sync with all enrichments
npx ts-node src/cli/sync-as-colour.ts --enrich-variants --enrich-prices

# Incremental sync since specific date
npx ts-node src/cli/sync-as-colour.ts --updated-since=2024-11-20T00:00:00

# Test variant enrichment with 2 products
npx ts-node src/cli/sync-as-colour.ts --dry-run --limit=2 --enrich-variants
```

### CLI Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | boolean | false | Preview output without saving |
| `--limit` | number | undefined | Max products to process |
| `--enrich-variants` | boolean | false | Fetch variants + inventory per product |
| `--enrich-prices` | boolean | false | Fetch and merge price list |
| `--updated-since` | string | undefined | Filter by updatedAt (ISO 8601) |

### Enrichment Details

#### Variant Enrichment (`--enrich-variants`)

**API Calls:**
- 1 call to `/v1/catalog/products/{styleCode}/variants` per product
- 1 call to `/v1/inventory/items/{styleCode}/{variantCode}` per variant

**Impact:**
- For 100 products with avg 10 variants each: ~1,100 API calls
- Use `--limit` during testing to avoid excessive requests

**Example:**

```bash
# Safe test: 2 products only
npm run sync:ascolour -- --dry-run --limit=2 --enrich-variants
```

**Output:**

```json
{
  "variants": [
    {
      "sku": "1000-BLACK-P-OS",
      "color": { "name": "Black" },
      "size": "One Size",
      "inStock": true,
      "quantity": 4549,
      "location": "CA"
    }
  ]
}
```

#### Price Enrichment (`--enrich-prices`)

**API Calls:**
- 1 call to `/v1/catalog/pricelist` (fetches all prices once)
- Filters by `styleCode` and merges into product

**Impact:**
- Minimal (single request regardless of product count)

**Example:**

```bash
npm run sync:ascolour -- --enrich-prices --limit=50
```

**Output:**

```json
{
  "pricing": {
    "basePrice": 12.50,
    "currency": "USD",
    "breaks": [...]
  }
}
```

---

## Persistence

### Storage Format

**Location:** `ASCOLOUR_DATA_DIR/products.jsonl`  
**Format:** JSON Lines (one JSON object per line)

**Example:**

```jsonl
{"sku":"AC-1000","name":"Parcel Tote | 1000","brand":"AS Colour",...}
{"sku":"AC-1001","name":"Staple Tee | 1001","brand":"AS Colour",...}
```

### Benefits

- **Append-Only:** Easy incremental syncs
- **Memory-Efficient:** Process one line at a time
- **Human-Readable:** Standard JSON format
- **Git-Friendly:** Line-based diffs

### Reading Persisted Data

```typescript
import { readPersistedProducts } from './persistence/productPersistence';

// Read first 50 products
const products = await readPersistedProducts(50);
```

---

## Error Handling

### Rate Limiting (429)

**Detection:** HTTP 429 response  
**Retry Logic:**
1. Check `Retry-After` header (use if present)
2. Fall back to exponential backoff: 1s, 2s, 4s
3. Max 3 retry attempts
4. Log warning with retry timing

**Example Log:**

```
2024-11-25T10:30:45.123Z [WARN] Rate limited by AS Colour API, retrying in 2000ms... (attempt 2/3)
```

### Service Unavailable (503)

**Detection:** HTTP 503 response  
**Behavior:** Same as 429 (exponential backoff retry)

### Authentication Errors (401)

**Symptom:** `Request failed with status code 401`

**Causes:**
- Invalid `ASCOLOUR_SUBSCRIPTION_KEY`
- Invalid `ASCOLOUR_EMAIL` or `ASCOLOUR_PASSWORD`
- Bearer token expired (not yet refreshed)

**Solution:**
1. Verify credentials in `.env`
2. Re-run authentication: `await client.authenticate(email, password)`
3. Check supplier portal for account status

### Not Found (404)

**Behavior:** Returns `null` or empty array  
**Log Level:** Warning  
**No Retry:** 404 is not transient

### Network Errors

**ETIMEDOUT:**
- Increase timeout: Default is 30s
- Check network connectivity

**ECONNREFUSED:**
- Verify `ASCOLOUR_BASE_URL`
- Check AS Colour API status

---

## Testing

### Manual Integration Test

**File:** `src/test-scripts/test-ascolour-auth.ts`

**Run:**

```bash
npx ts-node src/test-scripts/test-ascolour-auth.ts
```

**Tests:**
1. ✅ List colours (no bearer token)
2. ✅ Authenticate (get bearer token)
3. ✅ List products (with bearer token)
4. ✅ List inventory items
5. ✅ Health check

**Expected Output:**

```
Testing AS Colour API...

Test 1: List colours (no bearer token)
✓ Fetched 250 colours

Test 2: Authenticate
✓ Authenticated successfully

Test 3: List products
✓ Fetched 5 products
Sample: styleCode=1000, styleName="Parcel Tote | 1000"

Test 4: List inventory items
✓ Fetched 3 items
Sample: sku=1000-BLACK-P-OS, location=CA, quantity=4549

Test 5: Health check
✓ Health check passed

All tests passed! ✅
```

### Automated Tests (Jest)

**Location:** `tests/integration/test-ascolour.spec.ts` (planned)

**Run:**

```bash
npm test -- tests/integration/test-ascolour.spec.ts
```

---

## Known Issues

### Issue 1: Token Expiry Not Documented

**Status:** ⚠️ Open

**Description:** AS Colour API documentation doesn't specify bearer token TTL or refresh mechanism.

**Workaround:** Re-authenticate at start of each sync (current implementation).

**Future:** Implement token refresh logic when TTL is documented.

---

### Issue 2: Colour Hex Codes Not Available

**Status:** ⚠️ Open

**Description:** Colour endpoint returns colour names but not hex codes (e.g., "Black" but not "#000000").

**Impact:** UnifiedProduct `color.hex` field is `undefined`.

**Workaround:** Use colour name only; map to hex manually if needed.

---

### Issue 3: Rate Limits Not Documented

**Status:** ⚠️ Open

**Description:** API documentation doesn't specify rate limits (requests per minute/hour).

**Observed Behavior:** No 429 errors during testing (522 products, 6 pages).

**Workaround:** Conservative pagination (100 per page), exponential backoff retry implemented.

---

## Performance

### Benchmark: Full Catalog Sync

**Test Date:** November 25, 2024

**Configuration:**
- 522 products
- 6 pages (100 products per page)
- No variant enrichment
- No price enrichment

**Results:**
- **Total Time:** ~12 seconds
- **API Calls:** 6 (pagination only)
- **Products/Second:** ~43

### Benchmark: Variant Enrichment

**Configuration:**
- 2 products
- Variant enrichment enabled
- Average 10 variants per product

**Results:**
- **Total Time:** ~8 seconds
- **API Calls:** 2 (products) + 2 (variants) + 20 (inventory) = 24 total
- **Products/Second:** ~0.25 (with enrichment)

**Takeaway:** Variant enrichment is ~170x slower. Use `--limit` during testing.

---

## Roadmap

### Completed ✅
- [x] API client with all /v1 endpoints
- [x] Subscription-Key + Bearer token authentication
- [x] Pagination (pageNumber/pageSize)
- [x] Transformer with real field mapping
- [x] Variant enrichment (optional)
- [x] Price list integration (optional)
- [x] Incremental sync support (updatedAt filter)
- [x] Rate limit detection & retry
- [x] JSONL persistence
- [x] CLI with multiple sync modes
- [x] Integration testing

### In Progress 🚧
- [ ] Jest integration tests
- [ ] Token refresh logic (waiting for API docs)
- [ ] Colour hex code mapping (workaround table)

### Planned 📋
- [ ] Parallel variant fetching with circuit breaker
- [ ] Product image endpoint integration
- [ ] Variant inbound inventory tracking
- [ ] Parallel pagination (if rate limits allow)
- [ ] Extended metadata capture (fit, gender, coreRange)

---

## Changelog

### 2024-11-25 - Production Ready Release
- ✅ All endpoints implemented and validated with live API
- ✅ Transformer supports real AS Colour fields (styleCode, styleName, fabricWeight, composition)
- ✅ Variant enrichment feature complete (fetch variants + inventory per style)
- ✅ Price list integration complete (bearer token protected)
- ✅ Incremental sync support (updatedAt:min parameter)
- ✅ Rate limit detection & retry (429/503 with exponential backoff)
- ✅ CLI with dry-run, full, and incremental modes
- ✅ Documentation complete

### 2024-11-25 - API Specification Integration
- Updated endpoints to official /v1 spec
- Added authentication flow (POST /v1/api/authentication)
- Implemented bearer token for protected endpoints
- Fixed response parsing (data nested under .data property)

### 2024-11-25 - Initial Scaffold
- Created client with pagination
- Created transformer with placeholder mapping
- Created persistence layer (JSONL)
- Created CLI tool with basic flags

---

**Last Updated:** November 25, 2024  
**Integration Status:** ✅ Production Ready  
**Maintainer:** PrintShop OS Team  
**Validated With:** AS Colour API (info@mintprints.com credentials, 522 products synced)
