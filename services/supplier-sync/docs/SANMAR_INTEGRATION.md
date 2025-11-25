# SanMar Integration Guide

Complete implementation for synchronizing product data from SanMar using SFTP + CSV files.

## Overview

SanMar is a major supplier of apparel for screen printing, embroidery, and promotional products. This integration provides:

- **SFTP-based product data sync** (recommended by SanMar)
- Hourly inventory updates
- Full product catalog with pricing
- Multi-variant products (colors/sizes)
- Category/brand hierarchy
- Real-time inventory management

## ⚠️ Important: SFTP is Primary Data Source

SanMar recommends **SFTP with CSV files** over SOAP API calls for product data:
- **Faster** - Download entire catalog in seconds
- **More complete** - Includes all product attributes
- **Better performance** - No rate limits
- **Hourly updates** - Fresh inventory data every hour

## Features Implemented

### ✅ SFTP Client (`sanmar-sftp.client.ts`)
- Secure SFTP connection (port 2200)
- File listing and download
- Automatic file type detection
- Local caching with update detection
- CSV parsing built-in
- Health check endpoint

### ✅ CSV Transformer (`sanmar-csv.transformer.ts`)
- Three file format support:
  - **SDL_N** - Main product data
  - **EPDD** - Enhanced data with inventory (preferred)
  - **DIP** - Hourly inventory updates
- Variant generation (color x size matrix)
- Category mapping to ProductCategory enum
- Inventory merging from DIP file
- Statistics calculation

### ⏳ SOAP API Client (Coming Soon)
- For real-time individual product queries
- Backup method if SFTP unavailable
- Order status checking

### ⏳ CLI Tools (Coming Soon)
- SFTP sync commands
- File listing and download
- CSV parsing and transformation
- Inventory updates
- Dry-run mode

## Data Files

### Available on SFTP Server

Located in `/SanMarPDD/` directory (note capital 'M'):

| File | Type | Update Frequency | Contents |
|------|------|------------------|----------|
| `SanMar_SDL_N` | CSV | Daily | Product descriptions, pricing, weight |
| `SanMar_EPDD` | CSV | Daily | **Enhanced data** - inventory, categories, subcategories |
| `sanmar_dip.txt` | TXT | **Hourly** | Real-time inventory updates |

### Recommended Approach

1. **Initial Load**: Download `SanMar_EPDD` for full product catalog
2. **Inventory Updates**: Download `sanmar_dip.txt` hourly for fresh inventory
3. **Daily Refresh**: Re-download EPDD once daily for new products/pricing

### File Selection Notes

- Prefer plain `.csv` files (`SanMar_EPDD.csv`, `SanMar_SDL_N.csv`) over zipped variants when both exist.
- The `_csv.zip` files contain a single CSV file; we skip extra extraction cost by using the non-zipped version.
- Large file sizes (EPDD ≈495MB, DIP ≈170MB) require streaming parse to avoid high memory usage.
- Implement future enhancement: line-by-line streaming with back-pressure and batch persistence (e.g. commit every 5k records).

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# SanMar Configuration (SOAP API + SFTP)
# SOAP API credentials (use your Sanmar.com login)
SANMAR_USERNAME=your_sanmar_username
SANMAR_PASSWORD=your_sanmar_password
SANMAR_WSDL_URL=https://ws.sanmar.com/

# SFTP credentials for bulk product data
SANMAR_SFTP_HOST=ftp.sanmar.com
SANMAR_SFTP_PORT=2200
SANMAR_SFTP_USERNAME=your_sftp_username
SANMAR_SFTP_PASSWORD=your_sftp_password
SANMAR_SFTP_DIRECTORY=/SanmarPDD
```

### Getting SanMar Credentials

**SFTP Access** (for product data):
1. Contact SanMar customer service: 1-800-426-6399
2. Request SFTP access for product data integration
3. Receive separate SFTP username/password
4. Host: `ftp.sanmar.com`, Port: `2200`

**Web Services API** (optional - for real-time queries):
1. Use your existing Sanmar.com login credentials
2. Or request dedicated API credentials from support
3. WSDL endpoint: `https://ws.sanmar.com/`

## Data Structure

### SanMar EPDD CSV Format (Preferred)
```csv
StyleID,StyleName,BrandID,BrandName,MainCategory,SubCategory,Description,ColorCode,ColorName,Size,Inventory,WholesalePrice,RetailPrice,CaseQty,Weight,ImageURL
PC61,Essential Tee,PC,Port & Company,Tees,Short Sleeve,100% cotton tee,RED,Red,M,150,3.50,7.99,72,0.35,https://...
PC61,Essential Tee,PC,Port & Company,Tees,Short Sleeve,100% cotton tee,RED,Red,L,200,3.50,7.99,72,0.38,https://...
PC61,Essential Tee,PC,Port & Company,Tees,Short Sleeve,100% cotton tee,BLK,Black,M,300,3.50,7.99,72,0.35,https://...
```

