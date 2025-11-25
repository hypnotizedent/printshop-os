# S&S Activewear Integration Guide

**Status:** ⏳ Planned (Not Yet Implemented)  
**Priority:** High (Complete Supplier Trilogy)  
**Estimated Effort:** 4-6 hours  
**Last Updated:** November 25, 2025

---

## Overview

S&S Activewear is a major wholesale supplier of blank apparel and promotional products with a robust REST API. This integration will complete the supplier trilogy alongside AS Colour and SanMar, providing access to their extensive catalog of 50,000+ products.

**Why S&S Activewear:**
- Large catalog (50,000+ products)
- Strong REST API with comprehensive documentation
- Real-time inventory and pricing
- Competitive pricing for bulk orders
- Complements AS Colour (premium) and SanMar (volume) offerings

---

## API Overview

### Authentication
- **Type:** Account-based authentication
- **Credentials Required:**
  - Account Number
  - API Key
- **Endpoint:** `https://api.ssactivewear.com`

### Rate Limits
- **Limit:** 120 requests per minute
- **Burst:** Short bursts allowed within limit
- **Recommendation:** Implement rate limiting with queue

### Key Endpoints

```typescript
// Products
GET /v2/products                    // List all products (paginated)
GET /v2/products/{styleId}          // Single product detail
GET /v2/products/search             // Search by keyword
GET /v2/products/updated            // Products updated since date

// Inventory
GET /v2/inventory/{styleId}         // Stock levels by variant

// Pricing
GET /v2/pricing/{styleId}           // Price breaks by quantity

// Metadata
GET /v2/categories                  // List all categories
GET /v2/brands                      // List all brands
GET /v2/sizes                       // Size chart
GET /v2/colors                      // Color catalog

// Health
GET /v2/health                      // API health check
```

---

## Data Structure

### Product Response Example

```json
{
  "styleID": "G200",
  "styleName": "Gildan G200 - Ultra Cotton T-Shirt",
  "brandName": "Gildan",
  "categoryID": 1,
  "categoryName": "T-Shirts",
  "description": "6.0 oz., pre-shrunk 100% cotton...",
  "fabricContent": "100% Cotton",
  "fabricWeight": "6.0 oz",
  "colorCount": 52,
  "sizeCount": 7,
  "colors": [
    {
      "colorID": 12,
      "colorName": "Black",
      "colorHex": "#000000",
      "colorFamily": "Black",
      "sizes": [
        {
          "sizeID": 1,
          "sizeName": "S",
          "inventory": [
            {
              "warehouse": "NV",
              "quantity": 1250
            },
            {
              "warehouse": "PA",
              "quantity": 890
            }
          ]
        }
      ]
    }
  ],
  "pricing": {
    "priceTiers": [
      { "quantity": 1, "price": 5.82 },
      { "quantity": 12, "price": 4.98 },
      { "quantity": 72, "price": 4.42 },
      { "quantity": 144, "price": 3.98 }
    ],
    "msrp": 12.00
  },
  "images": [
    {
      "type": "front",
      "url": "https://cdn.ssactivewear.com/Images/Style/G200_fm.jpg"
    },
    {
      "type": "back",
      "url": "https://cdn.ssactivewear.com/Images/Style/G200_bk.jpg"
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Client & Transformer (2-3 hours)

**1. Create REST API Client** (`src/clients/ss-activewear.client.ts`)
```typescript
class SSActivewearClient {
  constructor(config: {
    accountNumber: string;
    apiKey: string;
    baseURL?: string;
  });
  
  // Core methods
  async authenticate(): Promise<void>;
  async healthCheck(): Promise<boolean>;
  async getAllProducts(options?: PaginationOptions): Promise<Product[]>;
  async getProduct(styleId: string): Promise<Product>;
  async getProductInventory(styleId: string): Promise<Inventory>;
  async getProductPricing(styleId: string): Promise<Pricing>;
  async searchProducts(query: string): Promise<Product[]>;
  async getUpdatedProducts(since: Date): Promise<Product[]>;
  
