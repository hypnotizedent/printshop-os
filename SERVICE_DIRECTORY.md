# PrintShop OS - Service Directory

**Last Updated:** November 28, 2025

---

## 🚀 Homelab Deployment

**Status:** ✅ PRODUCTION READY - Frontend + API + All Data Deployed

### Running Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **React Frontend** | 3000 | http://docker-host:3000 | ✅ Running |
| **Strapi CMS** | 1337 | http://docker-host:1337 | ✅ Running (v5.31.2) |
| **PostgreSQL** | 5432 | Internal | ✅ Healthy |
| **Redis** | 6379 | Internal | ✅ Healthy |
| **Inventory API** | 3002 | http://docker-host:3002 | ✅ Running |
| **MinIO** | 9000-9001 | http://docker-host:9001 | ✅ Running |
| **Traefik** | 80/443 | http://docker-host:8080 | ✅ Running |

### HTTPS URLs (Traefik + Cloudflare)
- **Frontend:** https://app.printshop.ronny.works
- **API/Admin:** https://printshop.ronny.works

### Data Counts (Verified Nov 27, 2025)
- **Orders:** 12,854
- **Customers:** 3,317
- **Line Items:** 49,216
- **Products:** 710

---

## Session Summary (Nov 26-28, 2025)

### Completed ✅
- Full Printavo data export and import
- AS Colour dual authentication (JWT + Subscription-Key)
- Inventory API deployed on port 3002
- **Frontend built and deployed** (React + Vite)
- Traefik SSL configured for HTTPS
- Docker-compose updated for homelab
- Documentation consolidated (HLBPA style)

### Key Technical Fixes
1. **AS Colour Auth:** Required both Subscription-Key header AND JWT Bearer token
2. **Port Conflict:** Inventory API moved to 3002 (uptime-kuma uses 3001)
3. **Docker Compose:** Removed deprecated `version` field, cleaned up unused services
4. **Artwork in Git:** Added to .gitignore (16GB - stored in MinIO, not Git)

---

## Quick Commands

```bash
# SSH to docker-host
ssh docker-host

# Container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test inventory API
curl http://docker-host:3002/health
curl http://docker-host:3002/api/inventory/check/5001

# View logs
docker logs printshop-strapi --tail 50 -f
```

---

## Service Structure
- ✅ **COMPLETE Printavo API extraction** - ALL accessible data exported:
  - **12,867 orders** (61 MB) with 44,158 embedded line items (23 MB)
  - **3,358 customers** (3.8 MB)
  - **1,463 tasks**, 297 expenses, 105 products, 25 statuses
  - Categories, delivery methods, payment terms, inquiries, users
- ✅ **V2 GraphQL API tested** - Schema accessible but data queries return "Unauthorized"
- ✅ **Comprehensive API documentation created**: `docs/reference/PRINTAVO_API.md`
  - All V1 endpoints documented with fields and examples
  - V2 GraphQL schema introspection results
  - Field mapping to Strapi content types
- ⚠️ **Imprints NOT accessible** - V1 `/lineitemgroups` returns 500, V2 unauthorized
- 📁 **Export location**: `data/raw/printavo-exports/complete_2025-11-27_14-20-05/`

### Session 11 Notes (Nov 27, 2025)
- ✅ Admin account created and operational
- ✅ API token generated for imports
- ✅ **FULL Printavo data import complete (deduplicated):**
  - **3,317 customers** (all with valid emails)
  - **12,854 orders** (entire order history - all years)
  - Duplicates cleaned: 2,485 customers + 1,331 orders removed
  - Status mapping: QUOTE, COMPLETE, PAYMENT_NEEDED, INVOICE_PAID, etc.
- ✅ Repository audit complete - 26 stale branches deleted
- ✅ Root docs consolidated to 10 files (HLBPA compliant)

### Infrastructure Tools (Same Host)

| Tool | URL | Purpose |
|------|-----|---------|
| Uptime Kuma | http://100.92.156.118:3001 | Monitoring |
| Dozzle | http://100.92.156.118:9999 | Docker logs |
| Traefik | http://100.92.156.118:8080 | Reverse proxy |
| MinIO | http://100.92.156.118:9001 | S3 storage |
| Ntfy | http://100.92.156.118:8088 | Notifications |

