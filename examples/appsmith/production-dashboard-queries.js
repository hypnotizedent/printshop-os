/**
 * Appsmith Queries for Production Dashboard
 * 
 * Installation:
 * 1. Create a new Appsmith page "Production Dashboard"
 * 2. Add these queries in the Query Editor
 * 3. Configure Strapi datasource with API token
 * 4. Bind queries to UI widgets
 * 
 * Prerequisites:
 * - Strapi API token with read/write access to jobs collection
 * - Appsmith REST API datasource named "StrapiAPI"
 */

// =============================================================================
// Query 1: Get Jobs In Production
// =============================================================================
// Name: GetJobsInProduction
// Type: REST API
// Method: GET
// URL: {{StrapiAPI.baseUrl}}/api/jobs?filters[status][$eq]=InProduction&sort[0]=dueDate:asc&populate=customer

// This query fetches all jobs with status "InProduction"
// Sorted by due date (earliest first)
// Includes customer relation

// Response Structure:
// {
//   data: [
//     {
//       id: 1,
//       attributes: {
//         jobNumber: "JOB-2025-001",
//         title: "T-Shirt Print Job",
//         status: "InProduction",
//         dueDate: "2025-11-30",
//         productionNotes: "Rush order",
//         mockupUrls: ["https://example.com/mockup.jpg"],
//         customer: {
//           data: {
//             id: 1,
//             attributes: {
//               name: "Acme Corp",
//               email: "contact@acme.com"
//             }
//           }
//         }
//       }
//     }
//   ]
// }

// =============================================================================
// Query 2: Get Job Details By ID
// =============================================================================
// Name: GetJobById
// Type: REST API
// Method: GET
// URL: {{StrapiAPI.baseUrl}}/api/jobs/{{Table1.selectedRow.id}}?populate=*

// This query fetches detailed information for a selected job
// Triggered when a row is clicked in the jobs table
// Populates all relations (customer, order, quote)

// =============================================================================
// Query 3: Update Job Status
// =============================================================================
// Name: UpdateJobStatus
// Type: REST API
// Method: PUT
// URL: {{StrapiAPI.baseUrl}}/api/jobs/{{JobDetailsModal.selectedJobId}}

// Body (JSON):
{
  "data": {
    "status": "{{JobDetailsModal.newStatus}}"
  }
}

// Triggered when clicking "Mark Complete", "On Hold", or other status buttons
// Updates the job status in Strapi

// =============================================================================
// Query 4: Get All Jobs (With Filters)
// =============================================================================
// Name: GetAllJobs
// Type: REST API
// Method: GET
// URL: {{StrapiAPI.baseUrl}}/api/jobs?filters[status][$eq]={{StatusFilter.selectedOptionValue || "InProduction"}}&sort[0]=dueDate:asc&populate=customer&pagination[pageSize]=50

// This query supports filtering by status
// Used with status dropdown filter

// =============================================================================
// Query 5: Get Job Counts By Status
// =============================================================================
// Name: GetJobCounts
// Type: REST API (Custom)
// Method: GET
// URL: {{StrapiAPI.baseUrl}}/api/jobs?fields[0]=id&fields[1]=status

// JavaScript transformer to count jobs by status:
{{
  const statusCounts = {
    InProduction: 0,
    Ready: 0,
    Pending: 0,
    Complete: 0,
    Cancelled: 0
  };
  
  if (GetJobCounts.data && GetJobCounts.data.data) {
    GetJobCounts.data.data.forEach(job => {
      const status = job.attributes.status;
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });
  }
  
  return statusCounts;
}}

// =============================================================================
// Query 6: Create New Job (Optional)
// =============================================================================
// Name: CreateJob
// Type: REST API
// Method: POST
// URL: {{StrapiAPI.baseUrl}}/api/jobs

// Body (JSON):
{
  "data": {
    "jobNumber": "{{NewJobForm.jobNumber}}",
    "title": "{{NewJobForm.title}}",
    "status": "Pending",
    "dueDate": "{{NewJobForm.dueDate}}",
    "productionNotes": "{{NewJobForm.productionNotes}}",
    "customer": "{{NewJobForm.customerId}}"
  }
}

// =============================================================================
// JavaScript Helper Functions
// =============================================================================

// Function: formatJobData
// Transforms Strapi response for table display
{{
  if (!GetJobsInProduction.data || !GetJobsInProduction.data.data) {
    return [];
  }
  
  return GetJobsInProduction.data.data.map(job => ({
    id: job.id,
    jobNumber: job.attributes.jobNumber,
    title: job.attributes.title,
    status: job.attributes.status,
    dueDate: job.attributes.dueDate,
    customer: job.attributes.customer?.data?.attributes?.name || 'N/A',
    customerId: job.attributes.customer?.data?.id,
    productionNotes: job.attributes.productionNotes,
    mockupUrls: job.attributes.mockupUrls || [],
    artFileUrls: job.attributes.artFileUrls || []
  }));
}}

// Function: getStatusColor
// Returns color based on job status
{{
  const colors = {
    InProduction: '#2196F3',  // Blue
    Ready: '#4CAF50',          // Green
    Pending: '#FF9800',        // Orange
    Complete: '#9E9E9E',       // Gray
    Cancelled: '#F44336'       // Red
  };
  
  return colors[Table1.selectedRow?.status] || '#757575';
}}

