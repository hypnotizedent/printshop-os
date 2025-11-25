# Adding a New Supplier - Step-by-Step Guide

This guide walks through the complete process of integrating a new apparel supplier into the Supplier Sync Service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step 1: Create API Client](#step-1-create-api-client)
4. [Step 2: Create Transformer](#step-2-create-transformer)
5. [Step 3: Create CLI Tool](#step-3-create-cli-tool)
6. [Step 4: Add Configuration](#step-4-add-configuration)
7. [Step 5: Write Tests](#step-5-write-tests)
8. [Step 6: Document Integration](#step-6-document-integration)
9. [Step 7: Update Package Scripts](#step-7-update-package-scripts)
10. [Example: Alphabroder Integration](#example-alphabroder-integration)
11. [Checklist](#checklist)

---

## Prerequisites

Before starting, gather:

1. **API Documentation**: Endpoint URLs, authentication methods, rate limits
2. **Test Credentials**: API keys, usernames, passwords for development/testing
3. **Sample Data**: Example API responses (JSON, XML, CSV)
4. **Rate Limits**: Requests per minute/hour, any throttling policies
5. **Pagination Strategy**: Page-based, cursor-based, offset-based
6. **Authentication Flow**: API key, OAuth2, Bearer token, Basic Auth, SFTP

---

## Project Structure

New supplier code should follow this structure:

```
services/supplier-sync/
├── src/
│   ├── clients/
│   │   └── {supplier}.client.ts          # API client
│   ├── transformers/
│   │   └── {supplier}.transformer.ts     # Data transformer
│   ├── cli/
│   │   └── sync-{supplier}.ts            # CLI tool
│   └── types/
│       └── {supplier}.types.ts           # TypeScript interfaces (optional)
├── tests/
│   └── integration/
│       └── test-{supplier}.spec.ts       # Integration tests
├── docs/
│   └── suppliers/
│       └── {SUPPLIER}.md                 # Supplier-specific docs
└── .env                                   # Add credentials here
```

**Naming Convention:**
- Use lowercase with hyphens: `as-colour`, `ss-activewear`, `bella-canvas`
- Client class: `AlphabroderClient`
- Transformer class: `AlphabroderTransformer`
- CLI file: `sync-alphabroder.ts`

---

## Step 1: Create API Client

### Location
`src/clients/{supplier}.client.ts`

### Template

```typescript
import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

// Define supplier-specific types
export interface SupplierRawProduct {
  id: string;
  name: string;
  // ... other fields from API
}

export interface SupplierClientConfig {
  apiKey: string;
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class SupplierClient {
  private client: AxiosInstance;
  private config: SupplierClientConfig;

  constructor(config: SupplierClientConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelayMs: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add retry interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        
        // Retry on rate limit or service unavailable
        if (response?.status === 429 || response?.status === 503) {
          const retryAfter = response.headers['retry-after'];
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.config.retryDelayMs * Math.pow(2, config.__retryCount || 0);

          config.__retryCount = (config.__retryCount || 0) + 1;

          if (config.__retryCount <= this.config.maxRetries) {
            logger.warn(
              `Rate limited, retrying in ${delay}ms... (attempt ${config.__retryCount}/${this.config.maxRetries})`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client.request(config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * List products with pagination
   */
  async listProducts(page: number = 1, perPage: number = 100): Promise<SupplierRawProduct[]> {
    try {
      const response = await this.client.get('/products', {
        params: { page, per_page: perPage },
      });
      
      return response.data.products || response.data || [];
    } catch (error) {
      logger.error('Failed to list products', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all products (auto-paginated)
   */
  async getAllProducts(): Promise<SupplierRawProduct[]> {
    const allProducts: SupplierRawProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const products = await this.listProducts(page, 100);
      allProducts.push(...products);
      
      hasMore = products.length === 100; // Adjust based on API behavior
      page++;

      // Safety cap
      if (page > 50) {
        logger.warn('Reached safety cap of 50 pages');
        break;
      }
    }

    return allProducts;
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<SupplierRawProduct> {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get product ${productId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health'); // Adjust endpoint
      return true;
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return false;
    }
  }
}
```

### Key Considerations

1. **Authentication**: Implement in constructor (API key, OAuth2, Bearer token)
2. **Retry Logic**: Handle 429 (rate limit) and 503 (unavailable)
3. **Pagination**: Auto-paginate with safety cap (50-100 pages max)
4. **Error Handling**: Log errors with context, re-throw for caller
5. **Response Parsing**: Handle nested data structures (`response.data.data`)
6. **Rate Limits**: Add delays between requests if required

---

## Step 2: Create Transformer

### Location
`src/transformers/{supplier}.transformer.ts`

### Template

```typescript
import { UnifiedProduct, ProductVariant, ProductCategory, SupplierName } from '../types/product';
import { SupplierRawProduct } from '../clients/supplier.client';
import { logger } from '../utils/logger';

export class SupplierTransformer {
  /**
   * Transform supplier product to unified schema
   */
  static transformProduct(raw: SupplierRawProduct): UnifiedProduct {
    return {
      sku: `PREFIX-${raw.id}`,
      name: raw.name,
      brand: raw.brand || 'Unknown',
      description: raw.description || '',
      category: this.mapCategory(raw.category),
      supplier: 'supplier-name' as SupplierName,
      
      variants: this.buildVariants(raw),
      images: this.extractImages(raw),
      
      pricing: {
        basePrice: raw.price || 0,
        currency: 'USD',
        breaks: this.parsePriceBreaks(raw.priceBreaks),
      },
      
      specifications: {
        weight: raw.weight,
        fabric: raw.fabric ? {
          type: raw.fabric.type,
          content: raw.fabric.content,
        } : undefined,
        features: raw.features || [],
      },
      
      availability: {
        inStock: raw.inStock || false,
        totalQuantity: raw.quantity || 0,
      },
      
      metadata: {
        supplierProductId: raw.id,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Build variants from color/size combinations
   */
  private static buildVariants(raw: SupplierRawProduct): ProductVariant[] {
    const variants: ProductVariant[] = [];

    // Example: Cross-product colors × sizes
    for (const color of raw.colors || []) {
      for (const size of raw.sizes || []) {
        variants.push({
          sku: `${raw.id}-${color.code}-${size.code}`,
          color: {
            name: color.name,
            hex: color.hex,
          },
          size: size.name,
          inStock: (color.quantity || 0) > 0,
          quantity: color.quantity || 0,
          imageUrl: color.imageUrl,
        });
      }
    }

    return variants;
  }

  /**
   * Map supplier category to normalized enum
   */
  private static mapCategory(categoryName?: string): ProductCategory {
    if (!categoryName) return ProductCategory.OTHER;

    const normalized = categoryName.toLowerCase();

    if (normalized.includes('t-shirt') || normalized.includes('tee')) {
      return ProductCategory.TSHIRTS;
    }
    if (normalized.includes('polo')) {
      return ProductCategory.POLOS;
    }
    if (normalized.includes('hoodie') || normalized.includes('sweatshirt')) {
      return ProductCategory.HOODIES;
    }
    if (normalized.includes('jacket')) {
      return ProductCategory.JACKETS;
    }
    if (normalized.includes('pant') || normalized.includes('trouser')) {
      return ProductCategory.PANTS;
    }
    if (normalized.includes('short')) {
      return ProductCategory.SHORTS;
    }
    if (normalized.includes('bag')) {
      return ProductCategory.BAGS;
    }
    if (normalized.includes('hat') || normalized.includes('cap')) {
      return ProductCategory.HATS;
    }

    return ProductCategory.OTHER;
  }

  /**
   * Extract image URLs
   */
  private static extractImages(raw: SupplierRawProduct): string[] {
    const images: string[] = [];

    // Add main image
    if (raw.imageUrl) {
      images.push(raw.imageUrl);
    }

    // Add additional images
    if (raw.additionalImages) {
      images.push(...raw.additionalImages);
    }

    return images;
  }

  /**
   * Parse price breaks from supplier format
   */
  private static parsePriceBreaks(breaks: any[]): any[] {
    if (!breaks || breaks.length === 0) return [];

    return breaks.map(b => ({
      quantity: b.quantity || b.qty || b.min,
      price: b.price || b.unitPrice,
    }));
  }
}
```

### Key Considerations

1. **SKU Prefix**: Use consistent prefix (e.g., "AC-", "SS-", "AB-")
2. **Category Mapping**: Map supplier categories to `ProductCategory` enum
3. **Variant Generation**: Cross-product colors × sizes or parse supplier variants
4. **Image Extraction**: Handle multiple image URLs
5. **Price Parsing**: Convert supplier price format to standard breaks
6. **Null Safety**: Use optional chaining and fallbacks

---

## Step 3: Create CLI Tool

### Location
`src/cli/sync-{supplier}.ts`

### Template

```typescript
import { SupplierClient } from '../clients/supplier.client';
import { SupplierTransformer } from '../transformers/supplier.transformer';
import { persistProducts } from '../persistence/productPersistence';
import { logger } from '../utils/logger';

interface Args {
  dryRun?: boolean;
  limit?: number;
  // Add other flags as needed
}

function parseArgs(): Args {
  const args: Args = {};

  process.argv.forEach((arg, index) => {
    if (arg === '--dry-run') {
      args.dryRun = true;
    }
    if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1], 10);
    }
  });

  return args;
}

async function main() {
  const args = parseArgs();

  // Validate environment variables
  const requiredEnvVars = ['SUPPLIER_API_KEY', 'SUPPLIER_BASE_URL'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Initialize client
  const client = new SupplierClient({
    apiKey: process.env.SUPPLIER_API_KEY!,
    baseURL: process.env.SUPPLIER_BASE_URL!,
  });

  // Health check
  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    logger.warn('API health check failed, proceeding with caution...');
  }

  // Fetch products
  logger.info('Fetching products...');
  let rawProducts = await client.getAllProducts();

  // Apply limit
  if (args.limit) {
    rawProducts = rawProducts.slice(0, args.limit);
  }

  logger.info(`Fetched ${rawProducts.length} products`);

  // Transform products
  logger.info('Transforming products...');
  const unifiedProducts = rawProducts.map(raw => 
    SupplierTransformer.transformProduct(raw)
  );

  // Dry run: print sample and exit
  if (args.dryRun) {
    logger.info('DRY RUN: Would sync products');
    logger.info(`Sample product:\n${JSON.stringify(unifiedProducts[0], null, 2)}`);
    return;
  }

  // Persist products
  logger.info('Persisting products...');
  await persistProducts(unifiedProducts);

  logger.info('✅ Sync complete');
}

main().catch(error => {
  logger.error('Sync failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
```

### Key Considerations

1. **Argument Parsing**: Support `--dry-run`, `--limit`, `--incremental`
2. **Environment Validation**: Check required env vars before starting
3. **Health Check**: Validate API connectivity
4. **Dry Run**: Print sample output without persisting
5. **Error Handling**: Catch and log errors with stack traces
6. **Progress Logging**: Log at each major step

---

## Step 4: Add Configuration

### Update `.env`

```bash
# Supplier Name
SUPPLIER_API_KEY=your_api_key_here
SUPPLIER_BASE_URL=https://api.supplier.com
SUPPLIER_ACCOUNT_NUMBER=your_account # if required
```

### Update `.env.example`

Add the same variables with placeholder values.

---

## Step 5: Write Tests

### Location
`tests/integration/test-{supplier}.spec.ts`

### Template

```typescript
import { SupplierClient } from '../../src/clients/supplier.client';
import { SupplierTransformer } from '../../src/transformers/supplier.transformer';

describe('Supplier Integration', () => {
  let client: SupplierClient;

  beforeAll(() => {
    client = new SupplierClient({
      apiKey: process.env.SUPPLIER_API_KEY!,
      baseURL: process.env.SUPPLIER_BASE_URL!,
    });
  });

  describe('Authentication', () => {
    it('should authenticate successfully', async () => {
      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Product Fetching', () => {
    it('should list products', async () => {
      const products = await client.listProducts(1, 10);
      
      expect(products).toBeDefined();
      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
    });

    it('should get single product', async () => {
      const products = await client.listProducts(1, 1);
      const productId = products[0].id;
      
      const product = await client.getProduct(productId);
      
      expect(product).toBeDefined();
      expect(product.id).toBe(productId);
    });
  });

  describe('Transformation', () => {
    it('should transform product to unified schema', async () => {
      const products = await client.listProducts(1, 1);
      const raw = products[0];
      
      const unified = SupplierTransformer.transformProduct(raw);
      
      expect(unified).toHaveProperty('sku');
      expect(unified).toHaveProperty('name');
      expect(unified).toHaveProperty('variants');
      expect(unified.supplier).toBe('supplier-name');
    });
  });
});
```

### Run Tests

```bash
npm test -- tests/integration/test-supplier.spec.ts
```

---

## Step 6: Document Integration

### Location
`docs/suppliers/{SUPPLIER}.md`

### Template

```markdown
# Supplier Name Integration

**Status:** ✅ Production Ready | 🚧 In Progress | ⚠️ Experimental

**Last Updated:** YYYY-MM-DD

---

## Overview

[Brief description of supplier, product types, market focus]

**Supplier Website:** https://www.supplier.com  
**API Documentation:** https://api.supplier.com/docs  
**Support Contact:** support@supplier.com

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPPLIER_API_KEY` | Yes | - | API authentication key |
| `SUPPLIER_BASE_URL` | No | `https://api.supplier.com` | API base URL |

### Example `.env`

```env
SUPPLIER_API_KEY=your_api_key_here
SUPPLIER_BASE_URL=https://api.supplier.com
```

---

## API Details

### Authentication

[Describe authentication method: API key, OAuth2, Bearer token, etc.]

### Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/products` | GET | List all products | Yes |
| `/products/{id}` | GET | Get product details | Yes |

### Rate Limits

- **Limit:** 120 requests per minute
- **Response:** HTTP 429 with `Retry-After` header
- **Handling:** Exponential backoff (1s, 2s, 4s)

### Pagination

- **Type:** Page-based
- **Parameters:** `page` (1-indexed), `per_page` (max 100)
- **Safety Cap:** 50 pages

---

## Data Transformation

### Field Mapping

| Supplier Field | UnifiedProduct Field | Notes |
|----------------|----------------------|-------|
| `id` | `sku` | Prefixed with "SUP-" |
| `name` | `name` | - |
| `brand` | `brand` | - |
| `category` | `category` | Mapped via heuristics |

### Sample Raw Product

```json
{
  "id": "ABC123",
  "name": "Classic T-Shirt",
  "brand": "Supplier Brand",
  "price": 12.99,
  "colors": [...]
}
```

### Sample Unified Product

```json
{
  "sku": "SUP-ABC123",
  "name": "Classic T-Shirt",
  "brand": "Supplier Brand",
  "supplier": "supplier-name",
  "pricing": { "basePrice": 12.99, "currency": "USD" }
}
```

---

## CLI Usage

### Basic Sync

```bash
npm run sync:supplier
```

### Dry Run

```bash
npm run sync:supplier -- --dry-run --limit=10
```

### Full Sync

```bash
npm run sync:supplier:full
```

---

## Known Issues

- [ ] Issue 1: Description
- [ ] Issue 2: Description

---

## Changelog

### YYYY-MM-DD - Initial Integration
- Implemented API client
- Added transformer
- Created CLI tool
```

---

## Step 7: Update Package Scripts

### Edit `package.json`

```json
{
  "scripts": {
    "sync:supplier": "ts-node src/cli/sync-supplier.ts --dry-run --limit=10",
    "sync:supplier:full": "ts-node src/cli/sync-supplier.ts"
  }
}
```

---

## Example: Alphabroder Integration

Let's walk through integrating **Alphabroder** as a concrete example.

### Step 1: API Research

- **API Base URL:** `https://api.alphabroder.com/v1`
- **Authentication:** API Key in `X-API-Key` header
- **Pagination:** Cursor-based with `cursor` parameter
- **Rate Limit:** 100 requests per minute

### Step 2: Create Client

```typescript
// src/clients/alphabroder.client.ts
export class AlphabroderClient {
  constructor(config: { apiKey: string; baseURL: string }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: { 'X-API-Key': config.apiKey },
    });
  }

  async listProducts(cursor?: string): Promise<{ products: any[]; nextCursor?: string }> {
    const response = await this.client.get('/products', {
      params: { cursor, limit: 100 },
    });
    
    return {
      products: response.data.items,
      nextCursor: response.data.next_cursor,
    };
  }
}
```

### Step 3: Create Transformer

```typescript
// src/transformers/alphabroder.transformer.ts
export class AlphabroderTransformer {
  static transformProduct(raw: any): UnifiedProduct {
    return {
      sku: `AB-${raw.style_id}`,
      name: raw.product_name,
      brand: raw.brand_name,
      category: this.mapCategory(raw.category),
      supplier: 'alphabroder',
      // ... rest of fields
    };
  }
}
```

### Step 4: Create CLI

```typescript
// src/cli/sync-alphabroder.ts
async function main() {
  const client = new AlphabroderClient({
    apiKey: process.env.ALPHABRODER_API_KEY!,
    baseURL: process.env.ALPHABRODER_BASE_URL!,
  });

  let cursor: string | undefined;
  const allProducts = [];

  do {
    const { products, nextCursor } = await client.listProducts(cursor);
    allProducts.push(...products);
    cursor = nextCursor;
  } while (cursor);

  const unified = allProducts.map(AlphabroderTransformer.transformProduct);
  await persistProducts(unified);
}
```

### Step 5: Add Config

```bash
# .env
ALPHABRODER_API_KEY=your_key_here
ALPHABRODER_BASE_URL=https://api.alphabroder.com/v1
```

### Step 6: Test

```bash
npm run sync:alphabroder -- --dry-run --limit=5
```

---

## Checklist

Use this checklist to track integration progress:

### Planning
- [ ] Gather API documentation
- [ ] Obtain test credentials
- [ ] Collect sample API responses
- [ ] Identify rate limits and pagination strategy

### Implementation
- [ ] Create API client (`src/clients/{supplier}.client.ts`)
- [ ] Add retry logic with exponential backoff
- [ ] Implement pagination (auto-paginate with safety cap)
- [ ] Create transformer (`src/transformers/{supplier}.transformer.ts`)
- [ ] Map fields to UnifiedProduct schema
- [ ] Build variant generation logic
- [ ] Create CLI tool (`src/cli/sync-{supplier}.ts`)
- [ ] Add argument parsing (dry-run, limit, incremental)
- [ ] Add environment validation
- [ ] Update `.env` and `.env.example`

### Testing
- [ ] Write integration tests (`tests/integration/test-{supplier}.spec.ts`)
- [ ] Test authentication
- [ ] Test product fetching
- [ ] Test pagination
- [ ] Test transformation
- [ ] Test error handling (rate limits, network errors)
- [ ] Perform manual dry-run sync

### Documentation
- [ ] Create supplier doc (`docs/suppliers/{SUPPLIER}.md`)
- [ ] Document API endpoints
- [ ] Document authentication flow
- [ ] Document rate limits
- [ ] Document pagination strategy
- [ ] Add usage examples
- [ ] Document known issues
- [ ] Update main README.md
- [ ] Add to COMPLETE_DOCUMENTATION.md

### Package & Scripts
- [ ] Add package scripts to `package.json`
- [ ] Add `sync:{supplier}` (dry-run)
- [ ] Add `sync:{supplier}:full`
- [ ] Add incremental script if supported

### Review
- [ ] Code review
- [ ] Test with production credentials
- [ ] Verify rate limits are respected
- [ ] Confirm data quality (spot-check products)
- [ ] Update roadmap/status docs

---

## Tips & Best Practices

1. **Start Small**: Test with `--limit=5` before full syncs
2. **Use Dry Runs**: Always test with `--dry-run` first
3. **Log Everything**: Use `logger.info/warn/error` liberally
4. **Handle Nulls**: Supplier APIs often have inconsistent data
5. **Test Edge Cases**: Empty responses, single-item pages, rate limits
6. **Document Quirks**: Note any API oddities in supplier docs
7. **Version Control**: Commit after each major step
8. **Ask for Help**: Review existing integrations (AS Colour, S&S) for patterns

---

**Last Updated:** November 25, 2024  
**Maintainer:** PrintShop OS Team
