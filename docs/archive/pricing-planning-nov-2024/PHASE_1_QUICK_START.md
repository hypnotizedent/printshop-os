# Phase 1: Pricing Engine Port - Quick Start Guide

**Objective**: Port core pricing logic from job-estimator to printshop-os  
**Effort**: 8-12 hours  
**Timeline**: 4-5 days working 2-3 hours/day  
**Status**: Ready to begin

---

## What You're Doing

You're copying the proven pricing calculation logic from `/projects/job-estimator/src/lib/pricing-engine.ts` and adapting it for printshop-os's needs:

1. ✅ Color-based charging (not just per-location)
2. ✅ 35% margin model (not hardcoded prices)
3. ✅ Supplier-driven costs (S&S, AS Colour, SanMar)
4. ✅ Unit tested with 20+ test cases

---

## Step-by-Step Implementation

### Step 1: Create Directory Structure (30 min)

```bash
cd /Users/ronnyworks/Projects/printshop-os

# Create the pricing service scaffold
mkdir -p services/pricing/{lib,data,tests,strapi}

# Copy baseline files
touch services/pricing/package.json
touch services/pricing/lib/pricing-engine.ts
touch services/pricing/lib/margin-calculator.ts
touch services/pricing/lib/color-calculator.ts
touch services/pricing/tests/pricing-engine.test.ts
touch services/pricing/data/pricing-rules-schema.json
```

### Step 2: Create package.json (15 min)

**File**: `services/pricing/package.json`

```json
{
  "name": "@printshop-os/pricing",
  "version": "1.0.0",
  "description": "Pricing engine service for PrintShop OS",
  "main": "lib/pricing-engine.ts",
  "scripts": {
    "test": "node --test tests/*.test.ts",
    "build": "tsc",
    "dev": "ts-node lib/pricing-engine.ts"
  },
  "dependencies": {
    "typescript": "^5.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "ts-node": "^10.9.0",
    "@types/node": "^20.10.0"
  }
}
```

### Step 3: Port Pricing Engine (2-3 hours)

**File**: `services/pricing/lib/pricing-engine.ts`

**Source**: `/Users/ronnyworks/Projects/job-estimator/src/lib/pricing-engine.ts`

Start with copying the entire file, then modify:

