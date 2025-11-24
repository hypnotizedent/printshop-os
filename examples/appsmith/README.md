# Appsmith Dashboard Configurations

This directory contains pre-built Appsmith dashboard configurations and queries for PrintShop OS.

## 📁 Files

### 1. production-dashboard-queries.js

Complete query reference for the Production Dashboard. Contains:
- All API queries (GetJobsInProduction, GetJobById, UpdateJobStatus)
- JavaScript helper functions
- Widget binding examples
- Error handling patterns
- Mobile responsiveness configurations

**Use this file as:**
- Reference when creating queries manually
- Copy-paste source for query code
- Documentation for query structure

### 2. production-dashboard-config.json

Full Appsmith application export including:
- Datasource configuration (StrapiAPI)
- All queries pre-configured
- Page layout and widgets
- Widget bindings and event handlers

**Use this file to:**
- Quick-start the dashboard setup
- Import directly into Appsmith
- Understand the complete application structure

### 3. support-dashboard-queries.js

Query templates for Customer Service AI Dashboard (Task 2.1). Contains queries for:
- Support ticket management
- AI-powered response suggestions
- Sentiment analysis
- FAQ search

---

## 🚀 Quick Start Guide

### Option 1: Import Pre-built Dashboard (Fastest)

1. **Open Appsmith**
   ```
   http://localhost:8080
   ```

2. **Import Application**
   - Click on workspace/organization dropdown
   - Select **Import**
   - Choose `production-dashboard-config.json`
   - Click **Import**

3. **Update API Token**
   - Go to **Datasources** → **StrapiAPI**
   - Update the Authorization header with your token:
     ```
     Bearer YOUR_ACTUAL_TOKEN_HERE
     ```
   - Click **Test** to verify
   - Click **Save**

4. **Test Dashboard**
   - Open the imported application
   - Should see empty table (or jobs if data exists)
   - Create sample data with seed script
   - Refresh dashboard

### Option 2: Build Manually (Learning Experience)

Follow the [Integration Guide](../../docs/TASK_2_4_INTEGRATION_GUIDE.md) for step-by-step instructions to build from scratch.

---

## 📋 Configuration Details

### Datasource Configuration

The StrapiAPI datasource requires:

```json
{
  "name": "StrapiAPI",
  "url": "http://strapi:1337",
  "headers": [
    {
      "key": "Authorization",
      "value": "Bearer YOUR_STRAPI_API_TOKEN"
    },
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ]
}
```

**Important Notes:**
- Use `http://strapi:1337` if Appsmith is running in Docker
- Use `http://localhost:1337` if Appsmith is running standalone
- Replace `YOUR_STRAPI_API_TOKEN` with actual token from Strapi admin

### Query Endpoints

**GetJobsInProduction:**
```
GET /api/jobs?filters[status][$eq]=InProduction&sort[0]=dueDate:asc&populate=customer
```

**GetJobById:**
```
GET /api/jobs/{id}?populate=*
```

**UpdateJobStatus:**
```
PUT /api/jobs/{id}
Body: {"data": {"status": "NEW_STATUS"}}
```

---

## 🔑 Getting Your API Token

1. Open Strapi admin: http://localhost:1337/admin
2. Navigate to **Settings** → **API Tokens**
3. Click **Create new API Token**
4. Configure:
   - Name: `Appsmith Production Dashboard`
   - Type: Custom
   - Permissions:
     - jobs: ✅ find, findOne, create, update
     - customers: ✅ find, findOne
5. Click **Save**
6. Copy the token (shown only once!)

---

## 🎨 Dashboard Features

### Production Dashboard

**What it does:**
- Displays all jobs with status "InProduction"
- Shows job details in modal (mockup, customer, notes)
- Allows status updates (Complete, Ready, On Hold)
- Filters by status
- Auto-refreshes data

**Key Features:**
- ✅ Real-time job list
- ✅ Detailed job view
- ✅ Status management
- ✅ Mobile responsive
- ✅ Search and filter
- ✅ Error handling

