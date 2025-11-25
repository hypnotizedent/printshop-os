# Task 2.4 Setup - QUICK START GUIDE

**Status:** 🚀 READY TO BUILD  
**Your Role:** Follow these steps to build the dashboard  
**Estimated Time:** 3-4 hours for complete setup  
**Services Running:** ✅ Appsmith (8080) | ✅ Strapi (1337) | ✅ PostgreSQL | ✅ Redis

---

## 🎯 What You're Building

A real-time production dashboard where operators:
- See all jobs assigned to them (In Production status)
- Click to view job details (mockup, quantity, instructions)
- Mark jobs complete
- Escalate issues
- Track progress

---

## 📋 STEP 1: Get Strapi API Token (5 minutes)

### 1.1 Access Strapi Admin
```
Open: http://localhost:1337/admin
```

### 1.2 Create API Token
```
1. Click Settings (bottom left)
2. Click API Tokens (under ADMINISTRATION)
3. Click "Create new API token"
4. Configuration:
   - Name: Appsmith Dashboard
   - Description: Production dashboard connector
   - Token duration: Unlimited
   - Token type: Custom
5. Select permissions:
   ✓ jobs (read)
   ✓ jobs (create)
   ✓ jobs (update)
   ✓ orders (read)
   ✓ customers (read)
   ✓ products (read)
   ✓ quotes (read)
6. Click Save
7. COPY the token (you'll need it in next step)
```

**Example token (save for next step):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiY...
```

---

## 🔌 STEP 2: Create Appsmith REST API Connector (5 minutes)

### 2.1 Open Appsmith
```
URL: http://localhost:8080
```

### 2.2 Create New Application
```
Click: Create New App
Name: Production Dashboard
Color: Blue
```

### 2.3 Add REST API Connector
```
In left panel:
1. Click "+" next to QUERIES
2. Select "REST API"
3. Name it: StrapiAPI
4. Configuration:

   URL: http://localhost:1337
   
   Default Headers:
   ┌─────────────────────────────────────────────────┐
   │ Key            │ Value                           │
   ├─────────────────────────────────────────────────┤
   │ Authorization  │ Bearer [PASTE_YOUR_TOKEN_HERE]  │
   │ Content-Type   │ application/json                │
   └─────────────────────────────────────────────────┘

5. Click "Test" to verify connection
   ✅ Should see: "Connection successful"
```

---

## 📊 STEP 3: Create Data Queries (10 minutes)

### Query 1: Get Jobs In Production

**In Appsmith:**
```
1. Click "+" next to QUERIES
2. Select "REST API"
3. Name: GetJobsInProduction
4. Method: GET
5. URL:
   http://localhost:1337/api/jobs?filters[status][$eq]=In%20Production&sort=created_at:desc&pagination[limit]=100

6. Headers (from StrapiAPI):
   Authorization: Bearer [TOKEN]
   Content-Type: application/json

7. Click "Run" to test
   ✅ Should return job data or empty array
```

**If you get 403 error:** Your token doesn't have read access to jobs. Go back to Step 1.6 and add permissions.

---

### Query 2: Get Job Details By ID

```
1. Click "+" next to QUERIES
2. Select "REST API"
3. Name: GetJobById
4. Method: GET
5. URL:
   http://localhost:1337/api/jobs/{{jobIdInput.value}}
6. Run to test
```

---

### Query 3: Update Job Status

```
1. Click "+" next to QUERIES
2. Select "REST API"
3. Name: UpdateJobStatus
4. Method: PUT
5. URL:
   http://localhost:1337/api/jobs/{{selectedJobId.value}}
6. Body (JSON):
   {
     "data": {
       "status": "{{newJobStatus.value}}"
     }
   }
7. Don't run yet (will test after UI built)
```

---

## 🎨 STEP 4: Build Job List Table (15 minutes)

### 4.1 Add Table Widget

```
In Canvas:
1. Click "+ Add" button
2. Search "Table"
3. Select "Table"
4. Name: JobsTable
```

### 4.2 Configure Table Data

```
Right panel (Inspector):
1. Find "Data" section
2. Paste this binding:
   {{GetJobsInProduction.data.data}}

3. Set Columns manually:
   - Column 1: ID (jobId)
   - Column 2: Customer (customer.name)
   - Column 3: Quantity (quantity)
   - Column 4: Status (status)
   - Column 5: Created (created_at - format as date)
