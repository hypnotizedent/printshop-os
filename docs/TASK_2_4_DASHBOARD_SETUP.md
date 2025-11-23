# Task 2.4: Production Dashboard Setup

**Phase:** 2 | **Priority:** 🔴 Critical | **Effort:** 12-16 hours

---

## 📋 Overview

Connect Appsmith dashboard to Strapi backend and build operator-facing production dashboard. This is where production team manages jobs in real-time.

## 🎯 Goals

1. ✅ Appsmith connects to Strapi API
2. ✅ Job list displays all "In Production" jobs
3. ✅ Job details view with mockup, instructions, quantities
4. ✅ Mark Complete button updates Strapi
5. ✅ Real-time status updates via polling/WebSocket
6. ✅ Mobile-responsive layout

---

## 🏗️ Architecture

### Current State
```
Strapi (Port 1337)
├── Collections: Orders, Quotes, Customers, Products, Jobs, TimeClocks
├── API Tokens: ✅ Generated
├── JWT Auth: ✅ Ready
└── Status Tracking: ✅ Ready

Appsmith (Port 8080)
├── Currently: Disconnected
├── Need: API integration
├── Need: Job list views
└── Need: Control buttons
```

### Target State
```
Production Team
    ↓
[Appsmith Dashboard]
    ↓ API Calls
[Strapi API]
    ↓
[PostgreSQL Jobs Table]

Features:
- Real-time job list
- Job details modal
- Mark complete button
- Status change tracking
- Team assignment (if needed)
```

---

## 📝 Detailed Setup Steps

### Step 1: Appsmith Setup & Configuration

#### 1.1 Access Appsmith
```bash
# Appsmith should be running at:
http://localhost:8080

# Create new application:
- Name: PrintShop Production Dashboard
- Color: Blue
- Enable responsive mode
```

#### 1.2 Create Strapi API Connector
```
In Appsmith:
1. Click "+" → New Connector
2. Select "REST API"
3. Configure:

   Name: StrapiAPI
   
   Base URL: http://localhost:1337
   
   Headers:
   - Authorization: Bearer [STRAPI_API_TOKEN]
   - Content-Type: application/json
   
   Test Connection ✅
```

**Where to get `STRAPI_API_TOKEN`:**
```bash
# Get token from Strapi admin:
1. http://localhost:1337/admin
2. Settings → API Tokens
3. Create API Token (read/write Jobs, Orders, Quotes, Products)
4. Copy token → paste in Appsmith
```

#### 1.3 Create Data Sources (Read Operations)

**Data Source 1: Get All Jobs (In Production)**
```
Name: GetJobsInProduction

Query Type: REST API

URL: {{StrapiAPI.baseUrl}}/api/jobs?filters[status][$eq]=In%20Production&sort=created_at:desc

Method: GET

Response Format: JSON

Test → Should return job list
```

**Data Source 2: Get Job Details (By ID)**
```
Name: GetJobById

URL: {{StrapiAPI.baseUrl}}/api/jobs/{{jobIdInput.value}}

Method: GET

Response → Returns single job with all fields
```

**Data Source 3: Get Products (for dropdown)**
```
Name: GetAllProducts

URL: {{StrapiAPI.baseUrl}}/api/products?pagination[limit]=100

Method: GET

Used for: Product type lookup in job details
```

---

### Step 2: Build Job List View

#### 2.1 Create Main Table

```
Component: Table
Name: JobsTable

Data Source: GetJobsInProduction.data

Columns Configuration:
┌─────────────────────────────────────────────────────────────────┐
│ Job ID (200px)       │ Customer      │ Status    │ Created   │  │
├─────────────────────────────────────────────────────────────────┤
│ JOB-2025-001         │ Acme Corp     │ In Prod   │ Nov 23    │  │
│ JOB-2025-002         │ Tech Startup  │ In Prod   │ Nov 23    │  │
└─────────────────────────────────────────────────────────────────┘

Column Details:
1. Job ID: {{currentRow.data.id}}
2. Customer: {{currentRow.data.customer.name}}
3. Status: {{currentRow.data.status}}
4. Created: {{moment(currentRow.data.created_at).format('MMM DD')}}
5. View Details: Button → opens modal
6. Mockup: Image → {{currentRow.data.mockup_url}}

Styling:
- Row height: 60px
- Font: 14px
- Hover highlight: light gray
- Mobile: Stack columns on <768px
```

