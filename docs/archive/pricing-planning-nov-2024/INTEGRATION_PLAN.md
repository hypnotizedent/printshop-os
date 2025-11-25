# Pricing Engine Integration Plan (Issue #44)
## Integrating Existing job-estimator with printshop-os

**Status**: CRITICAL DISCOVERY - Existing `/projects/job-estimator/` contains production-ready pricing engine  
**Decision**: Port existing logic rather than build from scratch  
**Timeline**: ~3-4 weeks for full integration  

---

## Executive Summary

### What We Found
The `job-estimator` project at `/Users/ronnyworks/Projects/job-estimator/` contains:
- **Mature TypeScript codebase**: Next.js + tRPC + Prisma
- **Working pricing engine**: `src/lib/pricing-engine.ts` with rule-based calculation
- **Production patterns**: API routers, data persistence, test infrastructure
- **Data pipelines**: Excel → JSON conversion for pricing rules

### Why This Matters
- **Avoids reinventing**: Don't rewrite existing tested code
- **Faster delivery**: Port and adapt > build from scratch (saves 2-3 weeks)
- **Better quality**: Use proven pricing logic
- **Clear path**: Integration steps already documented

### Integration Strategy
1. **Phase 1**: Port core pricing logic to `services/pricing/lib/`
2. **Phase 2**: Adapt for 35% margin model + color-based charging
3. **Phase 3**: Build Strapi integration layer
4. **Phase 4**: Connect supplier APIs (Issue #64)

---

## Current job-estimator Analysis

### Technology Stack
- **Framework**: Next.js 13+ with tRPC
- **Language**: TypeScript
- **Database**: Prisma ORM (PostgreSQL)
- **API Style**: tRPC (type-safe RPC) - wrappable in REST
- **Testing**: Node.js test runner + Jest

### Key Modules

#### 1. Pricing Engine (`src/lib/pricing-engine.ts`)
**Core logic for calculating quotes from rules**

```typescript
// Main functions:
export function calculateBasePrice(quantity: number, opts: PricingOptions)
  - Service-based pricing (screen, embroidery, laser, transfer)
  - Color surcharges: $0.50 per color
  - Size multipliers: Jumbo = 1.2x
  - Returns: total price rounded to $0.01

export function loadScreenPricingRules(jsonPath: string): PricingRule[]
  - Parses JSON pricing sheets
  - Handles quantity ranges: "1-24", "25+", "100-499"
  - Extracts: minQty, maxQty, unitPrice, setupPrice, colors, size
  - Sorts rules by minQty for efficient lookup

export function quoteFromRules(rules: PricingRule[], quantity: number): Quote
  - Runtime quote calculation
  - Best-fit rule selection by quantity
  - Returns: { total, breakdown: { unit, quantity, setup } }
```

**Data Structures**:
```typescript
type PricingOptions = {
  service: 'screen' | 'embroidery' | 'laser' | 'transfer';
  colors?: number;
  size?: 'S' | 'M' | 'L' | 'XL' | 'Jumbo';
};

type PricingRule = {
  minQty: number;
  maxQty?: number;
  unitPrice: number;
  setupPrice?: number;
  size?: string | null;
  colors?: number | null;
  raw?: ScreenRow;
};
```

#### 2. tRPC API Router (`src/api/pricing-router.ts`)
**Backend API procedures** (currently stubs, ready for implementation)

```typescript
export const pricingRouter = router({
  getQuote: publicProcedure
    .input(z.object({ quantity: z.number(), options: z.any() }))
    .query(/* Stub: needs implementation with pricing-engine */),
  
  createQuote: publicProcedure
    .input(z.object({ description: z.string(), price: z.number() }))
    .mutation(/* Saves to Prisma Quote table */),
});
```

**Integration point**: Replace stub with actual `quoteFromRules()` call

#### 3. Data Layer (`data/parsers/screen_print_mapping.json`)
**Mapping configuration for Excel → JSON conversion**

```json
{
  "sheetName": "Screen Printed Apparel",
  "headerRow": 2,
  "startRow": 3,
  "stopOnBlank": true,
  "mappings": {
    "Quantity": "quantity",
    "Size": "size",
    "Colors": "colors",
    "Unit Price": "unit_price",
    "Total Price": "total_price",
    "Notes": "notes"
  }
}
```

#### 4. Prisma Schema (`prisma/schema.prisma`)
**Data persistence for quotes and users**

```prisma
model Quote {
  id: String (CUID)
  userId: String
  description: String
  payload: Json          // Stores quote details
  price: Float
  createdAt: DateTime
  user: User @relation
}

model User {
  id: String (CUID)
  email: String @unique
  name: String?
  image: String?
  password: String?
  quotes: Quote[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## Printshop-os Integration: 4 Phases

### Phase 1: Core Engine Port (Effort: 8-12 hours)
**Goal**: Functional pricing engine in printshop-os with color-based + 35% margin logic

#### 1.1 Setup Structure
```bash
mkdir -p services/pricing/{lib,data,tests,strapi}
```

**New files**:
- `services/pricing/lib/pricing-engine.ts` - Ported from job-estimator
- `services/pricing/lib/margin-calculator.ts` - NEW: 35% margin logic
- `services/pricing/lib/color-calculator.ts` - NEW: Color-based surcharges
- `services/pricing/data/pricing-rules-schema.json` - NEW: Rule schema
- `services/pricing/tests/pricing-engine.test.ts` - Port tests from job-estimator
- `services/pricing/package.json` - Dependencies

#### 1.2 Port Core Logic
**File**: `services/pricing/lib/pricing-engine.ts`

```typescript
// Core calculation functions (COPIED FROM job-estimator)
export function loadScreenPricingRules(jsonPath: string): PricingRule[]
export function quoteFromRules(rules: PricingRule[], quantity: number): Quote

// NEW FUNCTIONS for printshop-os
export function calculateMargin(supplierCost: number, marginPercent: number): number
  - Input: $10.00 supplier cost, 35% margin
  - Returns: $13.50 (retail price)

export function calculateColorSurcharge(colors: number, colorMultiplier: number): number
  - Input: 3 colors, $0.50 per color
  - Returns: $1.50

export function calculateQuoteWithMargin(
  quantity: number, 
  supplierCost: number, 
  colors: number, 
  marginPercent: number = 35
): Quote
  - Combines rule lookup + margin calculation
  - Returns: { unitPrice, totalPrice, margin, breakdown }
```

#### 1.3 Adapt for 35% Margin Model
**Current job-estimator**: Hardcoded service prices ($4.00 screen, $6.00 embroidery)  
**Needed for printshop-os**: Dynamic costs from suppliers + 35% margin

**Changes**:
```typescript
// Instead of hardcoded base prices:
// OLD: const base = 4.0; (screen)
// NEW: const base = supplierCost * 1.35; (from supplier API + margin)

export function quoteWithSupplierCost(
  quantity: number,
  supplierCost: number,  // From supplier API (S&S, AS Colour, SanMar)
  colors: number,
  colorSurchargePerColor: number = 0.50,
  marginPercent: number = 35
): {
  supplierCost: number;
  costWithMargin: number;
  colorSurcharge: number;
  unitPrice: number;
  totalPrice: number;
  margin: number;
  breakdown: object;
}
```

#### 1.4 Testing
**Port from job-estimator**: `tests/test_pricing_engine.js`

```typescript
// services/pricing/tests/pricing-engine.test.ts
describe('Pricing Engine', () => {
  test('Load pricing rules from JSON', () => { ... });
  test('Quote calculation with quantity range', () => { ... });
  test('Color surcharge applied correctly', () => { ... });
  test('Size multiplier applied correctly', () => { ... });
  test('35% margin calculation', () => { ... });
  test('Margin from supplier cost', () => { ... });
  // ~20+ test cases total
});
```

**Run tests**:
```bash
npm test --prefix services/pricing/
```

### Phase 2: Rule Management System (Effort: 6-8 hours)
**Goal**: JSON-driven pricing rules independent of hardcoded values

#### 2.1 Define JSON Rule Schema
**File**: `services/pricing/data/pricing-rules-schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Pricing Rules for PrintShop",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["service", "minQty", "unitPrice"],
    "properties": {
      "id": { "type": "string", "description": "Unique rule ID" },
      "service": { "enum": ["screen", "embroidery", "laser", "transfer"] },
      "minQty": { "type": "integer", "minimum": 1 },
      "maxQty": { "type": "integer" },
      "unitPrice": { "type": "number", "minimum": 0 },
      "setupPrice": { "type": "number", "minimum": 0 },
      "colorCount": { "type": ["integer", "null"] },
      "garmentSize": { "enum": ["S", "M", "L", "XL", "Jumbo"] },
      "colorSurcharge": { "type": "number", "description": "$0.50 per color" },
      "marginPercent": { "type": "number", "default": 35 },
      "activeFrom": { "type": "string", "format": "date-time" },
      "activeTo": { "type": "string", "format": "date-time" },
      "notes": { "type": "string" }
    }
  }
}
```

#### 2.2 Implement Rule Loader with Caching
**File**: `services/pricing/lib/rule-loader.ts`

```typescript
export class PricingRuleLoader {
  private rules: PricingRule[] = [];
  private lastLoad: number = 0;
  private cacheTTL: number = 3600000; // 1 hour