### Deployment Commands

```bash
# Deploy/redeploy
./scripts/deploy-to-homelab.sh

# View logs
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose logs -f strapi'

# Check status
ssh docker-host 'docker ps | grep printshop'

# Restart a service
ssh docker-host 'cd ~/stacks/printshop-os && docker-compose restart strapi'
```

### Next Steps After Deployment

1. **Create Strapi Admin Account**
   - Visit http://100.92.156.118:1337/admin
   - Create first admin user

2. **Add to Uptime Kuma**
   - Add monitor for Strapi: `http://printshop-strapi:1337`
   - Add monitor for Postgres: `tcp://printshop-postgres:5432`

3. **Configure Traefik (Optional)**
   - Add labels to printshop containers for domain routing
   - Set up SSL with Let's Encrypt

4. **Import Production Data** ✅ COMPLETE
   - 5,802 customers imported
   - 14,185 orders imported (full history)
   - Script: `scripts/import-all-orders.py`

---

## Purpose

This document provides a precise map of where every component, service, and feature lives in the codebase. Use this to avoid creating duplicate files or searching aimlessly.

## Recent Updates

### November 27, 2025 (Business Services Stack)

✅ **Self-Hosted Business Services Added**
- Created `docker-compose.business-services.yml` with 5 services
- Invoice Ninja (port 9000) - Invoicing, payments, quotes
- n8n (port 5678) - Workflow automation
- Paperless-ngx (port 8010) - Document management with OCR
- Penpot (port 9001) - Design collaboration
- Vaultwarden (port 8222) - Password management
- Updated `.env.example` with all service configurations
- Created `docs/BUSINESS_SERVICES.md` documentation

### November 27, 2025 (Session 10 - Supplier Sync & Deployment)

✅ **Strapi Production Deployment**
- Deployed Strapi 5.31.2 Enterprise to docker-host (100.92.156.118)
- Fixed AI SDK package conflicts (removed `ai`, `@ai-sdk/*` causing zod/v4 errors)
- Fixed `payment/routes/payment.ts` malformed TypeScript
- PostgreSQL 15 + Redis 7 containers running
- **Blocker:** Vite host restriction prevents Tailscale access - needs on-site setup

✅ **ALL 3 Supplier APIs Verified Working (Nov 27 Evening)**
- **AS Colour:** 522 products, REST API with dual auth (Subscription-Key + Bearer JWT)
- **S&S Activewear:** 211K+ products, REST API with Basic Auth
- **SanMar:** 415K+ records, SFTP verified, 494MB EPDD.csv ready for download

✅ **Supplier Sync Documentation (HLBPA Pattern)**
- Created `services/supplier-sync/docs/ARCHITECTURE_OVERVIEW.md`
- Created `services/supplier-sync/docs/COMPLETION_CHECKLIST.md`
- Updated README with current status and quick links
- Fixed JSONL persistence to support per-supplier directories

✅ **Uptime Kuma Monitors Fixed**
- Ntfy: `/v1/health` → 🟢 Green
- Traefik: `/api/overview` → 🟢 Green
- Proxmox: HTTPS + ignore SSL → 🟢 Green
- PrintShop Strapi: Monitoring at 5.4%

✅ **Printavo Image Scrape Complete**
- 12,854 orders with scraped image URLs
- Saved to `data/processed/orders_with_images.json` (66MB)
- Resume-capable scraper worked as designed

### November 28, 2025 (Session 9 - Customer Journey Implementation)
✅ **Stripe Payment Integration**
- Created `services/api/src/payments/stripe.service.ts` - Full Stripe SDK integration
  - Payment intents, checkout sessions, deposits, refunds
  - Customer management, receipt URLs
- Created `services/api/src/payments/webhook.handler.ts` - Webhook processing
  - Payment succeeded/failed handlers
  - Automatic Strapi payment record updates

✅ **SendGrid Email Service**
- Created `services/api/src/email/sendgrid.service.ts` - Transactional emails
  - Quote emails with line items and approval links
  - Order confirmation and status updates
  - Payment receipts with styled HTML templates

