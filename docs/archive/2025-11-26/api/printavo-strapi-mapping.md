# Printavo to Strapi Field Mapping

## Overview

This document maps Printavo API data structures to printshop-os Strapi collection types to guide the data transformation and migration process.

**Data Snapshot:**
- **Customers:** 3,357 records
- **Orders:** 12,854 records
- **Total Revenue:** $9,269,919.53
- **Average Order Value:** $721.17

---

## Customer Mapping

### Strapi Customer Schema (Target)
```json
{
  "Name": "string (required)",
  "Email": "string (required, unique)",
  "Phone": "string",
  "Company": "string",
  "Notes": "text"
}
```

### Printavo Customer Schema (Source)
```json
{
  "id": 8479753,
  "first_name": "string",
  "last_name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "customer_email": "string",
  "extra_notes": "string",
  "billing_address_attributes": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  },
  "shipping_address_attributes": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  }
}
```

### Field Mapping: Printavo → Strapi

| Strapi Field | Printavo Source | Transformation Logic |
|--------------|-----------------|---------------------|
| `Name` | `first_name` + `last_name` | Concatenate with space trim. If both empty, use `company`. Fallback: "Unknown Customer" |
| `Email` | `email` or `customer_email` | Use `email` first, fallback to `customer_email`. If both empty, generate unique: `customer_{id}@imported.local` |
| `Phone` | `phone` | Direct copy. Clean formatting if needed |
| `Company` | `company` | Direct copy |
| `Notes` | `extra_notes` | Direct copy |

### Additional Data Considerations

**Addresses:**
- Printavo has separate `billing_address_attributes` and `shipping_address_attributes`
- Strapi Customer schema doesn't currently have address fields
- **Recommendation:** Store addresses in `Notes` field temporarily or extend Strapi schema to add Address component

**Data Quality Issues Observed:**
- Many customers have empty `first_name` and `last_name` but valid `company`
- Some records have neither name nor email
- Email field sometimes empty but `customer_email` populated

---

## Job/Order Mapping

### Strapi Job Schema (Target)
```json
{
  "JobID": "string (unique)",
  "Status": "enum [Pending Artwork, In Production, Complete, Archived]",
  "MockupImageURL": "string",
  "ArtFileURL": "string",
  "InkColors": "json",
  "Customer": "relation (Customer)"
}
```

### Printavo Order Schema (Source)
```json
{
  "id": 21199730,
  "visual_id": 13657,
  "order_nickname": "string",
  "customer_id": 6581663,
  "orderstatus": {
    "name": "QUOTE",
    "color": "#AE0FBD"
  },
  "customer": {
    "full_name": "string",
    "email": "string",
    "company": "string"
  },
  "lineitems_attributes": [
    {
      "id": "number",
      "style_name": "string",
      "style_number": "string",
      "quantity": "number",
      "cost": "number",
      "price": "number",
      "ink_colors": "array"
    }
  ],
  "order_total": 0,
  "amount_paid": 0,
  "amount_outstanding": 0,
  "created_at": "2025-11-21T18:35:47.684-05:00",
  "due_date": "2025-11-21T10:00:00.000-05:00",
  "production_notes": "string",
  "notes": "string"
}
```

### Field Mapping: Printavo → Strapi

| Strapi Field | Printavo Source | Transformation Logic |
|--------------|-----------------|---------------------|
| `JobID` | `visual_id` | Convert to string. Prefix with "P-" for imported orders: `P-13657` |
| `Status` | `orderstatus.name` | Map Printavo status to Strapi enum (see mapping table below) |
| `MockupImageURL` | N/A | Not available in API. Leave empty for migration |
| `ArtFileURL` | N/A | Not available in API. Leave empty for migration |
| `InkColors` | `lineitems_attributes[].ink_colors` | Aggregate all ink colors from line items into JSON array |
| `Customer` | `customer_id` | Lookup Strapi customer by matching Printavo `customer_id` |

### Status Mapping

| Printavo Status | Strapi Status | Notes |
|-----------------|--------------|-------|
| QUOTE | Pending Artwork | Initial quote stage |
| PENDING | Pending Artwork | Awaiting artwork approval |
| IN PRODUCTION | In Production | Currently being produced |
| READY FOR PICKUP | Complete | Job finished |
| DELIVERED | Complete | Job delivered |
| ARCHIVED | Archived | Old or cancelled |
| CANCELLED | Archived | Cancelled orders |
| (any other) | Pending Artwork | Default safe status |

### Additional Data for Reference

**Financial Data (Not in current Strapi schema but valuable):**
- `order_total` - Total order value
- `amount_paid` - Amount customer has paid
- `amount_outstanding` - Remaining balance
- **Recommendation:** Consider adding these fields to Job schema or store in Notes/JSON field

**Line Items (Product details):**
- Printavo has rich `lineitems_attributes` array with quantities, styles, costs
- Current Strapi schema doesn't have LineItem structure
- **Recommendation:** Store as JSON in a new field or create separate LineItem collection type

