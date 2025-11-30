# Supplier Sync Service

**Version:** 2.1.0  
**Status:** ✅ All APIs Verified Working | ✅ Curated Products System  
**Last Updated:** November 29, 2025

Product synchronization service for integrating with apparel suppliers. Normalizes disparate supplier APIs into a unified schema with intelligent caching and rate limiting.

## 🎯 Key Features

- **Curated Products Catalog**: Store top 500 products in Strapi, query full catalog on-demand via API
- **Real-time Inventory API**: Query stock levels, colors, sizes, and pricing from live supplier APIs
- **Multi-Supplier Support**: AS Colour, S&S Activewear, SanMar integration
- **Smart Caching**: Redis 3-tier cache (24h products, 1h pricing, 15min inventory)

## Quick Links

- 📖 **[Complete Documentation](./COMPLETE_DOCUMENTATION.md)** - Comprehensive reference guide
- 🏗️ **[Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md)** - System architecture (HLBPA style)
- ✅ **[Completion Checklist](./docs/COMPLETION_CHECKLIST.md)** - What's done, what's remaining
- 🆕 **[Adding New Suppliers](./docs/ADDING_NEW_SUPPLIER.md)** - Step-by-step integration guide
- 📦 **Supplier Docs:** [AS Colour](./docs/suppliers/ASCOLOUR.md) | [SanMar](./docs/SANMAR_INTEGRATION.md)

## Current Status

| Supplier | API | Transformer | CLI | Products | Status |
|----------|:---:|:-----------:|:---:|----------|--------|
| **AS Colour** | ✅ | ✅ | ✅ | 522 | Ready for sync |
| **S&S Activewear** | ✅ | ✅ | ✅ | 211K+ | Ready for sync |
| **SanMar** | ✅ | ✅ | ✅ | 415K+ | 494MB EPDD ready |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend / Quote UI                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────────┐      ┌──────────────────────────────────┐
│ Strapi CMS        │      │ Inventory API (on-demand)        │
│ (Top 500 Products)│      │ /api/inventory/check/:sku        │
│ - isCurated=true  │      │ /api/inventory/colors/:sku       │
│ - usageCount      │      │ /api/inventory/sizes/:sku        │
│ - priority        │      │ /api/inventory/pricing/:sku      │
└───────────────────┘      └──────────────────────────────────┘
                                          │
                           ┌──────────────┴──────────────┐
                           ▼                             ▼
                    ┌─────────────┐              ┌─────────────┐
                    │ Redis Cache │◄────────────►│ Supplier    │
                    │ (15min TTL) │              │ APIs        │
                    └─────────────┘              └─────────────┘
```

## Curated Products Management

The curated products system allows you to:
1. Store your top 500 most-used products in Strapi for fast browsing
2. Query the full supplier catalog (500K+ products) on-demand via API
3. Track product usage to automatically identify popular items

### CLI Commands

```bash
# Import popular styles (Gildan, Bella+Canvas, etc.)
npm run curate:import

# List top curated products
npm run curate:list

# Sync products from supplier to Strapi
npm run curate:sync -- --supplier ascolour --limit 100

# Set product as curated with priority
npm run curate -- set-curated --sku AC-5001 --priority 100
```

### Product Query Service

```typescript
import { ProductQueryService } from './services/product-query.service';

const service = new ProductQueryService({
  strapiUrl: 'http://localhost:1337',
  strapiApiToken: 'your-token',
  asColourApiKey: 'your-key',
});

// Search curated products (from Strapi)
const products = await service.searchCuratedProducts('gildan', {
  category: 't-shirts',
  curatedOnly: true,
  limit: 50
});

// Get top products by usage
const topProducts = await service.getTopProducts(50, {
  category: 't-shirts'
});

// Check stock (live API query)
const stock = await service.checkStock('5001', {
  color: 'Black',
  size: 'L'
});

// Get available colors
const colors = await service.getColorsAvailable('AC-5001');

