# Phase 1: CONDENSED Quick Start (Recommended)
## Simplified Implementation - 5-6 hours total

**Objective**: Port and integrate pricing logic from job-estimator in one lean phase  
**Effort**: 5-6 hours (vs 8-10 with separate files)  
**Timeline**: 2-3 days working 2-3 hours/day  
**Status**: Ready to execute

---

## Why Condensed?

### Consolidated Approach
Instead of 4 separate files, we'll consolidate to **2 core files**:
1. **pricing-engine.ts** - Contains all calculation logic
2. **pricing-engine.test.ts** - All tests in one suite

### Time Savings
- Removes file splitting overhead
- Reduces imports/exports complexity
- Keeps logic co-located
- Easier to test together

### What We're NOT Losing
- All functionality remains
- All tests included
- All margin/color logic present
- Full documentation

---

## The 4-Step Implementation

### Step 1: Create Structure (30 min)
```bash
cd /Users/ronnyworks/Projects/printshop-os

mkdir -p services/pricing/{lib,data,tests,strapi}

# Create core files
touch services/pricing/lib/pricing-engine.ts
touch services/pricing/tests/pricing-engine.test.ts
touch services/pricing/data/pricing-rules-schema.json
touch services/pricing/package.json
touch services/pricing/README.md
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

### Step 3: Port + Integrate Pricing Engine (3-4 hours)
**File**: `services/pricing/lib/pricing-engine.ts`

This is the **comprehensive single file** combining:
- Core pricing logic (from job-estimator)
- Margin calculator (35% model)
- Color surcharge calculator
- Helper utilities

```typescript
/**
 * PrintShop OS Pricing Engine
 * 
 * Combines:
 * 1. Core logic from job-estimator/src/lib/pricing-engine.ts
 * 2. Margin calculator (35% model)
 * 3. Color surcharge system
 * 4. Supplier cost integration hooks
 */

// ============================================
// SECTION 1: Type Definitions
// ============================================

export type PricingOptions = {
  service: 'screen' | 'embroidery' | 'laser' | 'transfer';
  colors?: number;
  size?: 'S' | 'M' | 'L' | 'XL' | 'Jumbo';
  supplierCost?: number;
  colorSurchargePerColor?: number;
  marginPercent?: number;
};

export type ScreenRow = {
  quantity?: any;
  size?: string | null;
  colors?: any;
  unit_price?: any;
  total_price?: any;
  notes?: string | null;
  [k: string]: any;
};

export type PricingRule = {
  minQty: number;
  maxQty?: number;
  unitPrice: number;
  setupPrice?: number;
  size?: string | null;
  colors?: number | null;
  raw?: ScreenRow;
};

export type Quote = {
  total: number;
  breakdown: {
    unit: number;
    quantity: number;
    setup: number;
  };
};

// ============================================
// SECTION 2: Parsing Utilities (from job-estimator)
// ============================================

function parseQuantitySpec(q: any): { minQty: number; maxQty?: number } {
  if (q === null || q === undefined) {
    return { minQty: 1 };
  }
  const s = String(q).trim();
  if (s.includes('-')) {
    const parts = s.split('-').map(p => p.trim());
    const minQ = parseInt(parts[0], 10);
    const maxQ = parseInt(parts[1], 10);
    return {
      minQty: Number.isNaN(minQ) ? 1 : minQ,
      maxQty: Number.isNaN(maxQ) ? undefined : maxQ
    };
  }
  if (s.endsWith('+')) {
    const n = parseInt(s.slice(0, -1), 10);
    return { minQty: Number.isNaN(n) ? 1 : n };
  }
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return { minQty: n, maxQty: n };
  return { minQty: 1 };
}

function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.\-]/g, '').trim();
  if (s === '') return undefined;
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}

// ============================================
// SECTION 3: Core Pricing Functions
// ============================================

export function loadScreenPricingRules(jsonPath: string): PricingRule[] {
  // Note: In production, this would be async and load from Strapi/file
  // For now, returns empty - will be implemented in Phase 2
  return [];
}

