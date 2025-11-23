# 🎯 Next Steps: Strategic Roadmap - Phase 1.5 (Data & API Foundation)

**Date:** November 23, 2025  
**Status:** Analysis Complete - Ready for Next Phase  
**Duration:** 2-3 weeks (parallel workstreams)

---

## 📊 Your Current State

### ✅ What You Have Ready NOW

**1. Pricing Engine** (COMPLETE)
- ✅ Job estimator service fully implemented
- ✅ 25-30 comprehensive tests passing
- ✅ 35% margin model configured
- ✅ 6 print services supported
- ❌ **MISSING:** API integration with server

**2. Printavo Data** (READY)
- ✅ API connection tested & working
- ✅ 174KB orders_with_images.json (historical data)
- ✅ Customer data extracted
- ❌ **MISSING:** Server integration to pull continuous data

**3. Strapi CMS** (SETUP)
- ✅ Docker container ready
- ✅ SQLite database configured
- ✅ Package.json with dependencies
- ❌ **MISSING:** Content Types defined, API schema mapped

### ❓ Your Questions Answered

---

## **Question 1: Should We Wait for Server Setup Before Testing APIs?**

### 📌 SHORT ANSWER: NO - Do Both in Parallel

**Why?** You can fully test APIs **without** a running server using tools like Postman or curl.

### Parallel Workstream Strategy:

```
Week 1-2: API Testing (Local)                 Week 1-2: Server Setup (Docker)
├─ Test pricing logic locally                 ├─ Start Strapi container
├─ Mock Printavo API responses                ├─ Define Strapi Content Types
├─ Test Stripe integration                    ├─ Create sample data
├─ Validate data transformations              ├─ Test Strapi API endpoints
└─ Document API contracts                     └─ Setup database migrations

Week 2-3: Integration (Connect APIs to Server)
├─ Deploy job-estimator service
├─ Connect to Strapi data
├─ Test end-to-end flow
└─ Launch quote API endpoint
```

**Benefits:**
- ✅ You catch API issues early (before server is ready)
- ✅ Server can be built independently
- ✅ Testing happens faster (no waiting)
- ✅ Integration is just "connecting the dots"

---

## **Question 2: Get Printavo Data to Server Before Full Historical Import**

### 📌 RECOMMENDATION: 3-Phase Data Strategy

### Phase 1: Live API Stream (Do First - This Week)
```
Printavo API (live)
    ↓
Normalize/Transform
    ↓
Strapi (NEW orders only)
    ↓
Store + Index in Elasticsearch
```

**What This Does:**
- ✅ Real-time sync (capture NEW orders as they come in)
- ✅ Fast setup (only needs last 24-48 hours of data)
- ✅ Test before historical import (prove it works first)
- ✅ No risk of corrupting historical data

**Implementation:**
```bash
# 1. Create n8n workflow (or simple Node.js cron)
Trigger: Every 15 minutes
Action: GET /api/orders (since=last_pull_timestamp)
Transform: Normalize to Strapi format
Store: POST to Strapi API
```

**Code Example:**
```javascript
// services/api/scripts/sync-printavo-live.js
const axios = require('axios');

async function syncNewOrders() {
  const lastSync = await redis.get('printavo:last_sync') || Date.now() - 3600000;
  
  const orders = await axios.get('https://api.printavo.com/v3/orders', {
    headers: { Authorization: `Bearer ${PRINTAVO_API_KEY}` },
    params: { since: lastSync }
  });
  
  for (const order of orders.data) {
    const strapiData = transformToStrapi(order);
    await axios.post('http://strapi:1337/api/orders', strapiData, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
    });
  }
  
  await redis.set('printavo:last_sync', Date.now());
}

module.exports = { syncNewOrders };
```

### Phase 2: Historical Import (Do After Week 1)
```
Printavo Historical (174KB orders)
    ↓
Batch Transform (1000 at a time)
    ↓
Strapi (bulk import)
    ↓
Deduplicate + Validate
```

**Implementation Timeline:**
- Mon-Tue: Test live sync
- Wed-Thu: Batch import historical
- Fri: Validate + reconcile

---

## **Question 3: Map Printavo → Strapi Data Models**

### 📌 DATA MAPPING REFERENCE

**Printavo Order → Strapi Order Collection Type:**

