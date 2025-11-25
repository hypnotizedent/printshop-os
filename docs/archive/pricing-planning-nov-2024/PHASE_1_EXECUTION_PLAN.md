# Phase 1 Pricing Engine: Execution Plan for Spark/Cursor

**Status**: Ready to Implement  
**Timeline**: 3-4 hours  
**Deliverables**: 3 files (engine, tests, schema)

---

## 📋 Step-by-Step Implementation Plan

### PHASE 1A: Data Extraction (30 minutes)
**Task**: Convert Excel pricing data into `pricing-rules-schema.json`

**What to do**:
1. Extract all price matrices from Excel sheets
2. Create JSON with structure:
   ```json
   {
     "services": {
       "screenprint": {
         "quantityBreaks": [1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000],
         "colorBreaks": [1, 2, 6, 10, 15, 20, 25],
         "sizeOptions": ["A6", "A5", "A5-LONG", "A4", "A4-LONG", "A3", "A2"],
         "setupFee": { "new": 74.28, "repeat": 0 },
         "priceMatrix": {
           "1-1-A6": 1.85,
           "1-2-A6": 1.77,
           // ... continue for all combinations
         }
       },
       "embroidery": { ... },
       "laser": { ... },
       "transfer": { ... },
       "vinyl": { ... }
     },
     "addOns": {
       "fold-and-bag-customer-labels": 0.70,
       "fold-and-bag-supplied": 1.00,
       // ... etc
     }
   }
   ```

**Key data points from your sheets**:
- **Screenprint**: Qty breaks (1,5,10,15,20,25,50,75,100,250,750,1000...), Colors (1,2,6,10,15,20,25), Sizes (A6-A2)
- **Embroidery**: Qty breaks same, stitch ranges (<5000, <6000, <9000), add-on options
- **Laser**: Qty breaks same, sizes (XS, S, M, L, XL), materials
- **Transfers**: Qty breaks same, placements (1-6), sizes
- **Vinyl**: Qty breaks, size variations, text type options
- **Add-ons**: All listed in your "Extras" tab

---

### PHASE 1B: Core Engine Implementation (2 hours)

**Create file**: `services/pricing/lib/pricing-engine.ts`

**Structure** (450-500 lines):

```
1. Imports & Types (50 lines)
   - Import pricing schema
   - Define interfaces (PricingRequest, PricingResponse, ServiceConfig)

2. Constants (50 lines)
   - MARGIN_MULTIPLIER = 1.35
   - SERVICES array
   - Load PRICING_RULES from schema

3. Helper Functions (200 lines)
   
   a) validateInput(request: PricingRequest): void
      - Check service exists
      - Check quantity > 0
      - Check required params for service
      - Throw helpful errors
   
   b) selectQuantityBreak(qty: number, breaks: number[]): number
      - Find highest break ≤ qty
      - Handle edge cases (qty too large)
      - Return selected break
   
   c) calculateUnitCost(service: string, params: any): number
      - Look up price in matrix
      - Return unit cost (no setup, no margin)
   
   d) calculateSetupCost(service: string, isNewDesign: boolean, params: any): number
      - Return setup fee based on service & isNewDesign
      - Handle per-placement/per-location variants
   
   e) calculateAddOns(addOns: Array): number
      - Sum all add-on costs
      - Return total
   
   f) applyMargin(cost: number): number
      - cost × 1.35
      - Round to 2 decimals
   
   g) getServiceConfig(service: string): ServiceConfig
      - Load config from PRICING_RULES
      - Validate service exists

4. Main Orchestrator (100 lines)
   
   export function getQuote(request: PricingRequest): PricingResponse
   - Validate input
   - Select quantity break
   - Calculate unit cost
   - Calculate setup cost
   - Calculate subtotal (unit_cost × qty + setup)
   - Calculate add-ons
   - Add add-ons to subtotal
   - Apply 35% margin
   - Build breakdown object
   - Return PricingResponse

5. Exports (optional helpers for testing)
   - export { selectQuantityBreak, calculateUnitCost, ... }
```