export function calculateBasePrice(quantity: number, opts: Partial<PricingOptions> = {}): number {
  const supplierCost = opts.supplierCost ?? 5.00;
  const colors = opts.colors ?? 1;
  const colorSurchargePerColor = opts.colorSurchargePerColor ?? 0.50;
  
  // Calculate color surcharge (only for colors beyond first)
  const chargeableColors = Math.max(0, colors - 1);
  const colorSurcharge = chargeableColors * colorSurchargePerColor;
  
  // Apply size multiplier
  const sizeMultiplier = opts.size === 'Jumbo' ? 1.2 : 1.0;
  
  const unitPrice = (supplierCost + colorSurcharge) * sizeMultiplier;
  const total = unitPrice * quantity;
  
  return Number(total.toFixed(2));
}

export function quoteFromRules(rules: PricingRule[], quantity: number): Quote {
  let candidate: PricingRule | undefined;
  for (const r of rules) {
    if (r.minQty <= quantity && (r.maxQty === undefined || quantity <= r.maxQty)) {
      candidate = r;
      break;
    }
  }
  if (!candidate) {
    candidate = rules[rules.length - 1];
  }
  const unit = candidate?.unitPrice ?? 0;
  const setup = candidate?.setupPrice ?? 0;
  const total = unit * quantity + setup;
  return { total: Number(total.toFixed(2)), breakdown: { unit, quantity, setup } };
}

// ============================================
// SECTION 4: Margin Calculator (35% Model)
// ============================================

export function applyMargin(baseCost: number, marginPercent: number = 35): number {
  // Formula: Retail = Cost × (1 + Margin%)
  // Example: $100 cost → $135 retail (35% margin)
  const multiplier = 1 + marginPercent / 100;
  return Number((baseCost * multiplier).toFixed(2));
}

export function calculateMarginAmount(retailPrice: number, costPrice: number): number {
  return Number((retailPrice - costPrice).toFixed(2));
}

export function validateMargin(
  retailPrice: number,
  costPrice: number,
  targetMarginPercent: number = 35
): {
  valid: boolean;
  actual: number;
  target: number;
  difference: number;
} {
  if (costPrice === 0) return { valid: false, actual: 0, target: targetMarginPercent, difference: 0 };
  
  const actualMargin = ((retailPrice - costPrice) / costPrice) * 100;
  return {
    valid: Math.abs(actualMargin - targetMarginPercent) < 0.01,
    actual: Number(actualMargin.toFixed(2)),
    target: targetMarginPercent,
    difference: Number((actualMargin - targetMarginPercent).toFixed(2))
  };
}

// ============================================
// SECTION 5: Color Surcharge Calculation
// ============================================

