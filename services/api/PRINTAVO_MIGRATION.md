# Printavo to Strapi Migration Guide

## Overview

This document describes the complete process for migrating all data from Printavo to the PrintShop OS Strapi CMS. The migration system is designed for a one-time full migration with support for incremental re-runs during the transition period.

### What Gets Migrated

**Orders (Invoices and Quotes)**
- Basic info: ID, visual ID, nickname, financial totals
- Status information with colors
- Contact and customer information
- Billing and shipping addresses
- Production notes and customer notes
- Tags and metadata
- Line items with sizes, colors, and personalizations
- Imprints with artwork files
- Production files (work orders, packing slips)
- Public URLs for customer access

**Customers**
- Basic info: name, company, email, phone
- Billing and shipping addresses
- Primary contact and all contacts
- Internal notes
- Tax information (resale number, tax exempt status)
- Creation and update timestamps

## Prerequisites

### 1. Environment Variables

Create a `.env` file in `services/api/` with the following variables:

```bash
# Printavo API Configuration
PRINTAVO_EMAIL=ronny@mintprints.com
PRINTAVO_TOKEN=tApazCfvuQE-0Tl3YLIofg

# Strapi Configuration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<your-strapi-api-token>
```

**How to get your Printavo token:**
1. Log into Printavo
2. Go to "My Account" → "API"
3. Copy your API token