#### 2.2 Add Refresh Button

```
Component: Button
Name: RefreshJobsButton

Label: "🔄 Refresh"

On Click: 
- Run GetJobsInProduction query
- Show toast: "Jobs updated"
- Auto-refresh: Every 30 seconds (optional WebSocket later)
```

#### 2.3 Add Filters

```
Component: Select
Name: StatusFilter

Options:
- All
- In Production
- Pending Approval
- Complete

On Change:
- Update GetJobsInProduction query with filter
- Re-run table
```

---

### Step 3: Build Job Details Modal

#### 3.1 Create Modal Window

```
Component: Modal
Name: JobDetailsModal

Trigger: Click row in JobsTable

Content:
┌─────────────────────────────────────────────────────────┐
│ Job Details: {{selectedJob.data.id}}                  X │
├─────────────────────────────────────────────────────────┤
│ [Mockup Image - 400px tall]                            │
├─────────────────────────────────────────────────────────┤
│ Customer: {{selectedJob.data.customer.name}}           │
│ Quantity: {{selectedJob.data.quantity}}                │
│ Print Locations: {{selectedJob.data.print_locations}}  │
│ Colors: {{selectedJob.data.color_count}}               │
│ Special Notes: {{selectedJob.data.notes}}              │
├─────────────────────────────────────────────────────────┤
│ [Mark Complete] [On Hold] [Need Help] [Close]          │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 Modal Components

**Image Display:**
```
Component: Image
URL: {{JobDetailsModal.selectedRow.mockup_url}}
Height: 400px
Width: 100%
Fit: Cover
```

**Job Info Section:**
```
Component: Text
- Customer Name
- Quantity
- Garment Type
- Print Locations (multi-line)
- Ink Colors
- Special Instructions/Notes
- Assigned To: {{JobDetailsModal.selectedRow.assigned_to}}
```

**Action Buttons:**
```
Button 1: Mark Complete
- Color: Green
- On Click: UpdateJobStatus("Complete")

Button 2: On Hold
- Color: Yellow
- On Click: UpdateJobStatus("On Hold")

Button 3: Need Help
- Color: Red
- On Click: NotifyManager()

Button 4: Close
- On Click: CloseModal()
```

---

### Step 4: Build Update Operations

#### 4.1 Update Job Status Query

```
Name: UpdateJobStatus

Query Type: REST API

URL: {{StrapiAPI.baseUrl}}/api/jobs/{{jobId}}

Method: PUT

Body (JSON):
{
  "data": {
    "status": "{{newStatus}}",
    "updated_at": "{{moment().toISOString()}}"
  }
}

On Success:
- Close modal
- Refresh JobsTable
- Show toast: "Job updated to {{newStatus}}"

On Error:
- Show error toast
- Log to console
```

#### 4.2 Notify Manager (Slack/Email)

```
Name: NotifyManager

Query Type: Webhook

URL: [Your webhook endpoint]

Method: POST

Body:
{
  "job_id": "{{jobId}}",
  "status": "NEEDS_HELP",
  "message": "Operator needs help on job {{jobId}}"
}

On Success: Show toast "Manager notified"
```

---

### Step 5: Mobile Responsiveness

#### 5.1 Responsive Grid Layout

```css
/* Desktop (>1024px) */
- 3-column grid
- Full details visible

/* Tablet (768-1024px) */
- 2-column grid
- Compact details

