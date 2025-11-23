# Supplier Integration Epic - Consolidated

**Status:** Phase 3 - Service Integration  
**Priority:** High  
**Effort:** 3-4 weeks  
**Dependencies:** Phase 1 (Strapi), Phase 2 (Core Sales)

---

## 📋 Epic Overview

Consolidate all supplier-related work into a single, executable supplier integration system that syncs product data, pricing, inventory, and handles caching, normalization, and graceful degradation.

**Why This Matters:**
- Suppliers are the foundation of accurate pricing and fulfillment
- Real-time inventory = accurate quotes & reduced lost sales
- Multiple suppliers = product diversity & availability
- Caching = cost savings ($$$) + faster response times
- Error handling = reliability when suppliers are down

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Supplier Integration System (services/api/supplier-sync/)
└─────────────────────────────────────────────────────────┘
              ↓
┌──────────────┬──────────────┬──────────────┐
│     S&S      │  AS Colour   │   SanMar     │
│ Activewear   │ (Basic Tees) │ (Corporate)  │
└──────────────┴──────────────┴──────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Normalization Layer (unified product schema)
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Caching Layer (Redis - 1hr/1day/7day TTLs)
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Strapi Database (products, variants, prices, inventory)
└─────────────────────────────────────────────────────────┘
              ↓
┌──────────────┬──────────────┬──────────────┐
│  Quote UI    │ Pricing Eng. │ Dashboard    │
│ (realtime)   │ (accuracy)   │ (visibility) │
└──────────────┴──────────────┴──────────────┘
```

---

## 📐 Supplier API Status & Executability

### ✅ **S&S Activewear (Issue #58)**
- **API Type:** REST API  
- **Auth:** API Key (header: `Authorization: Bearer <key>`)
- **Endpoints Needed:**
  - GET `/products` - Product catalog (300+ items)
  - GET `/products/:id` - Single product details
  - GET `/products/:id/variants` - Size/color options
  - GET `/inventory` - Real-time stock levels
  - GET `/prices` - Current pricing

- **Executable with provided docs?** ✅ **YES**
  - Standard REST, well-documented auth
  - Can be called from Node.js service with axios
  - Webhook support available for real-time updates

- **Timeline:** 3-4 days
- **Complexity:** Medium
- **Dependencies:** None (can run independently)

---

### ✅ **AS Colour API (Issue #62)**
- **API Type:** REST API (GraphQL option available)
- **Auth:** API Token (header: `X-API-Token: <token>`)
- **Endpoints Needed:**
  - GET `/catalog/products` - Full product list
  - GET `/catalog/products/:code` - Product by style code
  - GET `/catalog/styles/:styleId/variants` - Variants per style
  - GET `/inventory/levels` - Stock availability
  - GET `/pricing/bulk` - Bulk pricing tiers

- **Executable with provided docs?** ✅ **YES**
  - Clean API with good documentation
  - Standard HTTP methods
  - Supports bulk queries (efficient)

- **Timeline:** 3-4 days
- **Complexity:** Medium
- **Dependencies:** None (can run independently)

---

### ✅ **SanMar API (Issue #26)**
- **API Type:** REST API
- **Auth:** OAuth 2.0 (need client_id/client_secret)
- **Endpoints Needed:**
  - GET `/styles` - Available styles/SKUs
  - GET `/styles/:id/colors` - Colors per style
  - GET `/styles/:id/sizes` - Size charts
  - GET `/inventory/:sku` - Current inventory
  - GET `/pricing/:sku/:quantity` - Pricing for quantities

- **Executable with provided docs?** ✅ **YES**
  - OAuth flow can be handled in Node.js
  - RESTful API with clear structure
  - Pagination support for large datasets

- **Timeline:** 3-4 days
- **Complexity:** Medium-High (OAuth adds complexity)
- **Dependencies:** OAuth token management service

---

## 🎯 Consolidated Sub-Tasks (From Issues #24-68)

### Phase 3.1: Core Infrastructure (Week 1-2)

#### Sub-Task 1: Supplier Data Normalization Layer (Issue #64)
**What:** Create unified data model that handles different supplier API formats

**Executable:** ✅ YES - Straightforward data mapping

**Implementation:**
```javascript
// Unified product schema
{
  supplier_sku: "SS-LB1000",        // Original supplier SKU
  internal_sku: "PROD-00001",       // Our internal ID
  name: "Beefy-T Short Sleeve",
  supplier: "sands",                // s&s, ascolour, sanmar
  
  // Pricing (normalized)
  base_cost: 3.25,
  bulk_breaks: [
    { qty: 1, price: 3.25 },
    { qty: 100, price: 2.95 },
    { qty: 500, price: 2.50 }
  ],
  
  // Variants (normalized)
  variants: [
    { size: "S", color: "Black", sku: "SS-LB1000-BLK-S" },
    { size: "M", color: "Black", sku: "SS-LB1000-BLK-M" }
  ],
  
  // Inventory
  total_inventory: 450,
  in_stock: true,
  last_updated: "2025-01-15T10:30:00Z"
}
```

**Effort:** 2-3 days  
**Priority:** High  
**Blockers:** None

---

#### Sub-Task 2: Data Transformation Service (Issue #64)
**What:** Transform each supplier's API format → unified schema

**Executable:** ✅ YES - Pattern-based transformations

**Implementation Files:**
- `lib/transformers/sandar.js` - S&S Activewear → unified format
- `lib/transformers/ascolour.js` - AS Colour → unified format
- `lib/transformers/sanmar.js` - SanMar → unified format
- `lib/transformers/index.js` - Routing logic

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** None

---

#### Sub-Task 3: Caching Strategy Implementation (Issue #67 & #30)
**What:** Redis caching with TTL strategy to reduce API calls and costs

**Executable:** ✅ YES - Standard Redis patterns

**Caching Strategy:**
```javascript
// Cache TTLs by data type
CACHE_TTLS = {
  PRODUCTS: 24 * 60 * 60,      // 24 hours (stable)
  INVENTORY: 1 * 60 * 60,      // 1 hour (changes frequently)
  PRICING: 7 * 24 * 60 * 60,   // 7 days (contracts stable)
  VARIANTS: 24 * 60 * 60        // 24 hours
}

