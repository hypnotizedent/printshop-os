# PrintShop OS - Service Directory

**Last Updated:** November 25, 2025

## Purpose

This document provides a precise map of where every component, service, and feature lives in the codebase. Use this to avoid creating duplicate files or searching aimlessly.

## Quick Reference

| What Are You Looking For? | Where Is It? |
|---------------------------|--------------|
| Production dashboard backend | `services/production-dashboard/` |
| Customer portal backend | `services/api/customer/` |
| Analytics & reporting | `services/api/analytics/` |
| AI quote optimizer | `services/customer-service-ai/` |
| Supplier data sync | `services/api/supplier-sync/` |
| Frontend components | `frontend/src/components/` |
| Strapi content types | `printshop-strapi/src/api/` |
| Database schema | `printshop-strapi/schema.sql` |
| Tests | `tests/` (integration) + service-specific |
| Docker configs | Root: `docker-compose.yml` |
| Documentation | Root: `*.md` (authoritative) |
| Data imports | `data/` |
| Scripts/automation | `scripts/` |

## Service Breakdown

### 1. Production Dashboard Service

**Location:** `services/production-dashboard/`

```
services/production-dashboard/
├── src/
│   ├── server.ts              # Main server + WebSocket
│   ├── routes/
│   │   ├── time-clock.ts     # Clock in/out endpoints
│   │   ├── jobs.ts           # Job tracking
│   │   ├── sops.ts           # SOP management
│   │   └── permissions.ts    # RBAC endpoints
│   ├── services/
│   │   ├── TimeClockService.ts
│   │   ├── JobService.ts
│   │   ├── SOPService.ts
│   │   └── PermissionService.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT validation
│   │   └── permissions.ts    # RBAC checks
│   └── types/
│       └── index.ts          # TypeScript types
├── tests/
│   ├── time-clock.test.ts    # 20 tests
│   ├── jobs.test.ts
│   ├── sops.test.ts          # 25 tests
│   └── permissions.test.ts   # 28 tests
├── package.json
├── tsconfig.json
└── README.md
```

**Responsibilities:**
- Production floor real-time dashboard
- Time clock with PIN authentication
- Job tracking and status management
- SOP library
- Role-based permissions
- WebSocket server for real-time updates

**API Endpoints:**
- `POST /api/production/time-clock/in` - Clock in
- `POST /api/production/time-clock/out` - Clock out
- `GET /api/production/queue` - Production queue
- `GET /api/production/sops` - SOP library
- `GET /api/production/permissions` - Check permissions

**WebSocket Events:**
- `employee:clocked-in` / `employee:clocked-out`
- `timer:update` / `timer:pause` / `timer:resume`
- `order:status_changed`

**Port:** 3000

---

### 2. Analytics Service

**Location:** `services/api/analytics/`

```
services/api/analytics/
├── src/
│   ├── routes/
│   │   ├── revenue.ts        # Revenue analytics
│   │   ├── products.ts       # Product performance
│   │   ├── customers.ts      # Customer insights
│   │   └── orders.ts         # Order metrics
│   ├── services/
│   │   ├── RevenueService.ts
│   │   ├── ProductService.ts
│   │   ├── CustomerService.ts
│   │   └── ExportService.ts  # CSV/PDF export
│   └── types/
│       └── analytics.types.ts
├── tests/
│   └── analytics.test.ts     # 24 tests
└── README.md
```

**Responsibilities:**
- Revenue analytics with forecasting
- Product performance tracking
- Customer lifetime value calculation
- Order metrics and KPIs
- Data export (CSV, PDF)
- Redis caching (15-60min TTL)

