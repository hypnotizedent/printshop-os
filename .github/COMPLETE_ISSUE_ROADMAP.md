# PrintShop OS - Complete Issue Roadmap

**All 70 GitHub issues organized by milestone with descriptions, acceptance criteria, and effort estimates.**

---

## 📋 Issues by Milestone

### MILESTONE 1: SALES & QUOTING (10 Issues)

#### Issue #1: Phase 3: Customer Order Intake Proof-of-Concept (Botpress)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Description:** Validate conversational order intake and data sync to Strapi
- **Acceptance Criteria:**
  - Botpress project created
  - Chat flow collects: Customer Name, Email, Quantity
  - Data POSTs to Strapi (create Customer, create Job)

#### Issue #7: Production Gatekeeping: Prevent Jobs from Starting Without Required Assets
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Related:** #22-24 (SOP checklist)

#### Issue #13: Feature: CRM Module to Track Client Value, Repeat Orders, and Tags
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Related:** #18-21 (CRM features)

#### Issue #14: Visual quote format with customer mockups
- **Type:** Enhancement
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Design and build visual quote template with embedded product mockups
- **Priority:** High
- **Acceptance Criteria:**
  - Quote displays product images with customer's design
  - Mockup shows exact garment, colors, print placement
  - Mobile-responsive layout
  - PDF export with mockup

#### Issue #15: Retainer/card storage + auto-recharge capability
- **Type:** Enhancement
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Sales & Quoting
- **Description:** Store customer payment methods and enable recurring charges
- **Priority:** High
- **Acceptance Criteria:**
  - Stripe payment method storage via Strapi
  - Auto-charge when job created
  - Customer can manage saved cards in portal
  - Retry logic for failed charges

#### Issue #16: Mobile-friendly quote approval experience
- **Type:** Enhancement
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Optimize quote viewing and approval flow for mobile devices
- **Priority:** High
- **Acceptance Criteria:**
  - Quote mockup displays well on mobile
  - Easy approve/reject buttons
  - Signature capture (optional)
  - Works iOS and Android

#### Issue #17: Quote template library + customization
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Create reusable quote templates for different product types
- **Priority:** Medium
- **Acceptance Criteria:**
  - Templates for: t-shirt, hoodie, embroidery, bundles
  - Custom fields per template
  - Brand logo/colors in templates
  - Easy template selection during quoting

#### Issue #41: Pricing engine architecture (JSON/DB-driven)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Sales & Quoting
- **Description:** Build core pricing calculation engine
- **Priority:** Critical
- **Acceptance Criteria:**
  - Base garment cost lookup
  - Print location surcharges
  - Color count pricing
  - Stitch count pricing (embroidery)
  - Add-ons (shipping, rush, etc.)
  - Bundle discounts
  - Volume discounts
  - Margin calculation

#### Issue #42: Bundle/marketing package pricing logic
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Support combo pricing and seasonal marketing packages
- **Priority:** High
- **Acceptance Criteria:**
  - Combo packages (e.g., 50 shirts + 50 hoodies = discount)
  - Seasonal bundles
  - Auto-calculate bundle discounts
  - Marketing package templates

#### Issue #43: Deposit collection from quotes (Stripe)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Enable customers to pay deposit from quote
- **Priority:** High
- **Acceptance Criteria:**
  - Stripe payment form in quote
  - Configurable deposit %
  - Payment confirmation email
  - Deposit tracked in Strapi
  - Remaining balance shown in order