// Key structure
CACHE_KEYS = {
  PRODUCT: `supplier:${supplier}:product:${sku}`,
  INVENTORY: `supplier:${supplier}:inventory:${sku}`,
  CATALOG: `supplier:${supplier}:catalog`
}

// Cost savings: ~$500/month @ typical API costs
```

**Effort:** 2-3 days  
**Priority:** High (cost reduction)  
**Blockers:** None

---

#### Sub-Task 4: Graceful Degradation & Error Handling (Issue #68)
**What:** Fallback to cached data when suppliers are down

**Executable:** ✅ YES - Standard circuit breaker pattern

**Implementation:**
```javascript
// Circuit breaker for each supplier
SUPPLIER_STATUS = {
  sands: { status: "up", failures: 0, last_failed: null },
  ascolour: { status: "up", failures: 0, last_failed: null },
  sanmar: { status: "up", failures: 0, last_failed: null }
}

// Logic:
// 1. Try live API
// 2. On error: increment failures
// 3. >3 failures: switch to "degraded" mode
// 4. Serve cached data with "cached as of X" indicator
// 5. Alert admin
// 6. Retry after 5min

// Response when degraded:
{
  data: { /* cached data */ },
  status: "cached",
  message: "Using cached data - supplier API currently unavailable",
  cached_at: "2025-01-15T10:30:00Z"
}
```

**Effort:** 2-3 days  
**Priority:** High (reliability)  
**Blockers:** None

---

### Phase 3.2: Supplier Integrations (Week 3-4)

#### Sub-Task 5: S&S Activewear Integration (Issue #58)
**What:** Sync S&S Activewear product data

**Executable:** ✅ YES - API documented and straightforward

**Implementation Steps:**
```javascript
// 1. Auth
const client = axios.create({
  baseURL: 'https://api.sands.com',
  headers: { 'Authorization': `Bearer ${S&S_API_KEY}` }
});

