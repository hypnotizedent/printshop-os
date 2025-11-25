# Pricing Engine Implementation Prompt for Spark/Cursor

## Project Overview

**Goal**: Build a production-ready pricing engine that replicates the "Platinum Pricing 35" Excel model used by Mint Prints for custom apparel pricing.

**Technology Stack**:
- Language: TypeScript
- Framework: None (pure library)
- Location: `services/pricing/lib/pricing-engine.ts`
- Tests: `services/pricing/tests/pricing-engine.test.ts`
- Schema: `services/pricing/data/pricing-rules-schema.json`

**Timeline**: 3-4 hours
**Complexity**: Medium (complex but well-defined requirements)

---

## Business Requirements (From Excel Analysis)

### 1. Core Pricing Model

The pricing engine must handle **6 service types** with complex, nested pricing structures:

#### Service 1: SCREENPRINT - APPAREL
- **Quantity Breaks**: 1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000
- **Color Breaks**: 1, 2, 6, 10, 15, 20, 25
- **Print Sizes**: A6, A5, A5 LONG, A4, A4 LONG, A3, A2
- **Price Matrix**: Quantity × Color × Size = Unit Cost
- **Formula**: 
  ```
  Unit Cost = Base Cost (from matrix)
  Total Cost = Unit Cost × Quantity
  ```
- **Special Rule**: Set-up fee included (noted as "NEW DESIGN" or "REPEAT")
- **Margin Target**: 35% (Cost × 1.35 = Retail Price)

#### Service 2: EMBROIDERY - QUICK PRICE
- **Quantity Breaks**: 1, 5, 10, 15, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000
- **Stitch Count Ranges**: <5,000, <6,000, <9,000 stitches
- **Price Matrix**: Quantity × Stitches = Unit Cost
- **Special Options**:
  - New Digitising: $27.88 (one-time)
  - Standard Thread: included
  - Metallic Thread: +$5
  - Specialty Hoops: variable cost
  - Caps handling: different pricing
- **Margin Target**: 35%

#### Service 3: LASER ETCHING - QUICK QUOTE
- **Quantity Breaks**: 1, 5, 10, 15, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000
- **Size Options**: XS (60×100mm), S (100×150mm), M (150×200mm), L (200×300mm), XL (300×360mm)
- **Setup Cost**: Included or separate (NEW vs REPEAT)
- **Additional Options**: Heatpress for gloss/shimmer effect (+cost)
- **Materials**: 100% Polyester, Fleece, Microfibre, Cork, Rubber, Leather, Bamboo, Wood
- **Price Matrix**: Quantity × Size × Material = Unit Cost
- **Margin Target**: 35%

#### Service 4: PRINTED TRANSFERS - QUICK PRICE
- **Transfer Types**: DTF, Supa Wearable, Supa Metallic
- **Quantity Breaks**: Similar to screenprint
- **Placements**: 6 different location options
- **Print Sizes**: XS (40×40mm), SM (60×60mm), LC (100×100mm), A5 (210×150mm), A4 (210×300mm), A4 LONG (150×420mm), A3 (300×420mm)
- **Setup Cost**: Per placement per location
- **Price Matrix**: Quantity × Placement × Size = Unit Cost
- **Margin Target**: 35%

#### Service 5: CUT VINYL TRANSFERS - QUICK PRICE (1 Colour)
- **Vinyl Type**: Cotton, Polyester
- **Quantity Breaks**: 1, 10, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000
- **Logo/Text Size**: Height (mm) × Width (mm) variations
- **Options**: SINGLE NAMES, DOUBLE NAMES, SINGLE NUMBERS, DOUBLE NUMBERS, TRIPLE NUMBERS
- **Price Options**: Variable pricing per type
- **Setup Cost**: Included (varies by repeat vs new)
- **Price Matrix**: Quantity × Size × Type = Unit Cost
- **Margin Target**: 35%

#### Service 6: ADD-ONS / EXTRAS
- **Packing & Finishing**:
  - Fold and Bag (customer labels): $0.70
  - Fold and Bag (supplied): $1.00
  - Add Insert: $0.30
  - Swing ticketing: $0.30
  - Relabelling admin: $15.00
  - Press transfer neck labels: $0.75
- **Unpacking**: POA (Price on Application)
- **Despatch**:
  - Per location: $15.00
  - Per pallet: $15.00
  - Courier: At cost + $2.50
- **Artwork Services**:
  - Redraw: $45.00
  - Art Separation: $30 per color
  - Supply Art Proof: $15.00

---

## 2. Pricing Rules & Logic

### Margin Calculation
```
Retail Price = Cost × 1.35 (35% margin)
```

### Quantity Break Selection
- Must select the **highest quantity break** that doesn't exceed the order quantity
- Example: Order of 75 units
  - Available breaks: 1, 5, 10, 15, 20, 25, 50, 75, 100
  - Selected: 75 (exact match)

- Example: Order of 60 units
  - Available breaks: 1, 5, 10, 15, 20, 25, 50, 75, 100
  - Selected: 50 (highest without exceeding)