// Get pricing with quantity breaks
const pricing = await service.getPricing('G500', 100);
```

## Inventory API Endpoints

The inventory API provides real-time queries to supplier APIs with Redis caching:

| Endpoint | Description |
|----------|-------------|
| `GET /api/inventory/check/:sku` | Full inventory check with all sizes/colors |
| `GET /api/inventory/check/:sku/color/:color` | Filter inventory by color |
| `GET /api/inventory/colors/:sku` | Get available colors with stock info |
| `GET /api/inventory/sizes/:sku?color=X` | Get available sizes (optionally by color) |
| `GET /api/inventory/pricing/:sku?quantity=N` | Get pricing with volume breaks |
| `POST /api/inventory/batch` | Batch check multiple SKUs |
| `GET /api/inventory/health` | Health check for all suppliers |

### Example Responses

```bash
# Check stock for AS Colour 5001
curl http://localhost:3002/api/inventory/check/5001

# Response
{
  "sku": "5001",
  "name": "Staple Tee",
  "supplier": "as-colour",
  "price": 8.50,
  "totalQty": 15420,
  "inventory": [
    { "size": "S", "color": "Black", "qty": 850 },
    { "size": "M", "color": "Black", "qty": 1200 },
    ...
  ],
  "cached": false,
  "cacheExpires": "2025-11-29T01:30:00Z"
}

# Get available colors
curl http://localhost:3002/api/inventory/colors/5001

# Response
{
  "sku": "5001",
  "colorCount": 24,
  "colors": [
    { "color": "Black", "inStock": true, "totalQty": 5200, "sizes": ["XS","S","M","L","XL","2XL"] },
    { "color": "White", "inStock": true, "totalQty": 4800, "sizes": ["XS","S","M","L","XL","2XL"] },
    ...
  ]
}

# Get pricing with quantity
curl http://localhost:3002/api/inventory/pricing/G500?quantity=144

# Response
{
  "sku": "G500",
  "supplier": "s&s-activewear",
  "basePrice": 3.22,
  "priceBreaks": [
    { "minQty": 1, "price": 3.22 },
    { "minQty": 12, "price": 2.98 },
    { "minQty": 72, "price": 2.75 },
    { "minQty": 144, "price": 2.52 }
  ],
  "priceForQuantity": 2.52
}
```

## Setup

### Prerequisites

- Node.js 18+
- Redis running on localhost:6379 (or configured via REDIS_URL)
- Supplier API credentials

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

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
ASCOLOUR_API_KEY=your_subscription_key
ASCOLOUR_EMAIL=your_email
ASCOLOUR_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# Strapi
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token

# Logging
LOG_LEVEL=info
```

## Usage

### Supplier Sync Commands

```bash
# S&S Activewear
npm run sync:ss                    # Full sync
npm run sync:ss:categories         # List categories
npm run sync:ss:brands             # List brands

# AS Colour
npm run sync:ascolour              # Dry run
npm run sync:ascolour:full         # Full sync with enrichment

# Curated Products
npm run curate:import              # Import popular styles
npm run curate:list                # List top products
npm run curate:sync                # Sync to Strapi
```

## Development

```bash
npm run build          # Build TypeScript
npm test               # Run tests
npm run test:watch     # Watch mode
npm run lint           # Lint code
npm run format         # Format code
```

## Data Models

### UnifiedProduct

```typescript
interface UnifiedProduct {
  sku: string;                    // Supplier's style ID
  name: string;
  brand: string;
  description: string;
  category: ProductCategory;
  supplier: SupplierName;
  variants: ProductVariant[];     // Color/size combinations
  images: string[];
  pricing: {
    basePrice: number;
    currency: string;
    breaks?: PriceBreak[];
  };
  availability: {
    inStock: boolean;
    totalQuantity: number;
  };
  metadata: {
    supplierProductId: string;
    lastUpdated: Date;
  };
}
```

## Caching Strategy

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Product Catalog | 24 hours | Changes infrequently |
| Pricing | 1 hour | Price breaks, volume discounts |
| Inventory | 15 minutes | Real-time stock levels |

## License

MIT
