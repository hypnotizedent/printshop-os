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

## Phase 2: The Intelligence Engine (CURRENT FOCUS 🚧)

**Objective:** Refine data quality and prepare it for AI/LLM consumption.

*   **Step 2.1: Schema Refinement**
    *   Audit `data/processed` JSON against Strapi Content Types.
    *   Update Strapi schema to include rich fields (Production Notes, Tags, Payment Status).
    *   **Goal:** Ensure no data loss during import.

*   **Step 2.2: Customer Unification (Golden Record)**
    *   Analyze `top_customers.csv` for duplicates.
    *   Implement a deduplication strategy (merge by email/name).
    *   **Goal:** Single view of the customer.

*   **Step 2.3: Vector Context Store**
    *   Implement a vector database (e.g., Pinecone or local pgvector).
    *   Ingest `data/intelligence` summaries and recent order history.
    *   **Goal:** Enable Chatbots to answer "How much did Customer X spend last year?".

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