# Phase 2: Appsmith Dashboard - Internal Production Interface

## Overview

This guide provides detailed instructions for building the internal production dashboard using Appsmith. This low-code platform will allow your production team to view jobs, update statuses, and manage time tracking from mobile devices.

**Estimated Time:** 3-4 hours for complete setup  
**Skill Level:** Beginner to Intermediate (no coding required, JavaScript helpful)  
**Prerequisites:** Phase 1 (Strapi) completed and running

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Appsmith Setup](#appsmith-setup)
3. [Connecting to Strapi](#connecting-to-strapi)
4. [Building the Job List View](#building-the-job-list-view)
5. [Creating Job Details Page](#creating-job-details-page)
6. [Implementing Mark as Complete](#implementing-mark-as-complete)
7. [Building Time Clock Interface](#building-time-clock-interface)
8. [Mobile Responsiveness](#mobile-responsiveness)
9. [Testing Checklist](#testing-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Phase 1 Complete**: Strapi running with collection types created
- **Strapi API Token**: Generated in Phase 1
- **Strapi URL**: e.g., `http://localhost:1337`
- **Sample Data**: At least one customer and job in Strapi

### Optional

- Appsmith Cloud account (easier) OR
- Self-hosted Appsmith instance (more control)

---

## Appsmith Setup

### Option A: Appsmith Cloud (Recommended for MVP)

**Advantages:**
- Quick setup (5 minutes)
- No infrastructure management
- Free tier available
- Automatic updates

**Steps:**

1. **Create Account:**
   - Go to [https://app.appsmith.com/signup](https://app.appsmith.com/signup)
   - Sign up with email or Google/GitHub account
   - Verify your email

2. **Create Workspace:**
   - Enter workspace name: `PrintShop Production`
   - Click **Create Workspace**

3. **Create Application:**
   - Click **+ New** button
   - Click **Create New**
   - Name: `Production Dashboard`
   - Click **Create**

**Expected Result:** You're now in the Appsmith editor with a blank canvas.

### Option B: Self-Hosted Appsmith

**Advantages:**
- Full data control
- Custom branding
- No vendor dependency

**Docker Setup:**

```bash
# Create directory
mkdir appsmith
cd appsmith

# Download docker-compose.yml
curl -L https://bit.ly/appsmith-docker -o docker-compose.yml

# Start Appsmith
docker-compose up -d

# View logs
docker-compose logs -f appsmith
```

**Access:**
- URL: `http://localhost:8080`
- Create admin account on first visit
- Then follow Option A steps 2-3

---

## Connecting to Strapi

### Step 1: Create Datasource

1. In Appsmith editor, click **Explorer** (left sidebar)
2. Click **+** next to **Datasources**
3. Select **Authenticated API**
4. Name it: `Strapi API`

### Step 2: Configure Datasource

**Configuration:**
```
Name: Strapi API
URL: http://localhost:1337/api
  (Or your Strapi URL - use http://host.docker.internal:1337/api for Docker)

Headers:
  Key: Authorization
  Value: Bearer YOUR_API_TOKEN_FROM_PHASE_1

Authentication Type: None (we're using header for auth)
```

**Important:** Replace `YOUR_API_TOKEN_FROM_PHASE_1` with your actual token.

### Step 3: Test Connection

1. Click **+ New Query** next to Strapi API datasource
2. Name it: `TestConnection`
3. Method: `GET`
4. Path: `/customers`
5. Click **Run**

**Expected Result:** You should see a list of customers in the response panel.

If successful, you're connected! If not, see [Troubleshooting](#troubleshooting).

---

## Building the Job List View

### Overview

The Job List view displays all jobs with status "In Production" in a table format optimized for mobile viewing.

### Step 1: Create New Page

1. Click **Pages** in Explorer
2. Click **+** next to Pages
3. Name: `Job List`
4. Click **Add**

### Step 2: Create Query for Jobs

1. Click **+** next to **Queries/JS**
2. Click **+ New Query**
3. Select **Strapi API**
4. Name: `GetProductionJobs`

**Configure Query:**
```
Method: GET
Path: /jobs
Query Params:
  filters[Status][$eq]: In Production
  populate: customer
  sort: createdAt:desc

Run query on page load: ✓ (checked)
```

5. Click **Run** to test
6. You should see jobs in response

### Step 3: Add Table Widget

1. Click **Widgets** tab in left sidebar
2. Find **Table** widget
3. Drag it onto the canvas
4. Resize to fill most of the screen

### Step 4: Configure Table

**Select the Table widget**, then configure in right panel:

**Data (in Properties panel):**
```javascript
{{GetProductionJobs.data.data.map(item => ({
  id: item.id,
  JobID: item.attributes.JobID,
  Customer: item.attributes.customer?.data?.attributes?.Name || 'N/A',
  Quantity: item.attributes.Quantity,
  Status: item.attributes.Status,
  MockupURL: item.attributes.MockupImageURL
}))}}
```

**Columns:**

1. **Hide** the `id` column (click eye icon)
2. **JobID** column:
   - Column Type: Text
   - Width: 150px
3. **Customer** column:
   - Column Type: Text
   - Width: 200px
4. **Quantity** column:
   - Column Type: Number
   - Width: 100px
5. **Status** column:
   - Column Type: Text
   - Width: 150px
6. **MockupURL** column:
   - Column Type: Image
   - Width: 100px
   - Image Size: Cover

**Table Settings:**
- Enable **Search**: ✓
- Enable **Filters**: ✓
- Enable **Download**: ✗ (not needed for mobile)
- Server side pagination: ✗ (client-side for now)

### Step 5: Add Actions Column

1. Add a new column by clicking **+Add Column**
2. Name: `Actions`
3. Column Type: Button
4. Button Label: `View Details`
5. Button Color: Primary

### Step 6: Test the View

1. Click **Deploy** (top right)
2. Open in new tab to see live version
3. You should see your jobs listed

**Mobile Test:**
1. Open browser developer tools (F12)
2. Toggle device toolbar (mobile view)
3. Verify table is scrollable and readable

---

## Creating Job Details Page

### Step 1: Create Details Page

1. Click **+ New** next to Pages
2. Name: `Job Details`
3. Click **Add**

### Step 2: Setup Page Navigation

**Back to Job List page:**

1. Select the **View Details** button in the Actions column of the table
2. In properties panel, find **onClick** event
3. Select **Navigate to**
4. Page: `Job Details`
5. Query params:
   ```javascript
   {
     "jobId": Table1.selectedRow.id
   }
   ```

### Step 3: Create Query for Single Job

On the Job Details page:

1. Create new query: `GetJobDetails`
2. Datasource: **Strapi API**
3. Method: `GET`
4. Path: `/jobs/{{appsmith.URL.queryParams.jobId}}`
5. Query Params:
   ```
   populate: customer
   ```
6. Run on page load: ✓

### Step 4: Build Details Layout

**Add Container Widget:**
1. Drag **Container** widget to canvas
2. Name it: `JobDetailsContainer`

**Inside Container, add widgets:**

**1. Text Widget - Job ID:**
- Text: `Job: {{GetJobDetails.data.data.attributes.JobID}}`
- Font Size: 24px
- Font Weight: Bold

**2. Image Widget - Mockup:**
- Image URL: `{{GetJobDetails.data.data.attributes.MockupImageURL}}`
- Object Fit: Contain
- Height: 300px

**3. Text Widget - Customer:**
- Text: `Customer: {{GetJobDetails.data.data.attributes.customer.data.attributes.Name}}`
- Font Size: 18px

**4. Text Widget - Quantity:**
- Text: `Quantity: {{GetJobDetails.data.data.attributes.Quantity}}`
- Font Size: 16px

**5. Text Widget - Status:**
- Text: `Status: {{GetJobDetails.data.data.attributes.Status}}`
- Font Size: 16px
- Text Color: Conditional
  ```javascript
  {{
    GetJobDetails.data.data.attributes.Status === 'In Production' ? '#FFA500' : 
    GetJobDetails.data.data.attributes.Status === 'Complete' ? '#00AA00' : 
    '#999999'
  }}
  ```

**6. Text Widget - Ink Colors:**
- Text: 
  ```javascript
  Ink Colors: {{
    GetJobDetails.data.data.attributes.InkColors 
      ? GetJobDetails.data.data.attributes.InkColors.join(', ') 
      : 'Not specified'
  }}
  ```

**7. Text Widget - Imprint Locations:**
- Text:
  ```javascript
  Locations: {{
    GetJobDetails.data.data.attributes.ImprintLocations 
      ? GetJobDetails.data.data.attributes.ImprintLocations.join(', ') 
      : 'Not specified'
  }}
  ```

**8. Button Widget - Art File:**
- Text: `Download Art File`
- Visible:
  ```javascript
  {{!!GetJobDetails.data.data.attributes.ArtFileURL}}
  ```
- onClick:
  ```javascript
  {{
    navigateTo(GetJobDetails.data.data.attributes.ArtFileURL, {}, 'NEW_WINDOW')
  }}
  ```

---

## Implementing Mark as Complete

### Step 1: Create Update Query

On Job Details page:

1. Create new query: `UpdateJobStatus`
2. Datasource: **Strapi API**
3. Method: `PUT`
4. Path: `/jobs/{{appsmith.URL.queryParams.jobId}}`
5. Body:
   ```json
   {
     "data": {
       "Status": "Complete"
     }
   }
   ```
6. Run on page load: ✗ (uncheck)

### Step 2: Add Complete Button

1. Add **Button** widget below job details
2. Text: `Mark as Complete`
3. Button Style: Success (green)
4. Visible:
  ```javascript
  {{GetJobDetails.data.data.attributes.Status === 'In Production'}}
  ```

### Step 3: Configure Button Action

**onClick event:**
1. First action: Execute query `UpdateJobStatus`
2. onSuccess callback:
   ```javascript
   {{
     showAlert('Job marked as complete!', 'success');
     GetJobDetails.run();
   }}
   ```

### Step 4: Add Confirmation

Make it safer with confirmation:

**onClick:**
```javascript
{{
  showModal('ConfirmCompleteModal')
}}
```

**Create Modal:**
1. Add **Modal** widget
2. Name: `ConfirmCompleteModal`
3. Title: `Confirm Completion`
4. Add **Text**: `Are you sure you want to mark this job as complete?`
5. Add **Button Group**:
   - Button 1: `Cancel` → closes modal
   - Button 2: `Confirm` → executes `UpdateJobStatus` then closes modal

---

## Building Time Clock Interface

### Step 1: Create Time Clock Page

1. New page: `Time Clock`
2. Add to navigation menu

### Step 2: Create Employee Query

1. New query: `GetEmployees`
2. Datasource: **Strapi API**
3. Method: `GET`
4. Path: `/employees`
5. Run on page load: ✓

### Step 3: Add Employee Select

1. Add **Select** widget
2. Name: `EmployeeSelect`
3. Options:
   ```javascript
   {{
     GetEmployees.data.data.map(emp => ({
       label: emp.attributes.Name,
       value: emp.id
     }))
   }}
   ```
4. Placeholder: `Select Employee`
5. Label: `Employee`

### Step 4: Add Current Time Display

1. Add **Text** widget
2. Text:
   ```javascript
   {{moment().format('MMMM Do YYYY, h:mm:ss a')}}
   ```
3. Font Size: 20px
4. Update every second using interval

### Step 5: Create Clock In Query

1. New query: `ClockIn`
2. Datasource: **Strapi API**
3. Method: `POST`
4. Path: `/time-clock-entries`
5. Body:
   ```json
   {
     "data": {
       "Timestamp": "{{moment().toISOString()}}",
       "EntryType": "Clock In",
       "employee": {{EmployeeSelect.selectedOptionValue}}
     }
   }
   ```
6. Run on page load: ✗

### Step 6: Create Clock Out Query

Copy `ClockIn` query:
1. Duplicate query (right-click → Duplicate)
2. Rename to: `ClockOut`
3. Change Body:
   ```json
   {
     "data": {
       "Timestamp": "{{moment().toISOString()}}",
       "EntryType": "Clock Out",
       "employee": {{EmployeeSelect.selectedOptionValue}}
     }
   }
   ```

### Step 7: Add Clock Buttons

**Clock In Button:**
1. Add **Button** widget
2. Text: `Clock In`
3. Button Style: Primary
4. Disabled:
   ```javascript
   {{!EmployeeSelect.selectedOptionValue}}
   ```
5. onClick:
   ```javascript
   {{
     ClockIn.run(() => {
       showAlert('Clocked in successfully!', 'success');
     });
   }}
   ```

**Clock Out Button:**
1. Add **Button** widget
2. Text: `Clock Out`
3. Button Style: Danger
4. Disabled:
   ```javascript
   {{!EmployeeSelect.selectedOptionValue}}
   ```
5. onClick:
   ```javascript
   {{
     ClockOut.run(() => {
       showAlert('Clocked out successfully!', 'success');
     });
   }}
   ```

---

## Mobile Responsiveness

### Auto Layout Configuration

Appsmith uses auto-layout for responsive design:

1. **Click Canvas Settings** (gear icon near top)
2. **Auto Layout**: Ensure enabled
3. **Width**: Auto (responsive)

### Mobile-Specific Settings

**For Table (Job List):**
- Hide less important columns on mobile
- Enable horizontal scroll
- Increase row height for touch targets

**For Buttons:**
- Minimum height: 44px (Apple's touch target guideline)
- Full width on mobile
- Adequate spacing between buttons

### Testing Mobile View

1. **Deploy** your application
2. Open URL on mobile device OR
3. Use browser dev tools:
   - Press F12
   - Click device toolbar icon
   - Select device (iPhone, Android)
   - Test all pages

**Test Checklist:**
- [ ] All text is readable
- [ ] Buttons are tappable
- [ ] Tables scroll horizontally
- [ ] Images load and display correctly
- [ ] Forms are usable
- [ ] No horizontal page scrolling needed

---

## Testing Checklist

### Functionality Tests

**Job List Page:**
- [ ] Jobs load automatically
- [ ] Only "In Production" jobs shown
- [ ] Customer names display correctly
- [ ] Search works
- [ ] View Details button navigates correctly

**Job Details Page:**
- [ ] Job details load correctly
- [ ] All fields display properly
- [ ] Images load
- [ ] Mark as Complete button works
- [ ] Status updates reflect immediately
- [ ] Navigation back to list works

**Time Clock Page:**
- [ ] Employee list populates
- [ ] Current time displays
- [ ] Clock In creates entry
- [ ] Clock Out creates entry
- [ ] Success messages appear
- [ ] Cannot clock in/out without selecting employee

### Data Validation

Verify in Strapi admin panel:
- [ ] Job status changes persist
- [ ] Time clock entries created with correct timestamps
- [ ] Employee associations correct

### Performance Tests

- [ ] Pages load in < 3 seconds
- [ ] No console errors
- [ ] Queries don't timeout
- [ ] Images load quickly

### Mobile Tests

- [ ] All pages usable on mobile
- [ ] No horizontal scrolling
- [ ] Buttons easy to tap
- [ ] Text readable without zooming

---

## Troubleshooting

### Issue: "Cannot connect to datasource"

**Symptoms:** Queries fail, connection error

**Solutions:**
1. Verify Strapi is running:
   ```bash
   curl http://localhost:1337/api/customers
   ```
2. Check API token is correct
3. For Docker Appsmith connecting to local Strapi:
   - Use `http://host.docker.internal:1337/api` instead of `localhost`
4. Check CORS settings in Strapi (should allow Appsmith domain)

### Issue: "Data not displaying in table"

**Symptoms:** Table is empty or shows errors

**Solutions:**
1. Check query response:
   - Click on query
   - View **Response** tab
   - Ensure data structure matches
2. Verify data transformation:
   ```javascript
   {{GetProductionJobs.data.data}} // Check this exists
   ```
3. Add sample data in Strapi if database is empty

### Issue: "Navigation not working"

**Symptoms:** View Details button doesn't navigate

**Solutions:**
1. Check page name is exact match
2. Verify query params are set:
   ```javascript
   {
     "jobId": Table1.selectedRow.id
   }
   ```
3. Ensure table has selectedRow (row must be clickable)

### Issue: "Update button not working"

**Symptoms:** Mark as Complete doesn't update

**Solutions:**
1. Check API permissions in Strapi (Settings → Roles)
2. Verify query path includes job ID:
   ```
   /jobs/{{appsmith.URL.queryParams.jobId}}
   ```
3. Check request body format
4. Look for error in query response

### Issue: "Images not loading"

**Symptoms:** Mockup images don't display

**Solutions:**
1. Verify image URLs are valid
2. Check CORS if images from external source
3. Use placeholder if URL is null:
   ```javascript
   {{
     GetJobDetails.data.data.attributes.MockupImageURL || 
     'https://via.placeholder.com/300'
   }}
   ```

---

## Next Steps

After completing Phase 2:

1. **Test thoroughly** on both desktop and mobile
2. **Gather feedback** from production team
3. **Document any customizations** made
4. **Prepare for Phase 3**: [Botpress Integration](phase-3-botpress.md)

---

## Additional Resources

- [Appsmith Documentation](https://docs.appsmith.com/)
- [Appsmith Community Forum](https://community.appsmith.com/)
- [JavaScript in Appsmith](https://docs.appsmith.com/core-concepts/writing-code)
- [Widget Reference](https://docs.appsmith.com/reference/widgets)

---

**Phase 2 Complete! ✅**

You now have a functional mobile-optimized production dashboard for managing jobs and tracking time.
