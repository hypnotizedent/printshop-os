# Issue #44: Pricing Engine Architecture - Implementation Plan

## Overview
Build the core pricing calculation service that will be the financial heart of PrintShop OS.

## User Story
*As a sales team member, I need accurate, flexible pricing so that quotes are profitable and competitive.*

---

## Breakdown: 3 Core Deliverables

### **Deliverable 1: Pricing Service Foundation** (Backend)
**Status:** Starting  
**Effort:** 3-4 days  
**Files to Create:**
- `services/pricing/src/engine.ts` - Core pricing calculator
- `services/pricing/src/models.ts` - TypeScript interfaces
- `services/pricing/tests/engine.test.ts` - Unit tests
- `services/pricing/.env.example` - Configuration template

**What it does:**
- Takes a "quote spec" (garment, print location, color count, quantity, add-ons)
- Calculates base cost from supplier data
- Applies surcharges, discounts, taxes
- Returns total price with margin/profit breakdown

**Success Criteria:**
```
Input: {
  garment: "Gildan 18000 Black",
  quantity: 100,
  printLocations: ["front"],
  colorCount: 1,
  rush: false
}

Output: {
  baseGarmentCost: 250.00,
  printLocationSurcharge: 75.00,
  rushFee: 0.00,
  taxableSubtotal: 325.00,
  taxes: 26.00,
  totalPrice: 351.00,
  margin: 101.00,
  marginPercentage: 40
}
```

---

### **Deliverable 2: JSON-Based Pricing Rules** (Config)
**Status:** Not started  
**Effort:** 1-2 days  
**Files:**
- `services/pricing/config/pricing-rules.json` - Master pricing configuration
- `services/pricing/config/surcharges.json` - Location/technique surcharges
- `services/pricing/config/discounts.json` - Volume/bundle discounts

**What it does:**
- Defines print location surcharges (front +$0.75, back +$1.00, sleeve +$0.50)
- Defines color count pricing tiers
- Defines volume discount tiers
- Defines margin targets by product category

**Example structure:**
```json
{
  "printLocations": {
    "front": { "surcharge": 0.75, "description": "Front chest" },
    "back": { "surcharge": 1.00, "description": "Full back" },
    "sleeve": { "surcharge": 0.50, "description": "Sleeve print" }
  },
  "colorCounts": {
    "1": { "surcharge": 0 },
    "2": { "surcharge": 0.25 },
    "3": { "surcharge": 0.50 },
    "4+": { "surcharge": 1.00 }
  },
  "volumeDiscounts": {
    "1-99": { "discount": 0 },
    "100-499": { "discount": 0.05 },
    "500-999": { "discount": 0.10 },
    "1000+": { "discount": 0.15 }
  }
}
```

---

### **Deliverable 3: Strapi Integration & API Endpoints** (Backend + Strapi)
**Status:** Not started  
**Effort:** 2-3 days  
**Endpoints:**
- `POST /api/pricing/calculate` - Calculate price for a quote spec
- `GET /api/pricing/rules` - Get current pricing rules
- `POST /api/pricing/preview` - Preview price for different quantities

**What it does:**
- Exposes pricing service via REST API
- Integrates with Strapi for rule management
- Caches rules in Redis for performance
- Versioning for pricing rule changes

---

## Task Checklist

### Phase 1: Core Engine (Days 1-2)
- [ ] Create `services/pricing/` directory structure
- [ ] Write `models.ts` (TypeScript interfaces)
- [ ] Implement `engine.ts` (calculation logic)
- [ ] Write unit tests (50+ test cases)
- [ ] Test locally with sample data

### Phase 2: Configuration (Day 3)
- [ ] Create `pricing-rules.json` with realistic values
- [ ] Create `surcharges.json` for print techniques
- [ ] Create `discounts.json` for volume tiers
- [ ] Document configuration schema

### Phase 3: API Integration (Days 4-5)
- [ ] Create Strapi plugin/extension for pricing
- [ ] Implement `/api/pricing/calculate` endpoint
- [ ] Add Redis caching
- [ ] Write integration tests
- [ ] Document API usage

---

## Questions for You:

Before I start, please clarify:

1. **Pricing Model**: 
   - Do you charge per-color or per-location?
   - What's your typical margin target? (e.g., 40% on t-shirts, 50% on embroidery?)
   - Any special pricing for bulk orders?

2. **Suppliers**:
   - What's your base cost for a blank Gildan 18000 t-shirt?
   - Do costs vary by quantity tier from suppliers?

3. **Add-ons**:
   - Do you charge for setup fees?
   - Rush orders? How much extra?
   - Shipping included or separate?

4. **Current System**:
   - How are prices calculated NOW? (Spreadsheet? Manual? Old system?)
   - Any existing pricing data I should preserve?

---

## Next Steps

Once you answer the questions above, I'll:
1. Create the service scaffold in `services/pricing/`
2. Implement the engine with your pricing rules
3. Write comprehensive tests
4. Create PR to `refactor/enterprise-foundation`
5. Get it merged to `main`

**Ready to answer the questions?** 🚀
