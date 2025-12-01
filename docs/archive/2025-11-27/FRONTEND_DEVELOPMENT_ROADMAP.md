# 🗺️ Frontend Development Roadmap & Quick Navigation

**For:** Copilot Spark (Frontend AI Builder)  
**Purpose:** Quick navigation to all resources + phased development roadmap  
**Date:** November 23, 2025

---

## 🧭 Quick Navigation Guide

### 📚 DOCUMENTATION TO READ (In This Order)

1. **START HERE:** `docs/BACKEND_BRAIN_STATUS.md` (5 min read)
   - Status of all backend services
   - What's ready NOW vs. what's coming
   - Local development setup instructions

2. **NEXT:** `docs/SPARK_FRONTEND_TECHNICAL_BRIEF.md` (15 min read)
   - API endpoints you'll call
   - Request/response examples
   - Code patterns for implementation
   - Mock data locations

3. **REFERENCE:** `docs/FRONTEND_INTEGRATION_STRATEGY.md` (30 min reference)
   - Complete architecture overview
   - Component-to-API mapping
   - WebSocket integration
   - Performance optimization
   - Deployment strategy

### 🎯 REFERENCE CODE AVAILABLE NOW

```
services/api/mocks/
├── printavo-responses.ts        ← 10+ realistic order examples
├── strapi-responses.ts          ← API response patterns
└── postman-collection.json      ← Pre-built request examples

services/job-estimator/tests/
└── advanced-pricing.test.ts     ← 40+ pricing test cases (use expected values)

services/api/lib/
├── printavo-mapper.ts           ← Order transformation logic (reference)
└── strapi-schema.ts             ← Data type definitions

services/api/package.json        ← npm scripts and build config
services/api/README.md           ← API service documentation
```

### 🔗 LIVE SERVICES (Available Now)

```
Strapi Admin:     http://localhost:1337/admin
Strapi API:       http://localhost:1337/api
API Service:      http://localhost:3002 (coming soon)
Job Estimator:    http://localhost:3001 (pricing calculations)

Check Status: docker-compose ps
View Logs:    docker-compose logs -f [service-name]
```

---

## 🎬 3-Phase Development Roadmap

### ⭐ PHASE 1: Build UI Components (Start NOW - 24-36 hours)

**What You're Building:**
- Complete React component library
- Page layouts and navigation
- Form components with validation
- Mock data integration

**Resources You'll Use:**
- Agent 2's mock data (`services/api/mocks/`)
- Tailwind CSS + Material Design 3 system
- Storybook for component isolation

**Components to Build:**

```typescript
// Dashboard Components
├── OrderStatusWidget          // Shows order counts by status
├── RevenueChart              // Daily/weekly revenue
├── NotificationCenter        // System notifications
├── QuickActionPanel          // Common actions
└── MachineStatusBoard        // Machine indicators

// Job Manager Components
├── KanbanBoard               // 6-column workflow
├── JobCard                   // Individual job display
├── JobDetailsPanel           // Full job information
├── FileUploadZone            // Drag-drop for designs
└── JobTimeline               // Gantt chart view

// Quote/Portal Components
├── QuoteRequestForm          // Generate quote form
├── QuoteDisplay              // Show quote results
├── CustomerLoginForm         // Authentication
├── OrderHistoryList          // Customer's orders
└── ProfileManager            // Account settings

// Shared Components
├── Header                    // Navigation + logo
├── Sidebar                   // Menu navigation
├── DataTable                 // Reusable table
├── SearchBar                 // Global search
└── AlertBanner               // Error/success messages
```

**Success Criteria:**
- ✅ All components render with mock data
- ✅ Forms validate user input
- ✅ Navigation between pages works
- ✅ Mobile responsive (3 breakpoints)
- ✅ Storybook stories for all components
- ✅ Lighthouse score > 90

**Deliverable:**
```
frontend/
├── src/components/           ← 20+ components built
├── src/pages/               ← 5 main pages
├── src/stories/             ← Storybook stories
└── src/styles/              ← Tailwind config
```

---

### 🔗 PHASE 2: Integrate Real APIs (Start After Task 1.2 Complete - 12-24 hours)

**Prerequisites:**
- Task 1.2 MUST be complete (Strapi schema created)
- Strapi collections: Order, Quote, Customer, Product

**What You're Connecting:**
```
Dashboard
  ├─ GET /api/orders?status=in-progress
  ├─ GET /api/orders/summary/by-status
  └─ GET /api/analytics/revenue

Job Manager
  ├─ GET /api/orders (all jobs)
  ├─ PATCH /api/orders/{id}/status (drag-drop)
  └─ GET /api/orders/{id} (details)

Quote Portal
  ├─ POST /api/quotes (generate)
  ├─ GET /api/customer/quotes
  └─ POST /api/quotes/{id}/approve

Authentication
  ├─ POST /api/auth/login
  ├─ POST /api/auth/register
  └─ GET /api/auth/me
```

**What Changes in Code:**
```typescript
// PHASE 1 (Mock):
import { mockOrderData } from '@/mocks/strapi-responses';
const orders = mockOrderData;

// PHASE 2 (Real API):
const orders = await fetchOrders();  // Calls real backend
```

