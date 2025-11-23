# 💰 Pricing System Epic - Consolidated

**Status:** Phase 1 - Foundation  
**Priority:** CRITICAL  
**Effort:** 4 weeks  
**Dependencies:** Strapi setup (Phase 1)

---

## 📋 Epic Overview

**Goal:** Build a comprehensive, production-ready pricing engine that:
- ✅ Calculates accurate costs for all production methods (screen print, DTG, embroidery)
- ✅ Supports volume discounts, bulk breaks, and pricing tiers
- ✅ Integrates with supplier data (real-time product costs)
- ✅ Handles complex scenarios (bundles, deposits, taxes, fees)
- ✅ Provides REST API for quote generation
- ✅ Powers financial reporting and profitability analysis

**Why This Matters:**
- Pricing = Direct impact on profitability
- Wrong pricing = Lost revenue or razor-thin margins
- Complex rules = Manual calculations = errors
- Real-time supplier data = Accurate quotes = Higher close rate

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Pricing Engine Service (services/pricing/)
└─────────────────────────────────────────────────────────┘
              ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  Core Engine     │  Rule System     │  Supplier Data   │
│  • Base costs    │  • Discounts     │  • Real prices   │
│  • Calculations  │  • Bundles       │  • Inventory     │
│  • Margins       │  • Overrides     │  • Stock levels  │
└──────────────────┴──────────────────┴──────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│  Strapi CMS (Data Storage & Configuration)
│  • Product catalog
│  • Pricing rules
│  • Discount tiers
│  • User overrides
└─────────────────────────────────────────────────────────┘
              ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  Quote Engine    │  Quote Portal    │  Admin Portal    │
│  (REST API)      │  (React UI)      │  (Dashboard)     │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## 🎯 Consolidated Sub-Tasks

### Phase 1: Core Pricing Engine (Week 1-2)

#### Sub-Task 1: Pricing Engine Architecture (Issue #44) ✅ CRITICAL
**What:** Build the mathematical core of pricing system

**Executable:** ✅ YES - Based on existing job-estimator codebase

**Implementation:**
```javascript
// services/pricing/engine/core.ts
export class PricingEngine {
  // Base garment cost
  getBaseCost(productId: string, quantity: number): number {
    const product = this.productCatalog.find(productId);
    return product.base_cost * quantity;
  }
  
  // Print location surcharges (front=1x, back=1.5x, sleeve=2x)
  getLocationSurcharge(locations: string[]): number {
    const multipliers = {
      'front': 1.0,
      'back': 1.5,
      'sleeve': 2.0,
      'full_wrap': 3.0
    };
    return locations.reduce((sum, loc) => sum + multipliers[loc], 0);
  }
  
  // Color count pricing
  getColorCost(colorCount: number, quality: 'basic' | 'premium'): number {
    const rates = quality === 'premium' 
      ? [0.5, 1.0, 1.8, 2.5, 3.0, 3.5] // $/color for premium
      : [0.3, 0.6, 1.2, 1.8, 2.2, 2.5]; // $/color for basic
    return (colorCount - 1 >= 0 ? rates[colorCount - 1] : 0) * colorCount;
  }
  
  // Stitch count pricing (for embroidery)
  getStitchCost(stitchCount: number): number {
    const costPerStitch = 0.001; // $0.001 per stitch
    return stitchCount * costPerStitch;
  }
  
  // Volume discount tiers
  getVolumeDiscount(quantity: number): number {
    if (quantity >= 500) return 0.20;      // 20% off
    if (quantity >= 250) return 0.15;      // 15% off
    if (quantity >= 100) return 0.10;      // 10% off
    if (quantity >= 50) return 0.05;       // 5% off
    return 0;
  }
  
  // Final calculation
  calculatePrice(params: {
    productId: string;
    quantity: number;
    colors: number;
    locations: string[];
    stitches?: number;
    quality: 'basic' | 'premium';
  }): {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  } {
    const baseCost = this.getBaseCost(params.productId, params.quantity);
    const locationCost = this.getLocationSurcharge(params.locations);
    const colorCost = this.getColorCost(params.colors, params.quality);
    const stitchCost = params.stitches ? this.getStitchCost(params.stitches) : 0;
    
    let subtotal = (baseCost + locationCost + colorCost + stitchCost) * params.quantity;
    const discountPercent = this.getVolumeDiscount(params.quantity);
    const discount = subtotal * discountPercent;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * 0.08; // 8% tax (configurable)
    const total = taxableAmount + tax;
    
    return { subtotal, discount, tax, total };
  }
}
```

**Effort:** 4-5 days  
**Priority:** CRITICAL  
**Blockers:** None (can work independently)

