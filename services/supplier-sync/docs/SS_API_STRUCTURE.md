# S&S Activewear API - Actual Response Structure

## Authentication
- **Method**: HTTP Basic Auth
- **Username**: Account Number (e.g., `31810`)
- **Password**: API Key (e.g., `07d8c0de-a385-4eeb-b310-8ba7bc55d3d8`)
- **Header**: `Authorization: Basic ${base64(accountNumber:apiKey)}`

## Working Endpoints

### GET /v2/categories
Returns array of category objects:
```json
{
  "categoryID": 702,
  "name": " Lifestyle & Retail Market Guide",
  "image": "deprecated"
}
```

**Type Definition (Corrected)**:
```typescript
interface SSCategory {
  categoryID: number;
  name: string;  // NOT categoryName
  image?: string;
  parentCategoryID?: number;
}
```

### GET /v2/brands
Returns array of brand objects:
```json
{
  "brandID": 162,
  "name": "47 Brand"
}
```

**Type Definition (Corrected)**:
```typescript
interface SSBrand {
  brandID: number;
  name: string;  // NOT brandName
}
```

## Issues Discovered

### 1. Products Endpoint Performance
- `/v2/products?categoryID=262` returns **208,465 products**
- Request takes 30+ seconds and times out
- **Solution needed**: Check if S&S API supports:
  - Pagination parameters
  - Limit/offset parameters
  - Individual style endpoint `/v2/products/{styleId}`

### 2. Health Check Endpoint
- `/v2/health` does **not exist**
- **Workaround**: Use `/v2/categories` as health check

### 3. Product Structure
- Need to fetch sample product to determine actual fields
- Current transformer expects fields that may not exist:
  - `styleVariants` array - actual structure unknown
  - Pricing/inventory structure unknown

## Recommendations

1. **Use individual product endpoints** instead of bulk queries
2. **Implement proper pagination** if supported
3. **Fetch product structure** using a single style ID
4. **Update transformer** based on actual product response
5. **Add caching** for categories/brands (they don't change often)

## Status
- ✅ Authentication working
- ✅ Categories endpoint working (700+ categories)
- ✅ Brands endpoint working (200+ brands)
- ⚠️  Products endpoint returns data but is too slow/large
- ❌ Product structure unknown - needs investigation
- ❌ Transformer tests failing due to incorrect type assumptions

## Next Steps
1. Contact S&S support for API documentation on:
   - Product pagination
   - Recommended query patterns
   - Product response structure
2. Test individual product endpoint with known style ID
3. Update transformer based on actual response structure