**Success Criteria:**
- ✅ All API calls working
- ✅ Data flows from Strapi to UI
- ✅ CRUD operations functional
- ✅ JWT token handling
- ✅ Error boundaries show errors
- ✅ Loading states show spinners

**Deliverable:**
```
services/api.ts              ← HTTP client with all endpoints
hooks/useOrders.ts          ← Custom hook for order data
hooks/useAuth.ts            ← Authentication hook
context/AuthContext.ts      ← JWT token management
```

---

### ✨ PHASE 3: Advanced Features (After Batch 2 Complete - 12-24 hours)

**Prerequisites:**
- Phase 2 integration complete
- Task 3.1 (WebSocket) available
- Task 3.3 (Analytics) available

**What You're Adding:**

**Real-Time Features:**
```typescript
// WebSocket Connection
socket.on('order:status-changed', (data) => {
  updateKanbanBoard(data);  // Real-time Kanban updates
});

socket.on('order:created', (data) => {
  addNotification(`New order: ${data.order_number}`);
});
```

**Advanced Dashboard:**
- Real-time order updates (no refresh needed)
- Live machine status indicators
- Automated notifications
- Performance metrics streaming

**Analytics Dashboard:**
```typescript
// New endpoints available
GET /api/analytics/revenue?period=daily
GET /api/analytics/products?top=10
GET /api/analytics/customers?top=10
GET /api/analytics/orders?status=breakdown
```

**Supplier Product Search:**
```typescript
// After Task 2.2 + 2.3 complete
GET /api/suppliers/products
GET /api/products/{sku}/pricing
```

**Success Criteria:**
- ✅ WebSocket connections stable
- ✅ Real-time updates working
- ✅ Analytics dashboard populated
- ✅ Product search functional
- ✅ Cache hits > 80%
- ✅ Performance optimized

**Deliverable:**
```
hooks/useWebSocket.ts        ← WebSocket management
components/Analytics/        ← Dashboard pages
services/analytics.ts        ← Analytics API service
```

---

## 📊 Architecture Diagram: What Connects Where

```
┌─────────────────────────────────────────────────────────────┐
│                   SPARK FRONTEND                             │
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │  Dashboard      │  │ Job Manager  │  │   Portal    │    │
│  │  (Real-time)    │  │ (Kanban)     │  │ (Quotes)    │    │
│  └────────┬────────┘  └──────┬───────┘  └──────┬──────┘    │
│           │                  │                 │             │
│           └──────────────────┼─────────────────┘             │
│                              │                               │
│                    REST + WebSocket                          │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼─────┐  ┌────────────▼───┐  ┌──────────────▼──┐
│   Strapi     │  │ API Service    │  │ Job Estimator   │
│   (1337)     │  │ (3002)         │  │ (3001)          │
│              │  │                │  │ Pricing Logic   │
│ ├─ Auth      │  │ ├─ Quote API   │  │                 │
│ ├─ Orders    │  │ ├─ Order API   │  │ Task 2.1        │
│ ├─ Quotes    │  │ └─ Portal API  │  │ (Coming)        │
│ └─ Customers │  │   Tasks        │  │                 │
│              │  │   1.1, 2.1,    │  │                 │
│ PostgreSQL   │  │   2.4          │  │                 │
│ (5432)       │  │                │  │                 │
└──────────────┘  └────────────────┘  └─────────────────┘

                    ┌────────────────┐
                    │  Redis Cache   │
                    │  (6379)        │
                    │ Task 2.3       │
                    └────────────────┘
```

---

## ⏱️ Timeline: How Long Each Phase Takes

| Phase | Duration | Start | Dependencies |
|-------|----------|-------|---|
| Phase 1: UI Components | 24-36 hrs | NOW ✅ | None (use mocks) |
| Phase 2: Real APIs | 12-24 hrs | When Task 1.2 ✅ | Strapi schema |
| Phase 3: Advanced | 12-24 hrs | When Batch 2 ✅ | WebSocket + Analytics |
| **TOTAL** | **48-84 hrs** | **NOW** | **Parallel agent work** |

### Recommended Schedule

```
WEEK 1 (Nov 23-24)
├─ Phase 1 Components: Parallel with agent work
├─ Agents: Tasks 1.1, 1.2, 2.2 in progress
└─ You: Build & test with mock data

WEEK 1 (Nov 24-25) - Phase 1 Continues
├─ Agents: Complete Batch 1 (Tasks 1.1, 1.2, 2.2)
├─ Database: Strapi schema ready
└─ You: Final component polish + Storybook

WEEK 2 (Nov 26-27) - Phase 2 Integration
├─ Agents: Deploy Batch 2 (Tasks 1.3, 2.1, 2.3, 2.4)
├─ APIs: Real endpoints available
└─ You: Integrate real backend data

WEEK 2 (Nov 28-29) - Phase 2 Continues
├─ Agents: Complete Batch 2
├─ Testing: Full integration testing
└─ You: Polish + performance optimization

WEEK 3 (Nov 30) - Phase 3 Advanced
├─ Agents: Deploy Batch 3 (Tasks 3.1, 3.2, 3.3)
├─ WebSocket: Real-time ready
└─ You: Advanced features + analytics

WEEK 3 (Dec 1-2) - Production Ready
├─ Testing: Full E2E testing
├─ Performance: Optimization complete
└─ Deployment: Ready for production
```