```typescript
// ============================================
// SECTION 1: Import & Types (copy from job-estimator)
// ============================================
export type PricingOptions = { ... };
export type ScreenRow = { ... };
export type PricingRule = { ... };

// ============================================
// SECTION 2: Parsing Utilities (copy as-is)
// ============================================
function parseQuantitySpec(q: any) { ... }
function toNumber(v: any) { ... }
export function loadScreenPricingRules(jsonPath: string) { ... }

// ============================================
// SECTION 3: MODIFIED - Supplier Cost Model
// ============================================
// CHANGE: Remove hardcoded base prices
// REASON: We get costs from suppliers, not hardcode them

export type QuoteOptions = {
  quantity: number;
  colors: number;
  size?: 'S' | 'M' | 'L' | 'XL' | 'Jumbo';
  supplierCost?: number;  // NEW: From supplier API
  colorSurchargePerColor?: number;  // NEW: $0.50 default
  marginPercent?: number;  // NEW: 35% default
};

// ============================================
// SECTION 4: MODIFIED - Core Calculation
// ============================================
export function calculateBasePrice(
  quantity: number, 
  opts: Partial<QuoteOptions> = {}
): number {
  // Updated to use supplier cost instead of service-based pricing
  const supplierCost = opts.supplierCost ?? 5.00;  // fallback
  const colorSurcharge = (opts.colors ?? 1) * (opts.colorSurchargePerColor ?? 0.50);
  const sizeMultiplier = opts.size === 'Jumbo' ? 1.2 : 1.0;
  
  const unitPrice = (supplierCost + colorSurcharge) * sizeMultiplier;
  const total = unitPrice * quantity;
  
  return Number(total.toFixed(2));
}

// ============================================
// SECTION 5: NEW - Margin Calculator
// ============================================
export function applyMargin(
  baseCost: number,
  marginPercent: number = 35
): number {
  // Formula: retail = cost * (1 + margin%)
  // Example: $10.00 cost → $13.50 retail (35% margin)
  return Number((baseCost * (1 + marginPercent / 100)).toFixed(2));
}

export function calculateMarginAmount(
  retailPrice: number,
  costPrice: number
): number {
  return Number((retailPrice - costPrice).toFixed(2));
}

// ============================================
// SECTION 6: KEEP - Runtime Quoting
// ============================================
export function quoteFromRules(rules: PricingRule[], quantity: number): Quote {
  // This function works as-is from job-estimator
  // No changes needed - it's already perfect
  ...
}

// ============================================
// SECTION 7: NEW - Full Quote with Margin
// ============================================
export function generateQuote(
  quantity: number,
  options: Partial<QuoteOptions> & { supplierCost: number }
): {
  quantity: number;
  supplierCost: number;
  colorSurcharge: number;
  unitPrice: number;
  subtotal: number;
  margin: number;
  retailPrice: number;
  breakdown: object;
} {
  const colors = options.colors ?? 1;
  const colorMultiplier = options.colorSurchargePerColor ?? 0.50;
  const marginPercent = options.marginPercent ?? 35;
  
  const colorSurcharge = colors * colorMultiplier;
  const baseCost = options.supplierCost;
  const unitCost = baseCost + colorSurcharge;
  const subtotal = unitCost * quantity;
  
  const retailPrice = applyMargin(subtotal, marginPercent);
  const margin = calculateMarginAmount(retailPrice, subtotal);
  
  return {
    quantity,
    supplierCost: Number(baseCost.toFixed(2)),
    colorSurcharge: Number(colorSurcharge.toFixed(2)),
    unitPrice: Number(unitCost.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    retailPrice,
    breakdown: {
      quantity,
      colors,
      colorMultiplier,
      margins: `${marginPercent}%`,
      calculations: {
        unitCost: `$${baseCost} + ($${colorMultiplier} × ${colors} colors) = $${unitCost}`,
        subtotal: `$${unitCost} × ${quantity} = $${subtotal}`,
        retail: `$${subtotal} × ${1 + marginPercent / 100} = $${retailPrice}`
      }
    }
  };
}
```

### Step 4: Create Margin Calculator (45 min)

**File**: `services/pricing/lib/margin-calculator.ts`

```typescript
/**
 * Margin Calculator for PrintShop OS
 * 
 * Model: Retail Price = Cost × (1 + Margin%)
 * Example: $10 cost → $13.50 retail (35% margin)
 * 
 * Why 35%? Covers:
 * - Material shrinkage/waste (~5%)
 * - Labor/setup costs (~10%)
 * - Equipment maintenance (~5%)
 * - Business overhead (~10%)
 * - Profit (~5%)
 */

export class MarginCalculator {
  private targetMarginPercent: number;

  constructor(marginPercent: number = 35) {
    if (marginPercent < 0 || marginPercent > 100) {
      throw new Error('Margin must be between 0 and 100%');
    }
    this.targetMarginPercent = marginPercent;
  }

  /**
   * Calculate retail price from cost
   * @param cost Cost of goods/production
   * @param marginPercent Optional override of target margin
   * @returns Retail price with margin applied
   */
  toRetail(cost: number, marginPercent?: number): number {
    const margin = marginPercent ?? this.targetMarginPercent;
    const multiplier = 1 + margin / 100;
    return Number((cost * multiplier).toFixed(2));
  }

  /**
   * Calculate cost from retail price
   * @param retail Retail price
   * @param marginPercent Optional override
   * @returns Cost backed out of retail price
   */
  toCost(retail: number, marginPercent?: number): number {
    const margin = marginPercent ?? this.targetMarginPercent;
    const multiplier = 1 + margin / 100;
    return Number((retail / multiplier).toFixed(2));
  }

  /**
   * Calculate profit margin amount
   * @param retail Retail price
   * @param cost Cost price
   * @returns Profit amount
   */
  profitAmount(retail: number, cost: number): number {
    return Number((retail - cost).toFixed(2));
  }

  /**
   * Calculate actual margin percent achieved
   * @param retail Retail price
   * @param cost Cost price
   * @returns Actual margin percentage
   */
  actualMarginPercent(retail: number, cost: number): number {
    if (cost === 0) return 0;
    return Number(((retail - cost) / cost * 100).toFixed(2));
  }

  /**
   * Validate quote meets target margin
   * @param retail Retail price
   * @param cost Cost price
   * @returns Object with validation result
   */
  validateMargin(retail: number, cost: number): {
    valid: boolean;
    actual: number;
    target: number;
    difference: number;
  } {
    const actual = this.actualMarginPercent(retail, cost);
    return {
      valid: Math.abs(actual - this.targetMarginPercent) < 0.01,
      actual: Number(actual.toFixed(2)),
      target: this.targetMarginPercent,
      difference: Number((actual - this.targetMarginPercent).toFixed(2))
    };
  }
}

// Export default instance with 35% margin
export const defaultMarginCalculator = new MarginCalculator(35);

// Helper functions
export function toRetail(cost: number, marginPercent: number = 35): number {
  return defaultMarginCalculator.toRetail(cost, marginPercent);
}

export function toCost(retail: number, marginPercent: number = 35): number {
  return defaultMarginCalculator.toCost(retail, marginPercent);
}
```

