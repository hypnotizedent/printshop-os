# Getting Operational with Strapi UI - Quick Start Guide

**Date:** November 26, 2025  
**Goal:** Start managing jobs TODAY using Strapi Admin UI  
**Time:** 30 minutes to operational

---

## 🚀 STEP 1: Access Strapi Admin (2 minutes)

### Open Admin Panel
```bash
# Strapi is running at:
http://localhost:1337/admin
```

### First-Time Setup
If you see login screen but no account:
1. Click "Create an administrator"
2. Fill in:
   - **First name:** Your name
   - **Last name:** Your last name  
   - **Email:** your-email@example.com
   - **Password:** (strong password - save it!)
3. Click "Let's start"

### If Admin Account Exists
- Username: (check your notes or .env file)
- Password: (your password)

---

## 🎯 STEP 2: Create Your First Customer (5 minutes)

### Navigate to Content Manager
1. Left sidebar → **Content Manager**
2. Click **Customer** (under COLLECTION TYPES)
3. Click **Create new entry** (blue button, top right)

### Fill in Customer Details
**Required Fields:**
- **Name:** ABC Company
- **Email:** orders@abccompany.com
- **Phone:** (555) 123-4567

**Optional but Recommended:**
- **Company:** ABC Company
- **Street Address:** 123 Main St
- **City:** Portland
- **State:** OR
- **Zip Code:** 97201
- **Country:** USA
- **Customer Type:** Business (dropdown)
- **Status:** Active (dropdown)

### Save Customer
1. Click **Save** (top right)
2. Then click **Publish** (makes it available via API)
3. You should see "Successfully created" message

✅ **Checkpoint:** You now have 1 customer in the system

---

## 📋 STEP 3: Create Your First Order (10 minutes)

### Navigate to Orders
1. Left sidebar → **Content Manager**
2. Click **Order** (under COLLECTION TYPES)
3. Click **Create new entry**

### Fill in Order Details

**Basic Information:**
- **Order Number:** TEST-001 (or your format)
- **Status:** Pending (dropdown)
- **Customer:** Click dropdown → Select "ABC Company" (the customer you just created)

**Order Items (JSON field):**
Click the "items" field and enter:
```json
[
  {
    "description": "Custom T-Shirts",
    "quantity": 100,
    "unitPrice": 12.50,
    "subtotal": 1250.00
  }
]
```

**Financial Information:**
- **Total Amount:** 1250.00
- **Deposit Amount:** 0 (or 625.00 if half down)
- **Paid Amount:** 0
- **Payment Status:** Pending (dropdown)

**Timeline:**
- **Due Date:** Click calendar → Select a date (e.g., 2 weeks from now)
- **Rush Order:** Toggle OFF (or ON if rush)

**Notes (Optional):**
- **Notes:** "Customer wants red shirts with white logo"

### Save Order
1. Click **Save**
2. Click **Publish**
3. ✅ "Successfully created" message

---

## 🏭 STEP 4: Create Production Job (10 minutes)

### Navigate to Jobs
1. Left sidebar → **Content Manager**
2. Click **Job** (under COLLECTION TYPES)
3. Click **Create new entry**

### Link to Order
- **Order:** Select "TEST-001" from dropdown (the order you just created)
- **Customer:** Select "ABC Company"

### Job Details

**Basic Info:**
- **Job Number:** JOB-001 (or your format)
- **Title:** "Custom T-Shirts - ABC Company"
- **Status:** Pending Artwork (dropdown)

**Specifications:**
- **Quantity:** 100
- **Product Type:** T-Shirt (dropdown)
- **Product Description:** "Gildan 5000 - Red"

**Production Details:**
- **Production Method:** Screen Print (dropdown)
- **Ink Colors:** White (or multiple colors)
- **Imprint Locations:** Front Center

**Timeline:**
- **Due Date:** (same as order)
- **Rush Job:** Toggle OFF
- **Priority:** Normal (dropdown)

