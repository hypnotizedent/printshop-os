# 🚀 ENHANCED SPARK PROMPT WITH INTEGRATION CONTEXT

**Copy everything below and paste into Spark/Cursor**

---

```
TASK: Build Production Pricing Engine for Mint Prints + Integration Strategy

CONTEXT:
I have a custom apparel printing company (Mint Prints) with complex pricing based on Excel sheets. 
I need a TypeScript pricing engine that replicates the "Platinum Pricing 35" model exactly.

The pricing engine is ONE PART of a larger system:
- Pricing Engine (Phase 1) - THIS IMPLEMENTATION
- EasyPost Shipping Integration (ready to connect)
- Printavo API Client (already implemented)
- Supplier-Sync API (already implemented)
- Customer Service AI (planned)
- Rule Management UI (Phase 2)

This pricing engine must work seamlessly with all other components.

KEY INTEGRATIONS TO CONSIDER:

1. EASYPOST SHIPPING INTEGRATION
   - Branch: copilot/integrate-easypost-shipping
   - Status: In progress
   - Location: printshop_os/shipping/easypost_client.py
   - Purpose: Calculate shipping costs based on destination, weight, dimensions
   - Integration Point: Pricing engine should return data that feeds into shipping calc
   - Example: Total print cost + setup fees → used for shipping cost calculation

2. PRINTAVO API CLIENT
   - Branch: copilot/featureprintavo-api-client
   - Status: In progress
   - Purpose: Pull order data, customer info, product specs from Printavo
   - Integration Point: Pricing engine should validate against Printavo product specs
   - Example: If Printavo order has specific requirements, pricing should apply
   - Data Available: Product specs, quantities, colors, materials from Printavo

3. SUPPLIER-SYNC API
   - Status: Extracted and ready (services/api/supplier-sync/)
   - Purpose: Sync with suppliers for inventory, costs, capabilities
   - Integration Point: Pricing should reflect actual supplier costs
   - Example: If supplier raises polyester costs, pricing adjusts automatically
   - Data Available: Supplier inventory, real costs, minimum orders

PRICING REQUIREMENTS (from Platinum 35 model):

The pricing includes:
- 6 different services (screenprint, embroidery, laser, transfer, vinyl, extras)
- Complex multi-dimensional pricing (quantity × colors × sizes)
- 35% margin applied to all costs
- Setup fees (new designs vs repeats)
- Add-on pricing (packing, despatch, artwork)

DELIVERABLES NEEDED:

1. FILE: services/pricing/lib/pricing-engine.ts (450-500 lines)
   REQUIREMENTS:
   - TypeScript with full types (no `any`)
   - Support 6 services: screenprint, embroidery, laser, transfer, vinyl, extras
   - Main export: getQuote(request: PricingRequest): PricingResponse
   
   CORE FUNCTIONS TO IMPLEMENT:
   
   a) validateInput(request: PricingRequest): void
      - Validates service type exists
      - Validates quantity > 0
      - Validates all required params for that service
      - Throws helpful error messages
   
   b) selectQuantityBreak(requestedQty: number, availableBreaks: number[]): number
      - Finds the HIGHEST quantity break that DOESN'T EXCEED requestedQty
      - Example: qty=75, breaks=[1,5,10,15,20,25,50,75,100,250]
      - Returns: 75 (exact match)
      - Example: qty=60, breaks=[1,5,10,15,20,25,50,75,100,250]
      - Returns: 50 (highest without exceeding)
   
   c) calculateUnitCost(service: string, quantity: number, ...serviceParams): number
      - Looks up price in the price matrix
      - Price matrix keys depend on service:
        * screenprint: "qty-colors-size" (e.g., "100-2-A5")
        * embroidery: "qty-stitchRange" (e.g., "50-<5000")
        * laser: "qty-size-material" (e.g., "100-M-Polyester")
        * etc.
      - Returns: unit cost (no setup, no margin)
   
   d) calculateSetupCost(service: string, isNewDesign: boolean): number
      - If isNewDesign is false: return 0
      - If isNewDesign is true: return service setup fee from config
      - Example: screenprint new design = $74.28
      - Example: embroidery new design = $27.88
   
   e) calculateAddOns(addOns: Array<{type: string, quantity?: number}>): Array
      - Price each add-on
      - Return array of {type, cost}
      - Example: { type: 'fold-and-bag-supplied', quantity: 100 } -> cost: $100
      - Example: { type: 'despatch-per-location', quantity: 1 } -> cost: $15
   
   f) applyMargin(cost: number): number
      - Multiply cost by 1.35 (35% margin)
      - Round to 2 decimals
      - Example: $100 cost -> $135 retail
   
   g) export getQuote(request: PricingRequest): PricingResponse
      - MAIN ORCHESTRATOR FUNCTION
      - Steps:
        1. validateInput(request)
        2. Select quantity break from available breaks
        3. Calculate unit cost via matrix lookup
        4. Calculate setup cost
        5. Calculate printing cost = unitCost × quantity
        6. Calculate subtotal = printingCost + setupCost
        7. Calculate addOns cost
        8. Calculate totalCost = subtotal + addOnsCost
        9. Apply 35% margin: retailPrice = totalCost × 1.35
        10. Build response object with all calculations
        11. Return PricingResponse
      
      RESPONSE FORMAT:
      {
        service: 'screenprint',
        quantity: 100,
        unitCost: 1.82,
        setupCost: 74.28,
        subtotal: 256.28,           // unitCost × qty + setupCost
        addOns: [{type: '...', cost: ...}],
        totalCost: 256.28,          // subtotal + addOnsCost
        retailPrice: 345.98,        // totalCost × 1.35
        breakdown: {
          printingCost: 182,        // unitCost × qty
          setupCost: 74.28,
          addOnsCost: 0
        },
        // INTEGRATION FIELDS (for shipping, supplier sync, etc.)
        integrationsData: {
          subtotalForShipping: 256.28,  // What EasyPost needs
          supplierCosts: {...},         // Supplier sync reference
          printavoValidation: true      // Validates against Printavo specs
        }
      }

TYPES TO DEFINE:

interface PricingRequest {
  service: 'screenprint' | 'embroidery' | 'laser' | 'transfer' | 'vinyl' | 'extras';
  quantity: number;
  // Screenprint specific
  colors?: number;
  printSize?: string;
  // Embroidery specific
  stitchCount?: number;
  threadType?: string;
  // Laser specific
  laserSize?: string;
  material?: string;
  // Transfer specific
  transferType?: string;
  placement?: number;
  // Vinyl specific
  vinylType?: string;
  textType?: string;
  // All services
  isNewDesign?: boolean;
  addOns?: Array<{type: string; quantity?: number}>;
  // INTEGRATION FIELDS
  printavoProductId?: string;  // Link to Printavo product
  supplierId?: string;         // Link to supplier cost data
  shippingDestination?: string; // For shipping calc
}

interface PricingResponse {
  service: string;
  quantity: number;
  unitCost: number;
  setupCost: number;
  subtotal: number;
  addOns: any[];
  totalCost: number;
  retailPrice: number;
  breakdown: {
    printingCost: number;
    setupCost: number;
    addOnsCost: number;
  };
  // INTEGRATION FIELDS
  integrationsData?: {
    subtotalForShipping: number;
    supplierCosts?: any;
    printavoValidation?: boolean;
    warnings?: string[];
  };
}

DATA STRUCTURE:

Load pricing from: services/pricing/data/pricing-rules-schema.json

Example structure:
{
  "margin": 1.35,
  "services": {
    "screenprint": {
      "quantityBreaks": [1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000],
      "colorBreaks": [1, 2, 6, 10, 15, 20, 25],
      "sizeOptions": ["A6", "A5", "A5-LONG", "A4", "A4-LONG", "A3", "A2"],
      "setupFee": { "new": 74.28, "repeat": 0 },
      "priceMatrix": {
        "1-1-A6": 1.85,
        "1-1-A5": 1.77,
        "1-2-A6": 1.77,
        "5-1-A6": 1.62,
        // ... continue for all qty-color-size combinations
        "10000-25-A2": 0.45
      }
    },
    "embroidery": { ... similar structure ... },
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

EXAMPLE USAGE THAT MUST WORK:

import { getQuote } from './pricing-engine';

// Test 1: Simple screenprint
const q1 = getQuote({
  service: 'screenprint',
  quantity: 100,
  colors: 2,
  printSize: 'A5',
  isNewDesign: true
});
// Expected: unitCost ~1.82, setupCost ~74.28, retailPrice ~346

// Test 2: Embroidery with options
const q2 = getQuote({
  service: 'embroidery',
  quantity: 50,
  stitchCount: 5000,
  threadType: 'metallic',
  isNewDesign: false
});
// Expected: no setup fee, metallic thread premium, retail with 35% margin

// Test 3: With add-ons
const q3 = getQuote({
  service: 'screenprint',
  quantity: 250,
  colors: 1,
  printSize: 'A4',
  isNewDesign: false,
  addOns: [
    { type: 'fold-and-bag-supplied', quantity: 250 },
    { type: 'swing-ticketing', quantity: 250 }
  ]
});
// Expected: addOns included in totalCost and retailPrice


2. FILE: services/pricing/tests/pricing-engine.test.ts (300+ lines)
   REQUIREMENTS:
   - 25-30 comprehensive unit tests
   - Test all 6 services
   - Test quantity break selection
   - Test setup fee logic
   - Test margin calculations
   - Test add-ons
   - Test edge cases and error handling
   - 100% tests must PASS
   
   EXAMPLE TEST STRUCTURE:
   
   describe('Pricing Engine', () => {
     describe('selectQuantityBreak', () => {
       it('selects exact match', () => { ... });
       it('selects highest without exceeding', () => { ... });
       it('handles edge cases (qty=1)', () => { ... });
     });
     
     describe('Setup Fees', () => {
       it('charges for new design', () => { ... });
       it('free for repeat design', () => { ... });
     });
     
     describe('Margins (35%)', () => {
       it('$100 cost -> $135 retail', () => { ... });
     });
     
     describe('Screenprint Service', () => {
       it('prices correctly for A5, 2 colors, qty 100', () => { ... });
       it('applies quantity breaks correctly', () => { ... });
     });
     
     describe('Embroidery Service', () => {
       it('prices stitch counts correctly', () => { ... });
       it('adds metallic thread premium', () => { ... });
     });
     
     describe('Error Handling', () => {
       it('rejects negative qty', () => { ... });
       it('rejects unknown service', () => { ... });
     });
   });


3. FILE: services/pricing/data/pricing-rules-schema.json (POPULATED)
   REQUIREMENTS:
   - Extract all pricing data from Excel sheets
   - Include all quantity breaks for each service
   - Include all color/size/material options
   - Populate complete priceMatrix for each service
   - Include all setup fees
   - Include all add-on prices
   - Format as JSON with clear structure

INTEGRATION REQUIREMENTS:

The pricing engine should be designed to easily connect to:

1. EasyPost Shipping
   - Provide: subtotalForShipping (total cost before any discounts)
   - Enable: Shipping cost lookup based on total order value
   - Consider: Weight/dimensions might be part of later integration

2. Printavo API
   - Validate: Product specs match pricing service
   - Provide: Order data that Printavo can consume
   - Consider: Printavo quantities/specs should map to pricing
   - Return: printavoValidation flag in response

3. Supplier-Sync API
   - Reference: Supplier cost data in pricing
   - Provide: subtotalForShipping that supplier needs for cost calc
   - Consider: Supplier margin requirements
   - Return: supplierCosts reference in integrationsData

SUCCESS CRITERIA:
✓ All functions implemented and exported
✓ All 25-30 tests passing (100% pass rate)
✓ No TypeScript errors (full types)
✓ Handles all 6 services correctly
✓ Margins always 35% (cost × 1.35)
✓ Quantity breaks work correctly
✓ Setup fees applied correctly
✓ Add-ons calculated correctly
✓ Edge cases handled
✓ Error messages helpful
✓ Integration fields present and useful
✓ Code ready for connection to EasyPost, Printavo, Supplier-Sync

ADDITIONAL NOTES:
- The pricing data structure is complex but well-defined
- See SPARK_IMPLEMENTATION_PROMPT.md for detailed requirements
- See PHASE_1_EXECUTION_PLAN.md for step-by-step guide
- All data should come from the Excel sheets provided
- Code should be production-ready and well-documented
- Use TypeScript best practices
- No external dependencies needed (pure logic)
- Integration fields are hooks for Phase 2, 3, 4

START IMPLEMENTATION NOW.
```