**API Endpoints:**
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/customers` - Customer insights
- `GET /api/analytics/orders` - Order metrics
- `POST /api/analytics/export` - Export data

**Port:** 3002

---

### 3. Customer Service AI

**Location:** `services/customer-service-ai/`

```
services/customer-service-ai/
├── src/
│   ├── index.ts              # Main entry
│   ├── services/
│   │   └── QuoteOptimizer.ts # AI quote optimizer
│   ├── types/
│   │   └── ai.types.ts
│   └── utils/
│       ├── openai-client.ts  # OpenAI integration
│       └── cost-calculator.ts
├── tests/
│   └── quote-optimizer.test.ts # 19 tests
├── scripts/
│   │   └── init_knowledge_base.py # Knowledge base ingestion
│   └── README.md
```

**Responsibilities:**
- AI-powered design analysis (OpenAI Vision)
- Quote optimization suggestions
- Print recommendation engine
- Issue detection (resolution, bleed, colors)
- Cost optimization

**API:**
- `createQuoteOptimizer()` - Initialize
- `optimizeQuote(designUrl, orderDetails)` - Analyze & optimize

**Performance:**
- Analysis time: <5 seconds
- Cost per analysis: ~$0.01
- Cache TTL: 1 hour

---

### 4. Supplier Sync Service

**Location:** `services/supplier-sync/` (TypeScript, Production)

**Status:**
- ✅ **AS Colour**: Production ready (522 products, REST API, 3,000+ lines docs)
- ✅ **SanMar**: Core complete (415K records, SFTP+CSV, 560 lines docs)
- ⏳ **S&S Activewear**: Pending

```
services/supplier-sync/
├── src/
│   ├── clients/
│   │   ├── as-colour.client.ts      # REST API client
│   │   ├── sanmar-sftp.client.ts    # SFTP download client
│   │   ├── sanmar.client.ts
│   │   └── ss-activewear.client.ts  # Planned
│   ├── transformers/
│   │   ├── as-colour.transformer.ts # REST → UnifiedProduct
│   │   ├── sanmar-csv.transformer.ts # CSV → UnifiedProduct
│   │   ├── sanmar.transformer.ts
│   │   └── ss-activewear.transformer.ts # Planned
│   ├── cli/
│   │   ├── sync-as-colour.ts        # CLI: AS Colour sync
│   │   ├── sync-sanmar.ts           # CLI: SanMar sync
│   │   └── sync-ss-activewear.ts    # Planned
│   ├── persistence/
│   │   └── productPersistence.ts    # JSONL storage
│   ├── cache/
│   │   └── cacheService.ts          # Redis caching
│   └── types/
│       └── product.ts               # UnifiedProduct schema
├── tests/
│   └── transformers/
│       └── __tests__/               # Transformer unit tests
├── docs/
│   ├── suppliers/
│   │   ├── ASCOLOUR.md              # 653 lines (complete)
│   │   └── SANMAR.md                # 560 lines (complete)
│   ├── COMPLETE_DOCUMENTATION.md
│   └── ADDING_NEW_SUPPLIER.md
├── data/
│   └── ascolour/
│       └── products.jsonl           # Persisted products
└── README.md
```

**Responsibilities:**
- Multi-supplier product catalog integration
- Data transformation to UnifiedProduct schema
- SFTP + REST API clients
- CSV parsing with error tolerance
- JSONL persistence (file-based storage)
- Redis caching (TTL strategy)
- CLI tools for manual/scheduled sync

**Integration Types:**
- **REST API**: AS Colour (paginated, bearer token auth)
- **SFTP + CSV**: SanMar (ZIP extraction, 42-field CSV format)
- **REST API**: S&S Activewear (planned)

**Data Flow:**
1. Download from supplier (API or SFTP)
2. Transform to UnifiedProduct schema
3. Persist to JSONL files
4. Cache in Redis (optional)

**Performance:**
- AS Colour: 522 products, ~5 sec full sync
- SanMar: 415,941 records, 10K → 61 products in 8 sec
- Memory: ~700-800 MB for full SanMar catalog

---

### 5. Customer Portal Service

**Location:** `services/api/customer/`

```
services/api/customer/
├── src/
│   ├── routes/
│   │   ├── orders.ts         # Order history
│   │   ├── tickets.ts        # Support tickets
│   │   ├── quotes.ts         # Quote management
│   │   └── invoices.ts       # Invoice/file downloads
│   ├── services/
│   │   ├── OrderService.ts
│   │   ├── TicketService.ts
│   │   └── QuoteService.ts
│   └── types/
│       └── customer.types.ts
├── tests/
│   ├── orders.test.ts        # 19 tests
│   └── tickets.test.ts       # 21 tests
└── README.md
```

**Responsibilities:**
- Customer order history
- Support ticket system
- Quote management
- Invoice/file downloads
- Account management

**API Endpoints:**
- `GET /api/customer/orders` - Order history
- `GET /api/customer/orders/:id` - Order details
- `POST /api/customer/tickets` - Create ticket
- `GET /api/customer/invoices/:id` - Download invoice

---

### 6. Label Formatter Service (Planned)

**Location:** `services/label-formatter/`

```
services/label-formatter/
├── src/
│   ├── api/
│   │   └── format-label.ts       # POST /api/labels/format
│   ├── processors/
│   │   ├── pdf-processor.ts      # Handle PDF inputs
│   │   ├── image-processor.ts    # Handle image inputs
│   │   └── rollo-formatter.ts    # Format for Rollo printer specs
│   ├── detectors/
│   │   ├── orientation.ts        # Auto-detect rotation needed
│   │   └── boundaries.ts         # Smart crop detection
│   └── utils/
│       └── print-optimize.ts     # Optimize for printing
├── tests/
│   └── label-formatter.test.ts
└── README.md
```

**Responsibilities:**
- Automated shipping label formatting
- PDF and image processing
- Auto-rotation and cropping
- Format conversion to 4x6 Rollo printer format
- Eliminate manual Photoshop workflow

**API Endpoints:**
- `POST /api/labels/format` - Upload and format label
- `GET /api/labels/:id` - Retrieve formatted label
- `GET /api/labels/history` - Label processing history

**Processing Features:**
- PDF parsing and extraction
- Auto-detect text orientation
- Smart boundary detection
- Resize to standard 4x6 format
- Batch processing support

**Port:** 3003 (planned)

**Status:** Issue #143 - Agent assigned, in planning

---

### 7. Strapi CMS

**Location:** `printshop-strapi/`

```
printshop-strapi/
├── src/
│   ├── api/                  # Content types
│   │   ├── order/
│   │   │   ├── content-types/
│   │   │   │   └── order/
│   │   │   │       └── schema.json
│   │   │   ├── controllers/
│   │   │   │   └── order.ts
│   │   │   ├── routes/
│   │   │   │   └── order.ts
│   │   │   └── services/
│   │   │       └── order.ts
│   │   ├── customer/
│   │   ├── product/
│   │   ├── employee/
│   │   ├── time-clock-entry/
│   │   ├── support-ticket/
│   │   └── sop/
│   ├── extensions/           # Strapi extensions
│   └── middlewares/          # Custom middleware
├── config/
│   ├── database.ts           # PostgreSQL config
│   ├── server.ts
│   └── plugins.ts
├── public/
│   └── uploads/              # File uploads
└── schema.sql                # Database schema
```

**Content Types (Main):**
- `order` - Customer orders
- `customer` - Customer accounts
- `product` - Product catalog
- `employee` - Staff management
- `time-clock-entry` - Time tracking
- `support-ticket` - Support tickets
- `sop` - Standard Operating Procedures

**Port:** 1337

---

### 7. Frontend Application

**Location:** `frontend/`

```
frontend/
├── src/
│   ├── components/
│   │   ├── production/       # Production dashboard UI
│   │   │   ├── TimeClock.tsx
│   │   │   ├── JobQueue.tsx
│   │   │   ├── SOPLibrary.tsx
│   │   │   └── ResourceMonitor.tsx
│   │   ├── portal/           # Customer portal UI
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   ├── SupportTickets.tsx
│   │   │   └── QuoteManager.tsx
│   │   ├── labels/           # Label formatter UI (planned)
│   │   │   ├── LabelUploader.tsx
│   │   │   ├── LabelPreview.tsx
│   │   │   └── LabelHistory.tsx
│   │   ├── analytics/        # Analytics dashboards
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── ProductMetrics.tsx
│   │   │   └── CustomerInsights.tsx
│   │   └── ui/               # Shared UI components (shadcn)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Production.tsx
│   │   ├── CustomerPortal.tsx
│   │   └── Analytics.tsx
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── websocket.ts      # WebSocket client
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useOrders.ts
│   └── types/
│       └── index.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

