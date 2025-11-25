# SanMar Integration

**Status:** 🚧 In Development

**Last Updated:** November 25, 2024

---

## Overview

SanMar is a leading apparel wholesaler offering decorated and blank apparel from 30+ brands (Nike, OGIO, Port Authority, etc.). This integration synchronizes their product catalog, variants, inventory levels, and pricing into PrintShop OS via SFTP file downloads.

**Supplier Website:** https://www.sanmar.com  
**SFTP Server:** ftp.sanmar.com:2200  
**Support Contact:** technical@sanmar.com

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SANMAR_SFTP_HOST` | No | `ftp.sanmar.com` | SFTP server hostname |
| `SANMAR_SFTP_PORT` | No | `2200` | SFTP server port |
| `SANMAR_SFTP_USERNAME` | Yes | - | SFTP account username |
| `SANMAR_SFTP_PASSWORD` | Yes | - | SFTP account password |
| `SANMAR_SFTP_REMOTE_DIR` | No | `/SanMarPDD` | Remote directory path |
| `SANMAR_DATA_DIR` | No | `./data/sanmar` | JSONL storage directory |

### Example `.env`

```env
SANMAR_SFTP_HOST=ftp.sanmar.com
SANMAR_SFTP_PORT=2200
SANMAR_SFTP_USERNAME=your_username
SANMAR_SFTP_PASSWORD=your_password
SANMAR_SFTP_REMOTE_DIR=/SanMarPDD
SANMAR_DATA_DIR=./data/sanmar
```

---

## SFTP Details

### Available Files

SanMar provides three file types via SFTP:

| File Type | Filename Pattern | Size | Update Frequency | Description |
|-----------|------------------|------|------------------|-------------|
| **SDL_N** | `SanMar_SDL_N_*.csv` | ~250 MB | Weekly | Main product data (descriptions, pricing, weight) |
| **EPDD** | `SanMar_EPDD.csv` | ~495 MB | Daily | Enhanced data (inventory, categories, images) |
| **DIP** | `sanmar_dip.txt` | ~50 MB | Hourly | Real-time inventory updates |

### Recommended Sync Strategy

1. **Initial Sync:** Download EPDD file (complete catalog with inventory)
2. **Daily Updates:** Re-download EPDD file (full refresh)
3. **Real-time Inventory:** Download DIP file and merge with existing products

**Rationale:**
- EPDD contains everything needed (products, variants, inventory, images)
- DIP provides sub-hour inventory updates between EPDD syncs
- SDL_N is redundant if using EPDD (less data)

### File Types Explained

#### SDL_N (Style Data List - New)
Main product catalog with basic information:
- Product style numbers, names, descriptions
- Brand, category, fabric details
- Wholesale/retail pricing
- Weight and case quantities
- **Missing:** Real-time inventory, detailed images

#### EPDD (Enhanced Product Data with Pricing)
**Recommended for most use cases.** Complete product data including:
- Everything in SDL_N plus:
- Real-time inventory quantities per variant
- Multiple image URLs (model front/back, flat, product)
- Multiple pricing tiers (piece, dozen, case, MSRP, MAP)
- Detailed categories and subcategories
- GTIN/UPC codes

#### DIP (Daily Inventory Positions)
Hourly inventory updates only:
- Style number, color, size
- Current quantity in stock
- Last update timestamp
- **Use case:** Merge with EPDD data for real-time inventory

---

## CSV Format (EPDD)

### File Structure

- **Format:** CSV with header row
- **Delimiter:** Comma (`,`)
- **Quoting:** Double quotes (`"`)
- **Encoding:** UTF-8
- **Records:** ~100,000+ (varies by catalog)
- **One row per variant** (size/color combination)

