# Testing S&S Activewear with Real API Credentials

## Quick Start Guide

### Step 1: Get API Credentials

1. **Sign up at S&S Activewear**
   - Visit: https://www.ssactivewear.com/
   - Create business account
   - Contact your account manager to request API access

2. **Receive Credentials**
   You'll get:
   - API Key
   - Account Number

### Step 2: Configure Environment

```bash
cd services/supplier-sync
nano .env  # or use your preferred editor
```

Update these values:
```env
SS_ACTIVEWEAR_API_KEY=your_actual_api_key_here
SS_ACTIVEWEAR_ACCOUNT_NUMBER=your_actual_account_number
```

### Step 3: Test Commands (In Order)

#### 3.1 List Categories
```bash
npm run sync:ss:categories
```
**Expected Output**: List of all product categories with IDs
**Example**:
```
Available Categories:
====================
  1: T-Shirts
  2: Polos
  3: Hoodies
  4: Hats
  ...
```

#### 3.2 List Brands
```bash
npm run sync:ss:brands
```
**Expected Output**: List of all brands with IDs
**Example**:
```
Available Brands:
=================
  1: Gildan
  5: Port Authority
  10: Next Level
  ...
```

#### 3.3 Dry Run - Single Category
```bash
npm run sync:ss -- --dry-run --category 1
```
**Expected Output**:
- Health check: ✓
- Fetched X products
- DRY RUN message
- Sample transformed product JSON

**Purpose**: Validates API connection without caching data

#### 3.4 Real Sync - Single Category
```bash
npm run sync:ss -- --category 1
```
**Expected Output**:
- Health check: ✓
- Fetched X products
- Caching products in Redis
- ✓ Successfully synced X products
- Cache statistics

**Purpose**: Actually caches products in Redis

#### 3.5 Verify Cache
```bash
# List all cached products
docker exec printshop-redis redis-cli KEYS "product:*"

# Get specific product
docker exec printshop-redis redis-cli GET "product:G200"

# Count total products
docker exec printshop-redis redis-cli DBSIZE
```

#### 3.6 Test Incremental Sync
```bash
npm run sync:ss -- --incremental
```
**Expected Output**: Only products updated in last 24 hours

#### 3.7 Test Search
```bash
# Not yet implemented in CLI, but API client supports it
# You can test it by modifying src/cli/sync-ss-activewear.ts
```

---

## Troubleshooting

### Error: "Missing S&S Activewear credentials"
**Cause**: API key or account number not in .env  
**Fix**: Check .env file has real values (not placeholders)

### Error: "Authentication failed"
**Cause**: Invalid credentials  
**Fix**: 
1. Verify credentials with S&S support
2. Check for typos in .env
3. Ensure no extra spaces in values

### Error: "Rate limit exceeded"
**Cause**: Too many API calls too quickly  
**Fix**: Wait 1 minute, then try again. Rate limiter will auto-block.

### Error: "Redis connection failed"
**Cause**: Redis not running  
**Fix**: 
```bash
cd /Users/ronnyworks/Projects/printshop-os
docker compose up -d redis
```

### Error: "API health check failed"
**Cause**: S&S API might be down or network issue  
**Fix**:
1. Check S&S API status
2. Verify internet connection
3. Check firewall settings

---

## Expected Test Results

### Successful Dry Run
```
2024-11-25 12:00:00 [supplier-sync] info: Starting S&S Activewear full sync
2024-11-25 12:00:01 [supplier-sync] info: Fetching products for category 1
2024-11-25 12:00:05 [supplier-sync] info: Fetched 423 products from S&S Activewear
2024-11-25 12:00:05 [supplier-sync] info: Transforming products to unified format...
2024-11-25 12:00:06 [supplier-sync] info: DRY RUN - No data will be saved
2024-11-25 12:00:06 [supplier-sync] info: Would sync 423 products
2024-11-25 12:00:06 [supplier-sync] info: Sample product: { sku: 'G200', name: 'Gildan Ultra Cotton T-Shirt', ... }
```