**Key Implementation Details**:

**Price Matrix Lookup**:
```typescript
function calculateUnitCost(service: string, quantity: number, colors?: number, size?: string): number {
  const config = PRICING_RULES.services[service];
  const qtyBreak = selectQuantityBreak(quantity, config.quantityBreaks);
  
  // Build matrix key based on service
  let matrixKey = `${qtyBreak}`;
  if (colors) matrixKey += `-${colors}`;
  if (size) matrixKey += `-${size}`;
  
  const unitCost = config.priceMatrix[matrixKey];
  if (!unitCost) throw new Error(`No pricing for ${matrixKey}`);
  return unitCost;
}
```

**Setup Fee Logic**:
```typescript
function calculateSetupCost(service: string, isNewDesign: boolean): number {
  if (!isNewDesign) return 0;
  
  const config = PRICING_RULES.services[service];
  return config.setupFee?.new || 0;
}
```

**Main Quote Function**:
```typescript
export function getQuote(request: PricingRequest): PricingResponse {
  // 1. Validate
  validateInput(request);
  
  // 2. Calculate unit cost (service-specific)
  const unitCost = calculateUnitCost(request.service, request.quantity, /* ...params... */);
  
  // 3. Calculate setup
  const setupCost = calculateSetupCost(request.service, request.isNewDesign);
  
  // 4. Calculate subtotal
  const printingCost = unitCost * request.quantity;
  const subtotal = printingCost + setupCost;
  
  // 5. Calculate add-ons
  const addOnsCost = calculateAddOns(request.addOns);
  
  // 6. Total cost before margin
  const totalCost = subtotal + addOnsCost;
  
  // 7. Apply margin
  const retailPrice = applyMargin(totalCost);
  
  // 8. Return response
  return {
    service: request.service,
    quantity: request.quantity,
    unitCost,
    setupCost,
    subtotal,
    addOns: request.addOns || [],
    totalCost,
    retailPrice,
    breakdown: {
      printingCost,
      setupCost,
      addOnsCost
    }
  };
}
```

---

### PHASE 1C: Comprehensive Testing (1 hour)

**Create file**: `services/pricing/tests/pricing-engine.test.ts`

**Test Structure** (300-400 lines, 25-30 tests):