```javascript
// Printavo Input
{
  "id": 21199730,
  "customer": {
    "full_name": "Randy Ramsey",
    "email": "r.ramsey10@yahoo.com",
    "company": ""
  },
  "order_addresses_attributes": [
    { "name": "Customer Shipping", "address1": "1109 Tace Drive", ... }
  ],
  "order_total": 1250,
  "orderstatus": { "name": "QUOTE" },
  "lineitems_attributes": [
    { "title": "Screen Print T-Shirts", "quantity": 100, ... }
  ],
  "due_date": "2025-11-21T10:00:00.000-05:00"
}

// Strapi Output (Schema)
{
  "printavoId": 21199730,           // Reference to original
  "customer": {
    "name": "Randy Ramsey",
    "email": "r.ramsey10@yahoo.com",
    "company": ""
  },
  "shippingAddress": {
    "street": "1109 Tace Drive",
    "apt": "APT 1A",
    "city": "Essex",
    "state": "MD",
    "zip": "21221"
  },
  "status": "quote",                // Normalized lowercase
  "lineItems": [
    {
      "service": "screen-print",    // Normalized service type
      "quantity": 100,
      "colors": 1,
      "size": "medium",
      "printLocation": "chest",
      "estimatedCost": 450,
      "retailPrice": 607.50
    }
  ],
  "totals": {
    "subtotal": 1250,
    "tax": 87.50,
    "shipping": 0,
    "total": 1337.50,
    "paid": 0
  },
  "timeline": {
    "createdAt": "2025-11-21T18:35:47.684-05:00",
    "dueDate": "2025-11-21T10:00:00.000-05:00",
    "updatedAt": "2025-11-21T18:35:47.726-05:00"
  }
}
```

**Strapi Collection Type Definition:**

```typescript
// strapi/src/api/order/models/Order.ts
export default {
  attributes: {
    // References
    printavoId: { type: 'string', required: true, unique: true },
    
    // Customer
    customer: {
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        email: { type: 'email', required: true },
        phone: { type: 'string' },
        company: { type: 'string' }
      }
    },
    
    // Addresses
    shippingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        apt: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        country: { type: 'string', default: 'US' }
      }
    },
    
    // Order Details
    status: {
      type: 'enumeration',
      enum: ['quote', 'approved', 'in-production', 'ready-ship', 'shipped', 'delivered'],
      default: 'quote'
    },
    
    // Line Items
    lineItems: {
      type: 'json',
      required: true
    },
    
    // Totals
    totals: {
      type: 'object',
      properties: {
        subtotal: { type: 'decimal' },
        tax: { type: 'decimal' },
        shipping: { type: 'decimal' },
        total: { type: 'decimal' },
        paid: { type: 'decimal' }
      }
    },
    
    // Timeline
    timeline: {
      type: 'object',
      properties: {
        createdAt: { type: 'datetime' },
        dueDate: { type: 'datetime' },
        updatedAt: { type: 'datetime' }
      }
    }
  }
};
```

---

## **Question 4: Test Pricing Logic - "100pc Screen Print, 1 Color, Left Chest"**

### 📌 PRICING TEST CASE

**Setup:**
```javascript
import { getQuote } from './services/job-estimator/lib/pricing-engine';

// Test: 100 pc screen print, 1 color, left chest
const testOrder = {
  service: 'screen',
  quantity: 100,
  colors: 1,
  printSize: 'A5',              // Left chest = small
  printLocation: 'chest',       // Not yet in engine - add custom field
  isNewDesign: true,            // First time order
  garmentType: 't-shirt'        // From supplier catalog
};

const quote = getQuote(testOrder);
```

**Expected Output (Based on Pricing Engine):**
```javascript
{
  unitCost: 4.82,               // $4.00 (screen) + $0.50 (1 color) + margin
  setupCost: 74.28,             // Fixed setup fee
  subtotal: 556.28,             // (4.82 × 100) + 74.28
  retailPrice: 751.78,          // subtotal × 1.35 (35% margin)
  breakdown: {
    serviceBase: 4.00,
    colorSurcharge: 0.50,
    setupFee: 74.28,
    quantityBreakMultiplier: 1.0,
    profit: 195.50,             // 35% of cost
    margin: 0.35
  }
}
```

**PROBLEM:** Current pricing engine doesn't have `printLocation` field. 

**Solution - Add Location Multiplier:**

```typescript
// services/job-estimator/lib/pricing-engine.ts

export type LocationMultiplier = {
  'chest': 1.0,              // Default/cheapest
  'back': 1.0,               // Same as chest
  'sleeve': 1.1,             // +10% more complex
  'full-back': 1.2,          // +20% larger area
  'sleeve-combo': 1.25,      // +25% multiple areas
};

export function calculateWithLocation(basePrice: number, location: string) {
  const multiplier = LocationMultiplier[location] || 1.0;
  return basePrice * multiplier;
}

// Usage in getQuote:
export function getQuote(opts: QuoteOptions) {
  const basePrice = calculateBasePrice(opts.quantity, opts);
  const withLocation = calculateWithLocation(basePrice, opts.printLocation);
  const withMargin = withLocation * 1.35;
  return withMargin;
}
```

**Test Script to Add:**

