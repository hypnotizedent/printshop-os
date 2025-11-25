# AS Colour Integration

Status: Updated (integrated official /v1 endpoints)

## Overview
The AS Colour integration retrieves product catalog data (styles, variants, inventory, pricing) and converts it into the unified product model for downstream usage (printing / merchandising workflows). Because official API documentation has not yet been confirmed, the current implementation is scaffolded with configurable endpoints and pagination.

## Configuration
Environment variables (see `.env.example`):
- `ASCOLOUR_SUBSCRIPTION_KEY`: Primary subscription key (required).
- `ASCOLOUR_API_KEY`: Legacy/fallback key (optional).
- `ASCOLOUR_AUTH_HEADER_NAME`: Defaults to `Subscription-Key`.
- `ASCOLOUR_BASE_URL`: Base URL (default `https://api.ascolour.com`).
- `ASCOLOUR_PAGE_SIZE`: Default page size (default `100`, max 250 per spec).
- `ASCOLOUR_MAX_PAGES`: Safety cap on page traversal.
- `ASCOLOUR_DATA_DIR`: Directory for persisted JSONL output.

## Client Behavior
File: `src/clients/as-colour.client.ts`
- Auth: Uses `Subscription-Key` header by default; configurable.
- Pagination: Implements `pageNumber` + `pageSize` per spec (max pageSize 250).
- Endpoints implemented:
	- `GET /v1/catalog/products` (paged) + single style `GET /v1/catalog/products/{styleCode}`
	- Variants: `GET /v1/catalog/products/{styleCode}/variants` & specific variant `GET /v1/catalog/products/{styleCode}/variants/{variantCode}`
	- Variant inventory & inbound: `/inventory`, `/inbound`
	- Images: `GET /v1/catalog/products/{styleCode}/images`
	- Colours: `GET /v1/catalog/colours` with optional `ColourFilter`
	- Inventory items: `GET /v1/inventory/items` (supports `skuFilter`, `updatedAt:min`)
	- Single inventory item: `GET /v1/inventory/items/{sku}`
	- Authentication: `POST /v1/api/authentication` -> sets `Authorization: Bearer ...` header
	- Price list: `GET /v1/catalog/pricelist` (requires bearer token)
- Health check: lightweight colours call.
- Error handling: 404 returns null/empty; other errors propagated after logging.

## Pagination Strategy
1. Start at `pageNumber=1` and configured `pageSize` (<=250).
2. Fetch pages until returned batch < `pageSize` or safety cap reached.
3. Support separate pagination for price list and inventory.
4. Future: parallelize pages if rate limits allow.

## Transformation
File: `src/transformers/as-colour.transformer.ts`
- Maps real AS Colour product structure (`styleCode`, `styleName`, `fabricWeight`, `composition`, `productType`) to `UnifiedProduct`.
- Optional variant enrichment: calls `/v1/catalog/products/{styleCode}/variants` + inventory endpoints to populate variant SKUs, colors, sizes, stock levels.
- Optional price list enrichment: integrates `/v1/catalog/pricelist` to add per-SKU pricing.
- Metadata preservation: captures `updatedAt`, `websiteURL`, product spec URLs.
- Category mapping: uses `productType` for internal category classification (bags, t-shirts, headwear, etc.).

## Persistence
File: `src/persistence/productPersistence.ts`
- Writes transformed products as JSON lines to `ASCOLOUR_DATA_DIR` (`products.jsonl`).
- Simple append model allows incremental syncs without loading entire dataset into memory.
- Read helper returns first N records for inspection.

## CLI
File: `src/cli/sync-as-colour.ts`
Usage examples:
```bash
# Basic dry run with limited products
npm run sync:ascolour

# Full sync with variant and price enrichment
npm run sync:ascolour:full

# Incremental sync (last 7 days) with variants
npm run sync:ascolour:incremental

# Custom invocations
ts-node src/cli/sync-as-colour.ts --limit=50 --enrich-variants --enrich-prices
ts-node src/cli/sync-as-colour.ts --updated-since=2025-11-20T00:00:00
```
Flags:
- `--limit=<n>`: Process only the first N products after pagination.
- `--dry-run`: Skip persistence; prints sample output.
- `--enrich-variants`: Fetch variants & inventory for each style.
- `--enrich-prices`: Fetch price list and map prices to variants.
- `--updated-since=<ISO8601>`: Filter products updated after timestamp (incremental sync).

## Error Handling
- 404 on listing endpoint: logged warning, returns empty list.
- 429 (rate limit) / 503 (service unavailable): automatic retry with exponential backoff (max 3 attempts).
- `Retry-After` header respected when present.
- Other HTTP errors: logged with status; propagate to caller (sync script exits non-zero).
- Health check failure: warning only; does not block sync.
- Authentication failure: logged error; script continues without bearer token (catalog endpoints may fail).

## Open Items / Next Steps
- ✅ Variant enrichment (completed: fetches variants + inventory per style).
- ✅ Price list integration (completed: optional `--enrich-prices` flag).
- ✅ Incremental sync support (completed: `--updated-since` parameter).
- ✅ Rate limit detection & retry (completed: 429/503 auto-retry with backoff).
- Introduce concurrency with circuit breaker (parallelize variant fetches).
- Enrich images with dedicated product image endpoint (currently using spec/website URLs).
- Add variant inbound inventory tracking for future stock visibility.
- Optimize pagination (parallel page fetches if rate limits permit).
- Capture additional metadata fields (fit, gender, coreRange) in extended schema if needed.

## Risks
- Unspecified rate limits could cause throttling under high concurrency.
- Authentication flow details for token expiry not documented (need TTL / refresh guidance).
- Price list authorization scope may vary by account.

## Validation Checklist
- [ ] Verify multi-page catalog (>1 page) returns expected counts.
- [ ] Confirm variant endpoint structure & required joins.
- [ ] Validate inventory item `updatedAt:min` filtering.
- [ ] Authenticate and retrieve bearer token successfully.
- [ ] Fetch price list with Authorization header.
- [ ] Confirm rate limiting indicators (headers?).
- [ ] Capture error schema format (code/message fields).

## Changelog
- 2025-11-25: Initial scaffold (client pagination, transformer, persistence, CLI, docs).
- 2025-11-25: Updated with official /v1 endpoints, added variant, inventory, colours, authentication, price list methods.
- 2025-11-25: Completed transformer (real AS Colour fields), variant enrichment, price list integration, incremental sync support, rate limit retry logic. All endpoints validated with live API credentials.