  async loadFromJson(path: string): Promise<PricingRule[]> {
    if (Date.now() - this.lastLoad < this.cacheTTL) {
      return this.rules; // Return cached
    }
    // Load and validate against schema
    const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
    this.rules = this.validate(raw);
    this.lastLoad = Date.now();
    return this.rules;
  }

  async loadFromStrapi(collectionName: string): Promise<PricingRule[]> {
    // Fetch from Strapi and cache locally
  }

  private validate(rules: any[]): PricingRule[] {
    // Validate against schema, return sorted by minQty
  }
}
```

#### 2.3 Sample Rule Files
**File**: `services/pricing/data/rules/screen-printing-default.json`

```json
[
  {
    "id": "screen-1-24",
    "service": "screen",
    "minQty": 1,
    "maxQty": 24,
    "unitPrice": 4.50,
    "setupPrice": 35.00,
    "colorSurcharge": 0.50,
    "marginPercent": 35,
    "notes": "1-24 piece runs"
  },
  {
    "id": "screen-25-99",
    "service": "screen",
    "minQty": 25,
    "maxQty": 99,
    "unitPrice": 3.75,
    "setupPrice": 35.00,
    "colorSurcharge": 0.40,
    "marginPercent": 35,
    "notes": "25-99 piece runs"
  },
  {
    "id": "screen-100-499",
    "service": "screen",
    "minQty": 100,
    "maxQty": 499,
    "unitPrice": 2.50,
    "setupPrice": 50.00,
    "colorSurcharge": 0.30,
    "marginPercent": 35,
    "notes": "100-499 piece runs"
  }
]
```

### Phase 3: Strapi Integration (Effort: 8-10 hours)
**Goal**: REST API exposed via Strapi for quote generation

#### 3.1 Create Strapi Plugin
**File**: `services/pricing/strapi/plugin/index.ts`

```typescript
export default {
  register(api) {
    // Register pricing routes
  },
  bootstrap(api) {
    // Initialize pricing service
  },
};
```

#### 3.2 Define API Routes
**Files**:
- `services/pricing/strapi/routes/calculate.ts`
- `services/pricing/strapi/routes/rules.ts`

```typescript
// POST /api/pricing/calculate
{
  "quantity": 100,
  "service": "screen",
  "colors": 2,
  "garmentSize": "M",
  "supplierId": "s-and-s-activewear"  // For Issue #64
}

