# PrintShop OS API Service

TypeScript service for PrintShop OS that handles:
- Live Printavo data sync (15-min polling)
- Order transformation and storage
- Quote generation API
- Supplier API connectors
- Redis caching layer

## Quick Start

### Setup
```bash
cd services/api
npm install
cp .env.example .env
# Edit .env with your API keys
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm test             # Run tests
npm test:coverage    # Run tests with coverage
```

### Sync Operations
```bash
npm run sync:printavo      # Run live Printavo sync
npm run import:historical  # Import historical orders
```

## Project Structure

```
services/api/
├── lib/                    # Core libraries
│   ├── printavo-mapper.ts  # Printavo→Strapi transformation
│   ├── strapi-schema.ts    # Type definitions
│   └── ...
├── scripts/                # CLI scripts
│   ├── sync-printavo-live.ts    # (Task 1.1)
│   ├── import-historical-orders.ts (Task 1.3)
│   └── ...
├── tests/                  # Test suites
│   ├── printavo-mapper.test.ts
│   ├── api.integration.test.ts
│   └── ...
├── mocks/                  # Mock data for testing
│   ├── printavo-responses.ts
│   └── strapi-responses.ts
├── src/                    # API server code (Task 2.1+)
└── dist/                   # Compiled JavaScript output
```

## Phase 2 Tasks

### Priority 1: Foundation
- **Task 1.1**: Live Printavo Data Sync
- **Task 1.2**: Strapi Schema Migration
- **Task 1.3**: Historical Orders Import

### Priority 2: Integration
- **Task 2.1**: Quote API Endpoint
- **Task 2.2**: Supplier API Connectors
- **Task 2.3**: Redis Caching Layer
- **Task 2.4**: Customer Portal API

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run specific test file
npm test printavo-mapper.test.ts

# Run in watch mode
npm test:watch
```

## Configuration

See `.env.example` for all available options.

Key variables:
- `PRINTAVO_API_KEY` - Your Printavo API key
- `STRAPI_API_URL` - Strapi server URL (default: http://localhost:1337)
- `SYNC_INTERVAL_MINUTES` - Polling interval (default: 15)

## API Endpoints (Phase 2)

- `POST /api/quotes` - Generate quote (Task 2.1)
- `GET /api/customer/orders` - List customer orders (Task 2.4)
- `GET /api/customer/quotes` - List customer quotes (Task 2.4)
- `POST /api/customer/auth/login` - Customer login (Task 2.4)

## Dependencies

### Core
- `axios` - HTTP client
- `typescript` - Type safety

### Development
- `ts-jest` - Jest + TypeScript
- `jest` - Testing framework
- `ts-node` - Run TypeScript directly

## Related Documentation

- [Data Flow Guide](./DATA_FLOW.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [API Testing Suite](./API_TESTING_SUITE_DELIVERY.md)
- [Quick Start](./QUICK_START.md)

## License

MIT
