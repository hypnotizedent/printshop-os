# Data Flow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Printavo Orders                           │
│  (API, JSON File, Webhook, Database Export)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Printavo Batch Importer (batch-import.ts)          │
│                                                                  │
│  • Load from file or array                                      │
│  • Process in configurable batches (default 1000)              │
│  • Duplicate detection                                          │
│  • Error recovery & retry logic                                 │
│  • Session tracking                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Printavo to Strapi Mapper (printavo-mapper.ts)          │
│                                                                  │
│  Individual Transformation Functions:                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ mapOrderStatus()      - Map 11 status values            │   │
│  │ normalizeState()      - State name/code normalization   │   │
│  │ convertAddress()      - Transform address format        │   │
│  │ convertCustomer()     - Validate & map customer         │   │
│  │ convertLineItem()     - Calculate line item totals      │   │
│  │ calculateTotals()     - Aggregate financial data        │   │
│  │ convertTimeline()     - Map all date fields             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Main Functions:                                                │
│  transformPrintavoToStrapi()     - Single order (with validation)
│  transformPrintavoOrdersBatch()  - Multiple orders              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          Strapi Schema & Validation (strapi-schema.ts)          │
│                                                                  │
│  Type Definitions:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ StrapiOrder          - Main order document               │   │
│  │ StrapiCustomer       - Customer data                     │   │
│  │ StrapiAddress        - Billing/Shipping addresses        │   │
│  │ StrapiLineItem       - Line item structure               │   │
│  │ StrapiTotals         - Financial summary                 │   │
│  │ StrapiTimeline       - Order timeline with dates         │   │
│  │ OrderStatus          - Enum (11 values)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Validation Functions:                                          │
│  validateStrapiOrder() - Complete order validation              │
│  validateAddress()     - Address structure validation           │
│  isValidEmail()        - Email format check                     │
│  isValidISODate()      - ISO date format check                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Transformed Strapi Orders                     │
│  (Ready for Database Import, API Endpoints, etc.)              │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Data Transformation Flow

```
PRINTAVO ORDER                          STRAPI ORDER
┌──────────────────────────┐           ┌──────────────────────────┐
│                          │           │                          │
│ id: 21199730             │──────────▶│ printavoId: "21199730"   │
│                          │           │                          │
│ customer: {              │           │ customer: {              │
│   full_name: "John Doe"  │──────────▶│   name: "John Doe"       │
│   email: "john@ex.com"   │──────────▶│   email: "john@ex.com"   │
│   company: "Acme"        │──────────▶│   company: "Acme"        │
│ }                        │           │ }                        │
│                          │           │                          │
│ order_addresses_attrs: [ │           │ billingAddress: {        │
│   {                      │  Extract  │   street: "123 Main",    │
│     name: "Cust Billing" │  by type  │   city: "Boston",        │
│     address1: "123 Main" │───────────▶│   state: "MA",           │
│     city: "Boston"       │           │   zip: "02101"           │
│     state: "Massachusetts"           │ }                        │
│     zip: "02101"         │           │                          │
│   },                     │           │ shippingAddress: {       │
│   {                      │           │   street: "456 Oak",     │
│     name: "Cust Shipping"│           │   city: "New York",      │
│     address1: "456 Oak"  │───────────▶│   state: "NY",           │
│     city: "New York"     │           │   zip: "10001"           │
│     state: "New York"    │           │ }                        │
│     zip: "10001"         │           │                          │
│   }                      │           │                          │
│ ]                        │           │ status: "quote",         │
│                          │           │                          │
│ orderstatus: {           │  Map to   │                          │
│   name: "QUOTE"          │  Enum     │ totals: {                │
│ }                        │───────────▶│   subtotal: 1000,        │
│                          │           │   tax: 100,              │
│ order_subtotal: 1000     │  Aggregate│   fees: 25,              │
│ sales_tax: 100           │  & calc   │   total: 1125,           │
│ order_fees: [{           │───────────▶│   paid: 500,             │
│   amount: 25             │           │   outstanding: 625       │
│ }]                       │           │ }                        │
│ order_total: 1125        │           │                          │
│ amount_paid: 500         │           │ lineItems: [             │
│ amount_outstanding: 625  │           │   {                      │
│                          │           │     id: "1",             │
│ lineitems_attrs: [{      │  Transform│     description: "Item",│
│   id: 1                  │───────────▶│     quantity: 10,        │
│   style_desc: "Item"     │           │     unitCost: 50,        │
│   total_quantities: 10   │           │     total: 500           │
│   unit_cost: 50          │           │   }                      │
│ }]                       │           │ ]                        │
│                          │           │                          │
│ created_at: "2025-..."   │  Preserve │ timeline: {              │
│ updated_at: "2025-..."   │  ISO dates│   createdAt: "2025...",  │
│ due_date: "2025-..."     │───────────▶│   updatedAt: "2025...",  │
│                          │           │   dueDate: "2025..."     │
│ order_nickname: "Order1" │  Optional │ }                        │
│ notes: "Special notes"   │───────────▶│                          │
│                          │           │ orderNickname: "Order1"  │
│                          │           │ notes: "Special notes"   │
│                          │           │                          │
│ approved: true           │───────────▶│ approved: true           │
│                          │           │ published: true          │
│                          │           │                          │
└──────────────────────────┘           └──────────────────────────┘

VALIDATION OCCURS AT EACH STEP
```

