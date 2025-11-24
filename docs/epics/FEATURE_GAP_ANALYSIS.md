# Feature Gap Analysis & Implementation Plan

**Date:** November 23, 2025
**Status:** Draft

## 1. Overview
This document outlines the implementation plan for three key features identified as gaps between the legacy Printavo system/PowerApp experiments and the new PrintShop OS:
1.  **Custom Job Statuses & Automations**
2.  **Job Label Printing (4x6)**
3.  **Production Specs (Digital Run Sheet)**

---

## 2. Job Statuses & Automations

### The Problem
The current system relies on Printavo's default statuses. The user requires custom statuses (e.g., "Ready for Pickup", "Art Approved") that may not exist in Printavo or need to trigger specific internal workflows (emails, notifications) which Printavo doesn't handle flexibly enough.

### Proposed Solution

#### A. Database Schema (Strapi)
We will extend the `Order` collection or create a separate `OrderStatus` configuration collection to manage these states.

**Option 1: Hardcoded Enum (Simpler, faster)**
Update `services/api/lib/strapi-schema.ts` to include new statuses:
```typescript
export enum OrderStatus {
  // ... existing
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  ART_APPROVED = 'ART_APPROVED',
  SCREENS_BURNED = 'SCREENS_BURNED',
  // ...
}
```

**Option 2: Dynamic Status Collection (Flexible)**
Create a `JobStatus` collection in Strapi:
- `name` (Text)
- `color` (Color picker)
- `triggersEmail` (Boolean)
- `emailTemplate` (Relation to EmailTemplate)

#### B. Automation Engine
We will leverage the existing **Bull Queue** architecture.
1.  **Trigger:** When an Order is updated in Strapi (via Webhook or Lifecycle hook).
2.  **Process:** A worker listens for status changes.
3.  **Action:** If status == `READY_FOR_PICKUP`, send email to customer using `Nodemailer`.

### Implementation Steps
- [ ] Define complete list of desired statuses.
- [ ] Update Strapi `Order` content type.
- [ ] Create email templates for notifications.
- [ ] Implement `onStatusChange` listener in the API service.

---

## 3. Job Label Printing (4x6)

### The Problem
Production teams need to print 4x6 labels for boxes containing:
- Customer Name
- Job ID / Nickname
- Key Details (Qty, Size)
- QR Code (optional, for scanning)

### Proposed Solution

#### A. Frontend Component
Create a dedicated **Print Layout** component in the Frontend (`frontend/src/components/print/JobLabel.tsx`).

```tsx
export const JobLabel = ({ job }) => (
  <div className="w-[4in] h-[6in] flex flex-col p-4 border-2 border-black">
    <h1 className="text-2xl font-bold">{job.customer.name}</h1>
    <div className="text-4xl font-black my-4">#{job.printavoId}</div>
    <div className="text-lg">{job.orderNickname}</div>
    {/* ... details ... */}
  </div>
);
```

#### B. Print Trigger
Add a "Print Label" button in the Job Detail view.
- Uses `window.print()` with a specific CSS media query `@media print` to hide the UI and only show the label.
- Configured for standard 4x6 thermal printers (Zebra, Dymo, Rollo).

### Implementation Steps
- [ ] Design Label UI in React.
- [ ] Add "Print Label" button to Dashboard.
- [ ] Test with standard 4x6 printer settings.

---

## 4. Production Specs (PowerApp Replacement)

### The Problem
The user previously attempted to use a PowerApp to log "Production Specs" — granular details about *how* a job was produced (e.g., "Used 160 mesh screen", "Print sequence: White Underbase -> Flash -> Red -> Black", "Added 2% reducer to ink"). This is effectively a **Digital Run Sheet**.

### Proposed Solution
We will build this directly into PrintShop OS as a first-class citizen, replacing the messy PowerApp.

#### A. Database Schema (Strapi)
Create a new Component `ProductionSpecs` attached to the `Order` or `LineItem` content type.

**Fields:**
- `printSequence` (Rich Text or JSON): Ordered list of screens/colors.
- `meshCounts` (JSON): e.g., `{"White": 160, "Red": 230}`.
- `dryerSettings` (JSON): e.g., `{"temp": 320, "speed": 25}`.
- `modifications` (Rich Text): Notes on last-minute changes.
- `operator` (Relation): User who ran the job.

#### B. UI Implementation (Frontend)
Add a "Production" tab to the Job Detail view.
- **Run Sheet Form:** Simple inputs for operators to log data.
- **History:** View specs from previous runs of the same design (crucial for reorders).

