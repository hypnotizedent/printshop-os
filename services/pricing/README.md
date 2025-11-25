# Pricing Service

**Status:** Planning Phase  
**Last Updated:** November 25, 2025

---

## Overview

The Pricing Service will provide intelligent quote calculation for print shop operations, integrating with job-estimator logic and supplier pricing data.

---

## Current State

**Status:** Not yet implemented - planning documents archived

**Planning Documents:** Archived to `/docs/archive/pricing-planning-nov-2024/`
- Executive summaries
- Integration plans  
- Phase execution plans
- Repository architecture docs

---

## Planned Features

### Core Functionality
- Quote calculation based on job parameters
- Volume discount rules
- Location-based surcharges
- Color/process multipliers
- Margin tracking and reporting

### Integration Points
- **job-estimator:** Proven pricing logic from separate repository
- **supplier-sync:** Real-time product pricing and availability
- **Strapi API:** Quote storage and retrieval
- **Frontend:** Customer-facing quote interface

---

## Architecture Plan

### Technology Stack (Proposed)
- **Language:** TypeScript
- **Framework:** Express or tRPC
- **Database:** Prisma ORM + PostgreSQL (shared with Strapi)
- **Caching:** Redis (pricing rules, supplier costs)
- **Testing:** Jest or Vitest

### Service Structure (Proposed)
```
services/pricing/
├── src/
│   ├── lib/
│   │   ├── pricing-engine.ts    ← Core calculation logic
│   │   ├── rules-parser.ts      ← JSON rule processor
│   │   └── discount-calculator.ts
│   ├── api/
│   │   └── pricing-router.ts    ← REST/tRPC endpoints
│   ├── models/
│   │   └── prisma/              ← Database schema
│   └── utils/
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   └── API.md                   ← API documentation
├── README.md                    ← This file
└── package.json
```

---

## Implementation Phases

### Phase 1: Core Engine (4 weeks)
- Port pricing-engine.ts from job-estimator
- Implement rule system (JSON-based)
- Unit tests for calculations
- Basic REST API

### Phase 2: Supplier Integration (2 weeks)
- Connect to supplier-sync service
- Real-time cost lookup
- Caching strategy (Redis)
- Margin calculation

### Phase 3: Rule Management (2 weeks)
- Admin interface for pricing rules
- Excel → JSON import tool
- Rule versioning
- A/B testing framework

### Phase 4: Production Ready (1 week)
- Performance optimization
- Monitoring & logging
- Documentation
- Deployment automation

---

## Design Decisions

### Why Port from job-estimator?
- **Proven:** 2-3 months of production use
- **Tested:** Existing test suite
- **Fast:** Saves 2-3 weeks vs. building from scratch
- **Low Risk:** Known edge cases handled

### Why Separate Service?
- **Independent scaling:** Pricing calculations are CPU-intensive
- **Clear boundaries:** Single responsibility principle
- **Team autonomy:** Pricing logic can evolve independently
- **Caching:** Isolated cache layer for pricing rules

### Why Redis Caching?
- **Performance:** Sub-100ms quote generation
- **Cost Savings:** Reduce supplier API calls
- **Resilience:** Continue operating during supplier downtime

---

## API Design (Proposed)

### Calculate Quote
```typescript
POST /api/quotes/calculate
{
  "items": [
    {
      "productId": "AS5050",
      "quantity": 100,
      "colors": ["front-2color", "back-1color"],
      "locations": ["front", "back"]
    }
  ],
  "shipping": {
    "zipCode": "90210",
    "method": "ground"
  }
}

Response:
{
  "quoteId": "q_abc123",
  "subtotal": 450.00,
  "shipping": 25.00,
  "tax": 38.00,
  "total": 513.00,
  "itemizedCosts": [...],
  "expiresAt": "2025-12-01T00:00:00Z"
}
```

### Get Pricing Rules
```typescript
GET /api/pricing/rules

Response:
{
  "rules": {
    "volumeDiscounts": [...],
    "locationSurcharges": [...],
    "colorMultipliers": [...]
  },
  "version": "1.2.0",
  "effectiveDate": "2025-11-01"
}
```

---

## Dependencies

### Services
- **supplier-sync:** Product costs and availability
- **Strapi API:** Quote persistence
- **Redis:** Caching layer

### External
- **job-estimator repo:** Source of pricing logic (manual port)

---

## Testing Strategy

### Unit Tests
- Pricing calculations (edge cases, rounding)
- Rule parsing (JSON validation)
- Discount logic (volume tiers)

### Integration Tests
- Supplier API calls (mocked)
- Database operations (Prisma)
- Cache behavior (Redis)

### Performance Tests
- Quote calculation < 100ms (95th percentile)
- 1000 concurrent requests
- Cache hit rate > 80%

---

## Monitoring & Metrics

### Key Metrics
- Quote generation time (p50, p95, p99)
- Cache hit rate
- Supplier API call frequency
- Error rate by calculation type
- Cost savings from caching

### Alerts
- Quote calculation > 500ms
- Cache hit rate < 70%
- Supplier API failures > 5%
- Error rate > 1%

---

## Next Steps

1. **Review planning docs** in `/docs/archive/pricing-planning-nov-2024/`
2. **Extract job-estimator code** (pricing-engine.ts, rule system)
3. **Create service structure** (directories, package.json)
4. **Implement Phase 1** (core engine + tests)
5. **Document API** (OpenAPI/Swagger spec)

---

## References

- **Planning Docs:** `/docs/archive/pricing-planning-nov-2024/`
- **job-estimator Repo:** `github.com/hypnotizedent/pricer-new`
- **Issue #44:** Pricing Engine Implementation
- **Supplier Sync Service:** `/services/supplier-sync/`

---

**Status:** ⏳ Awaiting implementation - planning complete