**Key Fields:**
- `StyleID` - Unique product identifier
- `ColorCode` - Color code (used in variant SKU)
- `Size` - Size code (XS, S, M, L, XL, etc.)
- `Inventory` - Current stock quantity
- `WholesalePrice` - Cost per unit
- `MainCategory` / `SubCategory` - Product classification

### SanMar DIP Inventory Format (Hourly)
```txt
StyleID,ColorCode,Size,Quantity,LastUpdated
PC61,RED,M,147,2024-11-25T14:00:00Z
PC61,RED,L,195,2024-11-25T14:00:00Z
PC61,BLK,M,298,2024-11-25T14:00:00Z
```

**Update Pattern:**
- Download every hour
- Merge with existing product data
- Update variant quantities only

### Transformed to UnifiedProduct
```typescript
{
  sku: "SM-POR-PC61",
  name: "Port & Company Core Cotton Tee",
  brand: "Port & Company",
  category: ProductCategory.T_SHIRTS,
  supplier: SupplierName.SANMAR,
  variants: [
    {
      sku: "PC61-RED-M",
      color: { name: "Red", code: "RED", hex: "#FF0000" },
      size: "M",
      inStock: true,
      quantity: 150
    }
  ],
  pricing: {
    basePrice: 3.50,
    currency: "USD",
    breaks: [{ quantity: 1, price: 5.99 }]
  },
  availability: {
    inStock: true,
    totalQuantity: 2500
  }
}
```

## Usage

### Initialize SFTP Client

```typescript
import { SanMarSFTPClient } from './clients/sanmar-sftp.client';

const client = new SanMarSFTPClient({
  host: process.env.SANMAR_SFTP_HOST!,
  port: parseInt(process.env.SANMAR_SFTP_PORT!),
  username: process.env.SANMAR_SFTP_USERNAME!,
  password: process.env.SANMAR_SFTP_PASSWORD!,
  remoteDirectory: process.env.SANMAR_SFTP_DIRECTORY!,
  localDirectory: '/tmp/sanmar-data',
});
```

### Download Product Files

```typescript
// Connect to SFTP server
await client.connect();

// Download main product file (EPDD - recommended)
const epddPath = await client.downloadEnhancedProductFile();
console.log('Downloaded:', epddPath);

// Download hourly inventory file
const dipPath = await client.downloadInventoryFile();
console.log('Downloaded:', dipPath);

// Download all files at once
const { mainProduct, enhancedProduct, inventory } = await client.downloadAllFiles();

// Disconnect
await client.disconnect();
```

### Parse and Transform CSV Data

```typescript
import { SanMarCSVTransformer } from './transformers/sanmar-csv.transformer';

const transformer = new SanMarCSVTransformer();

// Parse EPDD file
const epddRecords = await client.parseCSVFile(epddPath);

// Transform to UnifiedProduct format
const products = transformer.transformEPDDRecords(epddRecords);

console.log(`Transformed ${products.length} products`);
```

### Update Inventory from DIP File

```typescript
// Parse hourly inventory file
const dipRecords = await client.parseCSVFile(dipPath);

// Transform to inventory map
const inventoryMap = transformer.transformDIPRecords(dipRecords);

// Apply inventory updates to existing products
const updatedProducts = transformer.applyInventoryUpdates(products, inventoryMap);

console.log('Inventory updated for', updatedProducts.length, 'products');
```

### Complete Sync Workflow

```typescript
// 1. Download EPDD file (daily)
const epddPath = await client.downloadEnhancedProductFile();
const epddRecords = await client.parseCSVFile(epddPath);
const products = transformer.transformEPDDRecords(epddRecords);

// 2. Download DIP file (hourly)
const dipPath = await client.downloadInventoryFile();
const dipRecords = await client.parseCSVFile(dipPath);
const inventoryMap = transformer.transformDIPRecords(dipRecords);

// 3. Apply inventory updates
const finalProducts = transformer.applyInventoryUpdates(products, inventoryMap);

// 4. Get statistics
const stats = transformer.calculateStats(finalProducts);
console.log('Sync complete:', stats);
// {
//   totalProducts: 15000,
//   totalVariants: 180000,
//   uniqueBrands: 50,
//   inStock: 12000,
//   totalInventory: 1500000
// }
```

## CLI Commands (Planned)

```bash
# List available files on SFTP
npm run sync:sanmar list

# Download EPDD file only
npm run sync:sanmar download:epdd

# Download DIP inventory file
npm run sync:sanmar download:inventory

# Full sync (EPDD + DIP)
npm run sync:sanmar

# Parse and transform only (use cached files)
npm run sync:sanmar transform

# Dry run (download but don't save to database)
npm run sync:sanmar -- --dry-run

# Force re-download even if files unchanged
npm run sync:sanmar -- --force

# Sync on schedule (hourly inventory updates)
npm run sync:sanmar:watch
```

## Testing

### Unit Tests
```bash
npm test transformers/sanmar.transformer.test.ts
```