**Notes:**
- **Production Notes:** "Use plastisol white ink"
- **Internal Notes:** "Customer is VIP"

### Save Job
1. Click **Save**
2. Click **Publish**
3. ✅ Job created and linked to order

---

## ✅ STEP 5: Verify Everything Works (3 minutes)

### Check Customer
1. Content Manager → **Customer**
2. You should see 1 entry: "ABC Company"
3. Click it to view details

### Check Order
1. Content Manager → **Order**
2. You should see 1 entry: "TEST-001"
3. Click it → Verify customer is linked (should show "ABC Company" relation)

### Check Job
1. Content Manager → **Job**
2. You should see 1 entry: "JOB-001"
3. Click it → Verify order and customer are linked

### Test API (Optional)
```bash
# In terminal, check if data is accessible via API:
curl http://localhost:1337/api/customers | jq
curl http://localhost:1337/api/orders | jq
curl http://localhost:1337/api/jobs | jq

# Should return your data in JSON format
```

---

## 🎉 YOU'RE OPERATIONAL!

### What You Can Do Now

1. **Enter New Orders:**
   - Create customer (if new)
   - Create order
   - Create job
   - Update status as work progresses

2. **Track Production:**
   - Update job status: Pending → Ready → In Production → Complete
   - Add production notes
   - Track timeline

3. **Manage Customers:**
   - View order history per customer
   - Update contact info
   - Track account balances

---

## 🔄 DAILY WORKFLOW

### New Order Comes In
1. Check if customer exists → Create if not
2. Create order entry
3. Create job entry linked to order
4. Notify production team

### Production Updates
1. Find job in Content Manager
2. Update status
3. Add notes if needed
4. Save changes

### Order Complete
1. Update job status to "Complete"
2. Update order status to "Complete"
3. Generate invoice (manual for now)

---

## 📝 TIPS & TRICKS

### Keyboard Shortcuts
- **Cmd/Ctrl + S** - Save entry
- **Cmd/Ctrl + Shift + P** - Save and publish
- **Esc** - Close modal/sidebar

### Filtering & Search
- Use search bar (top of list) to find entries
- Click filter icon to filter by status, date, etc.
- Sort by clicking column headers

### Bulk Operations
- Select multiple entries (checkboxes)
- Click "Actions" dropdown
- Choose "Publish" or "Delete"

---

## ⚠️ COMMON ISSUES

### "Relation not found"
- Make sure you saved AND published the related entry
- Refresh the page
- Try clearing browser cache

### "Required field missing"
- Red * indicates required fields
- Scroll through form to find missing fields
- Some fields auto-fill (like createdAt)

### "Cannot publish"
- Make sure all required fields are filled
- Check for validation errors (red text)
- Save first, then publish

---

## 🚀 NEXT STEPS

### Today (After Getting Comfortable)
1. Create 5-10 test orders to learn the system
2. Practice updating job statuses
3. Explore other content types (Colors, SOPs)

### This Week
1. Import historical Printavo data (once we fix API)
2. Connect frontend to Strapi
3. Set up production dashboard

### This Month
1. Train team on Strapi UI
2. Migrate fully from Printavo
3. Deploy to production

---

## 🆘 NEED HELP?

### Strapi Documentation
- [Strapi User Guide](https://docs.strapi.io/user-docs/intro)
- [Content Manager](https://docs.strapi.io/user-docs/content-manager/writing-content)

### Project Documentation
- `ARCHITECTURE.md` - How the system works
- `SERVICE_DIRECTORY.md` - Where everything is
- `PROGRESS_REPORT.md` - Current status

### Quick Questions
- Check Strapi logs: `printshop-strapi/logs/`
- Restart Strapi: `cd printshop-strapi && npm run develop`
- Reset database: Delete `.tmp/data.db` and restart

---

**You're now operational!** 🎉

Enter orders manually via Strapi UI while we work on importing historical data in the background.