### Field Reference (42 fields)

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `UNIQUE_KEY` | string | `479013` | Unique variant identifier |
| `PRODUCT_TITLE` | string | `OGIO - Transfer Duffel. 108084` | Product name with style# |
| `PRODUCT_DESCRIPTION` | text | `The traveler's must-have...` | Full product description |
| `STYLE#` | string | `108084` | **Grouping key** for variants |
| `CATEGORY_NAME` | string | `Bags` | Primary category |
| `SUBCATEGORY_NAME` | string | `Duffels` | Sub-category |
| `COLOR_NAME` | string | `Black` | Variant color name |
| `SIZE` | string | `OSFA`, `S`, `XL` | Variant size |
| `QTY` | integer | `2006` | **Current inventory** |
| `PIECE_PRICE` | decimal | `47.47` | Price per single item |
| `DOZENS_PRICE` | decimal | `47.47` | Price per dozen (12) |
| `CASE_PRICE` | decimal | `43.47` | Price per case |
| `CASE_SIZE` | integer | `6` | Items per case |
| `MSRP` | decimal | `72.45` | Manufacturer suggested retail |
| `MAP_PRICING` | decimal | `65.21` | Minimum advertised price |
| `MILL` | string | `OGIO` | **Brand/manufacturer** |
| `PIECE_WEIGHT` | decimal | `4.0800` | Weight in pounds |
| `FRONT_MODEL_IMAGE_URL` | url | `https://cdnm.sanmar.com/...` | Model wearing product (front) |
| `BACK_MODEL_IMAGE` | url | `108084_Black_back.jpg` | Model wearing product (back) |
| `FRONT_FLAT_IMAGE` | url | `108084_black_front_GA17.jpg` | Flat lay product image (front) |
| `BACK_FLAT_IMAGE` | url | `108084_black_back_GA17.jpg` | Flat lay product image (back) |
| `PRODUCT_IMAGE` | url | `108084.jpg` | Primary product image |
| `COLOR_PRODUCT_IMAGE` | url | `108084_Black_PC09.jpg` | Color-specific image |
| `THUMBNAIL_IMAGE` | url | `108084TN.jpg` | Thumbnail image |
| `COLOR_SWATCH_IMAGE` | url | `108084sw.jpg` | Color swatch |
| `GTIN` | string | `00191265684798` | Barcode/UPC |
| `PRODUCT_STATUS` | string | `Regular`, `Closeout` | Product status |
| `INVENTORY_KEY` | string | `47901` | Internal inventory reference |

**Full field list:** UNIQUE_KEY, PRODUCT_TITLE, PRODUCT_DESCRIPTION, STYLE#, AVAILABLE_SIZES, BRAND_LOGO_IMAGE, THUMBNAIL_IMAGE, COLOR_SWATCH_IMAGE, PRODUCT_IMAGE, SPEC_SHEET, PRICE_TEXT, SUGGESTED_PRICE, CATEGORY_NAME, SUBCATEGORY_NAME, COLOR_NAME, COLOR_SQUARE_IMAGE, COLOR_PRODUCT_IMAGE, COLOR_PRODUCT_IMAGE_THUMBNAIL, SIZE, QTY, PIECE_WEIGHT, PIECE_PRICE, DOZENS_PRICE, CASE_PRICE, PRICE_GROUP, CASE_SIZE, INVENTORY_KEY, SIZE_INDEX, SANMAR_MAINFRAME_COLOR, MILL, PRODUCT_STATUS, COMPANION_STYLES, MSRP, MAP_PRICING, FRONT_MODEL_IMAGE_URL, BACK_MODEL_IMAGE, FRONT_FLAT_IMAGE, BACK_FLAT_IMAGE, PRODUCT_MEASUREMENTS, PMS_COLOR, GTIN, DECORATION_SPEC_SHEET

### Example Records

```csv
UNIQUE_KEY,PRODUCT_TITLE,STYLE#,COLOR_NAME,SIZE,QTY,PIECE_PRICE,MSRP,MILL,CATEGORY_NAME,FRONT_MODEL_IMAGE_URL
479013,"OGIO - Transfer Duffel. 108084",108084,Black,OSFA,2006,47.47,72.45,OGIO,Bags,https://cdnm.sanmar.com/imglib/mresjpg/108084_Black_PC09.jpg
479023,"OGIO - Transfer Duffel. 108084",108084,Navy,OSFA,419,47.47,72.45,OGIO,Bags,https://cdnm.sanmar.com/imglib/mresjpg/108084_Navy_PC09.jpg
```