### Set-up Fees
- **NEW DESIGN**: Full set-up cost applies (varies by service)
- **REPEAT**: No set-up cost or reduced cost
- **Applied Per**: Design, per placement, per location (service-dependent)

### Multi-dimensional Pricing
- Some services have **3D+ pricing matrices**:
  - Screenprint: Quantity × Colors × Size
  - Embroidery: Quantity × Stitches
  - Laser: Quantity × Size × Material

---

## 3. Data Structure Requirements

### Input Parameters (User specifies)
```typescript
interface PricingRequest {
  service: 'screenprint' | 'embroidery' | 'laser' | 'transfer' | 'vinyl' | 'extras';
  quantity: number;
  // Service-specific parameters
  colors?: number;                    // For screenprint
  printSize?: 'A6' | 'A5' | 'A4' | 'A3' | 'A2' | string;
  stitchCount?: number;               // For embroidery
  laserSize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  material?: string;                  // For laser
  transferType?: 'DTF' | 'Supa Wearable' | 'Supa Metallic';
  placement?: number;                 // Number of placements (1-6)
  isNewDesign?: boolean;              // Set-up fee applicable?
  // Add-ons
  addOns?: Array<{ type: string; quantity?: number }>;
}
```

### Output Parameters
```typescript
interface PricingResponse {
  service: string;
  quantity: number;
  unitCost: number;
  setupCost: number;
  subtotal: number;                   // Before add-ons
  addOns: Array<{
    type: string;
    cost: number;
  }>;
  totalCost: number;                  // Cost (internal)
  retailPrice: number;                // Retail (35% margin applied)
  breakdown: {
    printingCost: number;
    setupCost: number;
    addOnsCost: number;
  };
}
```

### Pricing Rules Schema
```json
{
  "services": {
    "screenprint": {
      "quantityBreaks": [1, 5, 10, 15, 20, 25, 50, 75, 100, ...],
      "colorOptions": [1, 2, 6, 10, 15, 20, 25],
      "sizeOptions": ["A6", "A5", "A5 LONG", "A4", "A4 LONG", "A3", "A2"],
      "priceMatrix": {
        "1-1-A6": 1.85,
        "1-1-A5": 1.77,
        ...
      },
      "setupFee": {
        "new": 74.28,
        "repeat": 0
      }
    },
    "embroidery": { ... },
    "laser": { ... },
    "transfer": { ... },
    "vinyl": { ... }
  }
}
```

---

## 4. Implementation Requirements

### Core Functions

#### 1. `calculateUnitCost(params)`
- Takes service, quantity, dimensions, options
- Looks up correct price break
- Returns unit cost (before set-up, before margin)

#### 2. `calculateSetupCost(params)`
- Determines if new design or repeat
- Returns appropriate setup fee
- Can be service-specific

#### 3. `selectQuantityBreak(requestedQty, availableBreaks)`
- Finds highest break ≤ requestedQty
- Returns selected break

#### 4. `calculateAddOns(addOnsList)`
- Prices out each add-on item
- Sums total add-on costs
- Returns itemized breakdown

#### 5. `applyMargin(cost)`
- Multiplies cost by 1.35
- Returns retail price

#### 6. `getFullQuote(request: PricingRequest)`
- Main orchestrator function
- Calls all helpers
- Returns `PricingResponse`

### Error Handling
- Invalid service type
- Invalid dimensions/colors
- Quantity < 1
- Missing required parameters
- Unknown material/option

### Validation
- All inputs validated before calculation
- Helpful error messages for invalid inputs
- Warnings for unusual combinations (e.g., 25,000 units on small size)

---

## 5. Testing Requirements

Must include comprehensive test suite:

### Test Categories

1. **Unit Cost Lookup**
   - Exact quantity break matches
   - Between-break quantity selection
   - Edge cases (qty=1, qty=10000)
   - Multiple dimensions (colors, sizes, materials)

2. **Setup Fee Logic**
   - New design charges correct fee
   - Repeat design charges $0
   - Per-placement calculations
   - Multi-location scenarios

3. **Margin Calculation**
   - $1.00 cost → $1.35 retail ✓
   - $10.00 cost → $13.50 retail ✓
   - Decimal precision handling

4. **Add-ons Pricing**
   - Individual add-on costs
   - Multiple add-ons combined
   - Cost accumulation

5. **Full Quote Integration**
   - Screenprint: 100 units, 2 colors, A5 size → correct total
   - Embroidery: 50 units, 5000 stitches, metallic thread → correct total
   - Laser: 200 units, M size, polyester → correct total
   - Mixed scenarios

6. **Edge Cases & Errors**
   - Negative quantities
   - Unknown services
   - Missing required parameters
   - Decimal quantity handling
   - Very large quantities (10000+)

---

## 6. Code Structure