### Integration Tests
```bash
npm run test:integration:sanmar
```

### API Test Script
```bash
npx ts-node test-scripts/test-sanmar-api.ts
```

## Rate Limiting

- **Default**: 120 requests per minute
- **Burst**: Handled automatically with backoff
- **Blocking**: 61 seconds if limit exceeded
- **Recommendation**: Implement pagination and batch processing

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 401 | Authentication failed | Check API key and account number |
| 404 | Resource not found | Verify style ID or endpoint |
| 429 | Rate limit exceeded | Reduce request frequency |
| 500 | Server error | Retry with exponential backoff |

### Retry Strategy

```typescript
const maxRetries = 3;
const baseDelay = 1000; // ms

for (let i = 0; i < maxRetries; i++) {
  try {
    return await client.getProduct(styleId);
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await sleep(baseDelay * Math.pow(2, i));
  }
}
```

## Performance

### Optimization Tips

1. **Use category/brand filters** instead of fetching all products
2. **Implement pagination** for large datasets
3. **Cache categories and brands** (they rarely change)
4. **Batch product requests** in groups of 10-20
5. **Use incremental sync** for regular updates
6. **Leverage Redis caching** with 24-hour TTL

### Expected Performance

**SFTP Downloads:**
- EPDD file (~495MB): 2-5 minutes (depends on network throughput)
- DIP file (~170MB): 45-120 seconds  
- All core files (EPDD + DIP): ~3-7 minutes

**CSV Parsing:**
- EPDD records (high volume; size suggests >500k rows): Use streaming parser (estimated 2-6 minutes with batching)
- DIP records (inventory snapshot): 1-3 minutes streaming

**Transformation:**
- After streaming + grouping: 15,000 products with 180,000 variants: 30-60 seconds (including aggregation)

**Total Full Sync Time (initial full ingestion):** ~4-8 minutes (download + stream parse + transform). Subsequent hourly inventory update: 2-4 minutes.

### Streaming Strategy (Planned)

1. Stream EPDD CSV line-by-line using `csv-parse` in object mode.
2. Accumulate rows in an in-memory map keyed by `StyleID` (batch size e.g. 5,000 rows).
3. Flush batch to persistence layer (Redis/DB) with partial product construction.
4. After full pass, finalize product aggregation (variants, totals).
5. Apply DIP inventory after EPDD ingestion completes.

Benefits: memory footprint bounded; supports resumable strategy later.

## Next Steps

1. **Get API credentials** from SanMar
2. **Test authentication** with health check
3. **Implement CLI commands** for sync operations
4. **Add integration tests** with real API
5. **Set up automated sync** via cron job
6. **Monitor rate limits** and errors

## SanMar Best Practices (from Integration Guide)

### Inventory Pull Recommendations

| Use Case | Recommendation |
|----------|---------------|
| **Real-time inventory** | Use `sanmar_dip.txt` - updated hourly |
| **Initial product load** | Use `SanMar_EPDD` - complete catalog with categories |
| **Product descriptions** | Use `SanMar_SDL_N` or `SanMar_EPDD` |
| **Daily sync** | Download EPDD once, DIP hourly |
| **API queries** | Only for individual product lookups if needed |

### File Update Schedule

- **sanmar_dip.txt**: Every hour (real-time inventory)
- **SanMar_EPDD**: Daily (product catalog updates)
- **SanMar_SDL_N**: Daily (alternate product file)

### Integration Architecture

```
┌─────────────────────────────────────────────────┐
│              SFTP Server (ftp.sanmar.com:2200)  │
│  ┌─────────────┬──────────────┬───────────────┐ │
│  │  EPDD File  │  DIP File    │   SDL_N File  │ │
│  │  (Daily)    │  (Hourly)    │   (Daily)     │ │
│  └──────┬──────┴──────┬───────┴───────┬───────┘ │
└─────────┼─────────────┼───────────────┼─────────┘
          │             │               │
          ▼             ▼               ▼
    ┌─────────────────────────────────────────┐
    │      SFTP Client (download + parse)     │
    └─────────────────┬───────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │   CSV Transformer (EPDD → UnifiedProduct)│
    └─────────────────┬───────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │  Apply DIP Inventory Updates (merge)    │
    └─────────────────┬───────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │     Cache / Database (Redis + Strapi)   │
    └─────────────────────────────────────────┘
```

## Support

- **Customer Service**: 1-800-426-6399
- **SFTP Access**: Request through customer service
- **Technical Support**: apisupport@sanmar.com
- **Integration Guide**: See attached PDF documents
- **Account Issues**: Contact your SanMar account manager

## Status

- ✅ SFTP client implemented
- ✅ CSV transformer implemented (SDL_N, EPDD, DIP)
- ✅ Type definitions complete
- ✅ Documentation complete
- ⏳ CLI commands pending
- ⏳ Integration tests pending
- ⏳ SFTP credentials needed for testing
- ⏳ SOAP API client (optional, low priority)