**Framework:** React 19 + TypeScript + Vite  
**UI:** Tailwind CSS + Radix UI + shadcn/ui  
**Port:** 5173 (dev)

---

## Data Files

**Location:** `data/`

```
data/
├── products/                 # Product data
│   ├── ss-activewear.json
│   ├── sanmar.json
│   └── as-colour.json
├── processed/                # Normalized data
│   └── normalized-products.json
├── raw/                      # Raw supplier exports
├── strapi-imports/           # Strapi import files
├── intelligence/             # AI Knowledge Base
│   ├── knowledge_base/       # Markdown-based training data
│   │   ├── general/          # FAQs, generic docs
│   │   ├── operational/      # Supplier logic, shipping rules
│   │   ├── technical/        # Artwork guidelines, mockups
│   │   ├── case_studies/     # Real-world examples
│   │   └── email_history/    # Ingested email training data
│   └── vector_store/         # ChromaDB persistence (gitignored)
├── assets/                   # Customer Asset Vault (CDP)
│   └── {customer_id}/        # Organized by customer

```

**Purpose:**
- Store supplier data exports
- Normalized product catalogs
- Import files for Strapi
- AI training data (planned)

---

## Scripts

**Location:** `scripts/`

```
scripts/
├── import-products.js        # Import products to Strapi
├── sync-suppliers.js         # Run supplier sync
├── generate-test-data.js     # Create test fixtures
├── backup-db.sh              # Database backup
└── deploy.sh                 # Deployment script
```

