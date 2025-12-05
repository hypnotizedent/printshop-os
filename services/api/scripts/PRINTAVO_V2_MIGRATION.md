# Printavo v2 Data Migration

This document describes how to extract data from Printavo using the v2 GraphQL API and import it into PrintShop OS (Strapi).

## Overview

The migration process consists of two main steps:

1. **Extract** - Pull all data from Printavo v2 GraphQL API
2. **Import** - Push extracted data into Strapi CMS

## Prerequisites

### Environment Variables

Create a `.env` file in `services/api/` with the following variables:

```bash
# Printavo v2 API Authentication
PRINTAVO_EMAIL=your-email@example.com
PRINTAVO_TOKEN=your-api-token-here

# Strapi API Configuration
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token

# Optional: Rate limiting (default: 500ms)
PRINTAVO_RATE_LIMIT_MS=500
```

### Strapi Running

Ensure Strapi is running and accessible at the configured URL:

```bash
# From project root
cd printshop-strapi
npm run develop
```

### Strapi Content Types

The following content types must exist in Strapi:
- `customers` - with `printavoId` field
- `orders` - with `printavoId` field
- `quotes` - with `printavoId` field (optional)
- `products` - with `printavoId` field (optional)
- `invoices` - with `printavoId` field (optional)

## Step-by-Step Migration

### Step 1: Extract Data from Printavo

Run the extraction script:

```bash
cd services/api
npm run printavo:extract
```

This will:
1. Authenticate with Printavo using email/password
2. Extract all customers with addresses and contacts
3. Extract all orders with line items, tasks, and payments
4. Extract all quotes with line item groups
5. Extract all products
6. Extract all invoices with payments

Extracted data is saved to `data/printavo-export/v2/{timestamp}/`:
- `customers.json`
- `orders.json`
- `quotes.json`
- `products.json`
- `invoices.json`
- `summary.json`

### Step 2: Import Data to Strapi

Run the import script:

```bash
cd services/api
npm run printavo:import
```

Or to run both extraction and import:

```bash
npm run printavo:migrate
```

This will:
1. Import customers first (needed for relationships)
2. Import orders with customer relationships
3. Import quotes
4. Import products
5. Import invoices

### Import Options

**Specify Source Directory:**
```bash
IMPORT_SOURCE_DIR=/path/to/extracted/data npm run printavo:import
```

**Resume Interrupted Import:**
The import creates a checkpoint file (`import-checkpoint.json`) that tracks progress. If the import is interrupted, re-running will resume from where it left off.

**Reset and Re-import:**
Delete the checkpoint file to start fresh:
```bash
rm data/printavo-export/v2/{timestamp}/import-checkpoint.json
npm run printavo:import
```

## Data Verification

After import, verify the data in Strapi:

### 1. Check Record Counts

```bash
# Check customers
curl "http://localhost:1337/api/customers" | jq '.meta.pagination.total'

# Check orders
curl "http://localhost:1337/api/orders" | jq '.meta.pagination.total'
```

### 2. Verify Relationships

```bash
# Check orders have customer relationships
curl "http://localhost:1337/api/orders?populate=customer" | jq '.data[0].attributes.customer'
```

### 3. Compare with Source

Check the extraction summary against import results:
```bash
cat data/printavo-export/v2/{timestamp}/summary.json
```

## Troubleshooting

### Authentication Failed

**Error:** `Authentication failed: ...`

**Solutions:**
1. Verify PRINTAVO_EMAIL and PRINTAVO_TOKEN are correct
2. Ensure your Printavo account has API access
3. Check if your account requires 2FA (not supported via API)

### Rate Limiting

**Error:** `429 Too Many Requests`

**Solutions:**
1. Increase PRINTAVO_RATE_LIMIT_MS (default: 500ms)
2. Wait and retry later

### Strapi Connection Failed

**Error:** `ECONNREFUSED` or `401 Unauthorized`

**Solutions:**
1. Ensure Strapi is running: `cd printshop-strapi && npm run develop`
2. Verify STRAPI_API_URL is correct
3. Check STRAPI_API_TOKEN is valid and has write permissions

### Missing Content Types

**Error:** `Not Found` when creating records

**Solutions:**
1. Ensure all required content types exist in Strapi
2. Verify content types have `printavoId` field
3. Check API permissions are enabled for the content types

### Import Failures

**Error:** Individual records fail to import

**Solutions:**
1. Check `import-errors.json` for specific errors
2. Common issues:
   - Invalid email format
   - Missing required fields
   - Duplicate printavoId

## Rollback Procedure

If you need to undo the import:

### 1. Delete Imported Records

```bash
# Delete all imported orders (use with caution!)
curl -X DELETE "http://localhost:1337/api/orders/bulk-delete" \
  -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"printavoId": {"$notNull": true}}}'
```

### 2. Restore from Backup

If you have a database backup:
```bash
# For PostgreSQL
pg_restore -d printshop backup.sql

# For SQLite
cp backup.db printshop-strapi/.tmp/data.db
```

## File Structure

```
services/api/
├── scripts/
│   ├── extract-printavo-v2.ts    # Extraction script
│   ├── import-printavo-v2.ts     # Import script
│   ├── PRINTAVO_V2_MIGRATION.md  # This file
│   └── __tests__/
│       ├── extract-printavo-v2.test.ts
│       └── import-printavo-v2.test.ts
├── lib/
│   └── printavo-mapper.ts        # Data transformers (incl. v2)
└── package.json                  # NPM scripts

data/printavo-export/v2/
└── {timestamp}/
    ├── customers.json
    ├── orders.json
    ├── quotes.json
    ├── products.json
    ├── invoices.json
    ├── summary.json
    ├── import-checkpoint.json    # Resume state
    └── import-errors.json        # Failed imports
```

## Data Mapping

### Customers

| Printavo v2 Field | Strapi Field |
|-------------------|--------------|
| `id` | `printavoId` |
| `firstName` + `lastName` | `name` |
| `email` | `email` |
| `company` | `company` |
| `phone` | `phone` |
| `addresses[0].*` | `address1`, `city`, `state`, `zip` |

### Orders

| Printavo v2 Field | Strapi Field |
|-------------------|--------------|
| `id` | `printavoId` |
| `visualId` | `visualId` |
| `nickname` | `orderNickname` |
| `status.name` | `status` (mapped to enum) |
| `total` | `totals.total` |
| `subtotal` | `totals.subtotal` |
| `taxTotal` | `totals.tax` |
| `lineItemGroups.*.lineItems.*` | `lineItems[]` |
| `customer.id` | `customer` (relation) |

### Status Mapping

| Printavo Status | Strapi Status |
|-----------------|---------------|
| QUOTE | quote |
| AWAITING APPROVAL | pending |
| APPROVED FOR PRODUCTION | in_production |
| IN PRODUCTION | in_production |
| READY TO SHIP | ready_to_ship |
| SHIPPED | shipped |
| DELIVERED | delivered |
| COMPLETED | completed |
| CANCELLED | cancelled |
| INVOICE PAID | invoice_paid |
| PAYMENT DUE | payment_due |

## Support

For issues or questions:
1. Check the logs in `data/logs/`
2. Review `import-errors.json` for failed records
3. Open an issue in the repository

---

**Last Updated:** December 2025
**Maintainer:** PrintShop OS Team