---

## 🔧 Configuration Quick Reference

### Frontend .env Setup (You'll Create)

```bash
# Copy this to frontend/.env.example → .env

# API Endpoints
VITE_API_URL=http://localhost:3002
VITE_STRAPI_URL=http://localhost:1337
VITE_WS_URL=ws://localhost:3004

# JWT Storage
VITE_JWT_STORAGE_KEY=printshop_auth_token

# Feature Flags
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ADVANCED_PRICING=true
VITE_ENABLE_SUPPLIER_SYNC=true
VITE_ENABLE_ANALYTICS=true

# File Upload
VITE_MAX_FILE_SIZE=52428800        # 50MB
VITE_ALLOWED_FILE_TYPES=pdf,jpg,png,ai,eps,cdr

# Debugging
VITE_DEBUG=false
```

### Backend .env (Already Configured)

Located at: `/printshop-os/.env`

Services already configured:
- ✅ PostgreSQL connection
- ✅ Strapi JWT secrets
- ✅ Redis connection
- ✅ API service ports

---

## ✅ Pre-Development Checklist

Before you start building, verify:

- [ ] Read `BACKEND_BRAIN_STATUS.md`
- [ ] Read `SPARK_FRONTEND_TECHNICAL_BRIEF.md`
- [ ] Docker services running (`docker-compose ps`)
- [ ] Strapi accessible at `http://localhost:1337/admin`
- [ ] PostgreSQL connected (check Strapi admin)
- [ ] Mock data files found in `services/api/mocks/`
- [ ] Agent tasks assigned (issues #89, #91, #92)
- [ ] GitHub repository cloned and up-to-date

**All set?** ➡️ Start Phase 1 UI Component Development!

---

## 🎯 Key Success Metrics

### Phase 1 Success:
- ✅ 20+ components built
- ✅ All pages render correctly
- ✅ Mobile responsive
- ✅ Storybook working

### Phase 2 Success:
- ✅ All API calls working
- ✅ Data flows end-to-end
- ✅ Authentication functional
- ✅ CRUD operations working

### Phase 3 Success:
- ✅ Real-time updates working
- ✅ WebSocket stable connection
- ✅ Analytics dashboard populated
- ✅ Performance optimized

### MVP Launch Success:
- ✅ All phases complete
- ✅ No mock data remaining
- ✅ Production deployment ready
- ✅ Security audit passed

---

## 🚨 If Something Goes Wrong

### Backend Not Responding

```bash
# Check if services are running
docker-compose ps

# Start them if needed
docker-compose up -d

# Check Strapi logs
docker-compose logs strapi | tail -20
```

### Agent Task Not Completing

```bash
# Check GitHub issue status
gh issue view 89   # Task 1.1
gh issue view 91   # Task 1.2
gh issue view 92   # Task 2.2

# Check pull requests
gh pr list --search "is:open"
```

### API Endpoint Not Available Yet

- Check: `BACKEND_BRAIN_STATUS.md` → "Current Limitations" section
- Use: Mock data from `services/api/mocks/` instead
- Switch: Automatically when API ready (see Phase 2 code pattern)

### Data Not Persisting to Strapi

```bash
# Verify PostgreSQL connected
docker-compose logs postgres

# Check Strapi schema creation
docker-compose exec strapi npm run migrate:status

# Manually create test data
curl -X POST http://localhost:1337/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"name": "Test"}'
```

---

## 📞 Questions About Specific Areas

### Frontend Architecture Questions
→ See: `FRONTEND_INTEGRATION_STRATEGY.md` sections 1-2

### API Integration Questions
→ See: `SPARK_FRONTEND_TECHNICAL_BRIEF.md` sections 1-5

### Backend Component Questions
→ See: `BACKEND_BRAIN_STATUS.md` sections 1-4

### Mock Data Questions
→ See: `services/api/mocks/*.ts` files

### Pricing Logic Questions
→ See: `services/job-estimator/tests/advanced-pricing.test.ts`

---

## 🎬 Ready to Start?

1. **Open:** `docs/BACKEND_BRAIN_STATUS.md` (5 min overview)
2. **Reference:** `docs/SPARK_FRONTEND_TECHNICAL_BRIEF.md` (API guide)
3. **Create:** `frontend/` directory with React/TypeScript setup
4. **Import:** Mock data from `services/api/mocks/`
5. **Build:** Phase 1 components (24-36 hours)
6. **Wait:** Agents complete Task 1.2
7. **Integrate:** Real APIs (Phase 2)
8. **Deploy:** Production MVP

**Timeline:** Complete in 60-84 hours (1-2 weeks with parallel agent work)

---

**Last Updated:** November 23, 2025  
**Kept Up-To-Date:** As agents complete tasks  
**Questions?** Refer to linked documentation files above