```

### 4.3 Add "View Details" Button Column

```
1. Right-click table header
2. Add column
3. Name: Actions
4. Type: Button
5. Label: View Details
6. On Click:
   {{showDetailModal.clearValue()}}
   {{showDetailModal.setValue(true)}}
   {{selectedJobId.setValue(JobsTable.selectedRow.id)}}
```

### 4.4 Configure Table Styling

```
In Inspector:
- Row Height: 60px
- Font Size: 14px
- Hover Effect: Light gray background
- Hide search bar: NO
```

---

## 📌 STEP 5: Create Job Details Modal (20 minutes)

### 5.1 Add Modal Widget

```
1. Click "+ Add"
2. Search "Modal"
3. Name: JobDetailsModal
4. Position: Center
5. Width: 600px
```

### 5.2 Configure Modal Properties

```
Inspector:
- Show: {{showDetailModal.value}}
- Title: Job Details
- Can Escape: YES
- Has Backdrop: YES
```

### 5.3 Add Modal Content (Inside Modal)

Inside the modal, add these components:

#### Component 1: Header Text
```
Type: Text
Text: {{selectedJobId.value ? "Job #" + selectedJobId.value : "Loading..."}}
Font Size: 20px
Font Weight: Bold
```

#### Component 2: Job Details
```
Type: Text (multiple)

1. Customer:
   {{GetJobById.data.data.customer.name}}

2. Quantity:
   {{GetJobById.data.data.quantity}} items

3. Print Locations:
   {{GetJobById.data.data.print_locations.join(", ")}}

4. Color Count:
   {{GetJobById.data.data.color_count}} colors

5. Notes:
   {{GetJobById.data.data.notes || "No notes"}}

6. Status:
   {{GetJobById.data.data.status}}

7. Assigned To:
   {{GetJobById.data.data.assigned_to || "Unassigned"}}
```

#### Component 3: Mockup Image
```
Type: Image
URL: {{GetJobById.data.data.mockup_url}}
Height: 300px
Width: 100%
Fit: Cover
Fallback: (gray placeholder)
```

---

## 🔘 STEP 6: Add Action Buttons (10 minutes)

Inside Modal, add button row:

### Button 1: Mark Complete
```
Type: Button
Label: ✓ Complete
Color: Green
On Click:
1. updateJobStatus("Complete")
2. GetJobsInProduction.run()
3. showDetailModal.setValue(false)
4. Show toast: "Job marked complete!"
```

### Button 2: On Hold
```
Type: Button
Label: ⏸ On Hold
Color: Yellow
On Click:
1. updateJobStatus("On Hold")
2. GetJobsInProduction.run()
3. showDetailModal.setValue(false)
4. Show toast: "Job placed on hold"
```

### Button 3: Need Help
```
Type: Button
Label: ❓ Need Help
Color: Red
On Click:
1. Show notification: "Manager notified - help on the way!"
2. (Optional: webhook to Slack)
3. showDetailModal.setValue(false)
```

### Button 4: Close
```
Type: Button
Label: Close
Color: Gray
On Click:
showDetailModal.setValue(false)
```

---

## 🔄 STEP 7: Create Helper Functions (5 minutes)

### 7.1 Add Helper Query

```
1. Click "+" next to QUERIES
2. Select "JavaScript"
3. Name: updateJobStatus
4. Function:
   function updateJobStatus(newStatus) {
     return UpdateJobStatus.run({
       newStatus: newStatus
     });
   }
5. Save
```

### 7.2 Add Refresh Button

```
1. Add Button widget
2. Label: 🔄 Refresh
3. On Click:
   GetJobsInProduction.run()
   Show toast: "Jobs updated"
```

---

## 📱 STEP 8: Make It Mobile Responsive (10 minutes)

### 8.1 Set Canvas Width
```
Settings → Canvas
- Display Mode: Responsive
- Minimum Width: 320px
- Maximum Width: 1200px
```

### 8.2 Configure Breakpoints

```
For Table:
- Desktop (>1024px): Show all columns
- Tablet (768-1024px): Hide "Assigned To" column
- Mobile (<768px): Stack to cards