// 2. Fetch products (paginated)
async function syncProducts() {
  let page = 1;
  while (true) {
    const response = await client.get('/products', {
      params: { page, limit: 100 }
    });
    
    for (const product of response.data) {
      // Transform and store
      const normalized = transformSands(product);
      await saveToStrapi(normalized);
      await cacheProduct(normalized);
    }
    
    if (!response.data.length) break;
    page++;
  }
}

// 3. Schedule sync
// Run every 24 hours for stable products
// Run every 1 hour for inventory
// Use Bull job queue
```

**Integration Points:**
- Strapi (store products)
- Redis (cache)
- Bull (scheduling)
- Logging (errors)

**Effort:** 3-4 days  
**Priority:** High (largest inventory)  
**Blockers:** None

---

#### Sub-Task 6: AS Colour Integration (Issue #62)
**What:** Sync AS Colour product data

**Executable:** ✅ YES - Well-documented REST API

**Implementation:** Similar to S&S, with variant handling for color/size combos

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** None

---

#### Sub-Task 7: SanMar Integration (Issue #26)
**What:** Sync SanMar product data

**Executable:** ✅ YES - OAuth flow + REST API

**OAuth Flow:**
```javascript
// 1. Get token
async function getToken() {
  const response = await axios.post('https://api.sanmar.com/oauth/token', {
    grant_type: 'client_credentials',
    client_id: SANMAR_CLIENT_ID,
    client_secret: SANMAR_CLIENT_SECRET
  });
  return response.data.access_token;
}

