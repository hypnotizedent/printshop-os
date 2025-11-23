# Task 2.4 Setup - ACTION PLAN FOR TODAY

**Date:** November 23, 2025  
**Your Goal:** Build production dashboard in Appsmith  
**Time Budget:** 3-4 hours  
**Services Status:** ✅ All running

---

## 🎯 YOUR MISSION

Build a dashboard where production operators can:
1. See their jobs
2. View job details + mockup
3. Mark complete
4. Track progress

**This will be done while Copilot agents work on Tasks 2.1-2.3**

---

## ⏱️ TIME BREAKDOWN

```
5 min  → Step 1: Get Strapi API Token
5 min  → Step 2: Create REST API Connector
10 min → Step 3: Create Data Queries
15 min → Step 4: Build Job List Table
20 min → Step 5: Create Job Details Modal
10 min → Step 6: Add Action Buttons
5 min  → Step 7: Helper Functions
10 min → Step 8: Mobile Responsiveness
15 min → Step 9: Testing
5 min  → Step 10: Deploy

TOTAL: ~95 minutes (add 60 min buffer for troubleshooting)
```

---

## 📋 CHECKLIST - DO THESE IN ORDER

### ✅ SECTION 1: PREPARATION (5 minutes)

- [ ] Services running?
  - [ ] Appsmith: http://localhost:8080 ✅
  - [ ] Strapi: http://localhost:1337/admin
  - [ ] PostgreSQL: Running
  
- [ ] Open required tabs:
  - [ ] Tab 1: Appsmith at http://localhost:8080
  - [ ] Tab 2: Strapi admin at http://localhost:1337/admin
  - [ ] Tab 3: This guide (keep visible)

---

### ✅ SECTION 2: GET API TOKEN (5 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 1**

- [ ] Opened Strapi admin
- [ ] Navigated to Settings → API Tokens
- [ ] Created new token named "Appsmith Dashboard"
- [ ] Selected permissions: jobs (read+create+update), orders (read), customers (read), products (read), quotes (read)
- [ ] Saved token
- [ ] **COPIED TOKEN** ← Important! Save it somewhere
- [ ] Token format: `eyJhbGci...` (starts with eyJ)

**Token:** `[Paste here for reference]`
```
_________________________________________________________________________________________
```

---

### ✅ SECTION 3: APPSMITH SETUP (5 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 2**

- [ ] Opened http://localhost:8080
- [ ] Created new app named "Production Dashboard"
- [ ] Clicked to add REST API Connector
- [ ] Named it "StrapiAPI"
- [ ] Set URL: http://localhost:1337
- [ ] Added header: Authorization: Bearer [TOKEN]
- [ ] Added header: Content-Type: application/json
- [ ] Tested connection ✅

---

### ✅ SECTION 4: CREATE QUERIES (10 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 3**

- [ ] **Query 1: GetJobsInProduction**
  - [ ] Created REST API query
  - [ ] GET method
  - [ ] URL: http://localhost:1337/api/jobs?filters[status][$eq]=In%20Production&sort=created_at:desc&pagination[limit]=100
  - [ ] Ran test ✅ (returns data or empty array)

- [ ] **Query 2: GetJobById**
  - [ ] Created REST API query
  - [ ] GET method
  - [ ] URL: http://localhost:1337/api/jobs/{{jobIdInput.value}}
  - [ ] Ran test ✅

- [ ] **Query 3: UpdateJobStatus**
  - [ ] Created REST API query
  - [ ] PUT method
  - [ ] URL: http://localhost:1337/api/jobs/{{selectedJobId.value}}
  - [ ] Body: `{"data": {"status": "{{newJobStatus.value}}"}}`
  - [ ] Don't test yet ⏸

---

### ✅ SECTION 5: BUILD TABLE (15 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 4**

- [ ] Added Table widget named "JobsTable"
- [ ] Set data source: {{GetJobsInProduction.data.data}}
- [ ] Configured columns:
  - [ ] ID
  - [ ] Customer (customer.name)
  - [ ] Quantity
  - [ ] Status
  - [ ] Created (as date)
  - [ ] Actions (View Details button)
- [ ] Set row height to 60px
- [ ] Set font size to 14px
- [ ] Added "View Details" button that opens modal
  - [ ] On click: showDetailModal.setValue(true); selectedJobId.setValue(JobsTable.selectedRow.id)

---

### ✅ SECTION 6: CREATE MODAL (20 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 5**

- [ ] Added Modal widget
- [ ] Named it "JobDetailsModal"
- [ ] Set width: 600px
- [ ] Set show: {{showDetailModal.value}}
- [ ] Added modal content:
  - [ ] Header text: "Job Details"
  - [ ] Customer name
  - [ ] Quantity
  - [ ] Print locations
  - [ ] Color count
  - [ ] Notes
  - [ ] Status
  - [ ] Assigned to
  - [ ] Mockup image

**All fields bound to:** {{GetJobById.data.data.FIELD_NAME}}

---

### ✅ SECTION 7: ADD BUTTONS (10 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 6**

- [ ] Added "✓ Complete" button (Green)
  - [ ] On click: UpdateJobStatus.run(); GetJobsInProduction.run(); showDetailModal.setValue(false)
  
- [ ] Added "⏸ On Hold" button (Yellow)
  - [ ] On click: Same as above but status="On Hold"
  
- [ ] Added "❓ Need Help" button (Red)
  - [ ] On click: Show notification, close modal
  