✅ **Quote & Payment Content Types (Strapi)**
- Created `printshop-strapi/src/api/quote/` - Quote approval workflow
  - Full schema: lineItems, deposits, expiration, approval tokens
  - Public approval/reject endpoints (token-based, no auth)
  - Auto-generate quote numbers and tokens
- Created `printshop-strapi/src/api/payment/` - Payment tracking
  - Status tracking: pending → paid → refunded
  - Stripe integration fields: paymentIntentId, checkoutSessionId

✅ **Customer-Facing Pages (Frontend)**
- Created `frontend/src/pages/QuoteApproval.tsx` - Quote review & approval
  - Public page with token-based access
  - Mockup viewer, line item details, approval signature
  - Integrated payment buttons (deposit/full)
- Created `frontend/src/pages/OrderStatus.tsx` - Order tracking
  - Real-time status with progress steps
  - Tracking number integration (EasyPost)
  - Balance payment option

✅ **File Storage Service**
- Created `services/api/src/storage/file.service.ts` - S3/MinIO/local storage
  - Presigned upload/download URLs
  - Order-based file organization
  - Support for artwork, mockups, proofs, documents

✅ **Environment Configuration**
- Updated `printshop-strapi/.env.example` with all integration variables
  - PostgreSQL config for production
  - Stripe, SendGrid, S3, Twilio settings

### November 27, 2025 (Session 8 - Priority Features)
✅ **Priority 1: Quote Workflow UI**
- Created `frontend/src/components/quotes/QuoteForm.tsx` - Full quote creation form
  - Customer info, line items, print categories, location toggles
  - Price calculation logic (volume discounts, location surcharges)
  - Saves to Strapi with QUOTE/QUOTE_SENT status

✅ **Priority 2: Product Catalog UI**
- Created `frontend/src/components/products/ProductCatalog.tsx` - Product browsing
  - Fetches from `/api/products` (supplier SKUs)
  - Filters: search, brand, category, supplier, color
  - Product detail dialog with variant info

✅ **Priority 3: Shipping Labels UI**
- Created `frontend/src/components/shipping/ShippingLabelForm.tsx` - Shipping labels
  - From/To address forms with state dropdowns
  - Package dimensions with preset box sizes
  - Rate shopping (simulated EasyPost integration)
  - Label purchase and print/download

✅ **App Routing & Navigation**
- Updated `App.tsx` with new routes: quotes, products, shipping
- Updated `AppSidebar.tsx` with Quotes, Products, Shipping nav items

### November 26, 2025 (Session 7 - Phase 2 & 3 Implementation)
✅ **PHASE 2 COMPLETE: Schema Enhancement**
- Added payment fields to Order: `amountPaid`, `amountOutstanding`, `salesTax`, `discount`
- Added `productionNotes` and `customerPO` fields to Order
- Configured order status enumeration (QUOTE, QUOTE_SENT, QUOTE_APPROVED, IN_PRODUCTION, 
  COMPLETE, READY_FOR_PICKUP, PAYMENT_NEEDED, INVOICE_PAID, CANCELLED)

✅ **PHASE 3 COMPLETE: Strapi Auth Routes**
- Implemented `/api/auth/customer/login` (JWT with bcrypt)
- Implemented `/api/auth/customer/signup` (creates/activates customer)
- Implemented `/api/auth/employee/validate-pin` (PIN → JWT)
- Implemented `/api/auth/verify` (token verification)
- Updated frontend AuthContext for JWT token storage
- All auth endpoints tested and working

### November 26, 2025 (Session 6 - System Verification & Bug Fixes)
✅ **SYSTEM VERIFICATION COMPLETE**
- Verified Strapi 5.31.2 Enterprise operational (336 customers, 831 orders, 18 products)
- Fixed duplicate AuthContext.tsx (was 260+ lines with merged implementations)
- Fixed auth components (LoginForm, SignupForm, EmployeePINLogin) for boolean returns
- Fixed auth/index.ts (had markdown formatting in TypeScript file)
- Fixed duplicate OrderStatus type in lib/types.ts
- Validated HLBPA/Hashim Warren compliance (4 services, 10 root docs)
- All 10 Strapi content type APIs working

