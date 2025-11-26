# PrintShop OS - Minimum Viable Operations Gap Analysis

**Date:** November 26, 2025  
**Goal:** Cancel Printavo subscription and operate fully on PrintShop OS

---

## ✅ WORKING NOW

| Feature | Status | Notes |
|---------|--------|-------|
| Strapi CMS | ✅ Running | Port 1337, SQLite database |
| Customer API | ✅ Working | 338 customers imported |
| Order API | ✅ Working | Ready for data |
| Job API | ✅ Working | Ready for data |
| Color API | ✅ Working | Empty, needs data |
| SOP API | ✅ Working | Empty, needs data |
| Price Calculation API | ✅ Working | Empty |
| Pricing Rule API | ✅ Working | Empty |
| Admin UI | ✅ Working | http://localhost:1337/admin |

---

## 🔶 MINIMUM REQUIREMENTS TO REPLACE PRINTAVO

### 1. Orders (HIGH PRIORITY)

**Current Schema:**
- `orderNumber` - ✅ Exists
- `status` - ✅ Exists (needs status values)
- `customer` - ✅ Relation exists
- `totalAmount` - ✅ Exists
- `dueDate` - ✅ Exists  
- `items` - ✅ JSON field for line items
- `printavoId` - ✅ Migration tracking

**Missing Fields Needed:**
```json
{
  "amountPaid": "decimal",
  "amountOutstanding": "decimal",
  "salesTax": "decimal",
  "discount": "decimal",
  "productionNotes": "text",
  "customerPO": "string",
  "createdAt": "datetime" // Already exists in Strapi
}
```

**Action:** Add payment tracking fields to order schema

### 2. Order Statuses (HIGH PRIORITY)

Printavo uses these statuses (from your data):
1. `QUOTE` (3,508 orders)
2. `Quote Out For Approval` (1,142 orders)
3. `COMPLETE` (8,185 orders)
4. `PAYMENT NEEDED` (6 orders)
5. `READY FOR PICK UP` (4 orders)
6. `INVOICE PAID` (3 orders)

**Action:** Add enumeration or status content type

### 3. Line Items (MEDIUM PRIORITY)

Currently stored as JSON in `items` field. This works but could be:
- Separate content type for better querying
- Keep as JSON for simplicity (recommended for now)

**Line Item Structure from Printavo:**
```json
{
  "style_description": "Gildan 5000",
  "style_number": "G500",
  "color": "Black",
  "quantity": 24,
  "price": 8.50,
  "sizes": [{"name": "S", "qty": 4}, {"name": "M", "qty": 8}]
}
```

### 4. Import 2025 Orders (HIGH PRIORITY)

**Data Available:**
- 831 orders from 2025
- 796 with totals > $0
- All with customer data linked

**Action:** Create order import script similar to customer import

---

## ❌ NOT NEEDED FOR MVP

These can wait until after you're operational:

| Feature | Why It Can Wait |
|---------|-----------------|
| Invoice PDF Generation | Use existing tools temporarily |
| Quote Templates | Manual quoting works |
| Production Dashboard | Track on paper/whiteboard initially |
| Time Tracking | Not critical for orders |
| Historical Data (pre-2025) | Focus on current year |
| Frontend UI | Strapi Admin UI is sufficient |
| Supplier Integration | Order blanks manually |

---

## 📋 ACTION PLAN (Priority Order)

### Phase 1: Data Import (TODAY)
1. ✅ Import 2025 customers (338 done)
2. ⬜ Import 2025 orders (831 orders)
3. ⬜ Verify data in Strapi Admin

### Phase 2: Schema Enhancement (THIS WEEK)
1. ⬜ Add payment fields to Order
2. ⬜ Configure order statuses
3. ⬜ Test order creation workflow

### Phase 3: Operational Testing (NEXT WEEK)
1. ⬜ Create new order manually
2. ⬜ Update order status
3. ⬜ Link jobs to orders
4. ⬜ Complete full workflow test

---

## 🎯 VERDICT

**Can you cancel Printavo today?** Not quite.

**What's needed first:**
1. Import 2025 orders (~1 hour)
2. Test creating a new order in Strapi (~30 min)
3. Confirm you can track order status changes

**Estimated time to MVP:** 2-3 hours

**Recommendation:** Import the 2025 orders now, test for a day or two running both systems in parallel, then cancel Printavo.

---

## Commands to Continue

```bash
# Import 2025 orders
cd /Users/ronnyworks/Projects/printshop-os
bash scripts/import-2025-orders.sh

# Access Strapi Admin
open http://localhost:1337/admin
```