export function calculateColorSurcharge(
  colorCount: number,
  quantity: number = 1,
  surchargePerColor: number = 0.50
): number {
  // First color is free (included in base setup)
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

export function getPricingBreakdown(maxColors: number = 6, surchargePerColor: number = 0.50) {
  const breakdown = [];
  for (let i = 1; i <= maxColors; i++) {
    breakdown.push({
      colors: i,
      surchargePerUnit: colorSurchargePerUnit(i, surchargePerColor)
    });
  }
  return breakdown;
}

// ============================================
// SECTION 6: Complete Quote Generation
// ============================================

export function generateQuote(
  quantity: number,
  options: Partial<PricingOptions> & { supplierCost: number }
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
  const size = options.size ?? 'M';
  
  // Calculate color surcharge
  const chargeableColors = Math.max(0, colors - 1);
  const colorSurchargePerUnit = chargeableColors * colorMultiplier;
  
  // Apply size multiplier
  const sizeMultiplier = size === 'Jumbo' ? 1.2 : 1.0;
  
  // Calculate costs
  const baseCost = options.supplierCost;
  const unitCost = (baseCost + colorSurchargePerUnit) * sizeMultiplier;
  const subtotal = unitCost * quantity;
  
  // Apply margin
  const retailPrice = applyMargin(subtotal, marginPercent);
  const margin = calculateMarginAmount(retailPrice, subtotal);
  
  return {
    quantity,
    supplierCost: Number(baseCost.toFixed(2)),
    colorSurcharge: Number((colorSurchargePerUnit * quantity).toFixed(2)),
    unitPrice: Number(unitCost.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    retailPrice,
    breakdown: {
      quantity,
      colors,
      colorMultiplier,
      size,
      sizeMultiplier,
      marginPercent: `${marginPercent}%`,
      calculations: {
        unitCost: `$${baseCost.toFixed(2)} + ($${colorMultiplier.toFixed(2)} × ${colors} colors) × ${sizeMultiplier} = $${unitCost.toFixed(2)}`,
        subtotal: `$${unitCost.toFixed(2)} × ${quantity} = $${subtotal.toFixed(2)}`,
        retail: `$${subtotal.toFixed(2)} × ${(1 + marginPercent / 100).toFixed(2)} = $${retailPrice.toFixed(2)}`
      }
    }
  };
}

// ============================================
// SECTION 7: Supplier Cost Abstraction
// ============================================

// These are hooks for Phase 4 (supplier integration)
// For now, they're documented but not implemented

/**
 * Future: Get blank cost from supplier API
 * @param supplierId S&S, ASColour, SanMar
 * @param sku Garment SKU
 * @param quantity For bulk pricing
 * @returns Cost per unit
 */
export async function getSupplierCost(
  supplierId: string,
  sku: string,
  quantity?: number
): Promise<number> {
  // Implementation in Phase 4
  throw new Error('Phase 4: Supplier integration not yet implemented');
}

/**
 * Future: Calculate final price with supplier cost + margin
 * @param quantity Units to produce
 * @param garmentId Garment identifier
 * @param supplierId Supplier
 * @param colors Color count
 * @param marginPercent Target margin
 * @returns Complete quote
 */
export async function quoteWithSupplier(
  quantity: number,
  garmentId: string,
  supplierId: string,
  colors: number,
  marginPercent: number = 35
): Promise<any> {
  // Implementation in Phase 4
  throw new Error('Phase 4: Supplier integration not yet implemented');
}

// ============================================
// SECTION 8: Export All Types for External Use
// ============================================

export type { PricingOptions, ScreenRow, PricingRule, Quote };
```

### Step 4: Comprehensive Test Suite (2 hours)
**File**: `services/pricing/tests/pricing-engine.test.ts`

```typescript
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  calculateBasePrice,
  applyMargin,
  calculateMarginAmount,
  validateMargin,
  calculateColorSurcharge,
  colorSurchargePerUnit,
  getPricingBreakdown,
  generateQuote,
} from '../lib/pricing-engine.js';

describe('Pricing Engine - Core Calculations', () => {
  test('Calculate base price for 1 color, 100 quantity', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 1,
    });
    assert.equal(result, 500.00);
  });

  test('Calculate base price with 2 colors (0.50 surcharge)', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 2,
      colorSurchargePerColor: 0.50,
    });
    // (5.00 + 0.50) * 100 = 550.00
    assert.equal(result, 550.00);
  });

  test('Calculate base price with 3 colors', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 3,
      colorSurchargePerColor: 0.50,
    });
    // (5.00 + 1.00) * 100 = 600.00
    assert.equal(result, 600.00);
  });

  test('Apply size multiplier (Jumbo)', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 1,
      size: 'Jumbo',
    });
    // 5.00 * 1.2 * 100 = 600.00
    assert.equal(result, 600.00);
  });

  test('Combine colors and Jumbo size', () => {
    const result = calculateBasePrice(100, {
      supplierCost: 5.00,
      colors: 2,
      colorSurchargePerColor: 0.50,
      size: 'Jumbo',
    });
    // (5.00 + 0.50) * 1.2 * 100 = 660.00
    assert.equal(result, 660.00);
  });
});

describe('Margin Calculator', () => {
  test('Convert cost to retail with 35% margin', () => {
    const retail = applyMargin(100, 35);
    // 100 * 1.35 = 135.00
    assert.equal(retail, 135.00);
  });

  test('Convert cost to retail with different margin', () => {
    const retail = applyMargin(100, 40);
    // 100 * 1.40 = 140.00
    assert.equal(retail, 140.00);
  });

  test('Calculate profit amount', () => {
    const profit = calculateMarginAmount(135, 100);
    // 135 - 100 = 35.00
    assert.equal(profit, 35.00);
  });

  test('Validate margin is correct', () => {
    const validation = validateMargin(135, 100, 35);
    assert.equal(validation.valid, true);
    assert.equal(validation.actual, 35.00);
    assert.equal(validation.target, 35);
  });

  test('Detect margin deviation', () => {
    const validation = validateMargin(140, 100, 35);
    assert.equal(validation.valid, false);
    assert.equal(validation.actual, 40.00);
    assert.equal(validation.difference, 5.00);
  });
});

