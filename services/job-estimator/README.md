# 📊 Job Estimator & Pricing Engine

**Flexible, JSON-driven pricing and job estimation engine for print shop operations**

Consolidated from:
- ✅ screenprint-pricer (archived)
- ✅ pricer (archived)  
- ✅ pricer-new (archived)
- ✅ mint-prints-pricing (integrated)

---

## 🎯 Overview

The Job Estimator provides a comprehensive, maintainable pricing system with JSON-based rules, full audit trails, and sub-100ms calculation times. It handles complex multi-dimensional pricing with configurable rules that can be edited by non-technical users.

**Status**: ✅ **Task 2.3 Complete** - Flexible Pricing Engine with JSON Rules

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests (85+ tests, all passing)
npm test

# Build
npm run build

# Start REST API server (port 3001)
npm run api:dev

# Start development server (legacy)
npm run dev

# Test the API
./examples/test-api.sh
```

---

## 📁 Structure

```
services/job-estimator/
├─ lib/
│  ├─ pricing-rules-engine.ts    # ✨ NEW: JSON rules evaluation engine
│  ├─ pricing-api.ts             # ✨ NEW: API service with caching
│  ├─ api-server.ts              # ✨ NEW: Express REST API server
│  ├─ pricing-engine.ts          # Legacy pricing calculations
│  ├─ advanced-pricing.ts        # Advanced pricing features
│  └─ estimator.ts               # Entry point & API wrapper
├─ tests/
│  ├─ pricing-rules-engine.test.ts  # ✨ NEW: 39 rules engine tests
│  ├─ pricing-api.test.ts           # ✨ NEW: 24 API service tests
│  ├─ api-server.test.ts            # ✨ NEW: 22 HTTP API tests
│  ├─ advanced-pricing.test.ts      # 80 advanced pricing tests
│  └─ pricing-engine.test.js        # Legacy tests
├─ data/
│  ├─ sample-pricing-rules.json  # ✨ NEW: Sample rule configurations
│  ├─ pricing-rules-schema.json  # All pricing data
│  └─ pricing-tables.json        # Pricing lookup tables
├─ docs/
│  └─ PRICING_API.md             # ✨ NEW: Complete API documentation
├─ examples/
│  └─ test-api.sh                # ✨ NEW: API test script
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 💡 Features

### ✨ NEW: Flexible Pricing Engine (Task 2.3)

- ✅ **JSON-Based Pricing Rules** with versioning and precedence
- ✅ **Rule Engine** - Automatic condition evaluation and matching
- ✅ **REST API** - 9 endpoints for pricing and rule management
- ✅ **Caching** - Sub-100ms response times (typically 10-20ms)
- ✅ **Audit Trail** - Complete history of all pricing calculations
- ✅ **Admin API** - Non-technical user rule management
- ✅ **85+ Tests** - Comprehensive coverage, all passing

### Core Pricing Capabilities ✅

- ✅ **Base garment cost lookup** from supplier data
- ✅ **Print location surcharges** (front +$2, back +$3, sleeve +$1.50)
- ✅ **Color count multipliers** (1 color = ×1.0, 2+ colors = ×1.3)
- ✅ **Stitch count pricing** for embroidery (per 1000 stitches)
- ✅ **Volume tier discounts** (100-499 = -10%, 500+ = -20%)
- ✅ **Add-ons system** (rush fees, shipping, taxes, setup)
- ✅ **Margin calculation** (35% default, configurable per rule)

### Integration & Quality ✅

- ✅ **Strapi CMS** content types for rules and calculations
- ✅ **Full TypeScript** types (no `any`)
- ✅ **Performance** - All calculations <100ms
- ✅ **Detailed error handling**
- ✅ **Complete documentation**

---

## 📊 Usage Examples

### REST API (Recommended)

```bash
# Calculate pricing for an order
curl -X POST http://localhost:3001/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "garment_id": "ss-activewear-6001",
    "quantity": 100,
    "service": "screen",
    "print_locations": ["front", "back"],
    "color_count": 3,
    "customer_type": "repeat_customer"
  }'

# Response:
# {
#   "line_items": [...],
#   "subtotal": 1111.5,
#   "margin_pct": 35.0,
#   "total_price": 1500.52,
#   "breakdown": {...},
#   "rules_applied": ["volume-discount-100-499-v1", ...],
#   "calculation_time_ms": 12
# }
```