**User Flow:**
1. Operator opens dashboard
2. Sees list of jobs in production
3. Clicks "View Details" on a job
4. Reviews job info and mockup
5. Clicks "Mark Complete" when done
6. Job status updates in Strapi
7. Job disappears from production list

---

## 🧪 Testing

### Prerequisites
1. Services running (Strapi, Appsmith, PostgreSQL)
2. API token created and configured
3. Sample jobs created

### Create Sample Data

```bash
# Navigate to Strapi directory
cd printshop-strapi

# Set API token
export STRAPI_API_TOKEN="your-token-here"

# Run seed script
node scripts/seed-production-jobs.js
```

### Test Checklist

- [ ] Dashboard loads without errors
- [ ] Table displays jobs
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Click job → modal opens
- [ ] Modal shows all job details
- [ ] Mockup image loads (or shows placeholder)
- [ ] Mark Complete updates status
- [ ] Job disappears from table after completion
- [ ] Works on mobile (use DevTools)
- [ ] No console errors

---

## 🔧 Customization

### Adding New Queries

To add a new query:

1. Open Appsmith application
2. Click **+** next to Queries/JS
3. Select **StrapiAPI** datasource
4. Configure your query
5. Test and save

### Modifying Widget Bindings

To change how data displays:

1. Select widget in canvas
2. Open property panel (right side)
3. Update data binding using `{{...}}` syntax
4. Example: `{{Table1.selectedRow.jobNumber}}`

### Adding New Status Options

To add more status buttons:

1. Add new button to modal
2. Set onClick:
   ```javascript
   {{
     storeValue('newStatus', 'YOUR_NEW_STATUS');
     UpdateJobStatus.run(() => {
       GetJobsInProduction.run();
       closeModal('JobDetailsModal');
       showAlert('Status updated!', 'success');
     });
   }}
   ```
3. Ensure status exists in Strapi schema

---

## 📱 Mobile Responsiveness

The dashboard is designed to work on:
- Desktop (>1024px) - Full layout
- Tablet (768-1024px) - Compact layout
- Mobile (<768px) - Stacked layout

**Mobile Optimizations:**
- Touch-friendly buttons (44px minimum height)
- Simplified table view
- Full-screen modal
- Larger text for readability

**Testing Mobile:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select iPhone or Android device
4. Test all functionality

---

## 🐛 Common Issues

### Table shows "No data available"

**Causes:**
- No jobs exist with status "InProduction"
- Query failed to run
- API token lacks permissions

**Solutions:**
1. Run seed script to create sample jobs
2. Check query ran successfully (green checkmark)
3. Verify API token permissions in Strapi

### Modal doesn't open

**Causes:**
- Modal widget name mismatch
- Button onClick syntax error
- JavaScript error in console

**Solutions:**
1. Ensure modal is named "JobDetailsModal"
2. Check button onClick code
3. Look for errors in console (F12)

### Status update fails

**Causes:**
- API token lacks update permission
- Query body malformed
- Store value not set

**Solutions:**
1. Check token has "update" permission
2. Verify UpdateJobStatus query body format
3. Ensure storeValue is called before query

### 403 Forbidden

**Cause:** API token missing or lacks permissions

**Solution:**
1. Verify token in datasource is correct
2. Check token permissions in Strapi admin
3. Generate new token if needed

---

## 📚 Additional Resources

- [Appsmith Documentation](https://docs.appsmith.com/)
- [Strapi API Documentation](https://docs.strapi.io/dev-docs/api/rest)
- [Task 2.4 Integration Guide](../../docs/TASK_2_4_INTEGRATION_GUIDE.md)
- [Task 2.4 Quick Start](../../docs/TASK_2_4_QUICKSTART.md)
- [Seed Script Documentation](../../printshop-strapi/scripts/README.md)

---

## 🤝 Contributing

To contribute improvements:

1. Test your changes thoroughly
2. Update this documentation
3. Export updated configuration
4. Submit pull request with clear description

---

## 📞 Support

Issues or questions?
- Check troubleshooting section above
- Review integration guide
- Check GitHub issues
- Contact development team

---

**Version:** 1.0.0  
**Last Updated:** November 24, 2025  
**Status:** ✅ Production Ready