```typescript
import { getQuote, selectQuantityBreak, calculateUnitCost, ... } from '../lib/pricing-engine';

describe('Pricing Engine', () => {
  
  // 1. Quantity Break Selection (3 tests)
  describe('selectQuantityBreak', () => {
    it('selects exact match', () => {
      const result = selectQuantityBreak(100, [1, 5, 10, 50, 100, 250]);
      expect(result).toBe(100);
    });
    
    it('selects highest without exceeding', () => {
      const result = selectQuantityBreak(75, [1, 5, 10, 50, 100, 250]);
      expect(result).toBe(50);
    });
    
    it('handles qty=1', () => {
      const result = selectQuantityBreak(1, [1, 5, 10, 50, 100]);
      expect(result).toBe(1);
    });
  });
  
  // 2. Setup Fee Logic (3 tests)
  describe('Setup Fee Calculation', () => {
    it('charges for new design', () => {
      const quote = getQuote({
        service: 'screenprint',
        quantity: 100,
        colors: 2,
        printSize: 'A5',
        isNewDesign: true
      });
      expect(quote.setupCost).toBeGreaterThan(0);
    });
    
    it('charges $0 for repeat design', () => {
      const quote = getQuote({
        service: 'screenprint',
        quantity: 100,
        colors: 2,
        printSize: 'A5',
        isNewDesign: false
      });
      expect(quote.setupCost).toBe(0);
    });
  });
  
  // 3. Margin Calculation (3 tests)
  describe('Margin (35%) Calculation', () => {
    it('applies 1.35x multiplier correctly', () => {
      const quote = getQuote({
        service: 'screenprint',
        quantity: 1,
        colors: 1,
        printSize: 'A6',
        isNewDesign: false
      });
      // unitCost should be ~1.85, retail should be ~2.50
      expect(quote.retailPrice).toBeCloseTo(quote.totalCost * 1.35, 2);
    });
  });
  
  // 4. Screenprint Pricing (4 tests)
  describe('Screenprint Pricing', () => {
    it('calculates A5 single color for 100 units', () => { /* ... */ });
    it('calculates A5 two colors for 100 units', () => { /* ... */ });
    it('applies higher quantity break for 250 units', () => { /* ... */ });
    it('includes setup fee for new design', () => { /* ... */ });
  });
  
  // 5. Embroidery Pricing (3 tests)
  describe('Embroidery Pricing', () => {
    it('calculates base embroidery cost', () => { /* ... */ });
    it('adds metallic thread premium', () => { /* ... */ });
    it('applies quantity breaks correctly', () => { /* ... */ });
  });
  
  // 6. Laser Pricing (3 tests)
  describe('Laser Etching Pricing', () => {
    it('prices different sizes correctly', () => { /* ... */ });
    it('handles material variations', () => { /* ... */ });
    it('applies quantity breaks', () => { /* ... */ });
  });
  
  // 7. Add-ons (3 tests)
  describe('Add-ons Pricing', () => {
    it('prices individual add-on', () => { /* ... */ });
    it('combines multiple add-ons', () => { /* ... */ });
    it('included in final retail price', () => { /* ... */ });
  });
  
  // 8. Edge Cases (4 tests)
  describe('Edge Cases', () => {
    it('rejects negative quantity', () => { /* ... */ });
    it('rejects unknown service', () => { /* ... */ });
    it('handles very large quantities (10000+)', () => { /* ... */ });
    it('rounds decimals to 2 places', () => { /* ... */ });
  });
});
```

**Key test patterns**:
```typescript
// Pattern 1: Direct calculation verification
it('calculates screenprint A5, 2 colors, qty 100', () => {
  const quote = getQuote({
    service: 'screenprint',
    quantity: 100,
    colors: 2,
    printSize: 'A5',
    isNewDesign: true
  });
  
  expect(quote.unitCost).toBe(1.82); // From Excel matrix
  expect(quote.setupCost).toBe(74.28); // From Excel
  expect(quote.printingCost).toBe(182); // 1.82 × 100
  expect(quote.subtotal).toBe(256.28); // 182 + 74.28
  expect(quote.retailPrice).toBeCloseTo(346, 1); // 256.28 × 1.35
});

// Pattern 2: Edge case validation
it('throws error for invalid quantity', () => {
  expect(() => {
    getQuote({
      service: 'screenprint',
      quantity: -10,
      colors: 1,
      printSize: 'A5'
    });
  }).toThrow('Quantity must be > 0');
});

// Pattern 3: Comparison tests (Excel vs Engine)
it('matches Excel pricing for multiple scenarios', () => {
  const testCases = [
    { qty: 1, colors: 1, size: 'A6', expectedUnitCost: 1.85 },
    { qty: 100, colors: 2, size: 'A5', expectedUnitCost: 1.82 },
    { qty: 250, colors: 6, size: 'A4', expectedUnitCost: 1.04 },
    // ... more
  ];
  
  testCases.forEach(tc => {
    const quote = getQuote({...tc});
    expect(quote.unitCost).toBe(tc.expectedUnitCost);
  });
});
```

---

### PHASE 1D: Data Schema (15 minutes)