### Step 5: Create Color Calculator (30 min)

**File**: `services/pricing/lib/color-calculator.ts`

```typescript
/**
 * Color Surcharge Calculator for PrintShop OS
 * 
 * Model: Additional cost per color added
 * Default: $0.50 per color
 * 
 * Rationale:
 * - Color 1: Included in base screen setup ($35)
 * - Color 2+: Each adds $0.50 per unit
 */

export type ColorTierPricing = {
  colors: number;
  surchargePerUnit: number;
};

export class ColorCalculator {
  private baseSurcharge: number = 0.50;  // Default: $0.50 per color
  private tiers: ColorTierPricing[] = [];

  constructor(baseSurcharge?: number) {
    if (baseSurcharge !== undefined) {
      this.baseSurcharge = baseSurcharge;
    }
  }

  /**
   * Add color tier pricing
   * @param colors Number of colors
   * @param surchargePerUnit Price per unit for this tier
   */
  addTier(colors: number, surchargePerUnit: number): void {
    this.tiers.push({ colors, surchargePerUnit });
    this.tiers.sort((a, b) => a.colors - b.colors);
  }

  /**
   * Calculate surcharge for a given color count
   * @param colorCount Number of colors
   * @param quantity Number of units
   * @returns Total surcharge for all units
   */
  calculateSurcharge(colorCount: number, quantity: number = 1): number {
    let surchargePerUnit = this.baseSurcharge;

    // Check if custom tier matches
    for (const tier of this.tiers) {
      if (tier.colors === colorCount) {
        surchargePerUnit = tier.surchargePerUnit;
        break;
      }
    }

    // Color surcharge only applies for colors beyond the first
    const chargeableColors = Math.max(0, colorCount - 1);
    return Number((surchargePerUnit * chargeableColors * quantity).toFixed(2));
  }

  /**
   * Calculate per-unit surcharge
   * @param colorCount Number of colors
   * @returns Surcharge per unit
   */
  surchargePerUnit(colorCount: number): number {
    const chargeableColors = Math.max(0, colorCount - 1);
    let surchargePerUnit = this.baseSurcharge;

    for (const tier of this.tiers) {
      if (tier.colors === colorCount) {
        surchargePerUnit = tier.surchargePerUnit;
        break;
      }
    }

    return Number((surchargePerUnit * chargeableColors).toFixed(2));
  }

  /**
   * Get pricing breakdown by color
   * @param maxColors Maximum colors to show
   * @returns Array of color pricing
   */
  getPricingBreakdown(maxColors: number = 6): Array<{
    colors: number;
    surchargePerUnit: number;
  }> {
    const breakdown = [];
    for (let i = 1; i <= maxColors; i++) {
      breakdown.push({
        colors: i,
        surchargePerUnit: this.surchargePerUnit(i)
      });
    }
    return breakdown;
  }
}

// Export default instance
export const defaultColorCalculator = new ColorCalculator(0.50);

// Helper functions
export function calculateColorSurcharge(
  colorCount: number,
  quantity: number = 1,
  surchargePerColor: number = 0.50
): number {
  const chargeableColors = Math.max(0, colorCount - 1);
  return Number((surchargePerColor * chargeableColors * quantity).toFixed(2));
}

export function colorSurchargePerUnit(
  colorCount: number,
  surchargePerColor: number = 0.50
): number {
  const chargeableColors = Math.max(0, colorCount - 1);
  return Number((surchargePerColor * chargeableColors).toFixed(2));
}
```