### November 26, 2025 (Session 5 - Phase 1 Implementation)
✅ **PHASE 1 COMPLETE: Customer & Employee Authentication**
- Implemented customer signup/login (`services/api/src/auth/customer-auth.ts`)
- Implemented employee PIN validation (`services/api/src/auth/employee-auth.ts`)
- Added TypeScript types (`services/api/src/auth/types/auth.types.ts`)
- Added 18 passing tests (12 customer + 6 employee)
- Updated customer schema with `passwordHash` field
- Next: Phase 2 - Quote workflow & order creation

## Quick Reference

| What Are You Looking For? | Where Is It? |
|---------------------------|--------------|
| Production dashboard backend | `services/production-dashboard/` |
| Customer portal backend | `services/api/customer/` |
| Analytics & reporting | `services/api/analytics/` |
| AI quote optimizer | `services/customer-service-ai/` |
| Supplier data sync | `services/supplier-sync/` |
| Vector database / embeddings | `services/vector-store/` |
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

### 7. Vector Store Service (Milvus)

**Location:** `services/vector-store/`

```
services/vector-store/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── client.ts                   # Milvus client wrapper
│   ├── collections/
│   │   ├── designs.ts              # Design embeddings collection
│   │   ├── customers.ts            # Customer embeddings collection
│   │   ├── orders.ts               # Order embeddings collection
│   │   └── knowledge-base.ts       # RAG knowledge base collection
│   ├── embeddings/
│   │   ├── openai.ts               # OpenAI embedding generator
│   │   └── types.ts                # Embedding types
│   ├── search/
│   │   ├── similarity.ts           # Similarity search functions
│   │   └── rag.ts                  # RAG retrieval functions
│   ├── scripts/
│   │   └── init-collections.ts     # Collection initialization
│   └── utils/
│       └── logger.ts               # Winston logger
├── tests/
│   └── vector-store.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Infrastructure:**

| Component | Port | Purpose |
|-----------|------|---------|
| Milvus | 19530 | Vector database (gRPC) |
| Milvus Metrics | 9091 | Health/metrics endpoint |
| Attu | 8001 | Web UI for management |
| etcd | 2379 | Milvus metadata storage |
| MinIO | 9010/9011 | Milvus object storage |

**Collections:**

| Collection | Purpose |
|------------|---------|
| `designs` | Design similarity search, mockup matching |
| `customers` | Customer intelligence, segmentation |
| `orders` | Order pattern matching, pricing insights |
| `knowledge_base` | RAG retrieval for chatbot context |

**Responsibilities:**
- Store and search vector embeddings
- Power semantic search across designs, customers, orders
- Enable RAG for customer service chatbot
- Find similar historical orders for pricing
- Generate embeddings via OpenAI API

**Key Functions:**
- `ensureCollection(name, dimension)` - Create collection if not exists
- `insertVectors(collection, records)` - Insert vectors with metadata
- `searchSimilar(collection, vector, topK)` - Vector similarity search
- `findSimilarDesigns(description)` - Find similar design mockups
- `retrieveRAGContext(query)` - Get context for LLM prompts

**Documentation:** `docs/VECTOR_DATABASE.md`

---

### 8. Strapi CMS

**Location:** `printshop-strapi/`  
**Status:** ✅ All APIs Operational (Fixed Nov 26, 2025)

```
printshop-strapi/
├── src/
│   ├── api/                  # Content types (ALL TYPESCRIPT)
│   │   ├── customer/
│   │   │   ├── content-types/customer/schema.json
│   │   │   ├── controllers/customer.ts   # ✅ TypeScript
│   │   │   ├── routes/customer.ts        # ✅ TypeScript
│   │   │   └── services/customer.ts      # ✅ TypeScript
│   │   ├── order/
│   │   │   ├── content-types/order/schema.json
│   │   │   ├── controllers/order.ts      # ✅ TypeScript
│   │   │   ├── routes/order.ts           # ✅ TypeScript
│   │   │   └── services/order.ts         # ✅ TypeScript
│   │   ├── job/
│   │   │   ├── content-types/job/schema.json
│   │   │   ├── controllers/job.ts        # ✅ TypeScript
│   │   │   ├── routes/job.ts             # ✅ TypeScript
│   │   │   └── services/job.ts           # ✅ TypeScript
│   │   ├── product/                      # ✅ Supplier Product Catalog
│   │   │   ├── content-types/product/schema.json
│   │   │   ├── controllers/product.ts
│   │   │   ├── routes/product.ts
│   │   │   └── services/product.ts
│   │   ├── color/
│   │   ├── sop/
│   │   ├── price-calculation/
│   │   └── pricing-rule/
│   ├── index.ts              # Bootstrap with auto-permissions
│   └── services/
│       └── notification.ts   # WebSocket service
├── config/
│   ├── database.ts           # SQLite (dev) / PostgreSQL (prod)
│   └── server.ts
└── .tmp/
    └── data.db               # SQLite database (dev)
