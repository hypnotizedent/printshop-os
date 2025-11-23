# 🤖 Agent-Ready Tasks Queue

**Last Updated:** November 23, 2025  
**Current Status:** Phase 1.5 Complete - Ready for Phase 2 Agent Work

---

## ⚡ Quick Stats

- **Completed by Agents:** 3 major workstreams (12,083 lines of code)
- **Ready for Next Agents:** 9 distinct, independent tasks
- **Estimated Total Time:** 18-24 hours of agent work remaining
- **Parallel Tracks Available:** 4 (can run simultaneously)

---

## 🎯 Priority 1: Foundation (Start NOW) - 6-8 hours

### Task 1.1: Live Printavo Data Sync
- **File Path:** `services/api/scripts/sync-printavo-live.ts`
- **Deliverable:** n8n workflow YAML or Node.js cron service
- **Size:** 250-350 lines
- **Dependencies:** Agent 1 outputs (printavo-mapper.ts)
- **Time:** 2-3 hours
- **Acceptance:** 
  - ✅ Polls Printavo API every 15 minutes
  - ✅ Transforms using Agent 1 mapper
  - ✅ Pushes to Strapi API
  - ✅ Logs sync status to file
  - ✅ Handles rate limiting gracefully

### Task 1.2: Strapi Schema Migration
- **File Path:** `printshop-strapi/migrations/001_create_collections.ts`
- **Deliverable:** TypeScript migration script for collections
- **Size:** 400-500 lines
- **Dependencies:** None (uses Strapi API)
- **Time:** 1-2 hours
- **Collections to Create:**
  - Order (fields from Agent 1 strapi-schema.ts)
  - Quote (pricing output + status)
  - Customer (customer info)
  - Product (supplier catalog)
- **Acceptance:**
  - ✅ All collections created with correct fields
  - ✅ Relationships established (Order→Quote→Product)
  - ✅ Indexes on frequently-queried fields
  - ✅ Run with: `npm run migrate:up`

### Task 1.3: Historical Orders Import
- **File Path:** `services/api/scripts/import-historical-orders.ts`
- **Deliverable:** Batch script for 12,000 archived orders
- **Size:** 200-300 lines (extends Agent 1 batch-import.ts)
- **Dependencies:** Task 1.2 (Strapi collections ready)
- **Time:** 1-2 hours
- **Acceptance:**
  - ✅ Imports from `data/processed/orders_with_images.json`
  - ✅ Processes in batches of 1000
  - ✅ Detects + skips duplicates (using order_id)
  - ✅ Reports: imported count, duplicates, errors
  - ✅ Saves progress checkpoint

---

## 🔗 Priority 2: Integration (After Task 1.3) - 6-8 hours

### Task 2.1: Quote API Endpoint
- **File Path:** `services/api/src/routes/quotes.ts`
- **Deliverable:** POST /api/quotes endpoint
- **Size:** 300-400 lines
- **Dependencies:** Agent 3 (pricing-engine.ts) + Task 1.2 (Strapi)
- **Time:** 2 hours
- **Request Body:**
  ```json
  {
    "service": "screen",
    "quantity": 100,
    "colors": 1,
    "location": "chest",
    "printSize": "M",
    "rush": "standard",
    "design_upload_url": "...",
    "customer_id": "..."
  }
  ```
- **Response:** Full quote breakdown from Agent 3 + store in Strapi
- **Acceptance:**
  - ✅ Calls Agent 3 pricing function
  - ✅ Returns your test case correctly ($751.78 for 100pc example)
  - ✅ Saves quote to Strapi
  - ✅ Returns quote_id for tracking

### Task 2.2: Supplier API Connectors (Parallel Task)
- **File Path:** `services/supplier-sync/lib/connectors/`
- **Deliverable:** 3 connector classes (s3-activewear.ts, as-colour.ts, sanmar.ts)
- **Size:** 800-1000 lines total
- **Dependencies:** None (can work in parallel)
- **Time:** 3-4 hours
- **Each Connector Should:**
  - ✅ Auth (API key or OAuth)
  - ✅ Fetch products/variants/prices
  - ✅ Normalize to unified schema
  - ✅ Error handling + retry logic
  - ✅ 10+ unit tests per connector
