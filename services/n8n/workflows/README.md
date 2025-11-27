# n8n Workflows for PrintShop OS

This directory contains n8n workflow automation for PrintShop OS, including custom print-shop-specific workflows and access to the comprehensive Zie619/n8n-workflows collection (4,343+ workflows).

## Directory Structure

```
services/n8n/
├── workflows/
│   ├── README.md                    # This file
│   └── printshop/                   # Custom PrintShop OS workflows
│       ├── quote-to-invoice.json    # Strapi quote → Invoice Ninja
│       ├── payment-sync.json        # Invoice Ninja → Strapi payment status
│       ├── customer-sync.json       # EspoCRM ↔ Strapi customer sync
│       ├── order-notifications.json # Order status → Slack/Email
│       └── document-ocr.json        # Paperless-ngx → Strapi metadata
├── scripts/
│   ├── import-workflows.sh          # Bulk import to n8n instance
│   ├── export-workflows.sh          # Export workflows from n8n
│   └── search-workflows.py          # Search the workflow database
├── docs/
│   └── N8N_INTEGRATION.md           # Complete integration guide
└── README.md                        # Overview

services/n8n-workflows/              # Git submodule (4,343+ workflows)
```

## PrintShop Workflows

### 1. Quote to Invoice (`quote-to-invoice.json`)

**Trigger:** Webhook (`/webhook/quote-approved`)

**Flow:**
1. Receives webhook when quote is approved in Strapi
2. Fetches full quote details from Strapi API
3. Creates invoice in Invoice Ninja with line items
4. Updates Strapi quote with invoice ID and status

**Required Credentials:**
- `strapi-api-key` - Strapi API token
- `invoice-ninja-api` - Invoice Ninja API credentials

### 2. Payment Sync (`payment-sync.json`)

**Trigger:** Schedule (every 5 minutes)

**Flow:**
1. Fetches recent payments from Invoice Ninja
2. Matches payments to orders by invoice number
3. Updates Strapi order with payment status (PAID/PARTIAL)

**Required Credentials:**
- `strapi-api-key` - Strapi API token
- `invoice-ninja-api` - Invoice Ninja API credentials

### 3. Customer Sync (`customer-sync.json`)

**Trigger:** Schedule (every hour)

**Flow:**
1. Fetches updated contacts from EspoCRM
2. Fetches updated customers from Strapi
3. Bi-directional sync:
   - EspoCRM → Strapi: Creates or updates customers
   - Strapi → EspoCRM: Updates contact records

**Required Credentials:**
- `strapi-api-key` - Strapi API token
- `espocrm-api-key` - EspoCRM API key

### 4. Order Notifications (`order-notifications.json`)

**Trigger:** Webhook (`/webhook/order-status-changed`)

**Flow:**
1. Receives webhook when order status changes
2. Fetches order details with customer info
3. Routes to appropriate notification based on status:
   - `IN_PRODUCTION` → Slack notification
   - `READY_FOR_PICKUP` → Slack + Customer email
   - `SHIPPED` → Slack + Customer email with tracking
   - `COMPLETE` → Slack notification

**Required Credentials:**
- `strapi-api-key` - Strapi API token
- `slack-api` - Slack Bot token
- `smtp` - Email SMTP settings

### 5. Document OCR (`document-ocr.json`)

**Trigger:** Webhook (`/webhook/paperless-document-consumed`)

**Flow:**
1. Receives webhook when Paperless-ngx consumes a document
2. Fetches document details and OCR content
3. Extracts metadata (order number, customer, amounts)
4. If order number found, attaches to matching order
5. Otherwise creates document record for manual review

**Required Credentials:**
- `strapi-api-key` - Strapi API token
- `paperless-api-key` - Paperless-ngx API token

## Quick Start

### 1. Start n8n

```bash
docker-compose -f docker-compose.business-services.yml up -d n8n
```

### 2. Access n8n UI

Open http://localhost:5678

### 3. Import Workflows

```bash
cd services/n8n
./scripts/import-workflows.sh workflows/printshop
```

### 4. Configure Credentials

In n8n UI:
1. Go to Settings → Credentials
2. Add required credentials for each workflow
3. Update credential references in workflows if needed

### 5. Activate Workflows

1. Open each workflow in n8n
2. Click "Active" toggle to enable

## Finding More Workflows

The `services/n8n-workflows` submodule contains 4,343+ ready-to-use workflows. Search using:

```bash
# Search by keyword
python scripts/search-workflows.py "shopify order"

# Search by category
python scripts/search-workflows.py "email" --category "Communication"

# List categories
python scripts/search-workflows.py --list-categories
```

## Environment Variables

Add these to your `.env` file:

```env
# n8n Configuration
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password
N8N_API_KEY=your-n8n-api-key
N8N_WEBHOOK_URL=http://localhost:5678

# Service URLs
STRAPI_URL=http://localhost:1337
INVOICE_NINJA_URL=http://localhost:9000
ESPOCRM_URL=http://localhost:8080
PAPERLESS_URL=http://localhost:8000
```

## Webhook URLs

Configure these webhooks in your services:

| Service | Webhook URL | Event |
|---------|-------------|-------|
| Strapi | `http://n8n:5678/webhook/quote-approved` | Quote approved |
| Strapi | `http://n8n:5678/webhook/order-status-changed` | Order status change |
| Paperless-ngx | `http://n8n:5678/webhook/paperless-document-consumed` | Document consumed |

## Development

### Creating New Workflows

1. Create workflow in n8n UI
2. Export as JSON: Settings → Download
3. Save to `workflows/printshop/`
4. Update this README

### Testing Webhooks

Use n8n's built-in webhook testing:

1. Open workflow with webhook trigger
2. Click "Listen for Test Event"
3. Send test request to the test webhook URL
4. Inspect data and debug

### Version Control

All workflows are stored as JSON files and version-controlled. To update:

```bash
# Export current workflows
./scripts/export-workflows.sh

# Commit changes
git add workflows/
git commit -m "Update n8n workflows"
```

## Related Documentation

- [N8N_INTEGRATION.md](docs/N8N_INTEGRATION.md) - Complete integration guide
- [n8n Documentation](https://docs.n8n.io)
- [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows) - Source workflow collection