```

**Content Types (All Working):**
| Content Type | API Endpoint | Status |
|-------------|--------------|--------|
| customer | `/api/customers` | ✅ 336 records |
| order | `/api/orders` | ✅ 831 records |
| job | `/api/jobs` | ✅ 200 |
| color | `/api/colors` | ✅ 200 |
| sop | `/api/sops` | ✅ 200 |
| price-calculation | `/api/price-calculations` | ✅ 200 |
| pricing-rule | `/api/pricing-rules` | ✅ 200 |
| product | `/api/products` | ✅ 18+ records (supplier SKUs) |
| employee | `/api/employees` | ✅ Production Dashboard |
| time-clock-entry | `/api/time-clock-entries` | ✅ Production Dashboard |

**IMPORTANT:** Strapi 5 requires TypeScript files. JavaScript files are NOT compiled.  
See: `docs/reference/STRAPI_TYPESCRIPT_API_FIX.md`

**Port:** 1337

---

### 9. Frontend Application

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
│   │   ├── quotes/           # Quote creation UI ✅ NEW
│   │   │   └── QuoteForm.tsx         # Full quote workflow
│   │   ├── products/         # Product catalog UI ✅ NEW
│   │   │   └── ProductCatalog.tsx    # Supplier SKU browsing
│   │   ├── shipping/         # Shipping labels UI ✅ NEW
│   │   │   └── ShippingLabelForm.tsx # EasyPost integration
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
**UI:** Tailwind CSS + Radix UI + shadcn/ui + Phosphor Icons  
**Port:** 5000 (dev)

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
- **Printavo exports** (12,867 orders, 3,358 customers, 44,158 line items)

---

## Documentation Reference

| Doc | Location | Description |
|-----|----------|-------------|
| Printavo API | `docs/reference/PRINTAVO_API.md` | V1/V2 API reference, field mapping |
| Strapi TypeScript Fix | `docs/reference/STRAPI_TYPESCRIPT_API_FIX.md` | Agent reference for Strapi 5 |
| Production Dashboard | `docs/PRODUCTION_DASHBOARD_ARCHITECTURE.md` | WebSocket + time clock design |
| Supplier Integration | `docs/SUPPLIER_INTEGRATION_READINESS.md` | AS Colour, SanMar, S&S status |

---

## Scripts

**Location:** `scripts/`

```
scripts/
├── import-products.js        # Import products to Strapi
├── sync-products-to-strapi.js # ✅ Sync supplier SKUs to Strapi Product API
├── sync-suppliers.js         # Run supplier sync
├── import-2025-customers.py  # ✅ Import 2025 Printavo customers
├── import-2025-customers.sh  # Shell wrapper for customer import
├── link-orders-customers.py  # ✅ Link orders to customer records
├── generate-test-data.js     # Create test fixtures
├── backup-db.sh              # Database backup
└── deploy.sh                 # Deployment script
```

**Key Import Scripts:**
- `sync-products-to-strapi.js` - Syncs supplier products (JSONL) to Strapi Product API
  - Usage: `node scripts/sync-products-to-strapi.js [--supplier sanmar|ascolour] [--limit N] [--dry-run]`
  - Source: `services/supplier-sync/data/ascolour/products.jsonl`
  - Transforms: variants, pricing, availability, images
- `import-2025-customers.py` - Imports 2025 Printavo customer data (335 customers)
- `link-orders-customers.py` - Links orders to customers via Printavo customer ID

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
| Supplier integration | `services/supplier-sync/` |
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
| Supplier API calls | `services/supplier-sync/src/clients/` |
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

## Business Services Stack

**Location:** `docker-compose.business-services.yml`  
**Documentation:** `docs/BUSINESS_SERVICES.md`  
**Status:** Ready for Deployment

Self-hosted business tools for payments, automation, documents, design, and password management.

| Service | Port | Purpose | Docker Image |
|---------|------|---------|--------------|
| **Invoice Ninja** | 9000 | Invoicing, Payments, Quotes | `invoiceninja/invoiceninja:5` |
| **n8n** | 5678 | Workflow Automation | `n8nio/n8n:latest` |
| **Paperless-ngx** | 8010 | Document Management, OCR | `ghcr.io/paperless-ngx/paperless-ngx:latest` |
| **Penpot** | 9001 | Design Collaboration | `penpotapp/frontend:latest` |
| **Vaultwarden** | 8222 | Password Management | `vaultwarden/server:latest` |

### Integration with Core Services

```
Strapi CMS ←→ n8n ←→ Invoice Ninja
                ↓
         Paperless-ngx (documents)
                ↓
         Penpot (designs)