- [ ] Added "Close" button (Gray)
  - [ ] On click: showDetailModal.setValue(false)

---

### ✅ SECTION 8: MOBILE & POLISH (10 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 8**

- [ ] Set canvas to responsive mode
- [ ] Tested on desktop (1920px) ✅
- [ ] Tested on tablet (768px) ✅
- [ ] Tested on mobile (375px) ✅
- [ ] Buttons are at least 44px tall ✅
- [ ] Text is readable on small screens ✅
- [ ] Image scales properly ✅

---

### ✅ SECTION 9: TESTING (15 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 9**

**Create Test Data First:**
- [ ] Opened http://localhost:1337/admin
- [ ] Created 3+ sample jobs in "In Production" status
- [ ] Each job has: customer, quantity, print_locations, mockup_url, notes

**Test Dashboard:**
- [ ] Dashboard loads ✅
- [ ] Table shows jobs ✅
- [ ] Click job → modal opens ✅
- [ ] Modal shows all details ✅
- [ ] Mockup image appears ✅
- [ ] "Mark Complete" works → job disappears ✅
- [ ] Status updates in Strapi ✅
- [ ] "On Hold" works ✅
- [ ] "Need Help" works ✅
- [ ] Close button works ✅
- [ ] No console errors ✅

---

### ✅ SECTION 10: DEPLOY (5 minutes)

Follow: `docs/TASK_2_4_QUICKSTART.md` → **STEP 10**

- [ ] Saved application (Cmd+S)
- [ ] Published the app
- [ ] Dashboard accessible at: http://localhost:8080/app/production-dashboard
- [ ] Shared link with team (optional)

---

## 🎬 RIGHT NOW - START HERE

### Step 1: Get Strapi API Token

```bash
1. Go to: http://localhost:1337/admin
2. Click Settings (bottom left)
3. Click API Tokens
4. Click "Create new API token"
5. Name: Appsmith Dashboard
6. Permissions:
   ✓ jobs (read, create, update)
   ✓ orders (read)
   ✓ customers (read)
   ✓ products (read)
   ✓ quotes (read)
7. Save
8. COPY the token
```

### Step 2: Verify Strapi & Appsmith Are Running

```bash
# Check in terminal:
curl http://localhost:1337/api/health

# Should return: {"status":"OK"} or similar

# Appsmith: http://localhost:8080
# Should load with login screen or dashboard
```

### Step 3: Follow the Quick Start

Open side-by-side:
- **Left:** http://localhost:8080 (Appsmith)
- **Right:** docs/TASK_2_4_QUICKSTART.md (this computer)

Follow STEP 1 → STEP 2 → STEP 3... etc.

---

## 🚨 IF YOU GET STUCK

### "Connection refused" error
```
Service not running. In terminal:
docker-compose up -d strapi postgres
docker-compose ps
```

### "403 Forbidden" error
```
API token doesn't have permission.
Check in Strapi: Settings → API Tokens → check permissions
```

### "Can't find jobs" in table
```
1. Create sample jobs in Strapi first
2. Make sure status = "In Production"
3. Run GetJobsInProduction query manually
4. Check Network tab (F12) for errors
```

### Modal won't open
```
1. Check showDetailModal variable exists
2. Check button click code is correct
3. Try: showDetailModal.clearValue() first
```

---

## 📊 SUCCESS CRITERIA

When EVERYTHING below is true, Task 2.4 is DONE:

- [x] API connected ✅
- [x] Can see jobs in table ✅
- [x] Can click → modal opens ✅
- [x] Can see mockup + details ✅
- [x] Can mark complete ✅
- [x] Status updates in Strapi ✅
- [x] Mobile responsive ✅
- [x] No errors ✅

---

## ⏸️ BREAK IT DOWN FURTHER

If overwhelmed, do this:

**Hour 1:**
- Sections 1-3 (API token + queries)

**Hour 2:**
- Section 4 (Table only, no buttons yet)

**Hour 3:**
- Sections 5-6 (Modal + buttons)

**Hour 4:**
- Sections 7-10 (Polish + test)

Each section is ~10-15 minutes. You can do it! 💪

---

## 🎯 After This

Once Task 2.4 is complete:
- Agents finish Tasks 2.1-2.3 (~48 hours)
- All PRs merged
- Full revenue pipeline ready to test
- Deploy to staging

---

## 📚 DOCUMENTATION LINKS

All in one place (this repo):
- Quick Start: `docs/TASK_2_4_QUICKSTART.md`
- Full Guide: `docs/TASK_2_4_DASHBOARD_SETUP.md`
- Agent Tracking: `docs/PHASE_2_AGENT_TRACKING.md`
- Project Status: `PROJECT_STATUS.md`

---

## 💡 PRO TIPS

1. **Save frequently:** Appsmith auto-saves, but Cmd+S is safe
2. **Test after each step:** Don't wait until the end
3. **Use browser DevTools:** F12 to debug errors
4. **Check network:** F12 → Network tab to see API calls
5. **Start small:** Get table working first, then add modal
6. **Use placeholders:** Use placeholder image URL if mockup not available

---

## 🚀 LET'S GO!

You're building the operational heart of the system. Production team will use this every day to manage jobs. Make it count!

**Start with Step 1: Get API Token**

Questions? Check the Quick Start guide or GitHub issues.

**Let's ship this! 🎉**
