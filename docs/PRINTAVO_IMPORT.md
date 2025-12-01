# Printavo Data Import Guide

This guide documents the Printavo data import system for PrintShop OS.

## Overview

The import system migrates data from Printavo exports into Strapi CMS with:
- Auto-detection of export directories
- Full schema mapping
- Checkpointing and resume capability
- Validation and deduplication
- Relationship linking
- Progress reporting

## Quick Start

```bash
# Install dependencies
pip install tqdm python-dotenv

# Set environment variables
export STRAPI_URL=http://localhost:1337
export STRAPI_TOKEN=your-api-token

# Run the import
python3 scripts/printavo-import.py
```

## Export Directory Structure

The import script auto-detects export directories in `data/raw/printavo-exports/`.

Supported formats:
- `printavo_YYYY-MM-DDTHH-MM-SS-MMMZ/`
- `complete_YYYY-MM-DD_HH-MM-SS/`

Required files:
- `customers.json` - Customer records
- `orders.json` - Order records with embedded line items

## CLI Reference

### Basic Usage

```bash
# Auto-detect latest export and import everything
python3 scripts/printavo-import.py

# Import specific entities
python3 scripts/printavo-import.py --customers-only
python3 scripts/printavo-import.py --orders-only
python3 scripts/printavo-import.py --line-items-only

# Only link relationships (after import)
python3 scripts/printavo-import.py --link-only
```

### Resume & Checkpointing

```bash
# Resume from checkpoint (after interruption)
python3 scripts/printavo-import.py --resume

# Check import status
python3 scripts/printavo-import.py --status

# Reset checkpoints (start fresh)
python3 scripts/printavo-import.py --reset
```

### Validation

```bash
# Dry run - validate without importing
python3 scripts/printavo-import.py --dry-run
```

### Configuration

```bash
# Use specific export directory
python3 scripts/printavo-import.py --export-dir data/raw/printavo-exports/printavo_2025-11-22T11-29-44-911Z

# Override Strapi connection
python3 scripts/printavo-import.py --strapi-url http://localhost:1337 --strapi-token your-token
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRAPI_URL` | Strapi API URL | `http://localhost:1337` |
| `STRAPI_TOKEN` | Strapi API token | (required) |

## Data Mapping

### Customer Schema

| Printavo Field | Strapi Field | Notes |
|----------------|--------------|-------|
| `id` | `printavoId` | Unique identifier |
| `first_name` + `last_name` | `name` | Combined, fallback to company |
| `email` or `customer_email` | `email` | Required |
| `phone` | `phone` | |
| `company` | `company` | |
| `shipping_address_attributes.address1` | `address` | Falls back to billing |
| `shipping_address_attributes.city` | `city` | |
| `shipping_address_attributes.state_iso` | `state` | |
| `shipping_address_attributes.zip` | `zipCode` | |
| `shipping_address_attributes.country_iso` | `country` | Default: US |
| `extra_notes` | `notes` | |

### Order Schema

| Printavo Field | Strapi Field | Notes |
|----------------|--------------|-------|
| `id` | `printavoId` | Unique identifier |
| `visual_id` | `orderNumber` | Display number |
| `order_nickname` | `orderNickname` | |
| `orderstatus.name` | `status` | Mapped to enum |
| `customer_id` | `printavoCustomerId` | For relationship linking |
| `order_total` | `totalAmount` | |
| `amount_paid` | `amountPaid` | |
| `amount_outstanding` | `amountOutstanding` | |
| `sales_tax` | `salesTax` | |
| `discount` | `discount` | |
| `order_fees_attributes` | `fees` | Sum of all fees |
| `due_date` | `dueDate` | |
| `customer_due_date` | `customerDueDate` | |
| `invoice_date` | `invoiceDate` | |
| `payment_due_date` | `paymentDueDate` | |
| `notes` | `notes` | |
| `production_notes` | `productionNotes` | |
| `visual_po_number` | `customerPO` | |
| `public_hash` | `publicHash` | |
| `order_addresses_attributes` | `billingAddress`, `shippingAddress` | JSON objects |

### Status Mapping

| Printavo Status | Strapi Status |
|-----------------|---------------|
| Pending | QUOTE |
| Pending Approval | QUOTE_SENT |
| Quote Sent | QUOTE_SENT |
| Approved | QUOTE_APPROVED |
| Quote Approved | QUOTE_APPROVED |
| In Production | IN_PRODUCTION |
| Ready for Pickup | READY_FOR_PICKUP |
| Waiting for Pickup | READY_FOR_PICKUP |
| Complete | COMPLETE |
| Delivered | COMPLETE |
| Shipped | SHIPPED |
| Payment Received | INVOICE_PAID |
| Cancelled | CANCELLED |

