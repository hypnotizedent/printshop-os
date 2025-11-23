# Project Roadmap: Print Shop Operations Hub (Data-First Evolution)

This document outlines the technical plan for building a custom digital operations hub.
**Status:** Pivot to "Data-First" Strategy (November 2025).
**Core Philosophy:** Import Data → Analyze/Enrich → Build App around Insights.

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
    *   Implement a vector database (e.g., Pinecone or local pgvector).
    *   Ingest `data/intelligence` summaries and recent order history.
    *   **Goal:** Enable Chatbots to answer "How much did Customer X spend last year?".

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