// Response:
{
  "unitPrice": 4.50,
  "colorSurcharge": 0.80,  // 2 colors * $0.40
  "subtotal": 530.00,      // (4.50 + 0.80) * 100
  "setupPrice": 35.00,
  "totalPrice": 565.00,
  "margin": 197.50,        // 565 * 35% / (1 + 35%)
  "marginPercent": 35,
  "breakdown": {
    "quantity": 100,
    "unitPrice": 4.50,
    "colors": 2,
    "colorSurcharge": 0.80
  }
}
```

#### 3.3 Connect to Strapi Collections
**File**: `services/pricing/strapi/models/pricing-config.ts`

```typescript
// In Strapi:
// Collection: pricing-configs
// - id (UUID)
// - name: "Screen Printing Default"
// - service: "screen"
// - rules: [JSON pricing rules]
// - active: true
// - updatedAt: DateTime
```

**Webhook for rule updates**:
```typescript
// When pricing-configs is updated in Strapi:
// 1. Fetch new rules from Strapi API
// 2. Validate against schema
// 3. Reload rule cache in pricing-engine
// 4. Alert connected clients (WebSocket)
```

#### 3.4 Integration Tests
**File**: `services/pricing/tests/strapi-integration.test.ts`

```typescript
describe('Strapi Pricing Integration', () => {
  test('POST /api/pricing/calculate returns valid quote', () => { ... });
  test('GET /api/pricing/rules returns current rules', () => { ... });
  test('Rule update via webhook reloads cache', () => { ... });
  test('API key authentication enforced', () => { ... });
});
```

### Phase 4: Supplier Integration Hooks (Effort: 4-6 hours)
**Goal**: Abstract supplier API calls for Issue #64

#### 4.1 Supplier Adapter Pattern
**File**: `services/pricing/lib/supplier-adapter.ts`

```typescript
export interface SupplierAdapter {
  name: string;
  getSku(garmentId: string): Promise<string>;
  getBlankCost(sku: string, quantity?: number): Promise<number>;
  getAvailabilityDays(sku: string): Promise<number>;
}

export class S3SActivewearAdapter implements SupplierAdapter {
  async getBlankCost(sku: string, quantity: number): Promise<number> {
    // Query S&S Activewear API
    // Return cost per unit
  }
}

export class ASColourAdapter implements SupplierAdapter {
  async getBlankCost(sku: string, quantity: number): Promise<number> {
    // Query AS Colour API
    // Return cost per unit
  }
}