### Line Item Schema

| Printavo Field | Strapi Field | Notes |
|----------------|--------------|-------|
| `id` | `printavoId` | Unique identifier |
| (from parent order) | `orderId` | Printavo order ID |
| (from parent order) | `orderVisualId` | Order display number |
| `category` | `category` | |
| `style_number` | `styleNumber` | |
| `style_description` | `styleDescription` | |
| `color` | `color` | |
| `size_xs` | `sizeXS` | |
| `size_s` | `sizeS` | |
| `size_m` | `sizeM` | |
| `size_l` | `sizeL` | |
| `size_xl` | `sizeXL` | |
| `size_2xl` | `size2XL` | |
| `size_3xl` | `size3XL` | |
| `size_4xl` | `size4XL` | |
| `size_5xl` | `size5XL` | |
| `size_other` | `sizeOther` | |
| `total_quantities` | `totalQuantity` | |
| `unit_cost` | `unitCost` | |
| (calculated) | `totalCost` | unit_cost × total_quantities |
| `taxable` | `taxable` | |
| `goods_status` | `goodsStatus` | |

## Import Process

### Phase 1: Customers
1. Load customers from JSON
2. Filter to valid records (email + orders > 0)
3. Check for existing records by printavoId
4. Deduplicate by email
5. Map and validate each record
6. Create in Strapi with checkpointing

### Phase 2: Orders
1. Load orders from JSON
2. Check for existing records by printavoId
3. Map and validate each record
4. Create in Strapi with checkpointing

### Phase 3: Line Items
1. Extract line items from orders
2. Check for existing records by printavoId
3. Map and validate each record
4. Create in Strapi with checkpointing

### Phase 4: Relationship Linking
1. Link orders to customers via printavoCustomerId
2. Link line items to orders via orderId

## Checkpointing

Checkpoints are saved every 50 records to:
- `data/customer-import-checkpoint.json`
- `data/order-import-checkpoint.json`
- `data/line-item-import-checkpoint.json`

Each checkpoint contains:
```json
{
  "last_index": 1500,
  "imported_ids": ["123", "456", ...],
  "failed_ids": ["789", ...],
  "skipped_ids": ["101", ...],
  "started_at": "2025-12-01T10:00:00",
  "updated_at": "2025-12-01T10:30:00",
  "export_dir": "/path/to/export"
}
```

## Error Handling

- **Validation errors**: Logged and skipped
- **API errors**: Retried 3x with exponential backoff
- **Connection errors**: Wait for Strapi to recover, then retry
- **Duplicates**: Detected by printavoId, skipped

## Reusable Components

### StrapiClient (`scripts/lib/strapi_client.py`)

```python
from lib.strapi_client import StrapiClient

client = StrapiClient(url, token)
client.wait_for_healthy()

# CRUD operations with retry
ok, response = client.post('/api/customers', {'data': {...}})
ok, response = client.put('/api/customers/1', {'data': {...}})
ok, response = client.get('/api/customers', params={...})

# Utilities
count = client.get_count('/api/customers')
exists = client.exists_by_field('/api/customers', 'printavoId', '123')
all_records = client.get_all_paginated('/api/customers')
```

### PrintavoMapper (`scripts/lib/printavo_mapper.py`)

```python
from lib.printavo_mapper import PrintavoMapper

mapper = PrintavoMapper()

# Map records
strapi_customer = mapper.map_customer(printavo_customer)
strapi_order = mapper.map_order(printavo_order)
strapi_line_item = mapper.map_line_item(printavo_item, order_id, visual_id)

# Validate records
is_valid, errors = mapper.validate_customer(customer)
is_valid, errors = mapper.validate_order(order)

# Extract line items from order
line_items = mapper.extract_line_items_from_order(order)
```

## Troubleshooting

### "STRAPI_TOKEN not set"
Set the environment variable or use `--strapi-token`:
```bash
export STRAPI_TOKEN=your-token
# or
python3 scripts/printavo-import.py --strapi-token your-token
```

### "Could not connect to Strapi"
1. Verify Strapi is running: `curl http://localhost:1337/api/customers`
2. Check the URL is correct
3. Verify the API token has permissions

### "Export directory not found"
1. Check `data/raw/printavo-exports/` contains an export
2. Use `--export-dir` to specify the path explicitly

### Import seems slow
1. Install tqdm for progress bars: `pip install tqdm`
2. Check Strapi performance
3. Use `--status` to see progress

### Resuming after interruption
1. Run with `--resume` flag
2. Check status with `--status`
3. If needed, reset with `--reset` and start fresh

## Expected Results

After a successful import of the full dataset:
- ~3,300+ customers
- ~12,800+ orders
- ~44,000+ line items
- All orders linked to customers
- All line items linked to orders