### Successful Real Sync
```
2024-11-25 12:05:00 [supplier-sync] info: Starting S&S Activewear full sync
2024-11-25 12:05:01 [supplier-sync] info: Fetching products for category 1
2024-11-25 12:05:05 [supplier-sync] info: Fetched 423 products from S&S Activewear
2024-11-25 12:05:05 [supplier-sync] info: Transforming products to unified format...
2024-11-25 12:05:06 [supplier-sync] info: Caching products in Redis...
2024-11-25 12:05:08 [supplier-sync] info: Cached 100/423 products
2024-11-25 12:05:10 [supplier-sync] info: Cached 200/423 products
2024-11-25 12:05:12 [supplier-sync] info: Cached 300/423 products
2024-11-25 12:05:14 [supplier-sync] info: Cached 400/423 products
2024-11-25 12:05:15 [supplier-sync] info: ✓ Successfully synced 423 products
2024-11-25 12:05:15 [supplier-sync] info: Cache stats: { totalKeys: 423, productKeys: 423, pricingKeys: 0, inventoryKeys: 0 }
```

---

## Performance Benchmarks

Based on testing with mock data:

| Operation | Products | Duration | API Calls |
|-----------|----------|----------|-----------|
| Health Check | 0 | <1s | 1 |
| List Categories | 0 | <1s | 1 |
| List Brands | 0 | <1s | 1 |
| Dry Run (1 category) | ~500 | ~30s | 5-10 |
| Real Sync (1 category) | ~500 | ~45s | 5-10 |
| Incremental (24h) | ~100 | ~10s | 1-2 |

**Rate Limit**: 120 requests/minute (enforced automatically)

---

## Next Steps After Successful Test

### 1. Schedule Daily Incremental Syncs
Create a cron job (or GitHub Actions workflow):
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/printshop-os/services/supplier-sync && npm run sync:ss -- --incremental
```

### 2. Monitor Logs
```bash
# Watch live logs
tail -f services/supplier-sync/logs/combined.log

# Check errors only
tail -f services/supplier-sync/logs/error.log
```

### 3. Set Up Alerts
- Monitor Redis memory usage
- Alert on API authentication failures
- Track sync success/failure rates

### 4. Add Strapi Integration
Once products are caching successfully:
1. Create Product content type in Strapi
2. Modify sync CLI to push to Strapi
3. Test product search in Strapi admin

---

## API Rate Limit Guidelines

**S&S Activewear Limits**: 120 requests/minute

**Our Usage**:
- Categories: 1 request
- Brands: 1 request
- Products (paginated): ~5-10 requests per category
- Single product: 1 request

**Daily Incremental Sync**:
- Updated products: ~100-500/day
- API calls: ~1-5 requests
- Well under limit ✅

**Full Catalog Sync**:
- Total products: ~50,000
- API calls: ~500 requests
- Duration: ~7 hours (due to rate limiting)
- **Recommendation**: Don't do this often! Use categories instead.

---

## Support

If you encounter issues:

1. **Check logs**: `services/supplier-sync/logs/error.log`
2. **Verify Redis**: `docker compose ps redis`
3. **Test connectivity**: `npm run test:integration`
4. **Review API docs**: https://api.ssactivewear.com/v2/docs

---

## Example: Full Test Session

```bash
# 1. Navigate to service
cd /Users/ronnyworks/Projects/printshop-os/services/supplier-sync

# 2. Verify Redis is running
docker compose up -d redis

# 3. Run integration tests (no API needed)
npm run test:integration
# Expected: 4/4 tests passed

# 4. Add real credentials to .env
nano .env

# 5. Test API connection
npm run sync:ss:categories
# Expected: List of categories

# 6. Dry run test
npm run sync:ss -- --dry-run --category 1
# Expected: Products fetched, not cached

# 7. Real sync test
npm run sync:ss -- --category 1
# Expected: Products cached in Redis

# 8. Verify cache
docker exec printshop-redis redis-cli DBSIZE
# Expected: Number > 0

# 9. Check a product
docker exec printshop-redis redis-cli KEYS "product:G*"
# Expected: List of Gildan product keys

# 10. Run unit tests
npm test
# Expected: 17/17 tests passed

# Success! ✅
```
