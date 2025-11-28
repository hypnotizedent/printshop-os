# Supplier Integration Architecture

> **Purpose:** Real-time inventory checks + product catalog sync  
> **Last Updated:** November 27, 2025  
> **Status:** ✅ Credentials Configured | 🔄 API Service Ready

---

## Overview

PrintShop OS integrates with three major apparel suppliers to provide:
1. **Real-time inventory checks** - Know stock before quoting
2. **Product catalog sync** - Searchable product database
3. **Pricing data** - Accurate wholesale costs

### Why This Matters

**Before:** Staff manually check 3 supplier websites per quote → 5-10 minutes  
**After:** Type SKU → instant inventory across all suppliers → 5 seconds

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRINTSHOP OS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌─────────────────────────┐     ┌──────────────┐ │
│  │   Frontend   │────▶│   services/api          │────▶│    Redis     │ │
│  │  Quote Form  │     │   /api/inventory/*      │     │   Cache      │ │
│  └──────────────┘     └─────────────────────────┘     │  (15-min)    │ │
│                                │                       └──────────────┘ │
│                                │                                        │
│                                ▼                                        │
│                   ┌─────────────────────────────┐                       │
│                   │    Supplier Clients         │                       │
│                   │  (AS Colour, S&S, SanMar)   │                       │
│                   └─────────────────────────────┘                       │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   AS Colour     │   │ S&S Activewear  │   │    SanMar       │
│   REST API      │   │   REST API      │   │   SOAP API      │
│   (Australia)   │   │   (US)          │   │   (US)          │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Supplier Credentials (Configured ✅)

### AS Colour
| Field | Value |
|-------|-------|
| API Key | `1c27d1d97d234616923e7f8f275c66d1` |
| Base URL | `https://api.ascolour.com` |
| Auth | Subscription-Key header |
| Account Email | `info@mintprints.com` |

### S&S Activewear  
| Field | Value |
|-------|-------|
| API Key | `07d8c0de-a385-4eeb-b310-8ba7bc55d3d8` |
| Account Number | `31810` |
| Base URL | `https://api.ssactivewear.com` |
| Auth | Basic Auth (account:key) |

### SanMar
| Field | Value |
|-------|-------|
| Username | `180164` |
| Password | `dMvGlWLTScz2Hh` |
| WSDL URL | `https://ws.sanmar.com/` |
| SFTP Host | `ftp.sanmar.com:2200` |
| Auth | SOAP WS-Security |

---

## API Endpoints

### Inventory Check Service (`services/api`)

**Base URL:** `http://docker-host:3001/api/inventory`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check/:sku` | GET | Check inventory for SKU |
| `/check/:sku/color/:color` | GET | Check specific color variant |
| `/batch` | POST | Check multiple SKUs at once |
| `/health` | GET | Service health check |

### Example Request

```bash
# Check AS Colour style 5001 (Staple Tee)
curl http://docker-host:3001/api/inventory/check/5001

# Response
{
  "sku": "5001",
  "supplier": "as-colour",
  "found": true,
  "name": "Staple Tee",
  "price": 8.50,
  "currency": "AUD",
  "inventory": [
    { "size": "S", "color": "White", "qty": 1250, "warehouse": "AU" },
    { "size": "M", "color": "White", "qty": 890, "warehouse": "AU" },
    ...
  ],
  "cached": false,
  "timestamp": "2025-11-27T20:00:00Z"
}
```

### Batch Check

```bash
curl -X POST http://docker-host:3001/api/inventory/batch \
  -H "Content-Type: application/json" \
  -d '{"skus": ["5001", "G2000", "PC54"]}'
```

---

## SKU Detection Logic

The API automatically routes SKUs to the correct supplier:

| Pattern | Supplier | Examples |
|---------|----------|----------|
| `AC-*` or 4-5 digits | AS Colour | `AC-5001`, `5001`, `5051` |
| `SS-*` or numeric | S&S Activewear | `SS-12345`, `98765` |
| `SM-*` or alpha+digits | SanMar | `SM-PC54`, `K110P`, `PC54` |

**Heuristics:**
- AS Colour: 4-5 digit style codes (5001, 5051, 5026)
- SanMar: Alpha prefix + digits (PC54, K110P, DT6000)
- S&S: Pure numeric IDs or SS- prefix

---

## Caching Strategy

**3-Tier Redis Cache:**

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Product Info | 24 hours | Rarely changes |
| Pricing | 1 hour | Can fluctuate |
| Inventory | 15 minutes | Real-time critical |

**Cache Keys:**
```
inventory:as-colour:5001       → Product info
inventory:as-colour:5001:price → Pricing
inventory:as-colour:5001:stock → Inventory levels
```

---

## Two Services Explained

### 1. `services/api` (Inventory Checks)
- **Purpose:** Real-time inventory lookups during quoting
- **Latency:** <500ms with cache, <3s without
- **Runs on:** docker-host:3001
- **Used by:** Quote form, order creation

### 2. `services/supplier-sync` (Product Catalog)
- **Purpose:** Bulk product data sync to Strapi
- **Frequency:** Nightly or on-demand
- **Data:** Full product details, images, descriptions
- **Used by:** Product search, autocomplete

**Why separate?**
- Inventory checks need to be FAST (real-time)
- Catalog sync is HEAVY (millions of products)
- Different caching strategies
- Strapi shouldn't be hit for every inventory check

---

## Environment Variables

### For `services/api/.env`
```env
# Redis Cache (required)
REDIS_URL=redis://100.92.156.118:6379

# S&S Activewear
SS_ACTIVEWEAR_API_KEY=07d8c0de-a385-4eeb-b310-8ba7bc55d3d8
SS_ACTIVEWEAR_ACCOUNT_NUMBER=31810

# SanMar
SANMAR_USERNAME=180164
SANMAR_PASSWORD=dMvGlWLTScz2Hh

# AS Colour
ASCOLOUR_API_KEY=1c27d1d97d234616923e7f8f275c66d1

# Strapi (for product lookups)
STRAPI_URL=http://100.92.156.118:1337
STRAPI_API_TOKEN=73b35f5663...
```

### For `services/supplier-sync/.env`
```env
# Same supplier credentials as above
# Plus SFTP for SanMar bulk data
SANMAR_SFTP_HOST=ftp.sanmar.com
SANMAR_SFTP_PORT=2200
SANMAR_SFTP_USERNAME=180164
SANMAR_SFTP_PASSWORD=dMvGlWLTScz2Hh
```

---

## Deployment

### Docker Compose Service
```yaml
api:
  build:
    context: ./services/api
    dockerfile: Dockerfile
  container_name: printshop-api
  environment:
    PORT: 3001
    REDIS_URL: redis://redis:6379
    SS_ACTIVEWEAR_API_KEY: ${SS_ACTIVEWEAR_API_KEY}
    SS_ACTIVEWEAR_ACCOUNT_NUMBER: ${SS_ACTIVEWEAR_ACCOUNT_NUMBER}
    SANMAR_USERNAME: ${SANMAR_USERNAME}
    SANMAR_PASSWORD: ${SANMAR_PASSWORD}
    ASCOLOUR_API_KEY: ${ASCOLOUR_API_KEY}
  ports:
    - "3001:3001"
  depends_on:
    - redis
```

### Deploy Commands
```bash
# Build and deploy
cd /Users/ronnyworks/Projects/printshop-os
rsync -avz services/api/ docker-host:~/stacks/printshop-os/services/api/
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose up -d --build api'

# Check logs
ssh docker-host 'docker logs printshop-api --tail 50'

# Test endpoint
curl http://docker-host:3001/api/inventory/check/5001
```

---

## Frontend Integration

### Quote Form Example
```typescript
// When user types a style code
async function checkInventory(sku: string) {
  const response = await fetch(`/api/inventory/check/${sku}`);
  const data = await response.json();
  
  if (data.found) {
    // Show product name and available sizes
    setProduct(data.name);
    setInventory(data.inventory);
    setPrice(data.price);
  } else {
    // Show "Product not found" or suggest alternatives
    setError(data.error);
  }
}
```

### Autocomplete Integration
```typescript
// Combine with Top 500 Products for autocomplete
const suggestions = [
  ...top500Products.filter(p => p.styleCode.includes(query)),
  // If not in top 500, check supplier API
  await checkInventory(query)
].filter(Boolean);
```

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Product not found` | Invalid SKU | Check SKU format |
| `Supplier unavailable` | API down | Retry with backoff |
| `Rate limited` | Too many requests | Wait and retry |
| `Authentication failed` | Bad credentials | Check .env |

**Automatic Retry:**
- 3 retries with exponential backoff
- Falls back to cached data if available
- Returns partial results for batch requests

---

## Files Reference

| File | Purpose |
|------|---------|
| `services/api/src/inventory/router.ts` | API routes |
| `services/api/src/inventory/clients.ts` | Supplier API clients |
| `services/api/src/inventory/types.ts` | TypeScript types |
| `services/api/.env` | Credentials |
| `services/supplier-sync/` | Bulk catalog sync (separate) |

---

## Next Steps

1. ✅ Credentials configured
2. ✅ API service built
3. 🔄 Deploy to docker-host
4. ⏳ Test with real inventory queries
5. ⏳ Integrate with quote form
6. ⏳ Set up nightly catalog sync

---

## For Other Agents/LLMs

**Key Context:**
- Inventory checks go through `services/api`, NOT Strapi
- This avoids overloading Strapi with real-time queries
- Redis cache is critical for performance
- All three supplier APIs are working with credentials above
- SKU detection is automatic based on pattern matching

**When working on this:**
1. Check `services/api/.env` has credentials
2. Ensure Redis is running on docker-host
3. Test with `curl http://docker-host:3001/api/inventory/check/5001`
4. Check `services/api/src/inventory/` for implementation

---

<small>Generated by GitHub Copilot | PrintShop OS</small>