#### Issue #44: Quote → Order → Production Job mapping workflow
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Sales & Quoting
- **Description:** Automatically create order and production job from approved quote
- **Priority:** Critical
- **Acceptance Criteria:**
  - Approve quote → creates Order in Strapi
  - Order → creates Production Job
  - Job has quote mockup and notes
  - Tracks quote → order link
  - Job available in dashboard (#22-24)

#### Issue #45: Email quote delivery + approval workflow
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Sales & Quoting
- **Description:** Email quotes to customers with approve/reject links
- **Priority:** Medium
- **Acceptance Criteria:**
  - Beautiful email template
  - Direct approve link (no login)
  - Expiration date on link
  - Rejection reason capture
  - Follow-up reminder email

---

### MILESTONE 2: PRODUCTION & OPERATIONS (9 Issues)

#### Issue #2: Phase 1: Setup Strapi Project and Data Models
- **Type:** Chore
- **Status:** Backlog
- **Effort:** Large

#### Issue #8: Assign Team Roles and Ownership Per Job
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium

#### Issue #9: Time Tracking: Per-Job Clock-In System for Press Operators
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium

#### Issue #22: Press-ready checklist (mockups, ink, garments, notes)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Production & Operations
- **Description:** Build pre-production checklist system for press team
- **Priority:** High
- **Acceptance Criteria:**
  - Checklist template with: mockup review, ink colors, garment receipt, notes
  - Checkbox completion tracking
  - Photo upload for verification
  - Team member sign-off
  - Blocks job start until complete

#### Issue #23: SOP library + documentation built into dashboard
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Production & Operations
- **Description:** Create searchable SOP documentation accessible from dashboard
- **Priority:** High
- **Acceptance Criteria:**
  - SOP library organized by process (screen printing, DTG, embroidery, finishing)
  - Markdown with images/videos
  - Quick search from dashboard
  - Context-aware SOP suggestions per job type
  - Version control for SOPs

#### Issue #24: Admin view of time tracking logs + team productivity metrics
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Production & Operations
- **Description:** Dashboard showing who worked when and productivity metrics
- **Priority:** Medium
- **Acceptance Criteria:**
  - View team time logs
  - Productivity metrics (jobs/hour, output quality)
  - Bottleneck identification
  - Team member performance trends
  - Export reports

#### Issue #30: Mobile views for press team (job today, time clock, mockup viewer)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Production & Operations, Customer Portal & Mobile
- **Description:** Mobile-optimized views for press operators
- **Priority:** High
- **Acceptance Criteria:**
  - Today's jobs list (priority ordered)
  - One-tap time clock in/out
  - Mockup viewer (large, zoomable)
  - Job notes/special instructions
  - Quick job status update

#### Issue #31: Supervisor mobile dashboard (status change log, bottleneck tracking)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Production & Operations, Customer Portal & Mobile
- **Description:** Mobile supervisor view for real-time production oversight
- **Priority:** High
- **Acceptance Criteria:**
  - Real-time job status updates
  - Bottleneck alerts (job stuck > 2 hours)
  - Team member activity view
  - Quick decision buttons (escalate, reassign, etc.)
  - Notification push alerts

---

### MILESTONE 3: CRM & CLIENT MANAGEMENT (4 Issues)

#### Issue #3: Phase 2: Build Internal Production Dashboard (Appsmith)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

#### Issue #18: Client login portal (Strapi auth + Botpress integration)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** CRM & Client Management, Customer Portal & Mobile
- **Description:** Build customer login portal with Strapi authentication
- **Priority:** Critical
- **Acceptance Criteria:**
  - Signup/login with email
  - Strapi auth integration
  - Session management
  - Forgot password flow
  - Email verification

#### Issue #19: Client job history + reorder button
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** CRM & Client Management, Customer Portal & Mobile
- **Description:** Show customers their past jobs and enable easy reordering
- **Priority:** High
- **Acceptance Criteria:**
  - Display all past jobs with dates
  - Filter by product type, date range
  - "Reorder" button pulls quote
  - Reorder pre-fills garment/design details
  - Discount for repeat orders

#### Issue #20: Upcoming quote approvals dashboard
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** CRM & Client Management, Customer Portal & Mobile
- **Description:** Show pending quotes awaiting customer approval
- **Priority:** Medium
- **Acceptance Criteria:**
  - List pending quotes
  - Days pending indicator
  - Quick approve/request changes buttons
  - Notification if quote >5 days old

#### Issue #21: Client tagging system (nonprofit, monthly, VIP, late-pay)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** CRM & Client Management
- **Description:** Tag customers for different business rules and marketing
- **Priority:** Medium
- **Acceptance Criteria:**
  - Tag types: nonprofit (discount), monthly (recurring), VIP, late-pay
  - Custom tags support
  - Auto-apply rules (e.g., nonprofit tag = 10% discount)
  - Tag-based reporting
  - Bulk tagging

---

### MILESTONE 4: FINANCE & INVOICING (4 Issues)

#### Issue #4: Phase 2: Build Internal Production Dashboard (Appsmith)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

#### Issue #10: Enable Easy Job Reordering via Job Duplication
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small

#### Issue #12: Feature: Visual Quote & Invoice Generator with Mockups
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

#### Issue #13: Feature: CRM Module to Track Client Value, Repeat Orders, and Tags
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

---

### MILESTONE 5: AUTOMATION & INTEGRATION (18 Issues)

#### Issue #5: Phase 2: Build Internal Production Dashboard (Appsmith)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

#### Issue #11: Feature: Customer Portal for Orders, Approvals, and Reorders
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large

#### Issue #25: S&S, AS Colour, SanMar API auto-sync
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration, Supplier & Product Data
- **Description:** Auto-sync supplier catalogs

#### Issue #26: Style/garment linking to jobs (with size/color variants)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #27: Blank availability notifications + inventory alerts
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #28: n8n workflow for feedback requests (post-completion)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration

#### Issue #29: n8n workflow for "need help reordering?" + referral rewards
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration

#### Issue #46: S&S Activewear API integration
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration, Supplier & Product Data
- **Description:** Integrate S&S Activewear API for product sync
- **Priority:** High
- **Acceptance Criteria:**
  - API authentication working
  - Product catalog sync daily
  - Price updates
  - Inventory levels sync
  - Error handling

#### Issue #47: AS Colour API integration
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #48: SanMar API integration (plan + setup)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #49: Supplier data normalization layer
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #50: Inventory sync + update frequency strategy
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #51: Product variant system (size/color/fabric)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #52: Caching strategy for supplier APIs (Redis/local)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #53: Fallback/graceful degradation when APIs down
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** Automation & Integration, Supplier & Product Data

#### Issue #67: n8n workflow engine + Microsoft 365 integration
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Automation & Integration

#### Issue #68: n8n workflow: Customer communication pipelines
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration

#### Issue #69: n8n workflow: Financial report generation
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration

#### Issue #70: n8n workflow: Customer lifecycle automation
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Automation & Integration

---

### MILESTONE 6: CUSTOMER PORTAL & MOBILE (9 Issues)

*Issues covered above: #6, #18-20, #30-31, #54-58*

---

### MILESTONE 7: MARKETING & CONTENT SITE (9 Issues)

#### Issue #32: Information architecture for mintprints.com
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Marketing & Content Site
- **Description:** Define site structure and information hierarchy
- **Priority:** High
- **Acceptance Criteria:**
  - Wireframes for all main pages
  - Navigation structure defined
  - Content outline per page
  - Mobile layout planning
  - SEO structure planned

#### Issue #33: Brand storytelling pages
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Marketing & Content Site
- **Description:** Pages highlighting Mint Prints brand and values

#### Issue #34: Process/education pages (screen printing, embroidery, DTG, finishing)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Marketing & Content Site

#### Issue #35: Bundles/marketing packages pages
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Marketing & Content Site

#### Issue #36: Portfolio/case studies section
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Marketing & Content Site

#### Issue #37: Email campaign system (templates, scheduling, tracking)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** Marketing & Content Site

#### Issue #38: SEO optimization + sitemap
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** Marketing & Content Site

#### Issue #39: Blog/content management system
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** Marketing & Content Site

#### Issue #40: Analytics dashboard (site traffic + conversions)
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** Marketing & Content Site

---

### MILESTONE 8: SUPPLIER & PRODUCT DATA (13 Issues)

*Issues covered above: #46-58*

---

### MILESTONE 9: AI & INTELLIGENCE LAYER (8 Issues)

#### Issue #59: Local AI stack decision (Ollama vs Mistral vs LLaMA 3)
- **Type:** Chore
- **Status:** Backlog
- **Effort:** Small
- **Milestone:** AI & Intelligence Layer

#### Issue #60: Per-task assistant architecture
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** AI & Intelligence Layer

#### Issue #61: LLM container/VM templates
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** AI & Intelligence Layer

#### Issue #62: Prompt management system
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** AI & Intelligence Layer

#### Issue #63: Embeddings + vector DB for RAG
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Large
- **Milestone:** AI & Intelligence Layer

#### Issue #64: Per-task assistant #1: Marketing/content generation
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** AI & Intelligence Layer

#### Issue #65: Per-task assistant #2: Financial analysis
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** AI & Intelligence Layer

#### Issue #66: Per-task assistant #3: Customer service automation
- **Type:** Feature
- **Status:** Backlog
- **Effort:** Medium
- **Milestone:** AI & Intelligence Layer

---

## 📊 Summary

- **Total Issues:** 70
- **Total Milestones:** 9
- **Avg Issues/Milestone:** ~7.8
- **Total Effort:** Estimated 200+ developer weeks