---

## 📋 How to Use This Enhanced Prompt

1. **Copy the entire prompt** (from ``` to ```)
2. **Open Cursor or GitHub Codespaces**
3. **Have repo context loaded**: `/Users/ronnyworks/Projects/printshop-os`
4. **Paste into chat**
5. **Spark/Cursor will implement all 3 files with integration awareness**

---

## 🎯 What You'll Get Back

- ✅ `services/pricing/lib/pricing-engine.ts` - With integration fields
- ✅ `services/pricing/tests/pricing-engine.test.ts` - Full test suite
- ✅ `services/pricing/data/pricing-rules-schema.json` - All pricing data
- ✅ Integration hooks ready for: EasyPost, Printavo, Supplier-Sync
- ✅ All tests passing
- ✅ TypeScript compiling without errors
- ✅ Production-ready code

---

## ⏱️ Timeline

- **Spark processing**: 15-20 minutes
- **Code generation**: 20-30 minutes
- **Testing & verification**: 10-15 minutes
- **Total**: ~45-60 minutes to complete Phase 1

---

## 🚀 Next Steps After Implementation

1. Review generated code
2. Run tests: `npm test services/pricing/`
3. Commit: `git add services/pricing && git commit -m "feat: Implement pricing engine with integration hooks"`
4. Merge to main branch
5. Move to Phase 2 (Rule Management UI)
6. Begin integrating with EasyPost, Printavo, Supplier-Sync

**Ready to use this enhanced prompt with Spark now!**