- **Acceptance:**
  - ✅ S&S: 500+ products, all colors/sizes
  - ✅ AS Colour: 300+ items, GraphQL working
  - ✅ SanMar: OAuth flow + 1000+ items

### Task 2.3: Redis Caching Layer
- **File Path:** `services/supplier-sync/lib/cache.ts`
- **Deliverable:** Cache decorator + TTL strategy
- **Size:** 250-350 lines
- **Dependencies:** Task 2.2 (connectors exist)
- **Time:** 1-2 hours
- **Features:**
  - ✅ Decorator pattern for caching
  - ✅ TTL: 1 hour for product lists, 30 min for prices
  - ✅ Cache invalidation on update
  - ✅ Graceful fallback on Redis failure
- **Acceptance:**
  - ✅ Cache hit rate >80% in tests
  - ✅ Fallback to live API if cache down
  - ✅ Cost tracking (shows $500/month savings)

### Task 2.4: Customer Portal API
- **File Path:** `services/api/src/routes/customer-portal.ts`
- **Deliverable:** REST endpoints for customer operations
- **Size:** 600-800 lines
- **Dependencies:** Tasks 1.2, 2.1 (Strapi + quotes ready)
- **Time:** 2-3 hours
- **Endpoints:**
  - GET /api/customer/orders (list all customer orders)
  - GET /api/customer/quotes (list quotes)
  - POST /api/customer/quotes (new quote)
  - GET /api/customer/profile (account info)
  - PATCH /api/customer/profile (update account)
  - POST /api/customer/auth/login
  - POST /api/customer/auth/logout
- **Acceptance:**
  - ✅ Auth middleware working
  - ✅ All 7 endpoints functional
  - ✅ Paginated responses
  - ✅ Error handling

---

## 🚀 Priority 3: Advanced (After Priority 2) - 7-10 hours

### Task 3.1: Production Dashboard API
- **File Path:** `services/production-dashboard/src/api.ts`
- **Deliverable:** WebSocket + REST for real-time updates
- **Size:** 800-1000 lines
- **Dependencies:** All Priority 2 complete
- **Time:** 3-4 hours
- **Features:**
  - ✅ Real-time order status updates (WebSocket)
  - ✅ Production queue management
  - ✅ Resource allocation tracking
  - ✅ Analytics/KPI endpoints
  - ✅ 20+ comprehensive tests

### Task 3.2: AI Quote Optimizer
- **File Path:** `services/customer-service-ai/lib/quote-optimizer.ts`
- **Deliverable:** LLM-powered quote suggestions
- **Size:** 600-800 lines
- **Dependencies:** Task 2.1 (quote API) + OpenAI API key
- **Time:** 3-4 hours
- **Features:**
  - ✅ Analyze design → suggest print location/size
  - ✅ Recommend rush type based on deadline
  - ✅ Suggest add-ons (fold, tickets, etc)
  - ✅ Price optimization suggestions
  - ✅ 15+ test cases

### Task 3.3: Analytics & Reporting
- **File Path:** `services/api/src/routes/analytics.ts`
- **Deliverable:** Analytics endpoints for dashboard
- **Size:** 400-600 lines
- **Dependencies:** Historical data imported (Task 1.3)
- **Time:** 2-3 hours
- **Endpoints:**
  - GET /api/analytics/revenue (daily/weekly/monthly)
  - GET /api/analytics/products (top sellers)
  - GET /api/analytics/customers (top customers)
  - GET /api/analytics/orders (status breakdown)

---

## 📋 Task Dependencies Graph