**How to get your Strapi token:**
1. Log into Strapi admin panel
2. Go to Settings → API Tokens
3. Create a new token with "Full access" permissions
4. Copy the token immediately (it won't be shown again)

### 2. Strapi Running

Ensure Strapi is running and accessible:

```bash
# From project root
cd printshop-strapi
npm run develop

# Or in production
npm run start
```

Verify Strapi is accessible at: `http://localhost:1337/admin`

### 3. Strapi Content Types

The following content types must exist (they should already be configured):

- **customers** - with `printavoId` field for deduplication
- **orders** - with `printavoId` field for deduplication
- **line-items** - for order line items
- **payments** - for payment tracking

All required fields are automatically created by the Strapi schema.

### 4. System Requirements

- Node.js 16+ installed
- `jq` installed (for JSON validation in shell script)
  ```bash
  # Install jq if needed
  sudo apt-get install jq  # Ubuntu/Debian
  brew install jq          # macOS
  ```
- At least 2GB free disk space for extracted data
- Network access to Printavo API and Strapi instance

## Migration Process

### Full Migration (One-Time)

This performs a complete extraction of all data from Printavo and imports it into Strapi.

```bash
cd services/api/scripts

# Run the complete migration
./migrate-printavo.sh
```

**What happens:**

1. **Extraction Phase**
   - Connects to Printavo GraphQL API
   - Extracts all orders (page size: 5 to stay under complexity limit)
   - Extracts all customers (page size: 25)
   - Saves to `/app/data/printavo-final/full-YYYY-MM-DDTHH-MM-SS/`
   - Generates extraction summary

2. **Validation Phase**
   - Validates JSON file integrity
   - Checks for required files
   - Reports data counts

3. **Import Phase**
   - Connects to Strapi API
   - Imports customers first (required for order relationships)
   - Imports orders with customer relationships
   - Uses upsert logic (updates existing records by printavoId)
   - Generates import summary

4. **Report Generation**
   - Displays extraction and import statistics
   - Shows success/failure counts
   - Provides data location

**Expected Duration:** 15-30 minutes for ~1000 orders

### Incremental Sync (During Transition)

Use this during the transition period to catch new orders created in Printavo while you're setting up PrintShop OS.

```bash
cd services/api/scripts

# Sync orders created/updated since a specific date
./migrate-printavo.sh --incremental --since="2025-12-04"

# Or sync orders from today
./migrate-printavo.sh --incremental --since="$(date -I)"
```

**What happens:**

1. Extracts only orders updated after the specified date
2. Skips customer extraction (assumes customers already imported)
3. Imports new/updated orders
4. Updates existing orders if they changed

**Note:** Run this daily or as needed during your transition period.

### Manual Steps (Advanced)

If you need more control, you can run each step separately:

```bash
cd services/api/scripts

# Step 1: Extract data
node printavo-extract.js
# or incremental:
node printavo-extract.js --since="2025-12-04"

# Step 2: Import data
node strapi-import.js /app/data/printavo-final/full-2025-12-04T10-30-00
# or use most recent extraction:
node strapi-import.js
```

## Data Mapping

### Customer Mapping

| Printavo Field | Strapi Field | Notes |
|----------------|--------------|-------|
| `id` | `printavoId` | Used for deduplication |
| `company` or `firstName + lastName` | `name` | Falls back to "Unknown Customer" |
| `email` | `email` | Required, placeholder if missing |
| `phone` | `phone` | Optional |
| `company` | `company` | Optional |
| `internalNote` | `notes` | Optional |
| `billingAddress.address1` | `address` | Falls back to shipping address |
| `billingAddress.city` | `city` | Falls back to shipping address |
| `billingAddress.stateIso` | `state` | Falls back to shipping address |
| `billingAddress.zipCode` | `zipCode` | Falls back to shipping address |
| `billingAddress.country` | `country` | Falls back to shipping address |

### Order Mapping

| Printavo Field | Strapi Field | Notes |
|----------------|--------------|-------|
| `id` | `printavoId` | Used for deduplication |
| `visualId` | `visualId`, `orderNumber` | Customer-facing order number |
| `nickname` | `orderNickname` | Optional descriptive name |
| `status.name` | `status` | Mapped to Strapi enum values |
| `total` | `totalAmount` | Converted to decimal |
| `amountPaid` | `amountPaid` | Payment tracking |
| `amountOutstanding` | `amountOutstanding` | Balance due |
| `salesTaxAmount` or `taxTotal` | `salesTax` | Tax amount |
| `discountTotal` | `discount` | Discount applied |
| `customerDueAt` | `customerDueDate`, `dueDate` | When customer expects delivery |
| `paymentDueAt` | `paymentDueDate` | When payment is due |
| `productionNote` | `productionNotes` | Internal production notes |
| `customerNote` | `notes` | Notes visible to customer |
| `billingAddress` | `billingAddress` | Stored as JSON |
| `shippingAddress` | `shippingAddress` | Stored as JSON |
| `lineItemGroups` | `items` | Stored as JSON (detailed structure) |
| `customer.id` | `customer` | Relationship to customer record |

### Status Mapping

| Printavo Status | Strapi Status |
|-----------------|---------------|
| Quote | QUOTE |
| Quote Sent | QUOTE_SENT |
| Approved | QUOTE_APPROVED |
| In Production | IN_PRODUCTION |
| Complete | COMPLETE |
| Ready for Pickup | READY_FOR_PICKUP |
| Shipped | SHIPPED |
| Payment Needed | PAYMENT_NEEDED |
| Paid | INVOICE_PAID |
| Cancelled | CANCELLED |

## Troubleshooting

### Error: "Missing required environment variables"

**Problem:** One or more required environment variables are not set.

**Solution:**
```bash
# Check your .env file in services/api/
cat services/api/.env

# Ensure all required variables are present:
# - PRINTAVO_EMAIL
# - PRINTAVO_TOKEN
# - STRAPI_URL
# - STRAPI_API_TOKEN
```

### Error: "GraphQL complexity exceeded"

**Problem:** A single page query exceeded Printavo's complexity limit of 25000.

**Solution:** This shouldn't happen with the current page sizes (5 for orders, 25 for customers), but if it does, the script will automatically reduce page size. You can also manually edit the page sizes in the script.

### Error: "Cannot connect to Strapi"

**Problem:** The script cannot reach the Strapi API.

**Solution:**
```bash
# Check if Strapi is running
curl http://localhost:1337/admin

# Check your STRAPI_URL in .env
# Make sure it doesn't have a trailing slash

# Verify your API token is correct
# Generate a new token in Strapi admin if needed
```

### Error: "ECONNRESET" or timeout errors

**Problem:** Network connection to Printavo API was interrupted.

**Solution:** The script has automatic retry logic. If it continues to fail:
```bash
# Check your internet connection
ping www.printavo.com

# Verify your Printavo credentials
# Log into Printavo web interface to confirm access

# Try again - the script can be re-run safely (uses upsert logic)
./migrate-printavo.sh
```

### Error: "orders.json is not valid JSON"

**Problem:** Extraction was interrupted or corrupted.

**Solution:**
```bash
# Delete the incomplete extraction
rm -rf /app/data/printavo-final/full-YYYY-MM-DDTHH-MM-SS

# Run extraction again
node printavo-extract.js
```

### Warning: "No customers found in extraction"

**Problem:** You're running incremental mode, which skips customer extraction.

**Solution:** This is expected behavior. Customers don't change frequently, so incremental mode only syncs orders. If you need to update customers, run a full migration.

### Error: "Duplicate printavoId"

**Problem:** A record with the same Printavo ID already exists in Strapi.

**Solution:** This shouldn't happen because the script uses upsert logic. If it does:
```bash
# Check Strapi for duplicate records
# Delete the duplicate manually in Strapi admin
# Re-run the import
```

## Verification

After migration, verify the data in Strapi:

### 1. Check Record Counts

```bash
# Login to Strapi admin
open http://localhost:1337/admin

# Navigate to:
# - Content Manager → Customers
# - Content Manager → Orders

# Compare counts with extraction summary
```

### 2. Spot Check Data

- Open a few customer records - verify name, email, addresses
- Open a few order records - verify order number, totals, status
- Check that order → customer relationships are correct
- Verify line items are stored in the `items` JSON field

### 3. Check Logs

```bash
# Review extraction logs
cat /app/data/printavo-final/full-*/summary.json

# Review import logs
cat /app/data/printavo-final/full-*/import-summary.json

# Look for failed records
jq '.stats.orders.errors' /app/data/printavo-final/full-*/import-summary.json
```

## File Structure

After migration, you'll have the following structure:

```
/app/data/printavo-final/
├── full-2025-12-04T10-30-00/          # Full migration timestamp
│   ├── orders.json                     # All orders (invoices + quotes)
│   ├── invoices.json                   # Invoices only
│   ├── quotes.json                     # Quotes only
│   ├── customers.json                  # All customers
│   ├── summary.json                    # Extraction statistics
│   └── import-summary.json             # Import statistics
│
└── incremental-2025-12-05T08-15-00/   # Incremental sync timestamp
    ├── orders.json                     # New/updated orders only
    ├── summary.json
    └── import-summary.json
```

## Rate Limits and Performance

### Printavo Rate Limits

- **Complexity limit:** 25000 per query
- **Rate limit:** ~1 request per second (600ms delay between requests)
- **Page sizes used:**
  - Orders: 5 per page (complexity ~4500 each)
  - Customers: 25 per page (complexity ~800 each)

### Expected Performance

| Records | Extraction Time | Import Time | Total |
|---------|----------------|-------------|-------|
| 100 orders | 2-3 min | 2-3 min | 5-6 min |
| 500 orders | 10-12 min | 8-10 min | 18-22 min |
| 1000 orders | 20-25 min | 15-18 min | 35-43 min |

Times may vary based on network speed and Strapi performance.

## Best Practices

### Before Migration

1. **Backup Strapi database** - Take a backup before running the migration
2. **Test with small dataset** - Consider limiting the extraction for initial testing
3. **Verify credentials** - Ensure both Printavo and Strapi credentials are valid
4. **Check disk space** - Ensure at least 2GB free for extracted data

### During Migration

1. **Monitor logs** - Watch the console output for errors
2. **Don't interrupt** - Let the process complete (it's safe to restart if needed)
3. **Check network** - Ensure stable internet connection

