# Task 2.4: Production Dashboard Integration Guide

**Last Updated:** November 24, 2025  
**Status:** ✅ Ready for Implementation  
**Estimated Time:** 2-3 hours

---

## 📋 Overview

This guide walks you through integrating the Appsmith Production Dashboard with your Strapi backend. By the end, production operators will be able to view and manage jobs in real-time.

---

## 🎯 What You'll Accomplish

- ✅ Connect Appsmith to Strapi API
- ✅ Import pre-built dashboard configuration
- ✅ Create sample production jobs for testing
- ✅ Test all dashboard functionality
- ✅ Verify mobile responsiveness
- ✅ Deploy for production use

---

## 📦 Prerequisites

### Services Running

Ensure all required services are running:

```bash
# Check service status
docker-compose ps

# Should see:
# - printshop-strapi (port 1337) - healthy
# - printshop-appsmith (port 8080) - healthy
# - printshop-postgres (port 5432) - healthy
# - printshop-mongo (port 27017) - healthy

# Start services if not running
docker-compose up -d strapi appsmith postgres mongo
```

### Verify Strapi

```bash
# Test Strapi is responding
curl http://localhost:1337/api/health

# Open Strapi admin
open http://localhost:1337/admin
```

### Verify Appsmith

```bash
# Test Appsmith is responding
curl http://localhost:8080/api/v1/health

# Open Appsmith
open http://localhost:8080
```

---

## 🚀 Step-by-Step Integration

### Step 1: Create Strapi API Token (5 minutes)

1. **Open Strapi Admin Panel**
   ```
   http://localhost:1337/admin
   ```

2. **Navigate to API Tokens**
   - Click **Settings** (⚙️ icon in left sidebar)
   - Under "Global Settings", click **API Tokens**
   - Click **Create new API Token** button

3. **Configure Token**
   ```
   Name: Production Dashboard
   Description: API access for Appsmith production dashboard
   Token duration: Unlimited
   Token type: Custom
   ```

4. **Set Permissions**
   
   **Jobs Collection:**
   - ✅ find (GET /api/jobs)
   - ✅ findOne (GET /api/jobs/:id)
   - ✅ create (POST /api/jobs)
   - ✅ update (PUT /api/jobs/:id)
   
   **Customers Collection:**
   - ✅ find (GET /api/customers)
   - ✅ findOne (GET /api/customers/:id)
   
   **Orders Collection:** (optional)
   - ✅ find (GET /api/orders)
   - ✅ findOne (GET /api/orders/:id)
   
   **Quotes Collection:** (optional)
   - ✅ find (GET /api/quotes)

