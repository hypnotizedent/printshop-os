# Printavo API Integration - lib/ptavo

This directory contains tools and scripts for connecting to and extracting data from the Printavo API. The purpose is to facilitate data analysis and eventual migration from Printavo to the `printshop-os` system.

## Overview

**Printavo** is a shop management software for print shops. This integration is part of the migration strategy to move operational data from Printavo into the new `printshop-os` platform built on Strapi, Appsmith, and Botpress.

## Purpose

The code in this directory serves multiple purposes:

1. **Discovery & Planning** - Connect to Printavo API and explore available data
2. **Data Extraction** - Pull customer, invoice, order, and other operational data
3. **Schema Analysis** - Understand Printavo's data structure and relationships
4. **Migration Planning** - Map Printavo data to printshop-os data models
5. **Data Transformation** - Convert Printavo data format to printshop-os format

## Files

### `api_client.py`

The main API client script that provides:

- **Authentication** - Handles Printavo API authentication with API key
- **Data Fetching** - Methods to retrieve customers, invoices, and other resources
- **Pagination** - Automatic handling of paginated API responses
- **Data Export** - Export retrieved data to JSON files for analysis
- **Error Handling** - Robust error handling for API connectivity issues

#### Usage

```bash
# Set your API credentials
export PRINTAVO_API_KEY='your-api-key-here'
export PRINTAVO_EMAIL='your-email@example.com'

# Run the client
cd lib/ptavo
python3 api_client.py
```

The script will:
1. Connect to the Printavo API
2. Fetch sample customer and invoice data
3. Export the data to JSON files for review
4. Display the data structure for analysis

#### Features

- **APIClient Class**: Main class for interacting with Printavo API
  - `fetch_customers()` - Retrieve customer records
  - `fetch_invoices()` - Retrieve invoice/order records
  - `fetch_all_customers()` - Get all customers with automatic pagination
  - `fetch_all_invoices()` - Get all invoices with automatic pagination
  - `export_to_json()` - Export data to JSON files

- **Example Usage**: The `main()` function demonstrates:
  - How to initialize the client
  - Fetching sample data
  - Exporting to JSON for schema analysis
  - Next steps for migration planning

## Integration Goals

### Phase 1: Discovery & Planning (Current)

- ✅ Create API client structure
- ⏳ Connect to Printavo API
- ⏳ Fetch sample data for analysis
- ⏳ Document data schemas and relationships
- ⏳ Map Printavo data to Strapi models

### Phase 2: Data Extraction

- Extract all historical customer data
- Extract all invoice and order data
- Extract product and inventory data
- Export to structured formats (JSON/CSV)

### Phase 3: Schema Mapping

- Map Printavo customer fields to Strapi Customer model
- Map Printavo invoice fields to Strapi Job/Order models
- Identify custom fields and attributes
- Document data transformation requirements

### Phase 4: Migration Implementation

- Build data transformation scripts
- Create import scripts for printshop-os
- Implement data validation
- Test migration in development environment

### Phase 5: Production Migration

- Backup Printavo data
- Execute migration
- Verify data integrity
- Run parallel systems during transition

## Data Models to Map

Based on printshop-os architecture, the Printavo data needs to be mapped to:

- **Strapi Customer Model** - Customer contact information, history
- **Strapi Job/Order Model** - Orders, quotes, production jobs
- **Strapi Invoice Model** - Billing and payment information
- **Strapi Product Model** - Product catalog (future)
- **Strapi Inventory Model** - Stock levels (future)

## Requirements

The API client requires Python 3.7+ and the following packages:

```bash
pip install requests
```

Or using a requirements.txt:

```
requests>=2.28.0
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive credentials
3. **Restrict API key permissions** to read-only if possible
4. **Rotate API keys** after migration is complete
5. **Secure exported data files** - they contain sensitive business information

## API Documentation

Refer to Printavo's official API documentation for:
- Authentication details
- Available endpoints
- Rate limits and pagination
- Data schemas
- API changes and updates

## Next Steps

After running the initial data extraction:

1. **Review Exported Data**
   - Open the generated JSON files
   - Understand the data structure
   - Identify all fields and their purposes

2. **Document Schema**
   - Create mapping document between Printavo and printshop-os
   - Note any fields that need transformation
   - Identify relationships between entities

3. **Plan Transformation**
   - Design data transformation logic
   - Handle edge cases and data validation
   - Plan for missing or incomplete data

4. **Implement Import**
   - Create scripts to import into Strapi
   - Test with sample data first
   - Validate imported data matches source

5. **Execute Migration**
   - Backup all data
   - Run full migration
   - Verify and validate
   - Transition operations to printshop-os

## Support

For questions or issues with the Printavo API integration:

1. Check Printavo API documentation
2. Review printshop-os documentation in `/docs`
3. Create an issue in the printshop-os repository
4. Contact the development team

---

**Built for printshop-os migration**  
Part of the PrintShop OS project - https://github.com/hypnotizedent/printshop-os