  // Metadata
  async getCategories(): Promise<Category[]>;
  async getBrands(): Promise<Brand[]>;
  async getColors(): Promise<Color[]>;
  async getSizes(): Promise<Size[]>;
}
```

**2. Create Transformer** (`src/transformers/ss-activewear.transformer.ts`)
```typescript
class SSActivewearTransformer {
  transformProduct(ssProduct: SSProduct): UnifiedProduct {
    // Map S&S product structure to UnifiedProduct schema
    // Generate variants for color x size combinations
    // Extract pricing tiers
    // Aggregate inventory across warehouses
    // Map categories to standard taxonomy
  }
  
  transformBatch(ssProducts: SSProduct[]): UnifiedProduct[] {
    return ssProducts.map(p => this.transformProduct(p));
  }
}
```

### Phase 2: CLI Tool (1 hour)

**Create Sync Tool** (`src/cli/sync-ss-activewear.ts`)
```bash
# Full catalog sync
npx ts-node src/cli/sync-ss-activewear.ts

# Category-specific sync
npx ts-node src/cli/sync-ss-activewear.ts --category 1

# Brand-specific sync
npx ts-node src/cli/sync-ss-activewear.ts --brand "Gildan"

# Incremental sync (last 24 hours)
npx ts-node src/cli/sync-ss-activewear.ts --incremental

# Dry run (preview without saving)
npx ts-node src/cli/sync-ss-activewear.ts --dry-run --limit=100

# Test mode (limited records)
npx ts-node src/cli/sync-ss-activewear.ts --limit=1000
```

**Features:**
- Health check before sync
- Progress logging (every 100 products)
- Error handling with retry logic
- Dry run mode (preview only)
- Limit flag (test with N products)
- Incremental sync support
- JSONL persistence
- Redis caching (optional)

### Phase 3: Documentation (1-2 hours)

**Complete This Guide:**
- Field mapping tables (S&S → UnifiedProduct)
- Category mapping (S&S categories → ProductCategory enum)
- Error handling strategies
- Performance benchmarks
- Troubleshooting guide
- Usage examples

---

## Data Mapping

### S&S Product → UnifiedProduct

| S&S Field | UnifiedProduct Field | Transformation |
|-----------|---------------------|----------------|
| `styleID` | `supplierProductId` | Direct |
| `styleName` | `name` | Direct |
| `brandName` | `brand` | Direct |
| `description` | `description` | Direct |
| `categoryName` | `category` | Map via category mapping table |
| `fabricContent` | `specifications.fabric.content` | Direct |
| `fabricWeight` | `specifications.fabric.weight` | Direct |
| `colors[].colorName` | `variants[].color.name` | One variant per color/size |
| `colors[].colorHex` | `variants[].color.hex` | Direct |
| `colors[].sizes[].sizeName` | `variants[].size` | Direct |
| `colors[].sizes[].inventory` | `variants[].quantity` | Sum across warehouses |
| `pricing.priceTiers` | `pricing.breaks` | Map quantity → price |
| `pricing.msrp` | `pricing.msrp` | Direct |
| `images[]` | `images[]` | Extract URLs |

### Category Mapping

| S&S Category | UnifiedProduct Category | Notes |
|--------------|-------------------------|-------|
| T-Shirts | TEES | Standard cotton tees |
| Polo Shirts | POLOS | Short/long sleeve polos |
| Sweatshirts | OUTERWEAR | Crewneck sweatshirts |
| Hoodies | OUTERWEAR | Pullover/zip hoodies |
| Bags | BAGS | Totes, backpacks |
| Caps | HEADWEAR | Baseball caps, beanies |
| Youth | TEES | Category: YOUTH (if added) |
| Other | OTHER | Miscellaneous items |

---

## Expected Performance

### Benchmarks (Estimated)

| Operation | Records | Estimated Time | Speed |
|-----------|---------|---------------|-------|
| Health check | 1 | <1s | - |
| Single product | 1 | <1s | - |
| Category sync | ~500 | 30-60s | 8-16 products/s |
| Brand sync | ~1,000 | 1-2 min | 8-16 products/s |
| Full catalog | 50,000 | 50-100 min* | 8-16 products/s |

*Based on 120 req/min rate limit with 100 products per request

**Memory Usage (Estimated):**
- Single product: <1 MB
- Category sync: 10-50 MB
- Full catalog: 200-500 MB (in-memory processing)

**Storage (Estimated):**
- JSONL file size: ~50-100 MB for 50,000 products
- Redis cache: ~500 MB (if enabled)

---

## Environment Configuration

### Required Environment Variables

```bash
# S&S Activewear API Credentials
SS_ACTIVEWEAR_API_KEY=your_api_key_here
SS_ACTIVEWEAR_ACCOUNT_NUMBER=your_account_number
SS_ACTIVEWEAR_BASE_URL=https://api.ssactivewear.com