5. **Save and Copy Token**
   - Click **Save**
   - **IMPORTANT:** Copy the token immediately - it will only be shown once
   - Store it safely (you'll need it in Step 2)
   
   Example token format:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjk...
   ```

---

### Step 2: Configure Appsmith REST API Datasource (10 minutes)

1. **Open Appsmith**
   ```
   http://localhost:8080
   ```

2. **Create New Application**
   - Click **Create New** button
   - Select **Application**
   - Name: `Production Dashboard`
   - Icon: Choose blue factory/dashboard icon
   - Click **Create**

3. **Add REST API Datasource**
   - In the left panel, click **Datasources** tab
   - Click the **+** (plus) button
   - Select **Authenticated API**
   - Or select **REST API** from the list

4. **Configure Datasource**
   ```
   Name: StrapiAPI
   
   URL: http://strapi:1337
   (Use 'strapi' as hostname since we're inside Docker network)
   (Alternative if not in Docker: http://localhost:1337)
   
   Headers:
   ┌─────────────────┬──────────────────────────────────────────────┐
   │ Key             │ Value                                        │
   ├─────────────────┼──────────────────────────────────────────────┤
   │ Authorization   │ Bearer YOUR_TOKEN_FROM_STEP_1                │
   │ Content-Type    │ application/json                             │
   └─────────────────┴──────────────────────────────────────────────┘
   
   Note: Replace YOUR_TOKEN_FROM_STEP_1 with the actual token you copied
   ```

5. **Test Connection**
   - Click **Test** button
   - You should see: ✅ "Connection successful"
   - If you see an error, double-check:
     - Strapi is running
     - Token is correct and not expired
     - Headers are formatted correctly

6. **Save Datasource**
   - Click **Save** button

---

### Step 3: Create API Queries (15 minutes)

Now we'll create the queries that fetch and update job data.

#### Query 1: GetJobsInProduction

1. Click **+** next to **Queries/JS** in left panel
2. Select **StrapiAPI** datasource
3. Configure:
   ```
   Name: GetJobsInProduction
   Method: GET
   
   URL Path: /api/jobs
   
   Query Parameters:
   - filters[status][$eq] = InProduction
   - sort[0] = dueDate:asc
   - populate = customer
   - pagination[pageSize] = 100
   ```

4. Settings:
   - ✅ Run query on page load
   - Timeout: 10000ms

5. Click **Run** to test
   - Should return empty array or list of jobs (if you've created any)

6. Click **Save**

#### Query 2: GetJobById

1. Create new query with StrapiAPI
2. Configure:
   ```
   Name: GetJobById
   Method: GET
   
   URL Path: /api/jobs/{{Table1.selectedRow.id}}
   
   Query Parameters:
   - populate = *
   ```

3. Settings:
   - ☐ Run query on page load (leave unchecked)

4. **Don't test yet** (requires table selection)

5. Click **Save**

#### Query 3: UpdateJobStatus

1. Create new query with StrapiAPI
2. Configure:
   ```
   Name: UpdateJobStatus
   Method: PUT
   
   URL Path: /api/jobs/{{Table1.selectedRow.id}}
   
   Body (JSON):
   {
     "data": {
       "status": "{{appsmith.store.newStatus}}"
     }
   }
   ```

3. Headers (add to query headers):
   ```
   Content-Type: application/json
   ```

4. Settings:
   - ☐ Run query on page load (leave unchecked)

5. **Don't test yet** (requires store value)

6. Click **Save**

---

### Step 4: Build the UI (30 minutes)

#### 4.1: Add Header Section

1. **Drop a Container widget**
   - Drag from widget panel to canvas
   - Name: `HeaderContainer`
   - Position: Top of page
   - Height: 80px
   - Background: #f5f5f5

2. **Add Title Text**
   - Drop Text widget inside HeaderContainer
   - Configure:
     ```
     Text: Production Dashboard
     Font size: 24px
     Font weight: Bold
     ```

3. **Add Refresh Button**
   - Drop Button widget inside HeaderContainer
   - Configure:
     ```
     Label: 🔄 Refresh
     Button Color: #2196F3 (Blue)
     On Click: {{GetJobsInProduction.run(); showAlert('Jobs refreshed!', 'success');}}
     ```

4. **Add Status Filter**
   - Drop Select widget inside HeaderContainer
   - Configure:
     ```
     Label: Filter by Status
     Options:
     [
       { "label": "In Production", "value": "InProduction" },
       { "label": "Ready", "value": "Ready" },
       { "label": "Pending", "value": "Pending" },
       { "label": "Complete", "value": "Complete" }
     ]
     Default: InProduction
     On Selection Change: {{GetJobsInProduction.run();}}
     ```

#### 4.2: Add Jobs Table

1. **Drop Table widget**
   - Name: `Table1` (default)
   - Position: Below header
   - Take most of the page height

2. **Configure Table Data**
   ```javascript
   Data: {{GetJobsInProduction.data.data ? GetJobsInProduction.data.data.map(job => ({
     id: job.id,
     jobNumber: job.attributes.jobNumber,
     title: job.attributes.title,
     status: job.attributes.status,
     dueDate: job.attributes.dueDate,
     customer: job.attributes.customer?.data?.attributes?.name || 'N/A',
     productionNotes: job.attributes.productionNotes,
     mockupUrls: job.attributes.mockupUrls || []
   })) : []}}
   ```

3. **Configure Columns**
   
   Edit columns (click column settings):
   
   - **Job Number**
     - Column Name: `jobNumber`
     - Label: Job Number
     - Type: Text
     - Width: 150px
   
   - **Title**
     - Column Name: `title`
     - Label: Title
     - Type: Text
     - Width: 250px
   
   - **Customer**
     - Column Name: `customer`
     - Label: Customer
     - Type: Text
     - Width: 200px
   
   - **Due Date**
     - Column Name: `dueDate`
     - Label: Due Date
     - Type: Date
     - Date Format: MMM DD, YYYY
     - Width: 150px
   
   - **Status**
     - Column Name: `status`
     - Label: Status
     - Type: Text
     - Width: 120px
     - Cell Background: 
       ```javascript
       {{currentRow.status === 'InProduction' ? '#E3F2FD' : 
         currentRow.status === 'Ready' ? '#E8F5E9' : 
         currentRow.status === 'Pending' ? '#FFF3E0' : '#F5F5F5'}}
       ```
   
   - **Actions**
     - Add new column
     - Column Name: `actions`
     - Type: Button
     - Button Label: View Details
     - Button Color: #2196F3
     - On Click: 
       ```javascript
       {{showModal('JobDetailsModal'); GetJobById.run();}}
       ```

4. **Table Settings**
   - Enable Search: ✅
   - Enable Sorting: ✅
   - Enable Client-side Search: ✅
   - Row Height: Tall

#### 4.3: Create Job Details Modal

1. **Add Modal Widget**
   - Drag Modal widget to canvas
   - Name: `JobDetailsModal`
   - Size: Large (600px width)

2. **Add Modal Header**
   - Drop Text widget at top of modal
   - Configure:
     ```
     Text: Job #{{Table1.selectedRow.jobNumber}}
     Font size: 20px
     Font weight: Bold
     ```

3. **Add Mockup Image**
   - Drop Image widget
   - Configure:
     ```
     Image URL: {{Table1.selectedRow.mockupUrls && Table1.selectedRow.mockupUrls[0] ? Table1.selectedRow.mockupUrls[0] : 'https://via.placeholder.com/600x400/cccccc/666666?text=No+Mockup'}}
     Object Fit: Cover
     Height: 300px
     ```

4. **Add Job Details Section**
   
   Drop multiple Text widgets for each field:
   
   ```
   Customer:
   {{Table1.selectedRow.customer}}
   
   Title:
   {{Table1.selectedRow.title}}
   
   Due Date:
   {{moment(Table1.selectedRow.dueDate).format('MMMM DD, YYYY')}}
   
   Status:
   {{Table1.selectedRow.status}}
   
   Production Notes:
   {{Table1.selectedRow.productionNotes || 'No notes available'}}
   ```

5. **Add Action Buttons**
   
   Create a button group at bottom of modal:
   
   **Mark Complete Button:**
   ```
   Label: ✓ Mark Complete
   Button Color: #4CAF50 (Green)
   On Click: 
   {{
     storeValue('newStatus', 'Complete');
     UpdateJobStatus.run(() => {
       GetJobsInProduction.run();
       closeModal('JobDetailsModal');
       showAlert('Job marked as complete!', 'success');
     });
   }}
   ```
   
   **Mark Ready Button:**
   ```
   Label: ✓ Mark Ready
   Button Color: #4CAF50 (Green)
   On Click:
   {{
     storeValue('newStatus', 'Ready');
     UpdateJobStatus.run(() => {
       GetJobsInProduction.run();
       closeModal('JobDetailsModal');
       showAlert('Job marked as ready!', 'success');
     });
   }}
   ```
   
   **Put On Hold Button:**
   ```
   Label: ⏸ Put On Hold
   Button Color: #FF9800 (Orange)
   On Click:
   {{
     storeValue('newStatus', 'Pending');
     UpdateJobStatus.run(() => {
       GetJobsInProduction.run();
       closeModal('JobDetailsModal');
       showAlert('Job put on hold!', 'info');
     });
   }}
   ```
   
   **Close Button:**
   ```
   Label: Close
   Button Color: #757575 (Gray)
   On Click: {{closeModal('JobDetailsModal')}}
   ```

---

### Step 5: Create Sample Jobs (10 minutes)

Now let's create test data to see the dashboard in action.

1. **Open Terminal** in the project root

2. **Run the seed script:**
   ```bash
   # Set your API token
   export STRAPI_API_TOKEN="your-token-from-step-1"
   
   # Navigate to Strapi directory
   cd printshop-strapi
   
   # Run seed script
   node scripts/seed-production-jobs.js
   ```

3. **Verify jobs were created:**
   - Open http://localhost:1337/admin
   - Navigate to Content Manager → Jobs
   - You should see 8 sample jobs
   - 4 should have status "InProduction"

4. **Refresh Appsmith Dashboard**
   - Go back to your Appsmith app
   - Click the Refresh button
   - Table should now show 4 jobs in production

---

### Step 6: Test Dashboard Functionality (15 minutes)

#### Test Checklist

Run through each test to verify everything works:

**Table View:**
- [ ] Table loads and displays jobs
- [ ] Can see job number, title, customer, due date, status
- [ ] Search box filters jobs correctly
- [ ] Sorting works on columns
- [ ] Status colors are correct (blue for InProduction, etc.)

**Job Details:**
- [ ] Click "View Details" button
- [ ] Modal opens with job information
- [ ] Mockup image displays (or placeholder if no image)
- [ ] All job fields are visible and correct
- [ ] Production notes display properly

**Status Updates:**
- [ ] Click "Mark Complete" button
- [ ] Success message appears
- [ ] Modal closes
- [ ] Job disappears from table (since we filter by InProduction)
- [ ] Verify in Strapi admin that status was updated

**Filters:**
- [ ] Change status filter to "Complete"
- [ ] Completed job appears in table
- [ ] Change back to "InProduction"
- [ ] Only in-production jobs show

**Error Handling:**
- [ ] Stop Strapi: `docker-compose stop strapi`
- [ ] Try to refresh dashboard
- [ ] Should see appropriate error message
- [ ] Start Strapi: `docker-compose start strapi`
- [ ] Refresh should work again

---

### Step 7: Mobile Responsiveness (10 minutes)

Test the dashboard on mobile devices:

1. **Open DevTools**
   - Press F12 in browser
   - Click device toolbar icon (📱)

2. **Test iPhone View (375px)**
   - Select iPhone SE or similar
   - Verify:
     - Table is readable
     - Buttons are touch-friendly (min 44px height)
     - Modal fits screen
     - Can scroll to see all content
     - Image scales properly

3. **Test iPad View (768px)**
   - Select iPad or similar
   - Verify layout works
   - All features accessible

4. **Adjust if needed**
   - In Appsmith, set responsive breakpoints
   - Adjust column visibility for mobile
   - Ensure button sizes are appropriate

---

### Step 8: Deploy Dashboard (5 minutes)

1. **Save Application**
   - Click **Save** button (top right)
   - Or press Ctrl+S (Cmd+S on Mac)

2. **Deploy**
   - Click **Deploy** button (top right)
   - Wait for deployment to complete
   - You'll get a deployment URL

3. **Access Dashboard**
   ```
   Deployed URL: http://localhost:8080/app/production-dashboard
   ```

4. **Share with Team**
   - Copy the URL
   - Share with production team members
   - They can access directly (no login required in dev mode)
   - For production, enable authentication in Appsmith settings

---

## ✅ Success Criteria

Your dashboard is ready when:

- ✅ Appsmith connects to Strapi without errors
- ✅ Jobs table loads and displays data
- ✅ Clicking a job opens the details modal
- ✅ Modal shows all job information including mockup
- ✅ Mark Complete button updates job status
- ✅ Status updates reflect in real-time
- ✅ Dashboard works on mobile devices
- ✅ All 4 "InProduction" jobs are visible
- ✅ No console errors

---

## 🔧 Troubleshooting

### Table shows "No data"

**Check:**
1. GetJobsInProduction query ran successfully
2. Jobs exist in Strapi with status "InProduction"
3. API token has read permissions
4. Network tab in DevTools shows 200 response

**Fix:**
```bash
# Run seed script to create jobs
cd printshop-strapi
node scripts/seed-production-jobs.js
```

### Modal doesn't open

**Check:**
1. Modal widget exists and is named "JobDetailsModal"
2. Button onClick has correct syntax
3. No JavaScript errors in console

**Fix:**
```javascript
// Button onClick should be:
{{showModal('JobDetailsModal'); GetJobById.run();}}
```

### Update status doesn't work

**Check:**
1. UpdateJobStatus query is configured correctly
2. API token has update permission
3. storeValue sets newStatus before query runs

**Fix:**
```javascript
// Button onClick should be:
{{
  storeValue('newStatus', 'Complete');
  UpdateJobStatus.run(() => {
    GetJobsInProduction.run();
    closeModal('JobDetailsModal');
    showAlert('Status updated!', 'success');
  });
}}
```

### 403 Forbidden error

**Cause:** API token doesn't have required permissions

**Fix:**
1. Go to Strapi Admin → Settings → API Tokens
2. Edit your token
3. Ensure jobs collection has: find, findOne, update
4. Save and use the new token

### Images not loading

**Cause:** mockupUrls might be empty or invalid

**Fix:**
Use placeholder fallback:
```javascript
{{Table1.selectedRow.mockupUrls && Table1.selectedRow.mockupUrls[0] 
  ? Table1.selectedRow.mockupUrls[0] 
  : 'https://via.placeholder.com/600x400/cccccc/666666?text=No+Mockup'}}
```

---

## 📚 Additional Resources

- [Appsmith Documentation](https://docs.appsmith.com/)
- [Strapi REST API Reference](https://docs.strapi.io/dev-docs/api/rest)
- [Task 2.4 Quick Start](./TASK_2_4_QUICKSTART.md)
- [Appsmith Queries Reference](../examples/appsmith/production-dashboard-queries.js)
- [Seed Script Documentation](../printshop-strapi/scripts/README.md)

---

## 🎯 Next Steps

After completing this integration:

1. **Configure Auto-refresh**
   - Set GetJobsInProduction to run every 30 seconds
   - Keep dashboard data up-to-date

2. **Add More Features** (Optional)
   - Job count statistics
   - Due date warnings
   - Team assignment
   - Time tracking integration

3. **Production Deployment**
   - Enable authentication
   - Set up proper SSL certificates
   - Configure environment variables
   - Test with real production data

4. **Training**
   - Train production team on dashboard usage
   - Create quick reference guide
   - Set up support channel

---

## 📞 Support

If you encounter issues:

1. Check Troubleshooting section above
2. Review console logs (F12 → Console)
3. Check Strapi API response (F12 → Network)
4. Verify all services are running: `docker-compose ps`
5. Check GitHub issues: https://github.com/hypnotizedent/printshop-os/issues

---

**Happy Dashboard Building! 🚀**