### TypeScript API

```typescript
import { PricingAPIService, InMemoryRuleStorage, InMemoryCalculationHistory } from './lib/pricing-api';
import rules from './data/sample-pricing-rules.json';

// Initialize service
const ruleStorage = new InMemoryRuleStorage(rules);
const history = new InMemoryCalculationHistory();
const apiService = new PricingAPIService(ruleStorage, history);

// Calculate pricing
const result = await apiService.calculate({
  garment_id: 'ss-activewear-6001',
  quantity: 100,
  service: 'screen',
  print_locations: ['front', 'back'],
  color_count: 3
});

console.log(result.total_price); // Final price with margin
console.log(result.breakdown);   // Detailed breakdown
console.log(result.rules_applied); // Rules that were applied
```

### See Also
- **[Complete API Documentation](docs/PRICING_API.md)**
- **[API Test Script](examples/test-api.sh)**

---

## 🔗 Integration Points

### Phase 1: Pricing Engine ✅
- Core pricing logic implemented
- All 6 services fully supported
- Tests passing 100%

### Phase 2: Rule Management UI (In Progress)
- Admin interface for pricing rules
- Real-time price updates
- Price history tracking
- See: `docs/job-estimator/PHASE_2.md`

### Phase 3: System Integrations (Planned)
- **EasyPost Shipping**: Calculate shipping costs
- **Printavo API**: Validate product specs
- **Supplier-Sync API**: Check supplier costs
- See: `docs/job-estimator/INTEGRATION.md`

### Phase 4: Customer Experience (Planned)
- Customer-facing quote calculator
- Order management system
- Analytics and reporting
- See: `docs/job-estimator/PHASE_4.md`

---

## 📋 Pricing Rules

### Margin Model
```
Retail Price = Total Cost × 1.35 (35% margin)
```

### Setup Fees
```
New Design:  $27.88 - $74.28 (service dependent)
Repeat Design: $0.00
```

### Quantity Breaks
Standard: `[1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000]`

### Add-ons
- Fold & Bag (Customer): $0.70 each
- Fold & Bag (Supplied): $1.00 each
- Insert & Ticketing: $0.30 each
- Swing Ticketing: $0.30 each
- Relabelling: $15.00
- Despatch: $15.00
- Artwork Services: $15-$45

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- pricing-engine.test.ts

# Run with coverage
npm test -- --coverage
```

**Test Coverage**: 25-30 comprehensive tests
- ✅ All 6 services
- ✅ Quantity break selection
- ✅ Setup fee logic
- ✅ Margin calculations
- ✅ Add-ons pricing
- ✅ Edge cases
- ✅ Error handling

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development server (with auto-reload)
npm run dev

# Lint (if configured)
npm run lint

# Format code (if configured)
npm run format
```

---

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - REST API endpoints
- **[Usage Guide](./docs/USAGE.md)** - Code examples
- **[Integration Guide](./docs/INTEGRATION.md)** - Connect to other systems
- **[Data Schema](./docs/SCHEMA.md)** - pricing-rules-schema.json reference

---

## 🔄 Migration History

### Consolidated From:
- **screenprint-pricer** → Archived (legacy reference pricing)
- **pricer** → Archived (initial implementation)
- **pricer-new** (job-estimator) → Migrated (last working version)
- **mint-prints-pricing** → Integrated (Spark-generated Phase 1)

### Current Location:
- **Repository**: https://github.com/hypnotizedent/printshop-os
- **Path**: `/services/job-estimator/`
- **Status**: ✅ Single source of truth

---

## 🚀 Roadmap

| Phase | Status | Timeline | Description |
|-------|--------|----------|-------------|
| **Phase 1** | ✅ Complete | Done | Pricing engine implementation |
| **Phase 2** | 🔄 Planned | 1-2 weeks | Rule management UI |
| **Phase 3** | 🔄 Planned | 2-3 weeks | System integrations |
| **Phase 4** | 🔄 Planned | 3-4 weeks | Customer UI & launch |

---

## 📞 Support

For issues or questions:
1. Check `docs/job-estimator/FAQ.md`
2. Review test examples in `tests/`
3. See integration guides in `docs/`

---

## 📄 License

Part of printshop-os project. See main LICENSE.

---

**Last Updated**: November 23, 2025  
**Status**: ✅ Phase 1 Complete (Pricing Engine)  
**Next**: Phase 2 (Rule Management UI)