**Create/Update file**: `services/pricing/data/pricing-rules-schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Mint Prints Pricing Rules",
  "description": "Complete pricing configuration for all services",
  "margin": 1.35,
  "currency": "NZD",
  "lastUpdated": "2025-11-23",
  "services": {
    "screenprint": {
      "name": "Screenprint Apparel",
      "description": "Full-color screen printing on apparel",
      "quantityBreaks": [1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000],
      "colorBreaks": [1, 2, 6, 10, 15, 20, 25],
      "sizeOptions": {
        "A6": "50x100mm",
        "A5": "75x100mm",
        "A5-LONG": "105x300mm",
        "A4": "210x300mm",
        "A4-LONG": "150x420mm",
        "A3": "300x420mm",
        "A2": "300x600mm"
      },
      "setupFee": {
        "new": 74.28,
        "repeat": 0
      },
      "priceMatrix": {
        "1-1-A6": 1.85,
        "1-1-A5": 1.77,
        "1-1-A5-LONG": 1.82,
        "1-1-A4": 1.82,
        "1-1-A4-LONG": 2.15,
        "1-1-A3": 2.82,
        "1-1-A2": 3.95,
        "1-2-A6": 1.77,
        // ... ALL combinations for all qty/color combos
        "10000-25-A2": 0.45  // Example large qty
      }
    },
    "embroidery": {
      "name": "Embroidery",
      "description": "Machine embroidery with custom digitizing",
      "quantityBreaks": [1, 5, 10, 15, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000],
      "stitchRanges": {
        "<5000": { min: 0, max: 5000 },
        "<6000": { min: 0, max: 6000 },
        "<9000": { min: 0, max: 9000 }
      },
      "setupFee": {
        "new": 27.88,
        "digitizing": 27.88,
        "repeat": 0
      },
      "addOns": {
        "metallicThread": 5.00,
        "specialHoops": "varies"
      },
      "priceMatrix": {
        "1-<5000": 5.63,
        "1-<6000": 7.95,
        "5-<5000": 5.00,
        // ... etc
      }
    },
    "laser": {
      "name": "Laser Etching",
      "quantityBreaks": [1, 5, 10, 15, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000],
      "sizes": {
        "XS": "60x100mm",
        "S": "100x150mm",
        "M": "150x200mm",
        "L": "200x300mm",
        "XL": "300x360mm"
      },
      "materials": ["Polyester", "Fleece", "Microfibre", "Cork", "Rubber", "Leather", "Bamboo", "Wood"],
      "setupFee": { "new": "varies", "repeat": 0 },
      "priceMatrix": {
        "1-XS": 5.50,
        "1-S": 7.50,
        "1-M": 10.00,
        // ... etc
      }
    },
    "transfer": {
      "name": "Printed Transfers",
      "quantityBreaks": [1, 5, 10, 15, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000],
      "types": ["DTF", "Supa Wearable", "Supa Metallic"],
      "sizes": ["XS", "SM", "LC", "A5", "A4", "A4-LONG", "A3"],
      "setupFee": { "new": "varies", "repeat": 0 },
      "priceMatrix": {
        "100-DTF-front": 5.43,
        "100-Supa Wearable-front": 4.75,
        "100-Supa Metallic-front": 4.75,
        // ... etc
      }
    },
    "vinyl": {
      "name": "Cut Vinyl Transfers",
      "quantityBreaks": [1, 10, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000],
      "types": ["Cotton", "Polyester"],
      "textTypes": ["SINGLE-NAMES", "DOUBLE-NAMES", "SINGLE-NUMBERS", "DOUBLE-NUMBERS", "TRIPLE-NUMBERS"],
      "priceMatrix": {
        "84-Cotton-front": 4.62,
        "84-Cotton-LC": 9.17,
        // ... etc
      }
    }
  },
  "addOns": {
    "fold-and-bag-customer-labels": { cost: 0.70, unit: "per item" },
    "fold-and-bag-supplied": { cost: 1.00, unit: "per item" },
    "add-insert": { cost: 0.30, unit: "per item" },
    "swing-ticketing": { cost: 0.30, unit: "per item" },
    "relabelling-admin": { cost: 15.00, unit: "per order" },
    "press-transfer-neck-labels": { cost: 0.75, unit: "per item" },
    "despatch-per-location": { cost: 15.00, unit: "per location" },
    "despatch-per-pallet": { cost: 15.00, unit: "per pallet" },
    "artwork-redraw": { cost: 45.00, unit: "per design" },
    "artwork-separation": { cost: 30.00, unit: "per color" },
    "artwork-proof": { cost: 15.00, unit: "per proof" }
  }
}
```

