# PrintShop OS API Scripts

This directory contains scripts for data extraction, synchronization, and management.

## Table of Contents

1. [Printavo Data Extraction](#printavo-data-extraction)
   - [extract-printavo-v2.ts](#extract-printavo-v2ts)
   - [download-printavo-files.ts](#download-printavo-filests)
   - [sync-to-minio.ts](#sync-to-miniots)
2. [Printavo Live Sync](#printavo-live-sync)
   - [sync-printavo-live.ts](#sync-printavo-livets)
3. [Batch Import](#batch-import)
   - [batch-import.ts](#batch-importts)

---

## Printavo Data Extraction

Scripts for complete data extraction from Printavo and archival to MinIO.

### extract-printavo-v2.ts

Extracts all data from Printavo using the v2 GraphQL API.

**Features:**
- Cursor-based pagination
- Rate limiting (500ms between requests)
- Timestamped JSON output
- Comprehensive error handling

**Usage:**
```bash
npm run printavo:extract
```

**Output:**
- `data/printavo-export/v2/{timestamp}/orders.json`
- `data/printavo-export/v2/{timestamp}/customers.json`
- `data/printavo-export/v2/{timestamp}/quotes.json`
- `data/printavo-export/v2/{timestamp}/products.json`
- `data/printavo-export/v2/{timestamp}/invoices.json`
- `data/printavo-export/v2/{timestamp}/summary.json`

**Environment Variables:**
- `PRINTAVO_EMAIL` - Printavo account email
- `PRINTAVO_PASSWORD` - Printavo account password

### download-printavo-files.ts

Downloads artwork, production files, and PDFs from Printavo URLs.

**Features:**
- Parallel downloads (configurable concurrency, default: 5)
- Checkpoint/resume support
- Progress reporting with ETA
- Organized file structure by order

**Usage:**
```bash
# Use most recent extraction
npm run printavo:download-files

# Or specify extraction directory
npm run printavo:download-files data/printavo-export/v2/2025-12-03T00-00-00
```

**Output:**
```
data/printavo-export/v2/{timestamp}/files/
└── by_order/{visualId}/
    ├── artwork/
    ├── production/
    └── pdfs/
```

**Environment Variables:**
- `DOWNLOAD_CONCURRENCY` - Number of parallel downloads (default: 5)

### sync-to-minio.ts

Uploads extracted data and downloaded files to MinIO for long-term archival.

**Features:**
- Uploads JSON exports and files to MinIO
- Creates searchable index files
- Upload integrity verification
- Progress reporting

**Usage:**
```bash
# Use most recent extraction
npm run printavo:sync-minio

# Or specify extraction directory
npm run printavo:sync-minio data/printavo-export/v2/2025-12-03T00-00-00

# Run complete archive (extract + download + sync)
npm run printavo:full-archive
```

**MinIO Structure:**
```
minio://printshop/printavo-archive/
├── exports/{timestamp}/
│   ├── orders.json
│   ├── customers.json
│   └── ...
├── files/by_order/{visualId}/
│   ├── artwork/
│   ├── production/
│   └── pdfs/
└── index/
    ├── archive_{timestamp}.json
    └── latest.json
```

**Environment Variables:**
- `MINIO_ENDPOINT` - MinIO endpoint (default: localhost:9000)
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `MINIO_BUCKET` - MinIO bucket name (default: printshop)
- `MINIO_USE_SSL` - Use SSL (default: false)

---

## Printavo Live Sync

This directory contains scripts for syncing data between Printavo and Strapi.

## sync-printavo-live.ts

Live Printavo Data Sync Service that continuously polls the Printavo API and syncs orders to Strapi.

### Features

- **Automatic Polling**: Fetches orders from Printavo every 15 minutes (configurable)
- **Incremental Sync**: Only fetches orders updated since the last successful sync
- **Error Handling**: Comprehensive error handling with retry logic and exponential backoff
- **Logging**: Multi-level logging (debug, info, warn, error) with file output
- **Statistics**: Tracks sync performance metrics (fetched, synced, errors)
- **Graceful Shutdown**: Properly handles SIGINT and SIGTERM signals

### Prerequisites

1. Node.js 18+ installed
2. Valid Printavo API key
3. Running Strapi instance with API token
4. Environment variables configured (see below)

### Environment Variables

Required:
- `PRINTAVO_API_KEY` - Your Printavo API key
- `STRAPI_API_TOKEN` - Your Strapi API authentication token

Optional (with defaults):
- `PRINTAVO_API_URL` - Printavo API base URL (default: `https://www.printavo.com/api`)
- `STRAPI_API_URL` - Strapi API base URL (default: `http://localhost:1337`)
- `SYNC_INTERVAL_MINUTES` - Polling interval in minutes (default: `15`)
- `SYNC_BATCH_SIZE` - Number of orders to fetch per batch (default: `100`)
- `SYNC_MAX_RETRIES` - Maximum retry attempts for failed requests (default: `3`)
- `SYNC_TIMEOUT_SECONDS` - Request timeout in seconds (default: `30`)
- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, or `error` (default: `info`)

### Usage

#### Using npm script:
```bash
npm run sync:printavo
```

#### Using ts-node directly:
```bash
npx ts-node scripts/sync-printavo-live.ts
```

#### Using environment variables:
```bash
PRINTAVO_API_KEY=your_key \
STRAPI_API_TOKEN=your_token \
SYNC_INTERVAL_MINUTES=30 \
LOG_LEVEL=debug \
npm run sync:printavo
```

#### Using .env file:
Create a `.env` file in the `services/api` directory:
```env
PRINTAVO_API_KEY=your_printavo_api_key_here
STRAPI_API_TOKEN=your_strapi_token_here
SYNC_INTERVAL_MINUTES=15
LOG_LEVEL=info
```

Then run:
```bash
npm run sync:printavo
```

### How It Works

1. **Service Starts**: Loads configuration from environment variables
2. **First Sync**: Immediately runs the first sync cycle
3. **Fetch Orders**: Retrieves orders from Printavo API (filtered by update time)
4. **Transform**: Uses PrintavoMapper to transform orders to Strapi format
5. **Sync**: Upserts each order to Strapi (creates new or updates existing)
6. **Statistics**: Updates sync statistics (counts, times, errors)
7. **Schedule Next**: Waits for configured interval, then repeats from step 3
8. **Error Handling**: Retries failed operations up to max retries with exponential backoff

### Sync Flow

```
┌─────────────────────────────────────────────────┐
│ Start Service                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Load Configuration                              │
│ - Environment variables                         │
│ - Validate required settings                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Run Sync Cycle                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1. Fetch orders from Printavo (with retry) │ │
│ │ 2. Transform each order to Strapi format   │ │
│ │ 3. Upsert to Strapi (with retry)           │ │
│ │ 4. Update statistics                        │ │
│ │ 5. Log results                              │ │
│ └─────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Wait for Interval                               │
│ (default: 15 minutes)                           │
└──────────────────┬──────────────────────────────┘
                   │
                   └──────────────────┐
                                      │
                   ┌──────────────────┘
                   │
                   ▼
              Repeat Cycle
```

### Logging

Logs are written to both:
- **Console**: Real-time log output
- **File**: `data/logs/sync-printavo-YYYY-MM-DD.log` (grouped by day)

Log levels:
- `debug`: Detailed debugging information
- `info`: General informational messages (default)
- `warn`: Warning messages (retries, non-critical errors)
- `error`: Error messages (failed operations)

Example log output:
```
[2025-11-23T19:51:16.715Z] [INFO] Starting Printavo sync service {"intervalMinutes":15,"batchSize":100}
[2025-11-23T19:51:16.717Z] [INFO] Starting sync cycle
[2025-11-23T19:51:17.123Z] [INFO] Fetched 25 orders from Printavo
[2025-11-23T19:51:18.456Z] [INFO] Sync cycle completed {"fetched":25,"synced":25,"errors":0,"duration":"1.23s"}
```

### Statistics

The service tracks comprehensive statistics:

```typescript
{
  totalFetched: number;        // Total orders fetched from Printavo
  totalTransformed: number;    // Total orders successfully transformed
  totalSynced: number;         // Total orders synced to Strapi
  totalErrors: number;         // Total errors encountered
  lastSyncTime: Date;          // Timestamp of last sync attempt
  lastSuccessfulSync: Date;    // Timestamp of last successful sync
  errors: Array<{              // Recent errors (last 100)
    timestamp: Date;
    orderId?: number;
    error: string;
  }>;
}
```

### Error Handling

The service implements robust error handling:

1. **Retry Logic**: Failed API calls are retried up to `SYNC_MAX_RETRIES` times
2. **Exponential Backoff**: Wait time increases with each retry (1s, 2s, 3s, ...)
3. **Partial Success**: If some orders fail, successful orders are still synced
4. **Error Tracking**: Errors are logged and tracked in statistics
5. **Graceful Degradation**: Service continues running even after errors

### Stopping the Service

The service can be stopped gracefully:

- **Ctrl+C**: Sends SIGINT signal
- **Kill command**: Sends SIGTERM signal

Both methods trigger graceful shutdown:
1. Stop accepting new sync cycles
2. Allow current operations to complete
3. Log final statistics
4. Exit cleanly

### Testing

Run the test suite:
```bash
npm test -- sync-printavo-live.test.ts
```

Test coverage:
- 28 comprehensive tests
- 100% function coverage
- Tests for all major components (logger, API clients, sync service, config)

### Troubleshooting

#### Service won't start
- Check that required environment variables are set
- Verify Printavo API key is valid
- Ensure Strapi instance is running and accessible

#### No orders being fetched
- Check Printavo API connectivity
- Verify API key has proper permissions
- Check log level is set to `debug` for detailed output
- Confirm orders exist that have been updated since last sync

#### Orders not appearing in Strapi
- Verify Strapi API token has write permissions
- Check Strapi `/api/orders` endpoint is accessible
- Review error logs for transformation or sync failures
- Ensure Strapi schema matches expected order structure

#### High error rate
- Check network connectivity to both APIs
- Verify API rate limits aren't being exceeded
- Review error messages in logs for specific issues
- Consider increasing `SYNC_TIMEOUT_SECONDS` for slow connections

### Best Practices

1. **Use Environment Variables**: Store sensitive keys in environment variables, not code
2. **Monitor Logs**: Regularly review logs for errors and performance issues
3. **Adjust Interval**: Set sync interval based on order volume and API rate limits
4. **Set Appropriate Timeout**: Increase timeout for slow networks or large datasets
5. **Use Debug Level**: Enable debug logging for troubleshooting, but use info/warn in production
6. **Monitor Statistics**: Track sync statistics to identify performance trends

### Related Files

- `lib/printavo-mapper.ts` - Order transformation logic
- `lib/strapi-schema.ts` - Strapi order schema definitions
- `tests/sync-printavo-live.test.ts` - Test suite
- `.env.example` - Example environment configuration

## batch-import.ts

Batch import script for historical order data. See the file header for usage details.

### Key Differences from Live Sync

| Feature | Live Sync | Batch Import |
|---------|-----------|--------------|
| Purpose | Continuous real-time sync | One-time historical import |
| Data Source | Printavo API | JSON files |
| Frequency | Every 15 minutes | On-demand |
| Incremental | Yes | No |
| Progress Tracking | Statistics | Batch results + session files |

### When to Use Each

- **Live Sync**: Use for ongoing operations to keep Strapi in sync with Printavo
- **Batch Import**: Use for initial data migration or importing archived order data from files

---

## Production Migration System (NEW)

**For production-ready, one-time migration with incremental sync support.**

### Quick Start

```bash
# Test the migration system
npm run migrate:test

# Run full migration
npm run migrate:full

# Run incremental sync (during transition)
npm run migrate:incremental -- --since="2025-12-04"
```

### Scripts

#### `printavo-extract.js` (NEW)

Clean JavaScript extraction script for production use.

**Features:**
- Extracts ALL orders with complete field data
- Extracts ALL customers with complete data
- Handles GraphQL complexity limits (page size: 5 for orders, 25 for customers)
- Rate limiting (600ms delay)
- Saves to `/app/data/printavo-final/` with timestamps
- Incremental extraction support

**Usage:**
```bash
# Full extraction
node printavo-extract.js

# Incremental (orders since date)
node printavo-extract.js --since="2025-12-04"

# Or via npm
npm run migrate:extract
```

**Environment Variables:**
- `PRINTAVO_EMAIL` - Printavo email
- `PRINTAVO_TOKEN` - Printavo API token (from "My Account" page)

#### `strapi-import.js` (NEW)

Import extracted data into Strapi with relationship handling.

**Features:**
- Reads extracted JSON files
- Imports customers first (for relationships)
- Imports orders with customer relationships
- Upsert logic (by printavoId)
- Progress tracking and error logging
- Summary report generation

**Usage:**
```bash
# Import from specific directory
node strapi-import.js /app/data/printavo-final/full-2025-12-04T10-30-00

# Import from most recent extraction
node strapi-import.js

# Or via npm
npm run migrate:import
```

**Environment Variables:**
- `STRAPI_URL` - Strapi base URL
- `STRAPI_API_TOKEN` - Strapi API token

#### `migrate-printavo.sh` (NEW)

Master orchestration script for complete migration.

**Features:**
- Runs extraction → validation → import → report
- Pre-flight checks (env vars, Strapi connectivity)
- Error handling with colored output
- Support for incremental mode

**Usage:**
```bash
# Full migration
./migrate-printavo.sh

# Incremental sync
./migrate-printavo.sh --incremental --since="2025-12-04"

# Or via npm
npm run migrate:full
npm run migrate:incremental -- --since="2025-12-04"
```

#### `test-migration.sh` (NEW)

Validate migration system before running.

**Tests:**
- Script files and syntax
- Required dependencies
- Environment variables
- GraphQL queries
- System requirements

**Usage:**
```bash
./test-migration.sh

# Or via npm
npm run migrate:test
```

#### `lib/printavo-queries.js` (NEW)

GraphQL queries optimized for Printavo's complexity limits.

**Contains:**
- `ORDER_QUERY` - Full order extraction with all fields
- `CUSTOMER_QUERY` - Customer extraction with contacts/addresses
- `INCREMENTAL_ORDER_QUERY` - Incremental order sync

### Documentation

Complete migration guide: [`../PRINTAVO_MIGRATION.md`](../PRINTAVO_MIGRATION.md)

**Includes:**
- Full setup instructions
- Environment configuration
- Step-by-step migration process
- Data mapping reference (Printavo → Strapi)
- Status mapping
- Troubleshooting guide
- Performance metrics
- Best practices

### Comparison: Old vs New Migration

| Feature | Old Scripts (TypeScript) | New Scripts (JavaScript) |
|---------|-------------------------|-------------------------|
| Language | TypeScript | JavaScript (production-ready) |
| Page Size | Variable | Optimized (5 for orders, 25 for customers) |
| Rate Limiting | 500ms | 600ms (more conservative) |
| Output Location | `data/printavo-export/v2/` | `/app/data/printavo-final/` |
| Incremental Support | Limited | Full support with --since flag |
| Documentation | Technical | Production guide with troubleshooting |
| Master Script | No | Yes (`migrate-printavo.sh`) |
| Validation | No | Yes (`test-migration.sh`) |
| Use Case | Development/testing | Production migration |

### When to Use Which

**Use NEW Production Migration System when:**
- Performing one-time full migration from Printavo
- Running incremental syncs during transition period
- Need production-ready scripts with comprehensive error handling
- Want complete documentation and troubleshooting guide

**Use OLD TypeScript Scripts when:**
- Developing or testing extraction logic
- Need to extract additional fields not in production scripts
- Working with development data
- Need MinIO integration for file archival

---