/* Mobile (<768px) */
- 1-column stack
- Simplified view
- Larger touch buttons
```

#### 5.2 Mobile Layout

```
Header: [🔄] [Filter ▼]
┌──────────────────────┐
│ [Mockup Image]       │
│                      │
├──────────────────────┤
│ JOB-2025-001         │
│ Acme Corp            │
│ Qty: 100             │
│ Front + Back Print   │
│ 3 Colors             │
├──────────────────────┤
│ [✓ Complete]         │
│ [⏸ On Hold]          │
│ [❓ Help]            │
│ [Close]              │
└──────────────────────┘
```

---

### Step 6: Real-Time Updates (WebSocket Prep)

#### 6.1 Add Polling for Now

```javascript
// Set refresh interval
setInterval(() => {
  GetJobsInProduction.run();
}, 30000); // Every 30 seconds
```

#### 6.2 Later: WebSocket Integration

```typescript
// Future enhancement
const socket = io('http://localhost:3004');
socket.on('job:updated', (jobData) => {
  JobsTable.refresh();
});
```

---

### Step 7: Styling & Branding

#### 7.1 Color Scheme

```
Primary: #2563EB (Blue)
Success: #16A34A (Green) - Complete
Warning: #EAB308 (Yellow) - On Hold
Danger: #DC2626 (Red) - Help Needed
Background: #F8FAFC (Light)
```

#### 7.2 Typography

```
Header: 24px bold
Title: 16px bold
Body: 14px
Small: 12px gray
```

---

## 🧪 Testing Checklist

- [ ] Appsmith connects to Strapi ✅
- [ ] Job list loads (if jobs exist in Strapi)
- [ ] Filters work (status, customer, date)
- [ ] Click job opens modal
- [ ] Modal displays all job details correctly
- [ ] Mockup image displays
- [ ] Mark Complete updates Strapi job status
- [ ] Modal closes after update
- [ ] Table refreshes after update
- [ ] Mobile layout responsive
- [ ] Buttons work on touch devices
- [ ] Error handling works (network down, invalid data)
- [ ] Refresh button works
- [ ] Auto-refresh every 30s works

---

## 📊 Database Requirements

Ensure Strapi Job collection has these fields:
```typescript
Job {
  id: string              // JOB-2025-001
  status: enum            // In Production, Complete, On Hold, etc.
  customer: relation      // → Customer
  order: relation         // → Order
  quote: relation         // → Quote
  quantity: number
  print_locations: string[]  // ["front", "back", "sleeve"]
  color_count: number
  mockup_url: string      // S3 URL
  notes: string
  assigned_to: string     // Team member name
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🚀 Deployment Checklist

- [ ] Strapi running at http://localhost:1337
- [ ] Appsmith running at http://localhost:8080
- [ ] API token created in Strapi
- [ ] Connector configured in Appsmith
- [ ] Queries tested
- [ ] Dashboard deployed
- [ ] Team can access at: http://localhost:8080/app/production-dashboard
- [ ] Mobile tested on phone

---

## 📚 Useful Links

**Appsmith Docs:**
- REST API: https://docs.appsmith.com/reference/appsmith-framework/latest/apis/rest-api
- Table Widget: https://docs.appsmith.com/reference/widgets/table
- Modal: https://docs.appsmith.com/reference/widgets/modal

**Strapi Docs:**
- API Documentation: http://localhost:1337/documentation
- API Tokens: https://docs.strapi.io/user-docs/settings/managing-global-settings#managing-api-tokens

---

## ⏱️ Estimated Timeline

- Setup & Config: 2 hours
- Build Views: 4 hours
- Add Update Logic: 3 hours
- Styling & Mobile: 2 hours
- Testing & Polish: 1-2 hours
- **Total: 12-16 hours**

---

## 🎯 Success Criteria

✅ Production team can see all jobs  
✅ Click job → view details + mockup  
✅ Mark job complete → status updates in real-time  
✅ Dashboard works on desktop & mobile  
✅ Auto-refresh keeps data current  
✅ Zero errors in production use  

---

## 🔗 Next Steps

**After 2.4 Complete:**
- Add time clock system (Task 2.5)
- Add press-ready checklist (Task 2.6)
- Implement WebSocket for real-time updates
- Add team notifications
- Advanced analytics
