# Printavo Sync Scripts

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