### After Migration

1. **Verify data** - Spot check customers and orders in Strapi
2. **Review errors** - Check import-summary.json for any failed records
3. **Keep extraction files** - Don't delete until verified (needed for troubleshooting)
4. **Document issues** - Note any problems for team reference

### During Transition Period

1. **Run incremental syncs daily** - Catch new orders from Printavo
2. **Monitor both systems** - Ensure data consistency
3. **Plan cutover date** - Set a date to switch fully to PrintShop OS
4. **Communicate with team** - Ensure everyone knows the process

## Support

If you encounter issues not covered in this guide:

1. Check the logs in `/app/data/printavo-final/`
2. Review error messages carefully
3. Verify environment variables are correct
4. Ensure Strapi and Printavo are accessible
5. Check network connectivity

For additional help, consult the team or review the script source code for more details.

## Appendix: Script Details

### printavo-extract.js

**Purpose:** Extract all data from Printavo GraphQL API

**Key Features:**
- Pagination with small page sizes to stay under complexity limit
- Rate limiting (600ms between requests)
- Automatic retry with exponential backoff
- Progress logging
- Incremental extraction support

**Output:** JSON files in `/app/data/printavo-final/`

### strapi-import.js

**Purpose:** Import extracted data into Strapi

**Key Features:**
- Upsert logic (update if exists, create if new)
- Relationship handling (orders → customers)
- Batch processing with rate limiting
- Progress tracking
- Error logging with details

**Input:** JSON files from printavo-extract.js

### migrate-printavo.sh

**Purpose:** Orchestrate the complete migration process

**Key Features:**
- Pre-flight checks (environment variables, Strapi connectivity)
- Sequential execution (extract → validate → import → report)
- Error handling and rollback
- Colored output for readability
- Support for incremental mode

**Usage:** Main entry point for migrations

---

**Last Updated:** December 5, 2025  
**Version:** 1.0.0  
**Maintainer:** PrintShop OS Team