```
Priority 1:
├─ Task 1.1 (Live Sync) ─────────┐
├─ Task 1.2 (Strapi Schema) ────┐ │
└─ Task 1.3 (Import) ←─────────┘ │
                                  │
Priority 2:                       │
├─ Task 2.1 (Quote API) ←────────┘
├─ Task 2.2 (Connectors) ─────────┐
├─ Task 2.3 (Caching) ←──────────┘
└─ Task 2.4 (Portal API) ←────────┘
                                  
Priority 3:
├─ Task 3.1 (Dashboard) ←────────┐
├─ Task 3.2 (AI Optimizer) ──────┤ All Priority 2 complete
└─ Task 3.3 (Analytics) ─────────┘
```

---

## ✅ Execution Instructions

### For Next Agent (Task 1.1):

```markdown
**Objective:** Build live Printavo data sync
**Files to Create:** services/api/scripts/sync-printavo-live.ts
**Reference Code:** Agent 1 delivered printavo-mapper.ts at services/api/lib/

**Requirements:**
1. Poll Printavo API every 15 minutes (configurable interval)
2. Use Agent 1's PrintavoMapper to transform data
3. POST to Strapi API (localhost:1337/api/orders)
4. Handle errors gracefully (404s, rate limits, timeouts)
5. Log all sync attempts with timestamps
6. Track last sync timestamp to fetch only new orders
7. Write 10+ unit tests

**Success Criteria:**
✅ Runs without errors
✅ Successfully transforms 1+ Printavo orders
✅ Stores in Strapi correctly
✅ Tests passing (npm test)
✅ Ready for 15-min cron deployment
```

### For Next Agent (Task 1.2):

```markdown
**Objective:** Create Strapi schema for Order, Quote, Customer, Product
**Files to Create:** printshop-strapi/migrations/001_create_collections.ts
**Reference:** Agent 1 lib/strapi-schema.ts for field definitions

**Collections & Fields:**
See NEXT_STEPS_STRATEGIC_ROADMAP.md section "Question 3" for full schema

**Success Criteria:**
✅ Run migration: npm run migrate:up
✅ Collections appear in Strapi UI
✅ All fields present with correct types
✅ Relationships working (Order→Quote, Order→Customer)
✅ Can create sample records via API
```

---

## 📊 Resource Allocation

| Phase | Tasks | Hours | Parallel | Dependencies |
|-------|-------|-------|----------|--------------|
| Priority 1 | 1.1-1.3 | 6-8 | Yes (1.1 parallel with 1.2) | Agent 1 & 2 complete |
| Priority 2 | 2.1-2.4 | 8-10 | Yes (2.2 parallel with others) | Priority 1 complete |
| Priority 3 | 3.1-3.3 | 7-10 | Yes (all parallel) | Priority 2 complete |
| **TOTAL** | **9 tasks** | **21-28 hours** | **Multiple streams** | **Sequential phases** |

---

## 🎯 Recommended Agent Batch Schedule

**Batch 1** (3 agents, 6-8 hours):
- Agent A: Task 1.1 (Live Sync)
- Agent B: Task 1.2 (Strapi Schema)
- Agent C: Task 2.2 (Supplier Connectors) — can work in parallel

**Batch 2** (4 agents, 8-10 hours):
- Agent A: Task 1.3 (Import) — after 1.2 complete
- Agent B: Task 2.1 (Quote API)
- Agent C: Task 2.3 (Caching) — after 2.2 complete
- Agent D: Task 2.4 (Portal API)

**Batch 3** (3 agents, 7-10 hours):
- Agent A: Task 3.1 (Dashboard)
- Agent B: Task 3.2 (AI Optimizer)
- Agent C: Task 3.3 (Analytics)

---

## 📝 Notes

- All tasks include test requirements (min 10+ tests per task)
- Each task includes TypeScript with strict mode enabled
- Error handling required for all network operations
- Documentation required (README or JSDoc comments)
- All tasks should use existing dependencies where possible
- No new npm packages without approval