---

#### Sub-Task 2: Supplier Data Integration (Part of Epic #85)
**What:** Connect supplier pricing to pricing engine

**Implementation:**
```javascript
// services/pricing/engine/supplier-integration.ts
export class SupplierPricingAdapter {
  async getProductCost(supplierSKU: string, quantity: number) {
    // From Redis cache or Strapi
    const product = await this.cache.get(`product:${supplierSKU}`);
    
    // Find pricing tier for quantity
    const pricingTier = product.bulk_breaks.find(tier => 
      quantity >= tier.qty
    );
    
    return pricingTier.price * quantity;
  }
}
```

**Effort:** 2-3 days (depends on Epic #85: Supplier Integration)  
**Priority:** High  
**Blockers:** Epic #85 infrastructure phase

---

#### Sub-Task 3: Rule Management System (Issue #45 & Dashboard)
**What:** Allow business rules without code changes

**Implementation:**
```javascript
// Pricing rule structure (stored in Strapi)
{
  id: "rule-001",
  name: "Summer Sale Bundle",
  active: true,
  conditions: {
    product_category: "shirt",
    quantity_min: 50,
    date_start: "2025-06-01",
    date_end: "2025-08-31"
  },
  actions: {
    discount_percent: 15,
    override_base_cost: null,
    add_free_item: null
  }
}

// Application in pricing engine
function applyBusinessRules(params: PricingParams, rules: Rule[]): Discount[] {
  return rules
    .filter(rule => {
      // Evaluate conditions
      return evaluateConditions(params, rule.conditions);
    })
    .map(rule => rule.actions);
}
```

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** Strapi setup

---

### Phase 2: Quote System Integration (Week 3)

#### Sub-Task 4: Quote REST API (Issue #40, #42, #48)
**What:** Expose pricing as API for quote generation

**Implementation:**
```javascript
// POST /api/pricing/quote
{
  request: {
    product_id: "shirt-001",
    quantity: 100,
    print_method: "screen",
    colors: 4,
    locations: ["front", "back"],
    quality: "premium",
    include_shipping: true,
    tax_rate: 0.08
  },
  response: {
    subtotal: 1250.00,
    costs: {
      product: 500.00,
      printing: 400.00,
      art_fee: 75.00,
      shipping: 275.00
    },
    discounts: {
      volume: 150.00,
      promo_code: 0.00
    },
    tax: 100.00,
    total: 1200.00,
    margins: {
      markup_percent: 25,
      profit: 300.00
    }
  }
}
```

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** Sub-task 1 (core engine)

---

#### Sub-Task 5: Bundle & Package Pricing (Issue #45)
**What:** Support combo pricing (buy X + Y = discount)

**Implementation:**
```javascript
export class BundlePricingEngine {
  calculateBundlePrice(bundleId: string, quantity: number) {
    const bundle = this.bundles.get(bundleId);
    
    // Example: 50 shirts + 50 hoodies
    const shirtCost = this.calculatePrice({
      product: 'shirt',
      quantity: quantity
    });
    
    const hoodieCost = this.calculatePrice({
      product: 'hoodie',
      quantity: quantity
    });
    
    const bundleDiscount = bundle.discount_percent / 100;
    const subtotal = shirtCost + hoodieCost;
    
    return {
      subtotal,
      bundle_discount: subtotal * bundleDiscount,
      total: subtotal * (1 - bundleDiscount)
    };
  }
}
```

**Effort:** 2-3 days  
**Priority:** High  
**Blockers:** Sub-task 1 (core engine)

---

#### Sub-Task 6: Deposit & Payment Logic (Issue #46)
**What:** Calculate deposits, remaining balance, payment plans

**Implementation:**
```javascript
export class DepositCalculator {
  calculateDeposit(totalPrice: number, depositPercent: number = 25) {
    const deposit = totalPrice * (depositPercent / 100);
    const remaining = totalPrice - deposit;
    
    return {
      total: totalPrice,
      deposit: deposit,
      remaining: remaining,
      deposit_percent: depositPercent
    };
  }
}
```

**Effort:** 1-2 days  
**Priority:** Medium  
**Blockers:** Sub-task 1 (core engine)

---

### Phase 3: Advanced Features (Week 4)

#### Sub-Task 7: Profitability Tracking
**What:** Calculate margins, profit, ROI per quote

**Implementation:**
```javascript
export class ProfitabilityEngine {
  calculateMargins(cost: number, price: number) {
    const profit = price - cost;
    const margin_percent = (profit / price) * 100;
    const markup = (price / cost - 1) * 100;
    
    return {
      cost,
      price,
      profit,
      margin_percent,
      markup
    };
  }
}
```

**Effort:** 2 days  
**Priority:** Medium  
**Blockers:** Sub-task 1 (core engine)

---

#### Sub-Task 8: Pricing Dashboard (Rule Management UI)
**What:** Admin interface to create/edit pricing rules

**Features:**
- ✅ Visual rule builder (no code)
- ✅ Rule versioning & history
- ✅ A/B testing pricing strategies
- ✅ Import/export pricing tables
- ✅ Audit trail of changes

**Effort:** 3-4 days  
**Priority:** Medium  
**Blockers:** Sub-tasks 1-3

---

#### Sub-Task 9: Testing & Validation
**What:** Comprehensive test coverage

**Test Scenarios:**
- ✅ Basic pricing (single item, no discounts)
- ✅ Volume discounts (various quantity breaks)
- ✅ Complex scenarios (multi-location, multiple colors)
- ✅ Bundle pricing edge cases
- ✅ Tax calculations across regions
- ✅ Profit margin calculations
- ✅ Performance under load (1000 concurrent quotes)

**Effort:** 3-4 days  
**Priority:** High  
**Blockers:** All sub-tasks

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| **Calculation Accuracy** | 100% match vs manual calculation |
| **API Response Time** | <100ms average response |
| **Pricing Rules** | Support >50 simultaneous rules |
| **Margin Variance** | <2% across different scenarios |
| **Profitability** | Identify pricing errors within 24hrs |
| **Team Adoption** | 100% of quotes generated via engine |

---

## 🔄 Current Status

✅ **Already Exists:**
- Production-ready pricing engine in `job-estimator` repo
- Complex pricing logic implemented and tested
- Rule system designed
- Ready to port

⏳ **What We Need:**
1. Port core engine to `services/pricing/`
2. Strapi integration for data
3. REST API wrapper
4. Rule management UI
5. Supplier data connection

---

## 🚀 Execution Timeline

```
Week 1-2: Core Engine
├─ Sub-task 1: Port pricing engine (4-5 days)
├─ Sub-task 2: Supplier integration design (2-3 days)
└─ Sub-task 3: Rule management system (3-4 days)

Week 3: Integration
├─ Sub-task 4: Quote REST API (3-4 days)
├─ Sub-task 5: Bundle pricing (2-3 days)
└─ Sub-task 6: Deposit logic (1-2 days)

Week 4: Polish
├─ Sub-task 7: Profitability tracking (2 days)
├─ Sub-task 8: Dashboard UI (3-4 days)
└─ Sub-task 9: Testing & validation (3-4 days)

Total: 4 weeks
```

---

## 📁 File Structure

```
services/pricing/
├── IMPLEMENTATION_PLAN.md           (This file)
├── package.json
├── tsconfig.json
├── src/
│   ├── engine/
│   │   ├── core.ts                  (Core pricing logic)
│   │   ├── bundle.ts                (Bundle pricing)
│   │   ├── discount.ts              (Volume/promo discounts)
│   │   ├── supplier.ts              (Supplier data integration)
│   │   └── margins.ts               (Profitability)
│   ├── api/
│   │   ├── routes.ts                (Express routes)
│   │   ├── quote.ts                 (Quote endpoint)
│   │   └── rules.ts                 (Rule management)
│   └── db/
│       ├── strapi.ts                (Strapi integration)
│       └── models.ts                (Data models)
├── tests/
│   ├── engine.test.ts
│   ├── bundle.test.ts
│   ├── discount.test.ts
│   └── integration.test.ts
└── README.md
```

---

## 💼 Enterprise Integration

**Connects To:**
- ✅ Strapi (Issue #2) - Data storage
- ✅ Quote System (Issues #40, #42, #48) - Quote generation
- ✅ Supplier Integration (Epic #85) - Real-time pricing
- ✅ Production Dashboard (Issue #5) - Order visibility
- ✅ Financial Reporting (Phase 4) - Profitability analysis

**Depends On:**
- Strapi (must be functional)
- Database (PostgreSQL or similar)

**Enables:**
- Accurate quote generation (reduce pricing errors by 95%)
- Dynamic pricing (respond to supplier changes real-time)
- Financial visibility (track margins per order)
- Rule-based pricing (no manual intervention)

---

## 🎯 Next Steps

1. ✅ Review this epic documentation
2. → Port existing job-estimator code (Week 1)
3. → Implement Strapi integration (Week 2)
4. → Build REST API (Week 3)
5. → Create admin dashboard (Week 4)
6. → Deploy to production

---

**Status:** Ready for implementation  
**Created:** November 23, 2025  
**Reference:** Epic #44 (Part of Consolidated Pricing System)
