# Data Normalization & Mapping Layer

This module provides a comprehensive data normalization and mapping system for transforming varied supplier data formats into a consistent internal schema.

## Overview

Different suppliers use different data formats, field names, and conventions. This normalization layer ensures all supplier data is transformed into a consistent internal format for:

- Cross-supplier product search
- Accurate price comparison
- Inventory aggregation
- Quote generation
- Data quality maintenance

## Architecture

```
normalization/
├── normalizer.service.ts      # Main orchestrator
├── attribute-mapper.ts         # Field extraction & normalization
├── size-normalizer.ts          # Size standardization
├── color-normalizer.ts         # Color name & hex mapping
├── sku-normalizer.ts           # SKU format generation
├── price-normalizer.ts         # Pricing structure normalization
├── schema-validator.ts         # Zod schema validation
├── fuzzy-matcher.ts            # Product matching
└── __tests__/
    └── normalization.test.ts   # Comprehensive tests (49 tests)

mappings/
├── base.mapping.ts             # Base mapping interface
├── ss-activewear.mapping.ts    # SS Activewear configuration
├── sanmar.mapping.ts           # SanMar configuration
└── as-colour.mapping.ts        # AS Colour configuration
```

## Usage

### Basic Normalization

```typescript
import { DataNormalizer } from './normalization';

const normalizer = new DataNormalizer();

// Normalize a single product
const result = await normalizer.normalizeProduct(
  supplierData,
  'ss-activewear',
  {
    validateSchema: true,
    findMatches: true,
    existingProducts: existingProductsList,
  }
);

if (result.validation.valid) {
  console.log('Normalized product:', result.product);
  console.log('Warnings:', result.warnings);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Batch Normalization

```typescript
// Normalize multiple products
const results = await normalizer.normalizeProducts(
  supplierDataArray,
  'sanmar',
  { validateSchema: true }
);

console.log(`Successfully normalized: ${results.summary.successful}`);
console.log(`Failed: ${results.summary.failed}`);

// Generate report
const report = normalizer.generateReport(results);
console.log(report);
```

## Components

### Size Normalizer

Normalizes all size variations to standard format: S/M/L/XL/2XL/3XL/4XL/5XL

```typescript
import { normalizeSize } from './size-normalizer';

normalizeSize('LARGE');      // 'L'
normalizeSize('XLARGE');     // 'XL'
normalizeSize('XXL');        // '2XL'
normalizeSize('LG');         // 'L'
normalizeSize('YOUTH M');    // 'Youth M'
```

**Supported variations:**
- Standard: S, M, L, XL, 2XL, 3XL, 4XL, 5XL
- Spelled out: SMALL, MEDIUM, LARGE, XLARGE
- Abbreviations: SM, MD, LG, XXL, XXXL
- Youth sizes: YS, YM, YL, YXL

### Color Normalizer

Normalizes color names and provides hex codes:

```typescript
import { normalizeColor } from './color-normalizer';

const color = normalizeColor('BLK');
// { name: 'Black', hex: '#000000' }

const color2 = normalizeColor('NAVY BLUE');
// { name: 'Navy', hex: '#000080' }
```

**Features:**
- 30+ common colors with hex codes
- Fuzzy matching for variations
- Alias support (BLK → Black, WHT → White)
- Default gray (#808080) for unknown colors

### SKU Normalizer

Generates consistent internal SKU format: `BRAND-STYLE-COLOR-SIZE`

```typescript
import { normalizeSKU } from './sku-normalizer';

const sku = normalizeSKU(
  'GIL-G500-BLACK-LARGE',
  'sanmar',
  'Gildan',
  'G5000',
  'Black',
  'L'
);
// 'GLD-G5000-BLK-L'
```

**Brand codes:**
- Gildan → GLD
- Bella+Canvas → BLC
- Next Level → NXL
- AS Colour → ASC
- Hanes → HNS

### Price Normalizer

Normalizes various pricing structures to tiered format:

```typescript
import { normalizePricing } from './price-normalizer';

// Array format
normalizePricing([
  { qty: 1, price: 10.00 },
  { qty: 12, price: 8.50 },
]);
// [
//   { minQuantity: 1, maxQuantity: 11, price: 10.00 },
//   { minQuantity: 12, maxQuantity: null, price: 8.50 }
// ]

// Object format (SS Activewear)
normalizePricing({ price1: 10, price2: 8.50, price3: 7 });

// Object format (SanMar)
normalizePricing({ priceA: 10, priceB: 8.50, priceC: 7 });
```

### Attribute Mapper

Extracts and normalizes product attributes:

```typescript
import { 
  normalizeBrand, 
  normalizeName, 
  normalizeCategory,
  normalizeWeight 
} from './attribute-mapper';

normalizeBrand('BELLA CANVAS');    // 'Bella+Canvas'
normalizeCategory('T-SHIRTS');     // 'T-Shirts'
normalizeWeight('5.0 oz');         // 5.0
normalizeWeight('150g');           // 5.29 (converted to oz)
```

### Schema Validator

Validates normalized data using Zod schemas:

```typescript
import { validateProduct } from './schema-validator';

const result = validateProduct(normalizedProduct);