## Batch Processing Flow

```
INPUT: 5,000 Printavo Orders

         │
         ▼
┌─────────────────────────┐
│ Load & Validate         │
│ (5,000 orders)          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Batch 1 (1000)          │
├─────────────────────────┤
│ ✅ 950 successful       │
│ ❌ 40 errors            │
│ ⚠️ 10 duplicates        │
└────────┬────────────────┘
         │
         ├─▶ Save: batch-1-successful.json
         ├─▶ Save: batch-1-errors.json
         │
         ▼
┌─────────────────────────┐
│ Batch 2 (1000)          │
├─────────────────────────┤
│ ✅ 980 successful       │
│ ❌ 15 errors            │
│ ⚠️ 5 duplicates         │
└────────┬────────────────┘
         │
         ├─▶ Save: batch-2-successful.json
         ├─▶ Save: batch-2-errors.json
         │
         ▼
  ... (batches 3, 4, 5)
         │
         ▼
┌─────────────────────────────┐
│ SESSION COMPLETE            │
├─────────────────────────────┤
│ ✅ Total Successful: 4,890  │
│ ❌ Total Errors: 95         │
│ ⚠️ Total Duplicates: 15     │
│ Duration: 4.2 seconds       │
└────────┬────────────────────┘
         │
         └─▶ Save: session-summary-*.json
         └─▶ Save: import-*.log
         └─▶ Save: import-*-logs.json
```

## Error Handling & Recovery

```
INPUT ORDER
    │
    ▼
┌─────────────┐
│ Parse       │ No ─▶ Invalid JSON ─▶ SKIP
└────┬────────┘
     │ Yes
     ▼
┌─────────────┐
│ Validate    │ No ─▶ Missing required fields ─▶ ERROR
│ Required    │
│ Fields      │
└────┬────────┘
     │ Yes
     ▼
┌─────────────┐
│ Transform   │ Error ─▶ Invalid data ─▶ ERROR with context
│ Fields      │
└────┬────────┘
     │ Success
     ▼
┌─────────────┐
│ Validate    │ No ─▶ Validation failed ─▶ ERROR with details
│ Output      │
└────┬────────┘
     │ Yes
     ▼
✅ SUCCESS - SAVED TO OUTPUT
```

## Type Safety & Validation Chain