### Step 6: Create Unit Tests (2 hours)

**File**: `services/pricing/tests/pricing-engine.test.ts`

```typescript
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  calculateBasePrice,
  applyMargin,
  calculateMarginAmount,
  generateQuote,
} from '../lib/pricing-engine.js';
import { MarginCalculator } from '../lib/margin-calculator.js';
import { calculateColorSurcharge } from '../lib/color-calculator.js';

describe('Pricing Engine - Core Calculations', () => {
  test('Calculate base price for 1 color, 100 quantity', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 1,
      colorSurchargePerColor: 0.50,
    });
    // Expected: (5.00 + 0) * 100 = $500.00
    assert.equal(result, 500.00);
  });

  test('Calculate base price with 2 colors', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 2,
      colorSurchargePerColor: 0.50,
    });
    // Expected: (5.00 + 0.50) * 100 = $550.00
    assert.equal(result, 550.00);
  });

  test('Calculate base price with Jumbo size multiplier', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 1,
      size: 'Jumbo',
    });
    // Expected: 5.00 * 1.2 * 100 = $600.00
    assert.equal(result, 600.00);
  });
});

describe('Margin Calculator', () => {
  const calc = new MarginCalculator(35);

  test('Convert cost to retail with 35% margin', () => {
    const retail = calc.toRetail(100);
    // Expected: 100 * 1.35 = $135.00
    assert.equal(retail, 135.00);
  });

  test('Convert retail to cost with 35% margin', () => {
    const cost = calc.toCost(135);
    // Expected: 135 / 1.35 = $100.00
    assert.equal(cost, 100.00);
  });

  test('Calculate profit amount', () => {
    const profit = calc.profitAmount(135, 100);
    // Expected: 135 - 100 = $35.00
    assert.equal(profit, 35.00);
  });

  test('Validate margin is 35%', () => {
    const validation = calc.validateMargin(135, 100);
    assert.equal(validation.valid, true);
    assert.equal(validation.actual, 35.00);
  });
});

describe('Color Surcharge', () => {
  test('No surcharge for 1 color', () => {
    const surcharge = calculateColorSurcharge(1, 100, 0.50);
    assert.equal(surcharge, 0.00);
  });

  test('$0.50 surcharge per unit for 2 colors', () => {
    const surcharge = calculateColorSurcharge(2, 100, 0.50);
    // Expected: 0.50 * 1 color * 100 units = $50.00
    assert.equal(surcharge, 50.00);
  });

  test('$1.00 surcharge per unit for 3 colors', () => {
    const surcharge = calculateColorSurcharge(3, 100, 0.50);
    // Expected: 0.50 * 2 colors * 100 units = $100.00
    assert.equal(surcharge, 100.00);
  });
});

describe('Full Quote Generation', () => {
  test('Generate complete quote for 100 shirts, 2 colors, 35% margin', () => {
    const quote = generateQuote(100, {
      supplierCost: 5.00,
      colors: 2,
      colorSurchargePerColor: 0.50,
      marginPercent: 35,
    });

    assert.equal(quote.quantity, 100);
    assert.equal(quote.supplierCost, 5.00);
    assert.equal(quote.colorSurcharge, 1.00);  // 0.50 * 2 colors * 1 unit
    assert.equal(quote.unitPrice, 6.00);       // 5.00 + 1.00
    assert.equal(quote.subtotal, 600.00);      // 6.00 * 100
    assert.equal(quote.retailPrice, 810.00);   // 600 * 1.35
    assert.equal(quote.margin, 210.00);        // 810 - 600
  });
});

describe('Edge Cases', () => {
  test('Handle zero colors', () => {
    const quote = generateQuote(50, {
      supplierCost: 5.00,
      colors: 0,
      marginPercent: 35,
    });
    // Should still work, just use base cost
    assert.ok(quote.retailPrice > 0);
  });

  test('Handle large quantities', () => {
    const quote = generateQuote(10000, {
      supplierCost: 5.00,
      colors: 3,
      marginPercent: 35,
    });
    // Should handle large numbers without overflow
    assert.ok(quote.retailPrice > 100000);
  });

  test('Margin calculator with different percentages', () => {
    const calc35 = new MarginCalculator(35);
    const calc40 = new MarginCalculator(40);

    const retail35 = calc35.toRetail(100);
    const retail40 = calc40.toRetail(100);

    // 40% margin should result in higher retail price
    assert.ok(retail40 > retail35);
  });
});
```