### Implementation Steps
- [ ] Create `ProductionSpec` component in Strapi.
- [ ] Add "Production" tab to Job Dashboard.
- [ ] Implement "Duplicate Specs" feature for reorders.

---

## 5. Summary of Work
This plan integrates the missing features directly into the core platform, eliminating the need for external tools like PowerApps or manual label creation.

**Next Action:** Approval of this plan to proceed with implementation.

---

## 6. Time Clock & Reporting

### The Problem
The current system relies on Microsoft Teams for time tracking, which produces "terrible" and "overkill" reports. The user manually calculates payroll from these exports.
**Goal:** A simple "Clock In / Clock Out" system with a weekly summary email.

### Proposed Solution

#### A. Database Schema (Strapi)
Create a `TimeEntry` collection.
- `employee` (Relation to Employee/User)
- `clockIn` (DateTime)
- `clockOut` (DateTime)
- `durationMinutes` (Number, calculated)
- `type` (Enum: "SHIFT", "BREAK", "LUNCH")

#### B. UI Implementation (Frontend)
1.  **Time Clock Widget:**
    - A simple, always-visible widget in the Dashboard sidebar or header.
    - Big "Clock In" button (turns green).
    - Big "Clock Out" button (turns red).
    - Status indicator: "You are currently clocked in (3h 15m)".

2.  **Admin Reporting View:**
    - Date Range Picker (defaults to current week).
    - Table showing: Employee Name | Total Hours | Days Worked.
    - "Export to CSV" button (simple format).

#### C. Weekly Email Automation
Leverage the **Bull Queue** scheduler (Cron job).
1.  **Schedule:** Every Friday at 6:00 PM.
2.  **Action:**
    - Query `TimeEntry` for the current week.
    - Aggregate total hours per employee.
    - Generate HTML email table.
    - Send to Admin email via `Nodemailer`.

### Implementation Steps
- [ ] Create `TimeEntry` collection in Strapi.
- [ ] Build Time Clock widget in React.
- [ ] Implement `calculateWeeklyTotals` service.
- [ ] Configure Friday 6PM Cron job for email summary.

---

## 7. Marketing Website Assets (Consolidated)

### Overview
We have ingested legacy assets from the "MP Web" folder. These map directly to the **Marketing Website Epic** (`docs/MARKETING_WEBSITE_EPIC.md`).

### Asset Mapping
| Legacy Folder/File | Maps To Epic Feature | Location in Repo |
|-------------------|----------------------|------------------|
| `25.03 web About us` | Sub-Task 2: Brand Storytelling | `docs/reference/legacy_web_assets/` |
| `25.04 web embroidery` | Sub-Task 3: Service Pages | `docs/reference/legacy_web_assets/` |
| `25.06 web Screen printing` | Sub-Task 3: Service Pages | `docs/reference/legacy_web_assets/` |
| `Onboarding.numbers` | Customer Portal Epic | `docs/reference/legacy_planning/` |
| `Garment variants.numbers` | Product Catalog (Phase 1) | `docs/reference/legacy_planning/` |

**Action:** Use these assets when building the respective pages in the Marketing Website Epic.

---

## 8. Outsourced Product Catalog (3rd Party Vendors)

### The Problem
The shop sells items they don't produce in-house (e.g., promotional products, specific garment types) but currently lacks a structured way to manage these 3rd party vendors and their catalogs.

### Proposed Solution

#### A. Database Schema (Strapi)
Create a `Vendor` and `OutsourcedProduct` collection.
- **Vendor:** Name, Contact Info, Website, PDF Catalog (media relation).
- **OutsourcedProduct:** Name, Vendor (relation), Cost, Markup, MOQ (Minimum Order Qty).

#### B. UI Implementation
- **Vendor Directory:** A simple list view of approved 3rd party vendors.
- **Catalog Viewer:** Embedded PDF viewer for the catalogs (e.g., `Merch Plug Vendor rolodex.pdf`, `SJJ Catalog.pdf`).
- **Ordering Workflow:** When adding a line item to a Quote, allow selecting "Source: Outsourced" -> Select Vendor -> Select Product.

### Implementation Steps
- [ ] Create `Vendor` collection in Strapi.
- [ ] Upload existing catalogs (`docs/reference/vendors/`) to Strapi Media Library.
- [ ] Build "Vendor Directory" page in Dashboard.



