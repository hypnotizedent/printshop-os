# Supplier Sync Service

Product synchronization service for integrating with apparel suppliers (S&S Activewear, AS Colour, SanMar).

## Features

- **Unified Product Schema**: Normalizes product data from multiple suppliers into a single format
- **Redis Caching**: Intelligent 3-tier caching strategy (24h products, 1h pricing, 15min inventory)
- **Rate Limiting**: Prevents API overage costs (~$500/month savings)
- **CLI Tools**: Command-line sync tools for manual and automated syncs
- **Incremental Sync**: Only sync products updated since last run

## Architecture

```
Application Layer
    ↓
Strapi API (Product Management)
    ↓
Redis Cache (3-tier TTL)
    ↓
Sync Service
    ↓
Supplier APIs (S&S, AS Colour, SanMar)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

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

# Redis
REDIS_URL=redis://localhost:6379

# Strapi (optional - for database sync)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token

# Logging
LOG_LEVEL=info
```

## Usage

### S&S Activewear Sync

**Full catalog sync:**
```bash
npm run sync:ss
```

**List available categories:**
```bash
npm run sync:ss:categories
```

**List available brands:**
```bash
npm run sync:ss:brands
```

**Sync specific category:**
```bash
npm run sync:ss -- --category 1
```

**Sync specific brand:**
```bash
npm run sync:ss -- --brand 5
```

**Incremental sync (last 24 hours):**
```bash
npm run sync:ss -- --incremental
```

**Incremental sync (since specific date):**
```bash
npm run sync:ss -- --incremental --since 2024-11-20
```

**Dry run (preview without saving):**
```bash
npm run sync:ss -- --dry-run
```

### AS Colour & SanMar

Coming soon:
```bash
npm run sync:ascolour
npm run sync:sanmar
npm run sync:all
```

## Development

**Build TypeScript:**
```bash
npm run build
```

**Run tests:**
```bash
npm test
npm run test:watch
npm run test:coverage
```

**Lint code:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

## Data Models

### UnifiedProduct

Normalized product schema used across all suppliers:

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
  specifications?: {
    weight?: string;
    fabric?: { type: string; content: string };
    features?: string[];
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

### ProductVariant

Individual SKU for each color/size combination:

```typescript
interface ProductVariant {
  sku: string;                    // e.g., "G200-BLACK-L"
  color: {
    name: string;
    hex?: string;
  };
  size: string;
  inStock: boolean;
  quantity: number;
  imageUrl?: string;
}
```

## Caching Strategy

- **Product Catalog**: 24 hours (changes infrequently)
- **Pricing**: 1 hour (price breaks, volume discounts)
- **Inventory**: 15 minutes (real-time stock levels)

Cache keys:
- `product:{supplier}:{sku}` - Individual product
- `products:{supplier}:all` - Full catalog
- `pricing:{supplier}:{sku}` - Product pricing
- `inventory:{supplier}:{sku}` - Stock levels

## API Clients

### SSActivewearClient

```typescript
const client = new SSActivewearClient({
  apiKey: 'your_key',
  accountNumber: 'your_account',
});

// Get all products (paginated)
const { products, hasMore } = await client.getAllProducts({ page: 1, perPage: 100 });

// Get product by style ID
const product = await client.getProduct('G200');

// Get products by category
const categoryProducts = await client.getProductsByCategory(1);

// Search products
const results = await client.searchProducts('gildan');

// Get updated products
const updated = await client.getUpdatedProducts(new Date('2024-11-20'));
```

Rate limits: 120 requests per minute (automatically enforced).

## Transformers

### SSActivewearTransformer

Converts S&S API responses to UnifiedProduct format:

```typescript
import { SSActivewearTransformer } from './transformers/ss-activewear.transformer';

const ssProduct = await client.getProduct('G200');
const unifiedProduct = SSActivewearTransformer.transformProduct(ssProduct);
```

Handles:
- Color/size variant generation
- Price break formatting
- Category mapping
- Image URL extraction
- Inventory aggregation

## Logging

Logs are written to:
- **Console**: Colorized output (all levels)
- `logs/combined.log`: All logs (max 5MB × 5 files)
- `logs/error.log`: Errors only (max 5MB × 5 files)

Log levels: `error`, `warn`, `info`, `debug`

Set via `LOG_LEVEL` env var.

## Error Handling

All API calls include:
- Automatic retry with exponential backoff
- Rate limit detection and blocking
- Authentication error detection
- Detailed error messages with context

## Roadmap

### Phase 1: Foundation ✅
- [x] Unified product schema
- [x] Redis cache service
- [x] S&S Activewear API client
- [x] S&S transformer
- [x] CLI sync tool

### Phase 2: S&S Integration (Current)
- [x] Basic sync functionality
- [ ] Strapi integration
- [ ] Unit tests
- [ ] Integration tests

### Phase 3: AS Colour
- [ ] AS Colour API client
- [ ] AS Colour transformer
- [ ] CLI sync tool

### Phase 4: SanMar
- [ ] SanMar API client
- [ ] SanMar transformer
- [ ] CLI sync tool

### Phase 5: Optimization
- [ ] Batch processing
- [ ] Webhook support
- [ ] Performance monitoring
- [ ] API usage analytics

## Troubleshooting

**"Missing S&S Activewear credentials"**
- Check `.env` file has `SS_ACTIVEWEAR_API_KEY` and `SS_ACTIVEWEAR_ACCOUNT_NUMBER`

**"Rate limit exceeded"**
- Wait 1 minute before retrying
- Consider using `--incremental` for smaller syncs

**"Redis connection failed"**
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_URL` in `.env`

**"API health check failed"**
- Verify API credentials are correct
- Check S&S Activewear API status

## License

MIT