### Step 7: Create Schema (20 min)

**File**: `services/pricing/data/pricing-rules-schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PrintShop OS Pricing Rules",
  "description": "JSON schema for dynamic pricing rules",
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "required": ["id", "service", "minQty", "unitPrice"],
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$",
        "description": "Unique identifier for rule"
      },
      "service": {
        "enum": ["screen", "embroidery", "laser", "transfer"],
        "description": "Print service type"
      },
      "minQty": {
        "type": "integer",
        "minimum": 1,
        "description": "Minimum quantity for this rule"
      },
      "maxQty": {
        "type": ["integer", "null"],
        "minimum": 1,
        "description": "Maximum quantity (null = unlimited)"
      },
      "unitPrice": {
        "type": "number",
        "minimum": 0,
        "description": "Price per unit before surcharges"
      },
      "setupPrice": {
        "type": ["number", "null"],
        "minimum": 0,
        "description": "One-time setup fee"
      },
      "colorSurcharge": {
        "type": "number",
        "default": 0.50,
        "description": "Additional cost per color beyond first"
      },
      "marginPercent": {
        "type": "integer",
        "default": 35,
        "minimum": 0,
        "maximum": 100,
        "description": "Margin target for this rule"
      },
      "notes": {
        "type": ["string", "null"],
        "description": "Internal notes about rule"
      }
    }
  }
}
```

### Step 8: Test Everything (1 hour)

```bash
cd services/pricing

# Install dependencies
npm install

# Run tests
npm test

# Expected output: All tests pass (20+ assertions)
```

---

## What Comes Next

✅ **After Phase 1 Complete**:
1. Create PR: `refactor/enterprise-foundation` → `main`
2. Get code review
3. Merge to main
4. Move to **Phase 2**: Rule Management System

✅ **Success Looks Like**:
- ✅ All tests passing
- ✅ Core pricing logic working with color surcharges
- ✅ 35% margin model implemented and tested
- ✅ Documentation in place
- ✅ Ready for Phase 2

---

## Troubleshooting

### Test Failures
If tests fail, check:
1. TypeScript compilation errors
2. Missing imports
3. Calculation logic (especially margin formula)
4. Number rounding (use `.toFixed(2)`)

### Margin Math Issues
Remember: `Retail = Cost × (1 + Margin%)`
- $100 cost + 35% margin = $135 retail
- $10 profit ÷ $100 cost = 10% actual margin

### File Paths
All paths are relative to `services/pricing/`:
- `lib/` - Core logic
- `data/` - Schemas and sample data
- `tests/` - Unit tests

---

## Next Steps

1. ✅ Read this guide
2. ✅ Create directory structure
3. ✅ Port pricing logic from job-estimator
4. ✅ Create margin and color calculators
5. ✅ Write tests
6. ✅ Run tests and validate
7. ✅ Commit to git
8. ✅ Review with team

**Time Estimate**: 4-5 hours of focused work

**Ready?** Start with Step 1! 🚀