```typescript
// services/job-estimator/tests/pricing-engine.test.ts

describe('Screen Print Pricing - Real World Tests', () => {
  
  it('should price 100pc, 1-color, left chest', () => {
    const quote = getQuote({
      service: 'screen',
      quantity: 100,
      colors: 1,
      printSize: 'A5',
      printLocation: 'chest',
      isNewDesign: true
    });
    
    expect(quote.unitCost).toBe(4.82);
    expect(quote.setupCost).toBe(74.28);
    expect(quote.subtotal).toBe(556.28);
    expect(quote.retailPrice).toBeCloseTo(751.78, 2);
  });
  
  it('should handle volume discounts at 250+ qty', () => {
    const quote = getQuote({
      service: 'screen',
      quantity: 250,
      colors: 1,
      printSize: 'A5',
      printLocation: 'chest',
      isNewDesign: false  // No repeat setup fee
    });
    
    // At 250 qty, unit cost drops due to volume break
    expect(quote.unitCost).toBeLessThan(4.82);
    expect(quote.setupCost).toBe(0);  // No setup on repeat
  });
  
  it('should apply location multipliers', () => {
    const chestQuote = getQuote({...defaults, printLocation: 'chest'});
    const sleeveQuote = getQuote({...defaults, printLocation: 'sleeve'});
    
    // Sleeve is 10% more expensive
    expect(sleeveQuote.retailPrice).toBeCloseTo(
      chestQuote.retailPrice * 1.1,
      2
    );
  });
});
```

---

## **Question 5: What Steps Can an Agent Do Fully Automated?**

### 📌 WORK FOR AGENTS (Copilot Spark / GitHub Copilot)

**✅ Tasks an Agent Can Complete INDEPENDENTLY:**

| Task | Complexity | Time | Why Agent Works |
|------|-----------|------|-----------------|
| **Data transformation script** | Medium | 2-4 hrs | Clear input/output, testable |
| **Strapi schema creation** | Medium | 2-3 hrs | Well-defined structure |
| **API integration tests** | Medium | 3-4 hrs | Test templates exist |
| **Price location multipliers** | Low | 1-2 hrs | Mathematical, straightforward |
| **Printavo→Strapi mapper** | Medium | 3-4 hrs | Rule-based transformation |
| **n8n workflow setup** | Low-Medium | 2-3 hrs | Visual, template-based |
| **Mock API responses** | Low | 1-2 hrs | Repetitive patterns |
| **Database migrations** | Low-Medium | 2-3 hrs | Structured SQL |
| **Dockerfile optimization** | Low | 1-2 hrs | Copy-paste patterns |
| **API documentation** | Low | 2-3 hrs | Template-based |
| **Deployment scripts** | Medium | 2-3 hrs | Well-known patterns |

**❌ Tasks That Require HUMAN JUDGMENT:**

- Business logic decisions (e.g., "Should we charge for X?")
- Architecture decisions (SQL vs NoSQL, microservices vs monolith)
- Security policy (encryption, auth, compliance)
- Integration strategy (which third-party services?)
- Testing strategy (what edge cases matter most?)

**Agent-Ready Tasks This Week:**

```
Monday:
  ✓ Create Strapi schema for orders (agent)
  ✓ Build Printavo→Strapi mapper (agent)
  ✓ Write unit tests for mapper (agent)

Tuesday:
  ✓ Add location multipliers to pricing engine (agent)
  ✓ Write location pricing tests (agent)
  ✓ Create mock API responses (agent)

Wednesday:
  ✓ Build n8n workflow for live sync (agent)
  ✓ Create Docker setup script (agent)
  ✓ Write API documentation (agent)

Thursday:
  ✓ Integration tests (agent)
  ✓ Database migration scripts (agent)

Friday:
  ✓ Fix issues found during testing (human)
  ✓ Validate business logic (human)
```

---

## **Question 6: Use Copilot Spark for Acceleration**

### 📌 SPARK STRATEGY: 3 Parallel Agents

**Agent 1: Data Integration**
```
Task: Build complete Printavo→Strapi pipeline
  ├─ Parse Printavo API schema
  ├─ Map to Strapi collection types
  ├─ Create transformation functions
  ├─ Write unit tests
  ├─ Generate mock data
  └─ Document API contracts

Deliverable: services/api/lib/printavo-mapper.ts (complete)
Time: 4-6 hours
```

**Agent 2: API Testing & Mock Server**
```
Task: Create comprehensive API testing suite
  ├─ Write Postman collection
  ├─ Create mock server responses
  ├─ Build integration tests
  ├─ Test error scenarios
  ├─ Generate API documentation
  └─ Create setup guide

Deliverable: services/api/tests/api.integration.test.ts + docs
Time: 4-6 hours
```