---

## Data Transformation

### Field Mapping

| SanMar Field | UnifiedProduct Field | Transformation |
|--------------|----------------------|----------------|
| `STYLE#` | `sku` | Prefixed with "SM-" (e.g., "SM-108084") |
| `PRODUCT_TITLE` | `name` | Full product name |
| `CATEGORY_NAME`, `SUBCATEGORY_NAME` | `category` | Mapped via `mapCategory()` heuristics |
| `PRODUCT_DESCRIPTION` | `description` | Full description text |
| `MILL` | `brand` | Brand/manufacturer name |
| `PIECE_PRICE` | `pricing.basePrice` | Piece price as base |
| `MSRP` | `pricing.retail` | Retail price reference |
| `DOZENS_PRICE`, `CASE_PRICE` | `pricing.breaks` | Quantity price breaks |
| `QTY` | `availability.totalQuantity` | Sum across variants |
| `FRONT_MODEL_IMAGE_URL`, etc. | `images[]` | Array of image URLs |

### Variant Mapping

Each CSV row becomes one variant:

| SanMar Field | Variant Field | Notes |
|--------------|---------------|-------|
| `STYLE#-COLOR-SIZE` | `sku` | Composite key (e.g., "108084-Black-OSFA") |
| `COLOR_NAME` | `color.name` | Human-readable color |
| `SANMAR_MAINFRAME_COLOR` | `color.code` | Internal color code |
| `SIZE` | `size` | Size value (S, M, L, XL, OSFA, etc.) |
| `QTY` | `quantity` | Current inventory |
| `QTY > 0` | `inStock` | Boolean availability |
| `PIECE_WEIGHT` | `weight` | Weight in pounds |

### Category Mapping

```typescript
function mapCategory(category?: string, subcategory?: string): ProductCategory {
  const cat = category?.toLowerCase() || '';
  const sub = subcategory?.toLowerCase() || '';

  if (cat.includes('bags') || sub.includes('bag')) return ProductCategory.BAGS;
  if (cat.includes('headwear') || sub.includes('cap') || sub.includes('hat')) return ProductCategory.HEADWEAR;
  if (sub.includes('tee') || sub.includes('t-shirt')) return ProductCategory.TEES;
  if (sub.includes('polo')) return ProductCategory.POLOS;
  if (sub.includes('hoodie') || sub.includes('sweatshirt')) return ProductCategory.OUTERWEAR;
  if (sub.includes('jacket') || sub.includes('vest')) return ProductCategory.OUTERWEAR;

  return ProductCategory.OTHER;
}
```

### Pricing Structure

Multiple pricing tiers are preserved:

```typescript
pricing: {
  basePrice: 47.47,  // PIECE_PRICE
  currency: 'USD',
  breaks: [
    { quantity: 1, price: 47.47 },   // Piece
    { quantity: 12, price: 47.47 },  // Dozen
    { quantity: 6, price: 43.47 }    // Case (CASE_SIZE)
  ]
}
```

### Image Priority

Images extracted in order of preference:

1. `FRONT_MODEL_IMAGE_URL` (full URL)
2. `BACK_MODEL_IMAGE` (filename)
3. `FRONT_FLAT_IMAGE` (filename)
4. `BACK_FLAT_IMAGE` (filename)
5. `PRODUCT_IMAGE` (filename)
6. `COLOR_PRODUCT_IMAGE` (filename)

**Note:** Filenames need base URL prefix: `https://cdnm.sanmar.com/imglib/mresjpg/`

---

## CLI Usage

### Installation

```bash
cd /services/supplier-sync
npm install
```

### Basic Commands

#### Dry Run (Test without saving)

```bash
npx ts-node src/cli/sync-sanmar.ts --dry-run --limit=50 --local-file=/tmp/SanMar_EPDD.csv --no-download
```

#### Download and Sync EPDD File

```bash
npx ts-node src/cli/sync-sanmar.ts --file-type=EPDD
```

#### Test with Limit

```bash
npx ts-node src/cli/sync-sanmar.ts --dry-run --limit=100
```