---

## Tests

**Location:** `tests/` (integration) + `services/*/tests/` (unit)

```
tests/
├── integration/
│   ├── order-flow.test.ts    # End-to-end order flow
│   ├── time-clock.test.ts    # Time clock integration
│   └── customer-portal.test.ts
└── fixtures/
    ├── orders.json
    ├── customers.json
    └── products.json
```

**Test Distribution:**
- Production Dashboard: 73+ tests
- Analytics: 24 tests
- AI Optimizer: 19 tests
- Supplier Sync: 49 tests (123 total)
- Customer Portal: 40 tests
- **Total:** 240+ tests

---

## Configuration Files

**Root Level:**

```
printshop-os/
├── docker-compose.yml        # Development environment
├── docker-compose.local.yml  # Local overrides
├── docker-compose.ai.yml     # AI services
├── .env.example              # Environment template
├── .gitignore
├── package.json              # Workspace root
├── tsconfig.json             # TypeScript config
└── jest.config.js            # Jest config
```

---

## Documentation Files (Root)

**Current & Authoritative:**
- `PROJECT_OVERVIEW.md` - Project introduction & status
- `ARCHITECTURE.md` - System design & data flow
- `SERVICE_DIRECTORY.md` - This file
- `DEVELOPMENT_GUIDE.md` - Setup & workflows
- `AGENT_PR_STATUS_REPORT.md` - Current PR status

**Strategic Planning:**
- `ROADMAP.md` - Long-term roadmap
- `ISSUES_ROADMAP.md` - Issue tracking strategy
- `NEXT_STEPS_STRATEGIC_ROADMAP.md` - Next priorities

**Epic Documentation (Historical Context):**
- `AI_AUTOMATION_EPIC.md`
- `CUSTOMER_PORTAL_EPIC.md`
- `PRICING_SYSTEM_EPIC.md`
- `PRODUCTION_DASHBOARD_EPIC.md`
- `SUPPLIER_INTEGRATION_EPIC.md`
- `MARKETING_WEBSITE_EPIC.md`

**Session Reports (Point-in-Time):**
- `SESSION_COMPLETION_REPORT.md`
- `SESSION_COMPLETION_SUMMARY.md`
- `SESSION_ENTERPRISE_CONSOLIDATION_SUMMARY.md`
- `SESSION_EPIC_CONSOLIDATION_FINAL.md`

**Legacy (Reference Only):**
- `docs/` folder - Being consolidated into root docs

---

## Common Tasks: Where to Look

### Adding a New Feature

| Feature Type | Where to Add It |
|-------------|-----------------|
| Production floor feature | `services/production-dashboard/` |
| Customer-facing feature | `services/api/customer/` |
| Analytics/reporting | `services/api/analytics/` |
| AI-powered feature | `services/customer-service-ai/` |
| Supplier integration | `services/api/supplier-sync/` |
| Label formatting/automation | `services/label-formatter/` |
| New data type | `printshop-strapi/src/api/` |
| Frontend component | `frontend/src/components/` |
| Frontend page | `frontend/src/pages/` |

### Modifying Existing Features