# Data Storage
SS_ACTIVEWEAR_DATA_DIR=./data/ssactivewear

# Redis Cache (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=900  # 15 minutes

# Logging
LOG_LEVEL=info
```

---

## Testing Strategy

### Unit Tests
- [ ] Transformer: Product mapping
- [ ] Transformer: Variant generation
- [ ] Transformer: Category mapping
- [ ] Transformer: Pricing structure
- [ ] Client: Rate limiting
- [ ] Client: Error handling
- [ ] Client: Retry logic

### Integration Tests
- [ ] Full catalog sync (small subset)
- [ ] Category sync
- [ ] Brand sync
- [ ] Incremental sync
- [ ] Dry run mode
- [ ] JSONL persistence
- [ ] Redis caching

### Manual Testing
- [ ] Health check endpoint
- [ ] Authentication
- [ ] Single product fetch
- [ ] Category listing
- [ ] Brand listing
- [ ] Search functionality
- [ ] Inventory fetching
- [ ] Pricing fetching

---

## Known Challenges

### 1. Rate Limiting
**Challenge:** 120 requests/minute limit  
**Solution:** Implement rate limiter with queue (using `rate-limiter-flexible`)  
**Impact:** Full catalog sync takes 50-100 minutes

### 2. Warehouse Inventory Aggregation
**Challenge:** Inventory split across multiple warehouses (NV, PA, etc.)  
**Solution:** Sum quantities across all warehouses for `totalQuantity`  
**Trade-off:** Lose warehouse-level detail (can add to metadata if needed)

### 3. Large Color/Size Matrix
**Challenge:** Some products have 50+ colors × 7 sizes = 350+ variants  
**Solution:** Generate variants efficiently, consider pagination for large products  
**Impact:** Memory usage spikes for products with many variants

### 4. Category Taxonomy
**Challenge:** S&S has 20+ categories, UnifiedProduct has 8 standard categories  
**Solution:** Create detailed mapping table, use OTHER for unmapped categories  
**Trade-off:** Some granularity lost (can preserve original in metadata)

---

## Cost Analysis

### API Usage
- **Free Tier:** Not specified (need to confirm with S&S)
- **Rate Limit:** 120 requests/minute
- **Full Sync Frequency:** Daily recommended
- **Incremental Sync:** Hourly (only updated products)

**Estimated Costs:**
- Full sync: 50,000 products ÷ 100 per request = 500 requests = 4.2 minutes (within free tier)
- Incremental sync: ~10-50 requests = <1 minute
- Monthly: ~30 full syncs + 720 incremental = ~15,500 requests
- **Total Monthly Cost:** $0 (assuming generous free tier)

### Storage Costs
- JSONL files: ~100 MB (negligible)
- Redis cache: ~500 MB (free tier <1GB)
- **Total Storage Cost:** $0/month

### Caching Savings
- Without cache: 120 req/min × $0.01/req = $1.20/min
- With cache (15 min TTL): 8 req/min × $0.01/req = $0.08/min
- **Monthly Savings:** ~$500 (estimated)

---

## Implementation Checklist

### Pre-Implementation
- [ ] Obtain S&S Activewear API credentials
- [ ] Review official API documentation
- [ ] Test API endpoints with Postman/curl
- [ ] Confirm rate limits and authentication method
- [ ] Study product data structure

### Development (Phase 1: Client & Transformer)
- [ ] Create `SSActivewearClient` class
- [ ] Implement authentication
- [ ] Implement core API methods (products, inventory, pricing)
- [ ] Add rate limiting (120 req/min)
- [ ] Create `SSActivewearTransformer` class
- [ ] Implement product transformation
- [ ] Implement variant generation
- [ ] Implement category mapping
- [ ] Add error handling

### Development (Phase 2: CLI Tool)
- [ ] Create `sync-ss-activewear.ts` CLI script
- [ ] Add command-line argument parsing
- [ ] Implement health check
- [ ] Implement full catalog sync
- [ ] Implement category/brand filtering
- [ ] Implement incremental sync
- [ ] Add dry run mode
- [ ] Add progress logging
- [ ] Integrate JSONL persistence
- [ ] Integrate Redis caching

### Documentation (Phase 3)
- [ ] Complete field mapping tables
- [ ] Add usage examples
- [ ] Document error scenarios
- [ ] Add troubleshooting guide
- [ ] Document performance benchmarks
- [ ] Create quickstart guide
- [ ] Update main README

### Testing
- [ ] Write unit tests (transformer, client)
- [ ] Write integration tests (CLI workflows)
- [ ] Manual testing with real API
- [ ] Performance benchmarking
- [ ] Error scenario testing

### Deployment
- [ ] Add to production cron jobs
- [ ] Set up monitoring/alerting
- [ ] Configure log rotation
- [ ] Document runbook for operations

---

## Success Criteria

### Functional Requirements
- ✅ Authenticate with S&S API
- ✅ Fetch products with pagination
- ✅ Transform to UnifiedProduct schema
- ✅ Generate variants (color × size)
- ✅ Extract pricing tiers
- ✅ Aggregate warehouse inventory
- ✅ Persist to JSONL format
- ✅ Cache in Redis (optional)
- ✅ Handle errors gracefully

### Performance Requirements
- ✅ Process 50,000 products in <100 minutes
- ✅ Memory usage <500 MB for full sync
- ✅ Rate limiting (120 req/min enforced)
- ✅ Incremental sync <5 minutes

### Quality Requirements
- ✅ Unit test coverage >70%
- ✅ Integration tests passing
- ✅ Error handling for all API failures
- ✅ Comprehensive documentation
- ✅ CLI tool user-friendly (flags, help text)

---

## Related Documentation

- **AS Colour Integration:** [ASCOLOUR.md](ASCOLOUR.md) (653 lines) - REST API pattern
- **SanMar Integration:** [SANMAR.md](SANMAR.md) (560 lines) - SFTP/CSV pattern
- **UnifiedProduct Schema:** `src/types/product.ts`
- **Adding New Suppliers:** `docs/ADDING_NEW_SUPPLIER.md`
- **Main Documentation:** `docs/COMPLETE_DOCUMENTATION.md`

---

## Questions & TODOs

### Open Questions
1. **API Credentials:** Do we have S&S Activewear account credentials?
2. **Rate Limits:** Is 120 req/min the actual limit? Need to confirm.
3. **Pagination:** What's the max page size? (Assuming 100 products/page)
4. **Incremental Sync:** Does API support `updated_since` parameter?
5. **Image URLs:** Are image URLs public or require authentication?

### Future Enhancements
- [ ] Webhook support (real-time inventory updates)
- [ ] Warehouse-level inventory tracking
- [ ] Image caching (CDN integration)
- [ ] Product recommendation engine
- [ ] Price comparison across suppliers
- [ ] Automated restock alerts

---

**Status:** ⏳ Ready to Implement  
**Next Step:** Obtain API credentials and begin Phase 1 development  
**Estimated Completion:** 4-6 hours after credentials obtained