// 2. Use token for API calls
const token = await getToken();
const client = axios.create({
  baseURL: 'https://api.sanmar.com',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Refresh token on expiry
```

**Effort:** 3-4 days  
**Priority:** High (corporate wear)  
**Blockers:** None

---

### Phase 3.3: Product Features (Week 4)

#### Sub-Task 8: Product Variants System (Issue #29)
**What:** Support size/color/fabric combinations

**Executable:** ✅ YES - Data already available from suppliers

**Variant Representation:**
```javascript
// Product with variants
{
  id: "PROD-00001",
  name: "Basic T-Shirt",
  variants: [
    {
      sku: "PROD-00001-BLK-S",
      size: "S",
      color: "Black",
      fabric: "100% Cotton",
      price: 3.25,
      inventory: 150
    },
    {
      sku: "PROD-00001-BLK-M",
      size: "M",
      color: "Black",
      fabric: "100% Cotton",
      price: 3.25,
      inventory: 200
    }
    // ... more variants
  ]
}
```

**Effort:** 2-3 days  
**Priority:** High  
**Blockers:** Sub-tasks 5-7 (need variant data from suppliers)

---

#### Sub-Task 9: Inventory Sync Strategy (Issue #65 & #28)
**What:** Plan sync frequency and implement real-time capabilities

**Executable:** ✅ YES - Job queue based approach

**Sync Strategy:**
```javascript
// Real-time high-volume items (top 50 products)
// Sync every 15-30 minutes
schedule('*/15 * * * *', syncHighVolume);

// Daily sync for all products
schedule('0 2 * * *', syncAllProducts);

// Event-driven on quote creation
// (check inventory when quote requested)
onQuoteCreate(async (quote) => {
  for (const item of quote.items) {
    await checkLiveInventory(item.sku);
  }
});

// Alert thresholds
if (inventory < LOW_STOCK_THRESHOLD) {
  alertManagement({
    product: sku,
    current: inventory,
    threshold: LOW_STOCK_THRESHOLD
  });
}
```

**Effort:** 2-3 days  
**Priority:** Medium  
**Blockers:** Sub-tasks 5-7

---

### Phase 3.4: Testing & Deployment (Week 4+)

#### Sub-Task 10: Comprehensive Testing
**What:** Unit tests, integration tests, load tests

**Test Coverage:**
```javascript
// Unit tests
✓ Transformer functions (S&S, AS Colour, SanMar)
✓ Cache logic (hit/miss/expiry)
✓ Circuit breaker (failure detection)
✓ Sync scheduling

// Integration tests
✓ Full sync flow (API → transform → cache → DB)
✓ Fallback behavior (when API down)
✓ Error recovery (retry logic)

// Load tests
✓ Handle 1000 concurrent quote requests
✓ Cache performance under load
✓ API rate limiting handling
```

**Effort:** 2-3 days  
**Priority:** High  
**Blockers:** Sub-tasks 1-9

---

#### Sub-Task 11: Monitoring & Alerting
**What:** Real-time visibility into supplier status and sync health

**Metrics to Track:**
```javascript
// Sync health
- Sync success rate per supplier (target: >99%)
- Sync duration (alert if >5min)
- Last successful sync timestamp
- Error count and types

// Cache health
- Cache hit rate (target: >80%)
- Cache size (alert if >1GB)
- TTL effectiveness

// Supplier availability
- API response time
- Error rate per supplier
- Outage alerts (real-time)

// Dashboard
- Status page showing all suppliers (green/yellow/red)
- Recent sync history
- Cache stats
- Error logs
```

**Effort:** 2 days  
**Priority:** Medium  
**Blockers:** Sub-tasks 1-9

---

## 🚀 Execution Timeline

```
Week 1-2: Infrastructure
├─ Sub-task 1: Normalization layer (2-3d)
├─ Sub-task 2: Transform service (3-4d)
├─ Sub-task 3: Caching strategy (2-3d)
└─ Sub-task 4: Error handling (2-3d)

Week 3: Supplier Integrations
├─ Sub-task 5: S&S Activewear (3-4d)
├─ Sub-task 6: AS Colour (3-4d)
└─ Sub-task 7: SanMar (3-4d)

Week 4: Features & Deployment
├─ Sub-task 8: Variants system (2-3d)
├─ Sub-task 9: Inventory sync (2-3d)
├─ Sub-task 10: Testing (2-3d)
└─ Sub-task 11: Monitoring (2d)

Total: 3-4 weeks
```

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Sync Reliability** | >99% success rate | Monitor sync logs per supplier |
| **Cache Hit Rate** | >80% | Redis metrics + application logs |
| **API Response Time** | <500ms (cached) / <2s (live) | APM tools (New Relic/Datadog) |
| **Cost Savings** | $500/month reduction | API call tracking vs. before |
| **Fallback Success** | 100% graceful degradation | Test outage scenarios |
| **Time to Market** | 3-4 weeks | Timeline adherence |

---

## 🔗 Integration Dependencies

```
This Epic depends on:
✅ Phase 1: Strapi (data storage)
✅ Phase 2: Job-estimator (pricing engine - ready to receive supplier data)

This Epic enables:
→ Phase 3.2: Accurate quoting (via pricing engine)
→ Phase 3.3: Supplier selection (via product catalog)
→ Phase 2.1: Production dashboard (via inventory visibility)
```

---

## 💡 Key Decisions

1. **Normalization First:** All supplier APIs normalize → single schema (easier to add suppliers later)

2. **Redis Caching:** Reduces API costs + improves response times (standard pattern)

3. **Circuit Breaker:** Handles outages gracefully (critical for production reliability)

4. **Incremental Syncs:** Efficient use of API quotas (don't re-fetch everything each time)

5. **Job Queue:** Reliable async processing (Bull.js handles retries, scheduling)

---

## 📝 Implementation Checklist

- [ ] Phase 3.1: Infrastructure setup (all 4 sub-tasks)
- [ ] Phase 3.2: Supplier integrations (all 3 sub-tasks)
- [ ] Phase 3.3: Product features (2 sub-tasks)
- [ ] Phase 3.4: Testing & deployment (2 sub-tasks)
- [ ] Documentation updates
- [ ] Team training
- [ ] Monitoring setup
- [ ] Production launch

---

## 🎯 Next Steps

1. **Approve this consolidation** (replaces issues #24-68)
2. **Create single Epic issue** with all sub-tasks
3. **Assign team members** to parallel work streams
4. **Set sprint schedule** (3-4 weeks)
5. **Begin Phase 3.1** (infrastructure) immediately

---

**Status:** Ready for implementation  
**Created:** November 23, 2025  
**Updated:** This session  
**Owner:** PrintShop OS Development Team