**Dates:**
- `created_at` - Order creation date
- `due_date` - Customer due date
- **Recommendation:** Add date fields to Strapi Job schema

---

## Employee Mapping

### Note on Employee Data

The Printavo export does **not** include employee/user records beyond the `user` reference on orders showing who created them.

**Observed Data:**
```json
{
  "user": {
    "name": "Ronny Hantash"
  },
  "user_id": 70356
}
```

**Recommendation:**
- Manually create employee records in Strapi
- Or extract unique `user` names from orders and create stub employee records
- Map `user_id` for reference if needed later

---

## Data Transformation Strategy

### Phase 1: Schema Enhancement
Before importing, consider enhancing Strapi schemas:

**Customer Enhancements:**
```json
{
  "printavo_id": "number (unique)",
  "billing_address": "component",
  "shipping_address": "component",
  "orders_count": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Job Enhancements:**
```json
{
  "printavo_id": "number (unique)",
  "order_total": "decimal",
  "amount_paid": "decimal",
  "amount_outstanding": "decimal",
  "created_at": "datetime",
  "due_date": "datetime",
  "production_notes": "text",
  "line_items": "json",
  "addresses": "json"
}
```

### Phase 2: Transformation Script Requirements

1. **Customer Import:**
   - Read `data/printavo-exports/*/customers.json`
   - Transform each customer record
   - Handle duplicate emails
   - Create unique IDs for customers without emails
   - POST to Strapi `/api/customers`

2. **Order/Job Import:**
   - Read `data/printavo-exports/*/orders.json`
   - For each order:
     - Lookup customer in Strapi by Printavo `customer_id`
     - Map status enum
     - Aggregate ink colors from line items
     - Transform and POST to Strapi `/api/jobs`

3. **Error Handling:**
   - Log failed imports
   - Retry with fallback values
   - Generate report of data quality issues

### Phase 3: Validation

After import, validate:
- Customer count matches (3,357)
- Order count matches (12,854)
- All customer relations resolved
- No orphaned orders
- Status distributions look correct

---

## Next Steps

1. **Enhance Strapi Schemas** - Add missing fields identified in this mapping
2. **Build Transformation Scripts** - Create Python/Node.js scripts to transform data
3. **Test with Sample Data** - Import first 100 records and validate
4. **Full Import** - Run complete migration
5. **Validation & Testing** - Verify data integrity
6. **Documentation** - Document any manual cleanup needed

---

## Transformation Code Snippets

### Customer Transformation (Python)

```python
def transform_customer(printavo_customer):
    """Transform Printavo customer to Strapi format"""
    
    # Build name
    first = (printavo_customer.get('first_name') or '').strip()
    last = (printavo_customer.get('last_name') or '').strip()
    company = (printavo_customer.get('company') or '').strip()
    
    if first and last:
        name = f"{first} {last}"
    elif first:
        name = first
    elif last:
        name = last
    elif company:
        name = company
    else:
        name = "Unknown Customer"
    
    # Build email
    email = printavo_customer.get('email') or printavo_customer.get('customer_email')
    if not email:
        email = f"customer_{printavo_customer['id']}@imported.local"
    
    return {
        'data': {
            'Name': name,
            'Email': email,
            'Phone': printavo_customer.get('phone', ''),
            'Company': company,
            'Notes': printavo_customer.get('extra_notes', ''),
            'printavo_id': printavo_customer['id']
        }
    }
```

### Order Transformation (Python)

```python
def map_status(printavo_status):
    """Map Printavo status to Strapi enum"""
    status_map = {
        'QUOTE': 'Pending Artwork',
        'PENDING': 'Pending Artwork',
        'IN PRODUCTION': 'In Production',
        'READY FOR PICKUP': 'Complete',
        'DELIVERED': 'Complete',
        'ARCHIVED': 'Archived',
        'CANCELLED': 'Archived'
    }
    return status_map.get(printavo_status, 'Pending Artwork')

def transform_order(printavo_order, customer_id_map):
    """Transform Printavo order to Strapi Job format"""
    
    # Get ink colors from line items
    ink_colors = []
    for item in printavo_order.get('lineitems_attributes', []):
        if 'ink_colors' in item and item['ink_colors']:
            ink_colors.extend(item['ink_colors'])
    ink_colors = list(set(ink_colors))  # Remove duplicates
    
    # Lookup Strapi customer ID
    printavo_customer_id = printavo_order['customer_id']
    strapi_customer_id = customer_id_map.get(printavo_customer_id)
    
    return {
        'data': {
            'JobID': f"P-{printavo_order['visual_id']}",
            'Status': map_status(printavo_order['orderstatus']['name']),
            'InkColors': ink_colors,
            'Customer': strapi_customer_id,
            'printavo_id': printavo_order['id'],
            'order_total': printavo_order.get('order_total', 0),
            'amount_paid': printavo_order.get('amount_paid', 0),
            'production_notes': printavo_order.get('production_notes', '')
        }
    }
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-22  
**Data Source:** Printavo API Export (2025-11-22)