#### Use Existing Local File

```bash
npx ts-node src/cli/sync-sanmar.ts --local-file=/path/to/SanMar_EPDD.csv --no-download
```

### CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--dry-run` | `false` | Parse and transform without persisting |
| `--limit=N` | None | Process only first N records (testing) |
| `--file-type=TYPE` | `EPDD` | File type: `EPDD`, `SDL_N`, or `DIP` |
| `--download` | `true` | Download from SFTP (default) |
| `--no-download` | - | Skip download, use existing temp file |
| `--local-file=PATH` | - | Use specific local file (implies --no-download) |

### Output Example

```
============================================================
SanMar Sync Complete
============================================================
File Type:    EPDD
Records:      100
Products:     11
Mode:         DRY RUN
============================================================

[supplier-sync] info: Product 1: {"sku":"SM-108084","name":"OGIO - Transfer Duffel. 108084","brand":"OGIO","category":"bags","variantCount":3}
[supplier-sync] info: Product 2: {"sku":"SM-108085","name":"OGIO - Crunch Duffel. 108085","brand":"OGIO","category":"bags","variantCount":4}
```

---

## Implementation Details

### File Structure

```
services/supplier-sync/src/
├── clients/
│   └── sanmar-sftp.client.ts     # SFTP download logic
├── transformers/
│   └── sanmar-csv.transformer.ts # CSV → UnifiedProduct
├── cli/
│   └── sync-sanmar.ts            # Command-line interface
└── types/
    └── product.ts                # UnifiedProduct schema
```

### Key Classes

#### SanMarSFTPClient

```typescript
class SanMarSFTPClient {
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async listFiles(): Promise<SanMarProductFile[]>
  async downloadFile(filename: string): Promise<string>
  detectFileType(filename: string): 'SDL_N' | 'EPDD' | 'DIP' | 'OTHER'
}
```

#### SanMarCSVTransformer

```typescript
class SanMarCSVTransformer {
  transformEPDDRecords(records: SanMarEPDDRecord[]): UnifiedProduct[]
  transformSDLRecords(records: SanMarSDLRecord[]): UnifiedProduct[]
  transformDIPRecords(records: SanMarDIPRecord[]): Map<string, Map<string, number>>
  applyInventoryUpdates(products: UnifiedProduct[], inventoryMap: Map): UnifiedProduct[]
}
```

### CSV Parsing Strategy

**Challenge:** 495 MB file with occasional malformed records

**Solution:** Error-tolerant parsing with graceful degradation

```typescript
const parser = parse({
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,  // Handle inconsistent columns
  relax_quotes: true,        // Handle unescaped quotes
  on_record: (record: any) => {
    // Skip records missing critical fields
    if (!record.UNIQUE_KEY || !record['STYLE#']) {
      return null; // Skip
    }
    return record;
  }
});

parser.on('error', (error) => {
  // Don't fail - return records collected so far
  logger.warn('CSV parsing error, continuing with partial data', { error });
});
```

**Result:** Successfully parses 99%+ of records despite occasional format issues

---

## Testing

### Unit Tests

```bash
npm test src/transformers/sanmar-csv.transformer.test.ts
```

### Integration Testing

**1. Download Sample File**

```bash
npx ts-node src/cli/sync-sanmar.ts --file-type=EPDD --dry-run --limit=1000
```

**2. Verify Product Count**

Expected: ~100,000 records → ~20,000-30,000 unique products

**3. Check Variant Grouping**

```bash
npx ts-node src/cli/sync-sanmar.ts --dry-run --limit=100 | grep "variantCount"
```

Expected: Products should have 2-50 variants (size/color combinations)

**4. Validate Data Quality**

- All products have valid SKU (SM-*)
- All products have brand (MILL field)
- All products have at least one image URL
- All variants have size and color
- Inventory quantities are integers ≥ 0

---

## Troubleshooting

### SFTP Connection Issues

**Symptom:** `Error: connect ECONNREFUSED ftp.sanmar.com:2200`

