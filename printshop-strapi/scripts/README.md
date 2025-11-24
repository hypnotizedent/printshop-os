# Strapi Scripts

This directory contains utility scripts for managing and seeding data in the Strapi backend.

## Available Scripts

### seed-production-jobs.js

Creates sample job data for testing the Production Dashboard in Appsmith.

**Usage:**

```bash
# From the printshop-strapi directory
cd /path/to/printshop-strapi

# Set your Strapi API token (get from Settings > API Tokens in Strapi admin)
export STRAPI_API_TOKEN="your-token-here"

# Run the script
node scripts/seed-production-jobs.js
```

**What it creates:**
- 8 sample jobs with various statuses (InProduction, Ready, Pending, Complete)
- Different due dates, payment statuses, and production scenarios
- Sample mockup URLs and artwork file references
- Automatically creates or uses existing customers

**Environment Variables:**
- `STRAPI_URL` - Strapi base URL (default: http://localhost:1337)
- `STRAPI_API_TOKEN` - API token for authentication (optional but recommended)

**Example output:**
```
======================================
Production Jobs Seed Script
======================================

Strapi URL: http://localhost:1337

Testing connection to Strapi...
✓ Connected to Strapi successfully

✓ Using existing customer: Test Customer

Creating sample jobs...

✓ Created job: JOB-2025-001 - Corporate T-Shirts - Acme Corp [InProduction]
✓ Created job: JOB-2025-002 - Event Hoodies - Tech Startup [InProduction]
...

--- Summary ---
✓ Successfully created: 8 jobs

Total jobs with status "InProduction": 4
```

## Prerequisites

Before running any scripts:

1. **Strapi must be running**
   ```bash
   docker-compose up -d strapi
   ```

2. **Create an API Token** (recommended)
   - Navigate to http://localhost:1337/admin
   - Go to Settings → API Tokens
   - Create a new token with:
     - Name: "Seed Scripts"
     - Type: Custom
     - Permissions: 
       - ✓ jobs (read, create, update)
       - ✓ customers (read, create)
   - Copy the token and set it as environment variable

3. **Install dependencies** (if not already installed)
   ```bash
   npm install
   ```

## Troubleshooting

### "Connection refused" error
- Ensure Strapi is running: `docker-compose ps strapi`
- Check the URL is correct: `curl http://localhost:1337/api/health`

### "403 Forbidden" error
- Verify your API token has the required permissions
- Check the token is not expired
- Ensure the token is set correctly in environment variable

### "Customer not found" error
- The script will automatically create a test customer if none exists
- If you have specific customer requirements, modify the `getOrCreateCustomer` function

### Jobs already exist
- The script checks for existing jobs by jobNumber and skips them
- To recreate jobs, delete them from Strapi admin first or modify the jobNumber in the script

## Development

To add new seed scripts:

1. Create a new file in this directory (e.g., `seed-customers.js`)
2. Use the same pattern as `seed-production-jobs.js`
3. Add documentation to this README
4. Test the script locally before committing

## Related Documentation

- [Task 2.4 Dashboard Setup](../../docs/TASK_2_4_DASHBOARD_SETUP.md)
- [Appsmith Production Dashboard Queries](../../examples/appsmith/production-dashboard-queries.js)
- [Strapi API Documentation](http://localhost:1337/documentation)