// Function: getDaysUntilDue
// Calculates days until due date
{{
  const dueDate = moment(Table1.selectedRow?.dueDate);
  const today = moment();
  const daysUntil = dueDate.diff(today, 'days');
  
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`;
  } else if (daysUntil === 0) {
    return 'Due today';
  } else if (daysUntil === 1) {
    return 'Due tomorrow';
  } else {
    return `${daysUntil} days until due`;
  }
}}

// =============================================================================
// Widget Bindings
// =============================================================================

/*
1. Jobs Table Widget (Table1):
   - Data: {{formatJobData}}
   - Columns:
     * Job Number (jobNumber)
     * Title (title)
     * Customer (customer)
     * Due Date (dueDate) - Formatted as {{moment(currentRow.dueDate).format('MMM DD, YYYY')}}
     * Status (status) - With color badges
     * Actions (Button column)
   - On Row Selected: 
     * Open JobDetailsModal
     * Run GetJobById query
   - Server-side pagination: false
   - Enable search: true
   - Enable sorting: true

2. Job Details Modal (JobDetailsModal):
   - Show: Controlled by showJobDetails variable
   - Width: 600px
   - Components:
     * Header: Job #{{Table1.selectedRow.jobNumber}}
     * Image: {{Table1.selectedRow.mockupUrls[0]}} (with fallback)
     * Customer: {{Table1.selectedRow.customer}}
     * Due Date: {{moment(Table1.selectedRow.dueDate).format('MMMM DD, YYYY')}}
     * Production Notes: {{Table1.selectedRow.productionNotes}}
     * Status: {{Table1.selectedRow.status}}
     * Action Buttons (see below)

3. Status Buttons:
   a. Mark Complete Button:
      - Label: ✓ Complete
      - Color: Green (#4CAF50)
      - On Click:
        * Set newStatus to "Complete"
        * Run UpdateJobStatus
        * Run GetJobsInProduction (refresh table)
        * Close modal
        * Show success message
   
   b. Mark Ready Button:
      - Label: ✓ Ready
      - Color: Green
      - On Click: Same as Complete but status="Ready"
   
   c. Put On Hold Button:
      - Label: ⏸ On Hold
      - Color: Orange (#FF9800)
      - On Click: Same pattern but status="Pending"
   
   d. Cancel Button:
      - Label: ✕ Cancel Job
      - Color: Red (#F44336)
      - On Click: Same pattern but status="Cancelled"
      - Require confirmation

4. Status Filter (StatusFilter):
   - Type: Select
   - Options:
     * All Jobs
     * In Production
     * Ready
     * Pending
     * Complete
   - Default: In Production
   - On Change: Run GetAllJobs

5. Refresh Button:
   - Label: 🔄 Refresh
   - On Click: Run GetJobsInProduction

6. Status Count Cards:
   - In Production: {{GetJobCounts.InProduction}}
   - Ready: {{GetJobCounts.Ready}}
   - Pending: {{GetJobCounts.Pending}}
   - Complete (Today): {{GetJobCounts.Complete}}

7. Days Until Due Indicator:
   - Text: {{getDaysUntilDue}}
   - Color: 
     * Red if overdue
     * Orange if < 2 days
     * Green if >= 2 days
*/

// =============================================================================
// Auto-refresh Configuration
// =============================================================================

// Set these queries to auto-refresh:
// - GetJobsInProduction: Every 30 seconds
// - GetJobCounts: Every 60 seconds

// In query settings:
// ☑ Run query on page load
// ☑ Request confirmation before running: false
// Query timeout (ms): 10000

// =============================================================================
// Mobile Responsiveness
// =============================================================================

// Table responsive configuration:
// - Desktop (>1024px): Show all columns
// - Tablet (768-1024px): Hide production notes column
// - Mobile (<768px): Show only job number, customer, and due date

// Modal responsive configuration:
// - Desktop: 600px width
// - Tablet: 90% width, max 500px
// - Mobile: 95% width, full height

// Button sizes:
// - Minimum height: 44px (touch-friendly)
// - Minimum width: 100px
// - Font size: 14px minimum

// =============================================================================
// Error Handling
// =============================================================================

// Add error handlers to all queries:
{{
  if (GetJobsInProduction.isError) {
    showAlert('Failed to load jobs. Please check your connection.', 'error');
  }
  
  if (UpdateJobStatus.isError) {
    showAlert('Failed to update job status. Please try again.', 'error');
  }
}}

// Network error fallback:
// - Show "Offline" indicator
// - Cache last successful data
// - Retry button

// =============================================================================
// Performance Optimization
// =============================================================================

// 1. Use pagination for large datasets
// 2. Limit mockupUrls to first image in table view
// 3. Lazy load images in modal
// 4. Debounce search input (500ms)
// 5. Cache status counts for 60 seconds

// =============================================================================
// Testing Checklist
// =============================================================================

/*
✓ Load dashboard - table shows jobs
✓ Click job - modal opens with details
✓ Mark complete - status updates, job disappears from table
✓ Status filter - changes displayed jobs
✓ Search - filters by job number or customer
✓ Refresh - updates table data
✓ Mobile view - responsive layout
✓ Offline handling - shows error message
✓ Multiple users - updates reflect for all users
✓ Load time - under 2 seconds
*/