| What to Modify | Where to Find It |
|----------------|------------------|
| Time clock logic | `services/production-dashboard/src/services/TimeClockService.ts` |
| Order history | `services/api/customer/src/routes/orders.ts` |
| Analytics calculations | `services/api/analytics/src/services/` |
| AI quote logic | `services/customer-service-ai/src/services/QuoteOptimizer.ts` |
| Supplier API calls | `services/api/supplier-sync/src/suppliers/` |
| WebSocket events | `services/production-dashboard/src/server.ts` |
| Database schema | `printshop-strapi/src/api/*/content-types/*/schema.json` |

### Adding Tests

| Test Type | Where to Add |
|-----------|-------------|
| Service unit tests | Same folder as service: `services/*/tests/` |
| Integration tests | `tests/integration/` |
| Frontend tests | `frontend/src/components/__tests__/` |
| API endpoint tests | Same folder as routes: `services/*/tests/` |

### Configuration Changes

| Config Type | File Location |
|------------|---------------|
| Database connection | `printshop-strapi/config/database.ts` |
| Redis cache | Service-specific `.env` or `config/` |
| Environment variables | `.env` (create from `.env.example`) |
| Docker services | `docker-compose.yml` |
| TypeScript settings | Service-specific `tsconfig.json` |
| API ports | Service-specific `.env` or `server.ts` |

---

## Service Dependencies

### Dependency Map

```
Frontend
└── Depends on: All backend services via HTTP/WebSocket

Production Dashboard API
├── Depends on: Strapi CMS, Redis
└── Used by: Frontend, production floor devices

Analytics Service
├── Depends on: Strapi CMS, Redis
└── Used by: Frontend, admin users

Customer Service AI
├── Depends on: OpenAI API, Redis
└── Used by: Frontend, customer quotes

Supplier Sync Service
├── Depends on: Supplier APIs, Strapi CMS
└── Used by: Scheduled jobs, admin triggers

Strapi CMS
├── Depends on: PostgreSQL, Redis (optional)
└── Used by: All backend services, admin panel

PostgreSQL
├── Depends on: Nothing (base layer)
└── Used by: Strapi CMS

Redis
├── Depends on: Nothing (base layer)
└── Used by: All services (caching)
```

---

## File Naming Conventions

### Backend
- **Services:** `{Name}Service.ts` (PascalCase)
- **Routes:** `{entity}.ts` (kebab-case)
- **Tests:** `{name}.test.ts` (kebab-case)
- **Types:** `{name}.types.ts` (kebab-case)

### Frontend
- **Components:** `{Name}.tsx` (PascalCase)
- **Pages:** `{Name}.tsx` (PascalCase)
- **Hooks:** `use{Name}.ts` (camelCase)
- **Utils:** `{name}.ts` (kebab-case)

### Strapi
- **Content Types:** `{entity}/schema.json` (kebab-case folder)
- **Controllers:** `{entity}.ts` (kebab-case)
- **Services:** `{entity}.ts` (kebab-case)

---

## Port Assignments

| Service | Port | Protocol |
|---------|------|----------|
| Strapi CMS | 1337 | HTTP |
| Production Dashboard | 3000 | HTTP + WebSocket |
| Analytics API | 3002 | HTTP |
| Label Formatter | 3003 | HTTP (planned) |
| Frontend Dev Server | 5173 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |

---

## Important Notes

### DO NOT Create Files Here:
- ❌ `docs/` - Legacy, being phased out
- ❌ Root level service files - Use `services/` folders
- ❌ Duplicate documentation - One source of truth only

### ALWAYS Check Here First:
- ✅ `PROJECT_OVERVIEW.md` - Understand the project
- ✅ `ARCHITECTURE.md` - Understand the design
- ✅ This file (SERVICE_DIRECTORY.md) - Find the right location
- ✅ Existing service README files - Service-specific details

### Keeping This Document Updated:
- **When adding a service:** Update service breakdown section
- **When moving files:** Update all references
- **When changing structure:** Update directory trees
- **When adding features:** Update "Common Tasks" section

---

**Last Updated:** November 25, 2025  
**Maintained By:** Development team  
**Next Review:** When project structure changes

---

## Recent Updates

**November 25, 2025:**
- Updated Supplier Sync Service with SanMar completion status
- Added performance metrics (AS Colour: 522 products, SanMar: 415K records)
- Documented new TypeScript implementation location
- Added CLI tools and JSONL persistence details