```typescript
// services/pricing/lib/pricing-engine.ts

// 1. Type definitions
interface PricingRequest { ... }
interface PricingResponse { ... }
interface ServiceConfig { ... }

// 2. Constants & configuration
const PRICING_RULES = { ... };
const MARGIN_MULTIPLIER = 1.35;
const SERVICES = ['screenprint', 'embroidery', 'laser', 'transfer', 'vinyl', 'extras'];

// 3. Helper functions
function selectQuantityBreak() { ... }
function validateInput() { ... }
function calculateUnitCost() { ... }
function calculateSetupCost() { ... }
function calculateAddOns() { ... }
function applyMargin() { ... }

// 4. Main orchestrator
export function getQuote(request: PricingRequest): PricingResponse { ... }

// 5. Export helpers for testing
export { selectQuantityBreak, calculateUnitCost, ... };
```

---

## 7. Data Input

The pricing data should be loaded from `pricing-rules-schema.json`:

```json
{
  "margin": 1.35,
  "services": {
    "screenprint": {
      "description": "Screen printed apparel",
      "quantityBreaks": [1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000],
      "colorBreaks": [1, 2, 6, 10, 15, 20, 25],
      "sizeOptions": ["A6", "A5", "A5-LONG", "A4", "A4-LONG", "A3", "A2"],
      "setupFee": { "new": 74.28, "repeat": 0 },
      "priceMatrix": {
        // Format: "qty-color-size" -> unitCost
        "1-1-A6": 1.85,
        "1-1-A5": 1.77,
        "1-1-A4": 1.82,
        "1-2-A6": 1.77,
        // ... hundreds more entries
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
    "add-insert": 0.30,
    "swing-ticketing": 0.30,
    "relabelling-admin": 15.00,
    "press-transfer-neck-labels": 0.75,
    "despatch-per-location": 15.00,
    "despatch-per-pallet": 15.00,
    "artwork-redraw": 45.00,
    "artwork-separation": 30.00,
    "artwork-proof": 15.00
  }
}
```

---

## 8. Success Criteria

### Functionality ✓
- [ ] All 6 services pricing working
- [ ] Quantity break selection correct
- [ ] Setup fees applied correctly
- [ ] Margin calculation accurate (always 35%)
- [ ] Add-ons pricing correct
- [ ] Multi-dimensional pricing (qty × colors × size) working

### Code Quality ✓
- [ ] TypeScript with full types
- [ ] 20+ unit tests with 100% pass rate
- [ ] Clear, well-documented code
- [ ] Reusable helper functions
- [ ] DRY principle followed
- [ ] Comprehensive error handling

### Data ✓
- [ ] All pricing rules in schema.json
- [ ] Easy to update pricing values
- [ ] Schema matches Excel data
- [ ] All quantity/color/size options included

### Performance ✓
- [ ] Fast lookups (<1ms per quote)
- [ ] Handles 10000+ quantity orders
- [ ] No memory leaks
- [ ] Efficient data structures

---

## 9. Deliverables

1. **`services/pricing/lib/pricing-engine.ts`** (450-500 lines)
   - Core implementation with all functions
   - Full TypeScript types
   - Comprehensive error handling

2. **`services/pricing/tests/pricing-engine.test.ts`** (300+ lines)
   - 25-30 test cases
   - All services tested
   - Edge cases covered

3. **`services/pricing/data/pricing-rules-schema.json`** (populated)
   - All pricing data
   - Easy reference format
   - Complete coverage

4. **`services/pricing/README.md`** (updated)
   - Usage examples
   - API documentation
   - How to update pricing

---

## 10. Example Usage

```typescript
import { getQuote } from './pricing-engine';

// Example 1: Screenprint quote
const request1 = {
  service: 'screenprint',
  quantity: 100,
  colors: 2,
  printSize: 'A5',
  isNewDesign: true
};

const quote1 = getQuote(request1);
console.log(quote1);
// {
//   service: 'screenprint',
//   quantity: 100,
//   unitCost: 1.82,
//   setupCost: 74.28,
//   subtotal: 256.28,
//   retailPrice: 345.98,
//   breakdown: { ... }
// }

// Example 2: Embroidery quote
const request2 = {
  service: 'embroidery',
  quantity: 50,
  stitchCount: 5000,
  threadType: 'metallic',
  isNewDesign: false
};

const quote2 = getQuote(request2);

// Example 3: With add-ons
const request3 = {
  service: 'screenprint',
  quantity: 250,
  colors: 1,
  printSize: 'A4',
  isNewDesign: false,
  addOns: [
    { type: 'fold-and-bag-supplied', quantity: 250 },
    { type: 'swing-ticketing', quantity: 250 },
    { type: 'despatch-per-location', quantity: 1 }
  ]
};

const quote3 = getQuote(request3);
```

---

## Next Steps

1. **Parse the Excel data** into the `pricing-rules-schema.json`
2. **Implement core engine** in TypeScript
3. **Write comprehensive tests**
4. **Validate against Excel** (spot-check calculations)
5. **Deploy to Phase 1** complete

**Estimated Time**: 3-4 hours for complete implementation