```

### Key Workflows (n8n)
- Quote approved → Create Invoice Ninja draft
- Payment received → Update Strapi order status
- Document uploaded → OCR in Paperless-ngx → Tag and file

### Startup Commands

```bash
# Create required databases
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE n8n;"
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE paperless;"
docker exec -it printshop-postgres psql -U strapi -c "CREATE DATABASE penpot;"

# Start business services
docker compose -f docker-compose.business-services.yml up -d
```

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
| Invoice Ninja | 9000 | HTTP |
| n8n | 5678 | HTTP |
| Paperless-ngx | 8010 | HTTP |
| Penpot | 9001 | HTTP |
| Vaultwarden | 8222 | HTTP |

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

**Last Updated:** November 26, 2025  
**Maintained By:** Development team  
**Next Review:** When project structure changes

---

## Recent Updates

**November 26, 2025 (Session 4 - Gap Analysis):**
- ✅ Created comprehensive Printavo replacement plan
- ✅ Identified 3 critical gaps: Authentication, Quote Workflow, Order Creation
- ✅ 5-phase implementation strategy (22 days, 72+ tests)
- 📋 Next: Phase 1 - Customer & Employee Authentication

**November 26, 2025 (Session 3):**
- ✅ Created `employee` content type for Production Dashboard
- ✅ Created `time-clock-entry` content type for time tracking
- ✅ Added HLBPA-style architecture documentation: `docs/PRODUCTION_DASHBOARD_ARCHITECTURE.md`
- ✅ Created Mermaid diagrams in `docs/diagrams/`
- ✅ All 10 Strapi APIs now operational

**November 26, 2025 (Session 2):**
- ✅ Created Product content type for supplier SKU catalog
- ✅ Added `sync-products-to-strapi.js` script for supplier product sync
- ✅ Synced 18 supplier products (test run) with full variant/pricing data
- ✅ Imported 335 customers from 2025 Printavo data
- ✅ Imported 831 orders from 2025 Printavo data
- ✅ All 8 Strapi APIs now operational

**November 26, 2025:**
- ✅ Fixed all Strapi APIs (JS→TypeScript conversion)
- ✅ All 7 content types now operational: customer, order, job, color, sop, price-calculation, pricing-rule
- ✅ Public API permissions auto-enabled via bootstrap
- 📄 Added `docs/reference/STRAPI_TYPESCRIPT_API_FIX.md` for agent reference

**November 25, 2025:**
- Updated Supplier Sync Service with SanMar completion status
- Added performance metrics (AS Colour: 522 products, SanMar: 415K records)
- Documented new TypeScript implementation location
- Added CLI tools and JSONL persistence details