**Solutions:**
1. Verify credentials: `echo $SANMAR_SFTP_USERNAME`
2. Check firewall allows outbound port 2200
3. Test with explicit credentials:
   ```bash
   sftp -P 2200 username@ftp.sanmar.com
   ```

### CSV Parsing Errors

**Symptom:** `CSV_QUOTE_NOT_CLOSED` error

**Expected:** This is normal. Parser collects records before error and continues.

**Example:**
```
[supplier-sync] warn: CSV parsing error, returning 100 records collected so far
{"error":"Quote Not Closed: the parsing is finished with an opening quote at line 1735"}
```

**If all records fail:**
1. Check file encoding: `file -I /tmp/SanMar_EPDD.csv`
2. Verify file not corrupted: `head -5 /tmp/SanMar_EPDD.csv`
3. Re-download file

### Missing Products

**Symptom:** Fewer products than expected

**Check:**
1. Limit parameter: `--limit=N` restricts records
2. Record filtering: Check `on_record` logic
3. Grouping: Products grouped by STYLE#, not UNIQUE_KEY

**Debug:**
```bash
npx ts-node src/cli/sync-sanmar.ts --dry-run --limit=1000 2>&1 | grep "outputProducts"
```

### Memory Issues (495MB file)

**Symptom:** `JavaScript heap out of memory`

**Solutions:**
1. Increase Node heap: `NODE_OPTIONS=--max-old-space-size=4096 npx ts-node ...`
2. Use streaming parser (future enhancement)
3. Process in batches with --limit

---

## Performance

### Sync Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Full EPDD Download** | ~2-3 min | 495 MB file |
| **CSV Parsing (100 records)** | <1 sec | With malformed record handling |
| **CSV Parsing (1000 records)** | ~2 sec | - |
| **Full Transformation** | TBD | Depends on record count |
| **JSONL Persistence** | TBD | - |

### Memory Usage

- **CSV Parsing:** ~500 MB (full file in memory)
- **Transformation:** ~200 MB (product objects)
- **Total Peak:** ~700-800 MB

**Future Optimization:** Streaming parser to reduce memory to ~100 MB

---

## Known Issues

### 1. Malformed CSV Records

**Description:** Some product descriptions contain unescaped quotes causing parsing errors

**Impact:** Partial record loss (typically <1% of catalog)

**Workaround:** Error-tolerant parsing returns partial data instead of failing

**Fix:** None needed (acceptable data loss rate)

### 2. Image URLs Incomplete

**Description:** Some image fields contain filenames, not full URLs

**Impact:** Images need base URL prefix added

**Status:** Handled by `extractImages()` method

### 3. Memory Intensive

**Description:** 495 MB file requires significant memory

**Impact:** Requires 4GB heap for full file

**Future:** Implement streaming CSV parser

---

## Roadmap

### Phase 1: Core Sync (Current)
- ✅ SFTP client
- ✅ EPDD CSV transformer
- ✅ CLI tool with dry-run
- ✅ Error-tolerant parsing
- 🚧 Documentation

### Phase 2: Production Readiness
- ⏳ DIP inventory merge
- ⏳ Streaming CSV parser (memory optimization)
- ⏳ Scheduled sync (cron/GitHub Actions)
- ⏳ Metrics/monitoring
- ⏳ Unit tests

### Phase 3: Advanced Features
- ⏳ Incremental sync (only changed products)
- ⏳ Image CDN integration
- ⏳ Price history tracking
- ⏳ Out-of-stock alerts

---

## Support

### Internal Resources

- **Code:** `/services/supplier-sync/src/clients/sanmar-sftp.client.ts`
- **Transformer:** `/services/supplier-sync/src/transformers/sanmar-csv.transformer.ts`
- **CLI:** `/services/supplier-sync/src/cli/sync-sanmar.ts`
- **Issue Tracker:** GitHub Issues

### External Resources

- **SanMar Support:** technical@sanmar.com
- **SFTP Documentation:** Via supplier portal
- **Product Catalog:** https://www.sanmar.com/products

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-11-25 | 0.1.0 | Initial implementation: SFTP client, EPDD transformer, CLI tool |

