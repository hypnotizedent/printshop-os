# Supplier API Connectors

This directory contains TypeScript connector classes for integrating with various supplier APIs.

## Overview

The connector system provides a unified interface for fetching product data from multiple suppliers with built-in:
- **Error handling** with automatic retries
- **Exponential backoff** for rate limiting
- **Response normalization** to a common schema
- **Authentication** (Basic Auth, API Keys, OAuth)
- **Comprehensive test coverage** (10+ tests per connector)

## Available Connectors

### 1. S&S Activewear (`ss-activewear.ts`)
- **Authentication**: HTTP Basic Auth
- **Products**: 500+ items
- **Features**: Style catalog, colors, sizes, inventory

**Usage:**
```typescript
import { createSSActivewearConnector } from './connectors/ss-activewear';

const connector = createSSActivewearConnector();

// Fetch all products
const products = await connector.fetchProducts();

// Fetch single product
const product = await connector.fetchProduct('SS-001');

// Test connection
const isConnected = await connector.testConnection();
```

**Environment Variables:**
- `SS_USERNAME` - S&S Activewear API username
- `SS_PASSWORD` - S&S Activewear API password
- `SS_BASE_URL` - (optional) API base URL, defaults to `https://api.ssactivewear.com/v2`

---

### 2. AS Colour (`as-colour.ts`)
- **Authentication**: API Key (Subscription-Key header)
- **Products**: 300+ items
- **Features**: Style codes, colors, materials, composition

**Usage:**
```typescript
import { createASColourConnector } from './connectors/as-colour';

const connector = createASColourConnector();

// Fetch all products
const products = await connector.fetchProducts();

// Fetch single product
const product = await connector.fetchProduct('AS-5001');

// Test connection
const isConnected = await connector.testConnection();
```

**Environment Variables:**
- `ASCOLOUR_API_KEY` - AS Colour API subscription key
- `ASCOLOUR_BASE_URL` - (optional) API base URL, defaults to `https://api.ascolour.com/v1/catalog`

---

### 3. SanMar (`sanmar.ts`)
- **Authentication**: OAuth 2.0 (client credentials)
- **Products**: 1000+ items
- **Features**: Corporate apparel, brands (Nike, Adidas), bulk pricing

**Usage:**
```typescript
import { createSanMarConnector } from './connectors/sanmar';

const connector = createSanMarConnector();

// Fetch all products
const products = await connector.fetchProducts();

// Fetch single product
const product = await connector.fetchProduct('SM-001');

// Test connection
const isConnected = await connector.testConnection();
```

**Environment Variables:**
- `SANMAR_CLIENT_ID` - SanMar OAuth client ID
- `SANMAR_CLIENT_SECRET` - SanMar OAuth client secret
- `SANMAR_BASE_URL` - (optional) API base URL, defaults to `https://api.sanmar.com`

---

## Common Schema

All connectors normalize responses to this common schema:

```typescript
interface NormalizedProduct {
  supplier: string;           // Supplier name
  styleId: string;            // Unique product/style ID
  name: string;               // Product name
  brand: string;              // Brand name
  category: string;           // Product category
  sizes: string[];            // Available sizes
  colors: ColorVariant[];     // Color options
  imageUrls: string[];        // Product images
  material?: string;          // Fabric composition
  tags?: string[];            // Product features/tags
  description?: string;       // Product description
  baseCost?: number;          // Base price
  bulkBreaks?: BulkPriceBreak[]; // Bulk pricing tiers
  totalInventory?: number;    // Stock quantity
  inStock?: boolean;          // Availability
  lastUpdated?: string;       // ISO timestamp
}
```

## Retry Logic

All connectors inherit retry logic from `BaseConnector`:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Multiplier**: 2x (exponential)
- **Jitter**: 30% random variation to prevent thundering herd

**Retryable Errors:**
- 5xx server errors (500-599)
- 429 Rate Limit Exceeded
- 408 Request Timeout
- Network errors (no response)

**Non-Retryable Errors:**
- 4xx client errors (400, 401, 403, 404, etc.)

## Testing

Each connector has 10+ unit tests covering:
- Successful data fetching
- Error handling and retries
- Response normalization
- Different response structures
- Connection testing
- Authentication flows

**Run tests:**
```bash
npm test
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

## Architecture

```
BaseConnector (abstract)
├── Retry logic with exponential backoff
├── Error normalization
├── Axios client configuration
└── Logging

├── SSActivewearConnector
│   ├── Basic Auth
│   └── Style normalization
│
├── ASColourConnector
│   ├── API Key Auth
│   └── Product normalization
│
└── SanMarConnector
    ├── OAuth 2.0 flow
    ├── Token caching
    └── Product normalization
```

## Custom Configuration

You can also instantiate connectors with custom configuration:

```typescript
import { SSActivewearConnector } from './connectors/ss-activewear';

const connector = new SSActivewearConnector({
  baseUrl: 'https://api.ssactivewear.com/v2',
  auth: {
    username: 'your-username',
    password: 'your-password',
  },
  timeout: 60000, // 60 seconds
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 3,
  },
});
```

## Error Handling

All connectors throw normalized errors:

```typescript
try {
  const products = await connector.fetchProducts();
} catch (error) {
  console.error('Failed to fetch products:', error.message);
  // Error format: "API Error (status): message"
}
```

## Contributing

When adding a new connector:
1. Extend `BaseConnector`
2. Implement `SupplierConnector` interface
3. Add normalization logic to match common schema
4. Write 10+ tests covering all major scenarios
5. Update this README