describe('Color Surcharge', () => {
  test('No surcharge for 1 color', () => {
    const surcharge = calculateColorSurcharge(1, 100, 0.50);
    assert.equal(surcharge, 0.00);
  });

  test('$0.50 per unit for 2 colors', () => {
    const surcharge = calculateColorSurcharge(2, 100, 0.50);
    // 0.50 * 1 * 100 = 50.00
    assert.equal(surcharge, 50.00);
  });

  test('$1.00 per unit for 3 colors', () => {
    const surcharge = calculateColorSurcharge(3, 100, 0.50);
    // 0.50 * 2 * 100 = 100.00
    assert.equal(surcharge, 100.00);
  });

  test('Per-unit color surcharge', () => {
    const surcharge = colorSurchargePerUnit(3, 0.50);
    // 0.50 * 2 = 1.00
    assert.equal(surcharge, 1.00);
  });

  test('Get pricing breakdown', () => {
    const breakdown = getPricingBreakdown(3, 0.50);
    assert.equal(breakdown.length, 3);
    assert.equal(breakdown[0].surchargePerUnit, 0.00); // 1 color
    assert.equal(breakdown[1].surchargePerUnit, 0.50); // 2 colors
    assert.equal(breakdown[2].surchargePerUnit, 1.00); // 3 colors
  });
});

describe('Complete Quote Generation', () => {
  test('Generate quote: 100 shirts, 2 colors, $5 cost, 35% margin', () => {
    const quote = generateQuote(100, {
      supplierCost: 5.00,
      colors: 2,
      colorSurchargePerColor: 0.50,
      marginPercent: 35,
    });

    assert.equal(quote.quantity, 100);
    assert.equal(quote.supplierCost, 5.00);
    assert.equal(quote.unitPrice, 5.50); // 5.00 + 0.50 per unit
    assert.equal(quote.subtotal, 550.00); // 5.50 * 100
    assert.equal(quote.retailPrice, 742.50); // 550 * 1.35
    assert.equal(quote.margin, 192.50); // 742.50 - 550
  });

  test('Quote with Jumbo size', () => {
    const quote = generateQuote(50, {
      supplierCost: 5.00,
      colors: 1,
      size: 'Jumbo',
      marginPercent: 35,
    });

    assert.equal(quote.unitPrice, 6.00); // 5.00 * 1.2
    assert.equal(quote.subtotal, 300.00); // 6.00 * 50
    assert.equal(quote.retailPrice, 405.00); // 300 * 1.35
  });

  test('Quote with 40% margin', () => {
    const quote = generateQuote(100, {
      supplierCost: 10.00,
      colors: 1,
      marginPercent: 40,
    });

    assert.equal(quote.subtotal, 1000.00);
    assert.equal(quote.retailPrice, 1400.00); // 1000 * 1.40
    assert.equal(quote.margin, 400.00); // 1400 - 1000
  });
});