---

## 🎯 Spark/Cursor Prompt (Copy & Paste)

```
You are tasked with implementing a production-ready pricing engine for Mint Prints, a custom apparel printing company. The engine must accurately replicate Excel-based pricing from the "Platinum Pricing 35" model.

REQUIREMENTS:

1. CREATE FILE: services/pricing/lib/pricing-engine.ts
   - Implement pricing calculation functions in TypeScript
   - Support 6 services: screenprint, embroidery, laser, transfer, vinyl, extras
   - Handle complex multi-dimensional pricing (quantity × colors × sizes)
   - Implement 35% margin calculation (cost × 1.35 = retail price)
   - Support setup fees (new vs repeat designs)
   - Include add-ons pricing (packing, despatch, artwork services)

2. TYPES TO DEFINE:
   - PricingRequest: Input parameters (service, quantity, dimensions, options)
   - PricingResponse: Output with cost breakdown and retail price
   - ServiceConfig: Service-specific configuration

3. CORE FUNCTIONS:
   - selectQuantityBreak(qty, breaks): Select highest break ≤ qty
   - calculateUnitCost(service, params): Look up unit cost from matrix
   - calculateSetupCost(service, isNewDesign): Return setup fee
   - calculateAddOns(addOns): Sum all add-on costs
   - applyMargin(cost): Multiply by 1.35
   - getQuote(request): Main orchestrator - return full pricing

4. TESTING:
   - Create services/pricing/tests/pricing-engine.test.ts
   - 25-30 comprehensive unit tests
   - Test all services, quantity breaks, setup fees, margins, add-ons
   - Test edge cases and error handling
   - 100% passing test suite required

5. DATA:
   - Use pricing data from provided Excel sheets
   - Create services/pricing/data/pricing-rules-schema.json
   - Include all quantity breaks, colors, sizes, materials, setup fees
   - All pricing matrices fully populated

6. CODE QUALITY:
   - Full TypeScript types (no any)
   - DRY principle - reusable helpers
   - Comprehensive error handling with helpful messages
   - Well-documented with comments
   - Production-ready code

EXAMPLE USAGE:
const quote = getQuote({
  service: 'screenprint',
  quantity: 100,
  colors: 2,
  printSize: 'A5',
  isNewDesign: true,
  addOns: [{ type: 'fold-and-bag-supplied', quantity: 100 }]
});

SUCCESS CRITERIA:
✓ All pricing calculations accurate vs Excel
✓ All 6 services working
✓ 20+ passing unit tests
✓ TypeScript with full types
✓ Handles edge cases properly
✓ Fast (<1ms per quote)

START IMPLEMENTATION NOW.
```

---

## 📦 Deliverables Checklist

- [ ] `services/pricing/lib/pricing-engine.ts` (450+ lines)
- [ ] `services/pricing/tests/pricing-engine.test.ts` (300+ lines, 25-30 tests)
- [ ] `services/pricing/data/pricing-rules-schema.json` (fully populated)
- [ ] All tests passing
- [ ] TypeScript compilation succeeds
- [ ] README.md updated with usage examples

---

## ✅ Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Test Pass Rate | 100% | ⏳ |
| Code Coverage | 90%+ | ⏳ |
| TypeScript Errors | 0 | ⏳ |
| Calculation Accuracy | ±$0.01 vs Excel | ⏳ |
| Response Time | <1ms | ⏳ |
| Services Supported | 6/6 | ⏳ |

---

## 🚀 Next Steps After Implementation

1. Commit to git: `git add services/pricing/ && git commit -m "feat: Implement pricing engine - Phase 1 complete"`
2. Run tests: `npm test services/pricing/`
3. Merge to main
4. Move to Phase 2 (Rule Management UI)

**Timeline**: Ready to hand off to Spark/Cursor now!