export class SanMarAdapter implements SupplierAdapter {
  async getBlankCost(sku: string, quantity: number): Promise<number> {
    // Query SanMar API
    // Return cost per unit
  }
}
```

#### 4.2 Integration with Quote Calculation
**File**: `services/pricing/lib/pricing-engine.ts` (extended)

```typescript
export async function quoteWithSupplier(
  quantity: number,
  garmentId: string,
  supplierId: 'S&S' | 'ASColour' | 'SanMar',
  colors: number
): Promise<Quote> {
  const adapter = getSupplierAdapter(supplierId);
  const sku = await adapter.getSku(garmentId);
  const supplierCost = await adapter.getBlankCost(sku, quantity);
  
  return calculateQuoteWithMargin(
    quantity,
    supplierCost,
    colors,
    35 // margin percent
  );
}
```

#### 4.3 Caching Strategy
- **Supplier costs**: Cache for 24 hours
- **Pricing rules**: Cache for 1 hour (Strapi webhook updates)
- **SKU lookups**: Cache for 7 days

---

## Implementation Roadmap

### Week 1: Foundation (Phase 1)
- Day 1-2: Port pricing-engine.ts from job-estimator
- Day 2-3: Implement margin calculator + color surcharges
- Day 3-4: Write tests (20+ test cases)
- Day 4-5: Validate with sample data

**Deliverable**: Core pricing engine in `services/pricing/lib/` ✅

### Week 2: Rules System (Phase 2)
- Day 1-2: Define JSON schema + sample rules
- Day 2-3: Build rule loader with caching
- Day 3-4: Strapi collection integration
- Day 4-5: Testing + documentation

**Deliverable**: Rule-driven system operational ✅

### Week 3: API Layer (Phase 3)
- Day 1-2: Create Strapi plugin + routes
- Day 2-3: Implement `/api/pricing/calculate` endpoint
- Day 3-4: Add authentication + validation
- Day 4-5: Integration tests + docs

**Deliverable**: REST API ready for Strapi ✅

### Week 4: Supplier Hooks (Phase 4)
- Day 1-2: Design supplier adapter pattern
- Day 2-3: Implement adapter interfaces
- Day 3-4: Caching + error handling
- Day 4-5: Documentation for Issue #64

**Deliverable**: Ready for Issue #64 supplier integration ✅

---

## Success Criteria

- [x] job-estimator analyzed and documented
- [ ] `services/pricing/lib/pricing-engine.ts` ported and working
- [ ] Margin calculator: 35% model implemented
- [ ] Color surcharge system working
- [ ] JSON rule schema defined
- [ ] Rule loader with caching implemented
- [ ] 20+ unit tests passing
- [ ] Strapi plugin created
- [ ] `/api/pricing/calculate` endpoint working
- [ ] Documentation complete
- [ ] Ready for Issue #64 (Supplier Integration)

---

## Key Differences: job-estimator vs. printshop-os

| Aspect | job-estimator | printshop-os |
|--------|--------------|-------------|
| **Tech Stack** | Next.js + tRPC | Node.js service + Strapi plugin |
| **Pricing Model** | Hardcoded service prices | Supplier-driven + margin |
| **Data Source** | Excel sheets | Strapi collections + APIs |
| **Margin Model** | Not implemented | 35% target margin |
| **Scaling** | Single app | Microservices architecture |
| **Integration** | Standalone | Part of larger system |

---

## Files to Create

```
services/pricing/
├── lib/
│   ├── pricing-engine.ts         # Ported from job-estimator
│   ├── margin-calculator.ts      # NEW: 35% margin logic
│   ├── color-calculator.ts       # NEW: Color-based surcharges
│   ├── rule-loader.ts            # NEW: Rule management
│   └── supplier-adapter.ts       # NEW: Supplier abstraction
├── data/
│   ├── pricing-rules-schema.json # NEW: JSON schema
│   └── rules/
│       ├── screen-printing-default.json
│       ├── embroidery-default.json
│       ├── laser-default.json
│       └── transfer-default.json
├── strapi/
│   ├── plugin/
│   │   └── index.ts              # NEW: Strapi plugin
│   ├── routes/
│   │   ├── calculate.ts          # NEW: Quote calculation
│   │   └── rules.ts              # NEW: Rule management
│   └── models/
│       └── pricing-config.ts     # NEW: Strapi model
├── tests/
│   ├── pricing-engine.test.ts    # Ported + extended
│   ├── margin-calculator.test.ts # NEW
│   └── strapi-integration.test.ts # NEW
├── IMPLEMENTATION_PLAN.md        # (This file - UPDATED)
├── INTEGRATION_PLAN.md           # (This new document)
└── package.json                  # NEW
```

---

## Next Steps

1. **Immediate**: Review this plan with team
2. **This week**: Start Phase 1 (engine port)
3. **Follow-up**: Create PR from `refactor/enterprise-foundation` → `main`
4. **Then**: Move to Issue #64 (Supplier Normalization)

**Questions?** Ping with clarifications on Phase 1 approach.