describe('Edge Cases', () => {
  test('Handle zero colors', () => {
    const quote = generateQuote(50, {
      supplierCost: 5.00,
      colors: 0,
      marginPercent: 35,
    });
    assert.ok(quote.retailPrice > 0);
  });

  test('Handle large quantities', () => {
    const quote = generateQuote(10000, {
      supplierCost: 5.00,
      colors: 3,
      marginPercent: 35,
    });
    assert.ok(quote.retailPrice > 100000);
  });

  test('Handle zero margin', () => {
    const quote = generateQuote(100, {
      supplierCost: 5.00,
      colors: 1,
      marginPercent: 0,
    });
    // No margin = retail = cost
    assert.equal(quote.retailPrice, quote.subtotal);
  });

  test('Precision: Ensure proper rounding', () => {
    const quote = generateQuote(33, {
      supplierCost: 3.33,
      colors: 1,
      marginPercent: 35,
    });
    // All prices should be rounded to 2 decimals
    assert.ok(quote.retailPrice % 1 === 0 || quote.retailPrice.toString().split('.')[1].length <= 2);
  });
});
```

### Step 5: Create Schema (15 min)
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
    "properties": {
      "id": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$",
        "description": "Unique identifier"
      },
      "service": {
        "enum": ["screen", "embroidery", "laser", "transfer"],
        "description": "Print service type"
      },
      "minQty": {
        "type": "integer",
        "minimum": 1,
        "description": "Minimum quantity"
      },
      "maxQty": {
        "type": ["integer", "null"],
        "description": "Maximum quantity"
      },
      "unitPrice": {
        "type": "number",
        "minimum": 0,
        "description": "Price per unit"
      },
      "setupPrice": {
        "type": ["number", "null"],
        "minimum": 0,
        "description": "One-time setup fee"
      },
      "colorSurcharge": {
        "type": "number",
        "default": 0.50,
        "description": "Per-color surcharge"
      },
      "marginPercent": {
        "type": "integer",
        "default": 35,
        "description": "Target margin"
      }
    }
  }
}
```

---

## Step 6: Test Everything (1 hour)

```bash
cd services/pricing

# Install dependencies
npm install

# Run all tests
npm test

# Expected: All tests pass (20+ assertions)
```

---

## What Gets Committed

```bash
cd /Users/ronnyworks/Projects/printshop-os

git add services/pricing/

git commit -m "feat(pricing): Implement Phase 1 - core pricing engine

Combines pricing logic with margin calculator and color surcharge system:
- Port core pricing logic from job-estimator
- Implement 35% margin model
- Add color-based surcharge calculation
- Single consolidated implementation (pricing-engine.ts)
- Comprehensive test suite (20+ tests)

Time saved: Condensed from 8-10 hours to 5-6 hours by consolidating
into single core file with integrated calculators.

Files:
- services/pricing/lib/pricing-engine.ts (core engine, ~400 lines)
- services/pricing/tests/pricing-engine.test.ts (~200 lines)
- services/pricing/data/pricing-rules-schema.json (schema)
- services/pricing/package.json (config)

Status: Phase 1 complete, ready for Phase 2 (Rule Management)"

git push origin refactor/enterprise-foundation
```

---

## Why This Condensed Version Is Better

| Aspect | 8-Step Version | 4-Step Condensed |
|--------|---|---|
| **Files Created** | 4+ | 2 |
| **Time** | 8-10 hours | 5-6 hours |
| **Complexity** | Higher (multiple files) | Lower (consolidated) |
| **Maintainability** | Harder (scattered logic) | Easier (co-located) |
| **Testing** | Separate suites | One comprehensive suite |
| **Functionality** | Same ✅ | Same ✅ |
| **Documentation** | Clearer | Still clear |

---

## Next After Phase 1

Once Phase 1 is complete:

1. **PR to main**: Create pull request from `refactor/enterprise-foundation`
2. **Code review**: Team reviews 30-40 lines of core logic
3. **Merge**: Approved by team lead
4. **Phase 2**: Rule management (JSON-driven pricing)
5. **Phase 3**: Strapi API integration
6. **Phase 4**: Supplier integration hooks

---

## Files Summary

**Phase 1 Deliverables**:
- ✅ `services/pricing/lib/pricing-engine.ts` (450 lines)
- ✅ `services/pricing/tests/pricing-engine.test.ts` (200 lines)
- ✅ `services/pricing/data/pricing-rules-schema.json` (40 lines)
- ✅ `services/pricing/package.json` (25 lines)
- ✅ All tests passing
- ✅ Ready for Phase 2

**Total Implementation Time**: 5-6 hours focused work

---

## Ready?

This condensed Phase 1 is ready to execute. It has:
✅ Clear step-by-step guide
✅ Copy/paste code templates
✅ Comprehensive test suite (20+ tests)
✅ All integrated into single core file
✅ Full documentation

**Estimated completion: 2-3 days (5-6 hours total effort)**

Next: Execute Phase 1! 🚀