For Modal:
- Desktop: 600px width
- Tablet: 500px width
- Mobile: 90% width
```

### 8.3 Test on Mobile
```
1. Open Developer Tools (F12)
2. Toggle device toolbar
3. Test on iPhone SE (375px)
4. Test on iPad (768px)
5. Make sure buttons are touch-friendly (44px+ height)
```

---

## 🧪 STEP 9: Testing (15 minutes)

### 9.1 Create Test Data (in Strapi)

```
If you don't have jobs, create sample data:

1. Go to http://localhost:1337/admin
2. Jobs collection
3. Click "Create new entry"
4. Fill in:
   - status: In Production
   - customer: (select or create)
   - quantity: 100
   - print_locations: ["front", "back"]
   - color_count: 3
   - mockup_url: (any image URL)
   - notes: "Test job for dashboard"
5. Publish
6. Create 2-3 more jobs
```

### 9.2 Test Dashboard

```
1. Run GetJobsInProduction query
   ✅ Should see your test jobs

2. Click table row
   ✅ Modal should open
   ✅ Should see job details
   ✅ Should see mockup image

3. Click "Mark Complete"
   ✅ Job status should update to "Complete"
   ✅ Job should disappear from list (filter: In Production)
   ✅ Toast message shows

4. Test filters
   ✅ Filter by status
   ✅ Search by customer name

5. Test mobile view
   ✅ Open in Dev Tools mobile view
   ✅ Table converts to cards
   ✅ Buttons responsive
   ✅ Modal readable
```

---

## 🚀 STEP 10: Deploy & Access (5 minutes)

### 10.1 Save Application
```
1. Press Ctrl+S (or Cmd+S)
2. Name: Production Dashboard
3. Click "Publish"
```

### 10.2 Access Dashboard
```
URL: http://localhost:8080/app/production-dashboard
```

### 10.3 Share with Team
```
Go to Settings → Share
- Copy deployment link
- Share with production team
- They can access at that URL
```

---

## 🔍 TROUBLESHOOTING

### Table Shows No Data
```
1. Check API token has read access to jobs
2. Check GetJobsInProduction query runs successfully
3. Check database has jobs with status="In Production"
4. Check network in Dev Tools (F12)
```

### Modal Doesn't Open
```
1. Check showDetailModal variable exists
2. Check "View Details" button click handler
3. Check modal "Show" binding is correct
4. Try: showDetailModal.clearValue() then showDetailModal.setValue(true)
```

### Update Failed / 403 Error
```
1. Check API token has write access to jobs
2. Check UpdateJobStatus query URL is correct
3. Check PUT request body is valid JSON
4. Check Strapi job record exists
```

### Image Not Loading
```
1. Check mockup_url is valid (copy URL to browser)
2. Check image URL is accessible
3. Use placeholder image URL for testing:
   https://via.placeholder.com/600x400/cccccc/666666?text=Job+Mockup
```

---

## 📊 API Reference (If Needed)

### Get All Jobs
```
GET /api/jobs?filters[status][$eq]=In%20Production
Response: { data: [...jobs] }
```

### Get Single Job
```
GET /api/jobs/[ID]
Response: { data: {...job} }
```

### Update Job Status
```
PUT /api/jobs/[ID]
Body: { data: { status: "Complete" } }
Response: { data: {...updated job} }
```

---

## ✅ COMPLETION CHECKLIST

When all of these pass, Task 2.4 is complete:

- [ ] Appsmith connected to Strapi via API token
- [ ] GetJobsInProduction query returns data
- [ ] Table displays jobs
- [ ] Can click job → modal opens
- [ ] Modal shows all job details
- [ ] Mockup image displays
- [ ] Mark Complete button works
- [ ] Status updates in Strapi
- [ ] Job disappears from list after marking complete
- [ ] Mobile view is responsive
- [ ] All buttons work on touch devices
- [ ] No console errors
- [ ] Test with 5+ jobs

---

## 🎯 Next Steps After This

Once Task 2.4 is complete:
1. Task 2.5: Add time clock system
2. Task 2.6: Add press-ready checklist
3. Then: Advanced features (WebSocket, analytics, etc.)

---

## 📞 Support

If you get stuck:
1. Check DevTools Console (F12) for errors
2. Check Strapi API is responding: http://localhost:1337/api/health
3. Check API token is valid in Strapi settings
4. Review corresponding section in `docs/TASK_2_4_DASHBOARD_SETUP.md`

Good luck! You've got this! 🚀