```
INPUT (Unknown Type)
         │
         ▼
┌────────────────────────────┐
│ Parse as PrintavoOrder     │
└────┬───────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ Validate printavoOrder     │ ◀─ Check required fields
└────┬───────────────────────┘     Check field types
     │
     ▼
┌────────────────────────────┐
│ Transform Fields           │ ◀─ mapOrderStatus()
│ (Type-safe functions)      │     normalizeState()
└────┬───────────────────────┘     convertCustomer()
     │                             convertAddress()
     ▼                             etc.
┌────────────────────────────┐
│ StrapiOrder (Typed)        │ ◀─ Full TypeScript inference
└────┬───────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ Validate StrapiOrder       │ ◀─ Final validation check
└────┬───────────────────────┘     All rules enforced
     │
     ▼
✅ OUTPUT (Guaranteed Valid StrapiOrder)
```

## Integration Points

```
┌─────────────────┐
│ Data Sources    │
├─────────────────┤
│ • Printavo API  │
│ • JSON File     │
│ • Webhook       │
│ • Database      │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Mapper │
    │ Logic  │
    └────┬───┘
         │
    ┌────┴─────┬──────────┬────────┐
    │           │          │        │
    ▼           ▼          ▼        ▼
┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐
│ Express │ │ Cron   │ │ CLI  │ │Queue │
│ Route   │ │ Job    │ │Script│ │Worker│
└─────────┘ └────────┘ └──────┘ └──────┘
    │           │          │        │
    └────┬──────┴──────┬───┴────┬───┘
         │             │        │
         ▼             ▼        ▼
    ┌────────────────────────────────┐
    │  Strapi Database / API / Cache │
    └────────────────────────────────┘
```

## Field Coverage Matrix

```
Printavo Fields (20+)              ▶ Strapi Fields

Customer Fields (6):
  ✅ full_name                     ▶ customer.name
  ✅ email                         ▶ customer.email
  ✅ company                       ▶ customer.company
  ✅ first_name                    ▶ customer.firstName
  ✅ last_name                     ▶ customer.lastName
  ✅ customer_id                   ▶ (archived)

Address Fields (9):
  ✅ address1                      ▶ street
  ✅ address2                      ▶ street2
  ✅ city                          ▶ city
  ✅ state/state_iso               ▶ state (normalized)
  ✅ zip                           ▶ zip
  ✅ country/country_iso           ▶ country
  ✅ name (type marker)            ▶ (used to extract)
  ✅ customer_name                 ▶ (informational)
  ✅ company_name                  ▶ (informational)

Line Item Fields (8):
  ✅ id                            ▶ lineItem.id
  ✅ style_description             ▶ lineItem.description
  ✅ total_quantities              ▶ lineItem.quantity
  ✅ unit_cost                     ▶ lineItem.unitCost
  ✅ taxable                       ▶ lineItem.taxable
  ✅ category                      ▶ lineItem.category
  ✅ (calculated: qty × cost)      ▶ lineItem.total
  ✅ goods_status/color/size_*     ▶ (optional context)

Financial Fields (7):
  ✅ order_subtotal                ▶ totals.subtotal
  ✅ sales_tax                     ▶ totals.tax
  ✅ discount                      ▶ totals.discount
  ✅ order_fees_attributes (sum)   ▶ totals.fees
  ✅ order_total                   ▶ totals.total
  ✅ amount_paid                   ▶ totals.amountPaid
  ✅ amount_outstanding            ▶ totals.amountOutstanding

Status Field (1):
  ✅ orderstatus.name              ▶ status (mapped enum)

Timeline Fields (5):
  ✅ created_at                    ▶ timeline.createdAt
  ✅ updated_at                    ▶ timeline.updatedAt
  ✅ due_date                      ▶ timeline.dueDate
  ✅ customer_due_date             ▶ timeline.customerDueDate
  ✅ payment_due_date              ▶ timeline.paymentDueDate

Metadata Fields (5):
  ✅ id                            ▶ printavoId
  ✅ order_nickname                ▶ orderNickname
  ✅ public_hash                   ▶ publicHash
  ✅ production_notes              ▶ productionNotes
  ✅ notes                         ▶ notes
  ✅ approved                      ▶ approved

TOTAL COVERAGE: 20+ Fields Mapped & Validated ✅
```

---

This architecture ensures reliable, type-safe data transformation from Printavo to Strapi with comprehensive error handling and batch processing capabilities.
