# Project Roadmap: Print Shop Operations Hub (Data-First Evolution)

**Last Updated:** November 25, 2024  
**Status:** Phase 2 Complete - Ready for Phase 3  
**Core Philosophy:** Import Data → Analyze/Enrich → Build App around Insights

## 🎯 Current Focus (November 25, 2024)

### ✅ Just Completed
1. **Flexible Pricing Engine** (PR #98) - Merged Nov 23
2. **Workflow Automation** (PR #99) - Merged Nov 23
3. **System Testing** - Validated all services Nov 25
4. **Git Branch Cleanup** - Removed 5 merged branches Nov 25
5. **Documentation Consolidation** - Streamlined to STATUS.md + ROADMAP.md

### 🚀 Next Priorities
Choose one of these ready-to-implement features:

1. **Customer Portal Dashboard** (Epic #87) - Customer self-service
2. **Supplier Integration System** (Epic #85) - Product/inventory sync
3. **AI Quote Optimizer** - Intelligent pricing recommendations

---

This document outlines the technical plan for building a custom digital operations hub.

## Core Architecture

1.  **Data Lake (FileSystem/Git)**: Raw and Processed JSON data from Printavo.
2.  **Intelligence Layer (Python/LLM)**: Scripts to generate summaries, financial reports, and vector embeddings.
3.  **Headless CMS (Strapi)**: The structured database for the application.
4.  **Internal Tool (Appsmith)**: Insight-driven dashboards.
5.  **Automation (Botpress)**: Context-aware agents.

---

## Phase 1: Data Foundation (COMPLETED ✅)

**Objective:** Secure and structure historical data to power the system.

*   **Step 1.1: Data Extraction** (Done)
    *   ✅ Connect to Printavo API.
    *   ✅ Export 12k+ orders and customer records.
    *   ✅ Establish "Raw" data layer (`data/raw`).

*   **Step 1.2: Transformation Pipeline** (Done)
    *   ✅ Map Printavo statuses to Strapi workflow.
    *   ✅ Create ETL scripts (`scripts/transform/`).
    *   ✅ Establish "Processed" data layer (`data/processed`).

*   **Step 1.3: Initial Intelligence** (Done)
    *   ✅ Generate Financial Summaries (`data/intelligence/context/financial_summary.md`).
    *   ✅ Identify Top Customers (`data/intelligence/context/top_customers.csv`).

---

## Phase 2: Customer Portal + Data Intelligence Foundation

**Objective**: Dual focus on customer-facing design portal AND refining data quality for AI/LLM consumption.

### Part 2A: Data Intelligence Engine (Data-First Approach)

**Goal:** Refine data quality and prepare it for AI/LLM consumption.

*   **Step 2A.1: Schema Refinement**
    *   Audit `data/processed` JSON against Strapi Content Types.
    *   Update Strapi schema to include rich fields (Production Notes, Tags, Payment Status).
    *   **Goal:** Ensure no data loss during import.

*   **Step 2A.2: Customer Unification (Golden Record)**
    *   Analyze `top_customers.csv` for duplicates.
    *   Implement a deduplication strategy (merge by email/name).
    *   **Goal:** Single view of the customer.

*   **Step 2A.3: Vector Context Store**
    *   ✅ Implement Milvus vector database (self-hosted, replacing Pinecone)
    *   Ingest `data/intelligence` summaries and recent order history.
    *   **Goal:** Enable Chatbots to answer "How much did Customer X spend last year?".
    *   **Cost Savings:** $0/month vs $70+/month for cloud vector DB

### Part 2B: Customer Portal & Design System (New)

**Objective**: Build customer-facing design/mockup portal with interactive canvas and quote generation.

*   **Step 2B.1: Setup Customer Portal Service** 
    *   Create new service: `services/customer-portal/`
    *   Integrate design canvas library (Fabric.js) for interactive mockups
    *   Implement shadcn-ui component library for consistent UI
    *   **Source**: Migrated from `custom-studio-app` repository
    *   **See**: `docs/CUSTOM_STUDIO_APP_INTEGRATION_STRATEGY.md`

*   **Step 2B.2: Create Design Canvas Component**
    *   Garment silhouette rendering (t-shirt, hoodie, tank-top, etc.)
    *   Interactive design placement and manipulation
    *   Real-time mockup preview
    *   Mobile-responsive interface

*   **Step 2B.3: Integrate with Pricing Engine**
    *   Connect `services/job-estimator/lib/pricing-engine.ts`
    *   Real-time price updates as design changes
    *   Quantity selector with volume discounts
    *   Add-ons and special services pricing

*   **Step 2B.4: Connect to Quote System**
    *   Design canvas → Strapi Job record (MockupImageURL)
    *   Quote generation with embedded mockups
    *   Approval workflow integration
    *   PDF export with mockup preview

*   **Step 2B.5: Authentication Integration**
    *   Strapi JWT authentication
    *   Customer login/signup flow
    *   Session persistence
    *   Account profile management

### Part 2C: Internal Production Dashboard (Appsmith)

**Objective**: Build simple, functional mobile interface for production team.

*   **Step 2C.1: Setup Appsmith and Connect to Strapi**
    *   Create a new application in Appsmith.
    *   Create a new Datasource, connecting to the Strapi API.

*   **Step 2C.2: Create Job List View**
    *   Display Jobs where Status = "In Production"
    *   Show MockupImageURL (as image), JobID, Customer.Name
    *   Enrich with customer insights from data intelligence layer

*   **Step 2C.3: Build Job Details Page**
    *   Show mockup, art file, colors, locations, quantity
    *   "Mark as Complete" button to update status
    *   Time clock integration for team tracking

---

## Phase 2B: EPIC - Pricing System (Issue #86)

**Status:** Epic #86 - Fully Documented  
**Timeline:** 4 weeks  
**Priority:** CRITICAL  
**Documentation:** See `PRICING_SYSTEM_EPIC.md` for complete details

### Overview
Build production-ready pricing engine with rule management that powers all quote generation, handles complex pricing scenarios (volume discounts, rush premiums, special services), and integrates with the supplier system.

### Sub-Tasks (9 executable items)
1. Core pricing engine (location surcharges, color count, stitch count)
2. Volume discount tiers & bundle pricing
3. Deposit & payment terms system
4. Pricing rule management interface
5. REST API for quote generation
6. Profitability tracking & margin analysis
7. Admin dashboard for rule management
8. Comprehensive testing & edge cases
9. Deployment & monitoring

### Key Metrics
| Metric | Target |
|--------|--------|
| Quote Accuracy | 100% matches manual calculations |
| API Response Time | <500ms |
| Rule Coverage | 99%+ of pricing scenarios |
| Margin Improvement | +3% over manual |
| Adoption | 100% of quotes |

---

## Phase 2C: EPIC - Marketing Website (Issue #87)

**Status:** Epic #87 - Fully Documented  
**Timeline:** 3-4 weeks  
**Priority:** HIGH  
**Documentation:** See `MARKETING_WEBSITE_EPIC.md` for complete details

### Overview
Professional marketing site (mintprints.com) for lead generation with service education pages, interactive pricing calculator, blog content strategy, and full SEO implementation.

### Sub-Tasks (11 executable items)
1. Information architecture & brand strategy
2. Storytelling/hero pages (home, about, values)
3. Service education pages (screen print, DTG, embroidery, finishing)
4. Portfolio/case studies showcase
5. Blog infrastructure & content strategy
6. Interactive pricing transparency calculator
7. Contact & lead capture forms
8. SEO implementation (meta tags, schema, sitemaps)
9. Analytics setup (Google Analytics 4, conversion tracking)
10. Product bundles & package pages
11. Performance optimization & testing

### Key Metrics
| Metric | Target |
|--------|--------|
| Page Load Time | <2.5 seconds |
| Mobile Adoption | 60%+ traffic |
| Lead Generation | 50+ qualified leads/month |
| SEO Ranking | Top 5 for target keywords |
| Conversion Rate | 3%+ contact form submissions |

---

## Phase 3B: EPIC - Supplier Integration System (Issue #85)

**Status:** Epic #85 - Fully Consolidated & Documented  
**Timeline:** 3-4 weeks (Weeks 7-10)  
**Priority:** High  
**Documentation:** See `SUPPLIER_INTEGRATION_EPIC.md` for complete details

### Overview
Consolidates all supplier-related work (previously issues #24-68) into a single, executable supplier integration system that syncs product data, pricing, inventory, and handles caching, normalization, and graceful degradation.

### Architecture
```
Supplier APIs (S&S, AS Colour, SanMar)
         ↓
Normalization Layer (unified schema)
         ↓
Caching Layer (Redis - TTL strategy)
         ↓
Strapi Database (products, variants, prices, inventory)
         ↓
Applications (Quote UI, Pricing Engine, Dashboard)
```

### Sub-Tasks (11 executable items)

**Infrastructure (Week 1-2):**
1. Supplier data normalization layer
2. Data transformation service (S&S, AS Colour, SanMar)
3. Redis caching strategy (~$500/month savings)
4. Graceful degradation & error handling

**Integrations (Week 3-4):**
5. S&S Activewear API integration
6. AS Colour API integration
7. SanMar OAuth + API integration

**Features (Week 4):**
8. Product variants system (size/color/fabric)
9. Real-time inventory sync strategy

**Deployment (Week 4+):**
10. Comprehensive testing (unit/integration/load)
11. Monitoring & alerting setup

### Key Metrics
| Metric | Target |
|--------|--------|
| Sync Reliability | >99% success rate |
| Cache Hit Rate | >80% |
| API Response Time | <500ms cached / <2s live |
| Cost Savings | $500/month reduction |
| Fallback Success | 100% graceful degradation |

### Dependencies
- Depends on: Phase 1 (Strapi), Phase 2 (Core Sales)
- Enables: Accurate quoting, supplier selection, inventory visibility

---

## Phase 3: EPIC - Production Dashboard (Issue #86)

**Status:** Epic #86 - Fully Documented  
**Timeline:** 3-4 weeks  
**Priority:** HIGH  
**Documentation:** See `PRODUCTION_DASHBOARD_EPIC.md` for complete details

### Overview
Mobile-first internal dashboard for production team enabling real-time job visibility, time tracking, quality checklists, SOP access, supervisor oversight, and productivity analytics.

### Sub-Tasks (9 executable items)
1. Job Queue Dashboard (priority ordered view)
2. Time Clock & Job Details
3. Press-Ready Checklist
4. SOP Library & Documentation
5. Team Productivity Metrics
6. Supervisor Mobile Dashboard
7. Historical Analytics
8. Role-Based Permissions
9. Mobile Optimization & Testing

### Key Metrics
| Metric | Target |
|--------|--------|
| Load Time | <2 seconds on 4G |
| Uptime | 99.9% |
| Team Adoption | 100% daily usage |
| Defect Reduction | 95% fewer checklist misses |
| Quality Improvement | 10% fewer defects |

---

## Phase 3: EPIC - Customer Portal (Issue #87)

**Status:** Epic #87 - Fully Documented  
**Timeline:** 3-4 weeks  
**Priority:** CRITICAL  
**Documentation:** See `CUSTOMER_PORTAL_EPIC.md` for complete details

### Overview
Customer self-service portal enabling secure login, order history, reorder functionality, quote approval, real-time job tracking, billing, and support ticketing.

### Sub-Tasks (10 executable items)
1. User Authentication & Registration (2FA)
2. Dashboard & Navigation
3. Order History & Details
4. Quote Approval Workflow
5. Reorder & Quick Repeat
6. Real-Time Job Tracking
7. Billing & Invoice Management
8. Account Settings & Profile
9. Support Ticketing System
10. Advanced Analytics (optional)

### Key Metrics
| Metric | Target |
|--------|--------|
| Login Success Rate | 99.9% |
| Quote Approval Time | <48 hours average |
| Reorder Adoption | 40% of customers |
| Support Ticket Reduction | 60% fewer |
| Payment Success | 98% first attempt |

---

## Phase 4: EPIC - AI & Automation (Issue #88)

**Status:** Epic #88 - Fully Documented  
**Timeline:** 5-6 weeks  
**Priority:** MEDIUM  
**Documentation:** See `AI_AUTOMATION_EPIC.md` for complete details

### Overview
AI-powered automation including intelligent workflow orchestration (n8n), design metadata extraction, customer chatbot, smart pricing, demand forecasting, quality control AI, document processing, and supplier enrichment.

### Sub-Tasks (10 executable items)
1. ✅ AI/ML Stack Setup (OpenAI, Milvus, n8n) - Milvus replaces Pinecone for $0/month self-hosted
2. Retrieval-Augmented Generation (RAG) System
3. Customer Inquiry Chatbot
4. Design Analysis AI (Computer Vision)
5. Smart Pricing AI (ML Model)
6. n8n Workflow Orchestration
7. Document Processing & Data Extraction
8. Demand Forecasting
9. Quality Control AI (Computer Vision)
10. Analytics Dashboard & KPIs

### Vector Database (Milvus)
Self-hosted Milvus replaces cloud vector databases (Pinecone) for significant cost savings:
- **Collections:** designs, customers, orders, knowledge_base
- **Use Cases:** Semantic search, RAG, design similarity, customer intelligence
- **Cost:** $0/month (vs $70+/month for Pinecone)
- **Documentation:** `docs/VECTOR_DATABASE.md`

### Key Metrics
| Metric | Target |
|--------|--------|
| Support Response Time | <2 min (70% AI-handled) |
| Quote Turnaround | +40% faster |
| Manual Data Entry | -80% (50 hrs/month saved) |
| Pricing Margin | +3% improvement |
| Production Defects | 50% reduction |
| ROI | <1 month payback |

---

## Phase 3: The Active Dashboard (Appsmith)

**Objective:** Build interfaces that show *insights*, not just rows of data.

*   **Step 3.1: Admin/Sales Dashboard**
    *   Display "Projected Revenue" vs "Actual".
    *   Show "At-Risk Customers" (from Intelligence layer).
    *   View Order History with calculated Lifetime Value.

*   **Step 3.2: Production Dashboard**
    *   (Original Scope) Kanban/List view for "In Production" jobs.
    *   Enrich with "Customer Frequency" (e.g., "This is a VIP customer").

---

## Phase 4: Context-Aware Automation (Botpress)

**Objective:** Agents that know the business context.

*   **Step 4.1: Contextual FAQ**
    *   Bot can query the Vector Store for company policies or past order details.

*   **Step 4.2: Proactive Sales**
    *   Agent identifies customers due for re-orders (based on Phase 2 analysis).
    *   Drafts outreach messages for human review.