if (result.valid) {
  console.log('Product is valid:', result.data);
} else {
  console.log('Validation errors:', result.errors);
}
```

### Fuzzy Matcher

Matches products to existing inventory using fuzzy search:

```typescript
import { findMatchingProduct } from './fuzzy-matcher';

const match = findMatchingProduct(
  normalizedProduct,
  existingProducts,
  { 
    minConfidence: 0.8,
    strictBrandMatch: true 
  }
);

if (match) {
  console.log(`Matched to product ${match.id} with ${match.confidence * 100}% confidence`);
}
```

## Supplier Mappings

### SS Activewear

```typescript
{
  supplierId: 'ss-activewear',
  fields: {
    brand: 'brandName',
    name: 'styleName',
    sku: 'styleColorSizeId',
    size: 'sizeName',
    color: 'colorName',
    price: 'wholeSalePrice',
  },
  skuParser: (sku) => {
    // Format: SSACT_BRAND_STYLE_COLOR_SIZE
    const parts = sku.split('_');
    return { brand: parts[1], style: parts[2], color: parts[3], size: parts[4] };
  }
}
```

### SanMar

```typescript
{
  supplierId: 'sanmar',
  fields: {
    brand: 'Brand',
    name: 'Description',
    sku: 'SKU',
    size: 'Size',
    color: 'Color',
    price: 'PriceC',
  },
  skuParser: (sku) => {
    // Format: BRAND-STYLE-COLOR-SIZE
    const parts = sku.split('-');
    return { brand: parts[0], style: parts[1], color: parts[2], size: parts[3] };
  }
}
```

### AS Colour

```typescript
{
  supplierId: 'as-colour',
  fields: {
    brand: 'AS Colour',  // Constant
    name: 'styleName',
    sku: 'styleCode',
    size: 'sizeName',
    color: 'colourName',
    price: 'price',
  }
}
```

## Normalized Product Schema

```typescript
{
  // Required fields
  brand: string;           // 'Gildan'
  name: string;            // 'Heavy Cotton T-Shirt'
  category: string;        // 'T-Shirts'
  sku: string;             // 'GLD-G5000-BLK-L'
  
  // Variant attributes
  size: string;            // 'L'
  color: string;           // 'Black'
  colorHex: string;        // '#000000'
  style?: string;          // 'G5000'
  
  // Pricing (tiered)
  pricing: [
    {
      minQuantity: number;
      maxQuantity: number | null;
      price: number;
    }
  ];
  
  // Specifications
  specifications?: {
    weight?: number;       // in oz
    material?: string;     // '100% Cotton'
    fit?: 'Standard' | 'Slim' | 'Relaxed' | 'Athletic';
  };
  
  // Metadata
  supplierSKU: string;     // Original supplier SKU
  supplierId: string;      // 'ss-activewear'
  lastUpdated?: Date;
  
  // Matching (optional)
  matchedProductId?: string;
  confidence?: number;     // 0-1
}
```

## Error Handling

The normalizer provides detailed error reporting:

```typescript
{
  product: NormalizedProduct | null,
  validation: {
    valid: boolean,
    errors: [
      { field: 'sku', message: 'Invalid format', value: 'INVALID-SKU' }
    ]
  },
  warnings: [
    'Unknown size value: WEIRD_SIZE',
    'Unknown color: WEIRD_COLOR'
  ],
  errors: [
    'No valid pricing data found'
  ]
}
```

## Performance

- Single product normalization: <100ms
- Batch normalization: 1000 products in <60s
- Fuzzy matching: <50ms per product
- Schema validation: <10ms per product

## Testing

The normalization layer includes 49 comprehensive tests covering:

- Size normalization (6 tests)
- Color normalization (6 tests)
- SKU generation (5 tests)
- Price normalization (7 tests)
- Attribute mapping (8 tests)
- Schema validation (5 tests)
- Fuzzy matching (5 tests)
- End-to-end normalization (7 tests)

Run tests:
```bash
npm test -- lib/normalization/__tests__/normalization.test.ts
```

## Adding New Suppliers

1. Create mapping configuration:

```typescript
// lib/mappings/new-supplier.mapping.ts
import { SupplierMapping, registerMapping } from './base.mapping';

export const NewSupplierMapping: SupplierMapping = {
  supplierId: 'new-supplier',
  name: 'New Supplier',
  fields: {
    brand: 'BrandField',
    name: 'NameField',
    // ... map all fields
  },
  sizes: {
    'SM': 'S',
    // ... size mappings
  },
  colors: {
    'BLK': 'Black',
    // ... color mappings
  },
  skuParser: (sku) => {
    // Parse supplier SKU format
  }
};

registerMapping(NewSupplierMapping);
```

2. Import mapping in normalizer.service.ts:

```typescript
import '../mappings/new-supplier.mapping';
```

3. Add tests for the new supplier

## Best Practices

1. **Always validate** normalized data before saving to database
2. **Review warnings** to improve mappings over time
3. **Use fuzzy matching** with appropriate confidence thresholds (0.8+ recommended)
4. **Batch normalize** for better performance
5. **Log failed normalizations** for manual review
6. **Update mappings** as suppliers change formats
7. **Test with real data** from each supplier

## Future Enhancements

- Support for CSV/XML data formats
- Machine learning for color/size prediction
- Auto-detection of supplier format
- Caching for frequently normalized products
- Parallel processing for large batches
- Real-time normalization monitoring dashboard