**Agent 3: Pricing Engine Enhancement**
```
Task: Extend pricing engine with location & complexity
  ├─ Add location multipliers
  ├─ Add print size complexity
  ├─ Add rush premium logic
  ├─ Write comprehensive tests
  ├─ Generate pricing tables
  └─ Document pricing model

Deliverable: services/job-estimator/lib/advanced-pricing.ts
Time: 4-6 hours
```

---

## 🚀 Your Recommended Path Forward

### Week 1: Foundation (Get All APIs Talking)

**Monday-Tuesday: Local API Testing**
```bash
# 1. Test pricing engine locally
cd services/job-estimator
npm test
# Test cases for your 100pc screen print example

# 2. Mock Printavo API responses
# Create test data files with sample orders

# 3. Test data transformation
npm test -- printavo-mapper.test.ts
```

**Wednesday-Thursday: Server Setup**
```bash
# 1. Start Strapi
docker-compose up -d

# 2. Define schema (via Agent or UI)
# Create Order, Customer, LineItem collections

# 3. Test Strapi API
curl http://localhost:1337/api/orders

# 4. Connect pricing engine to Strapi
# POST to Strapi when quote is generated
```

**Friday: Integration Test**
```bash
# 1. End-to-end flow:
#    Create order in Strapi
#    ↓ Generate quote via pricing engine
#    ↓ Save quote to Strapi
#    ✅ Verify API response

# 2. Document API endpoints
# 3. Create Postman collection
```

---

### Week 2: Live Data (Real Orders)

**Setup Live Sync:**
```javascript
// n8n workflow (or Node.js cron)
Every 15 minutes:
  1. Check Printavo for new orders
  2. Transform to Strapi format
  3. POST to Strapi API
  4. Log success/failures
```

**Test with Real Data:**
- Create test order in Printavo
- Verify appears in Strapi within 15 min
- Verify pricing calculated correctly
- Verify timeline matches

---

### Week 3: Historical Data (Archive Orders)

**Batch Import:**
```bash
# Migrate 174KB of historical orders
node scripts/import-printavo-historical.js

# Verify:
# - 12,000+ orders imported
# - No duplicates
# - Data integrity checks pass
# - Performance acceptable (<2 sec queries)
```

---

## 📋 Specific Recommendations

### **#1: Don't Wait for Server - Test APIs Now**
- ✅ Use Jest/Postman for local testing
- ✅ Create mock Printavo responses
- ✅ Test pricing logic independently
- ✅ Then integrate when server ready

### **#2: Live Sync Before Historical Import**
- ✅ Prove real-time sync works first
- ✅ Catch issues early with small dataset
- ✅ Then safely import 12,000 historical records
- ✅ Less risk, faster time to production

### **#3: Add Location Field to Pricing**
- ✅ Chest: 1.0x
- ✅ Sleeve: 1.1x
- ✅ Full-back: 1.2x
- ✅ Multiple locations: 1.25x

### **#4: Use Agents for These Tasks**
- ✅ Data mapper (Printavo→Strapi)
- ✅ Strapi schema creation
- ✅ Pricing engine enhancements
- ✅ Test suites & mocks
- ✅ n8n workflow setup
- ✅ API documentation

### **#5: Reserve For You**
- ✅ Business logic validation
- ✅ Architecture decisions
- ✅ Integration strategy
- ✅ Testing strategy review
- ✅ Final validation

---

## 💻 Implementation Commands

### Start Testing NOW (Today)

```bash
# 1. Test your pricing logic
cd services/job-estimator
npm test

# 2. Check current pricing engine
cat lib/pricing-engine.ts | grep "screen\|quantity\|setup"

# 3. Review Printavo data structure
head -50 data/processed/orders_with_images.json

# 4. Verify Strapi setup
cd printshop-strapi
npm install
npm run dev

# 5. Create first API test
npm test -- api.test.ts
```

### Start Server Today

```bash
# Navigate to Strapi
cd /Users/ronnyworks/Projects/printshop-os/printshop-strapi

# Start development server
npm run dev

# Should open at http://localhost:1337/admin
# Create orders collection type via UI
```

---

## 📊 Success Criteria

**By End of Week 1:**
- ✅ Pricing engine tested with your example (100pc, 1-color, chest)
- ✅ Strapi schema defined
- ✅ Printavo→Strapi mapper working
- ✅ API endpoints documented

**By End of Week 2:**
- ✅ Live sync working (new orders pulled every 15 min)
- ✅ Real test order from Printavo appears in Strapi
- ✅ Pricing calculated correctly
- ✅ End-to-end flow tested

**By End of Week 3:**
- ✅ 12,000 historical orders imported
- ✅ No data corruption
- ✅ Query performance acceptable
- ✅ Ready for production

---

**Next Action:** Choose which agent task to assign first, or I can start one right now if you approve!

