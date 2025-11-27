# Printavo API Reference

> **Last Updated:** November 27, 2025  
> **Source:** [Printavo Apiary Docs](https://printavo.docs.apiary.io/)  
> **Account:** ronny@mintprints.com

## API Access Status

| API Version | Authentication | Data Access | Notes |
|-------------|----------------|-------------|-------|
| **V1 REST** | ✅ Working | ✅ Full Access | Email + Token in query params |
| **V2 GraphQL** | ⚠️ Schema Only | ❌ Unauthorized | Requires special permissions |

## Authentication

```bash
# V1 REST - Query Parameters
GET https://www.printavo.com/api/v1/{endpoint}?email={email}&token={token}

# Rate Limit: 10 requests per 5 seconds
```

## V1 REST Endpoints

### Available & Tested ✅

| Endpoint | Method | Count | Description |
|----------|--------|-------|-------------|
| `/orders` | GET | 12,867 | All orders (quotes + invoices) |
| `/customers` | GET | 3,358 | Customer records |
| `/products` | GET | 105 | Product catalog |
| `/tasks` | GET | 1,463 | Tasks/reminders |
| `/categories` | GET | 19 | Product categories |
| `/expenses` | GET | 297 | Expense records |
| `/orderstatuses` | GET | 25 | Order status definitions |
| `/users` | GET | 4 | User accounts |
| `/delivery_methods` | GET | 2 | Shipping options |
| `/payment_terms` | GET | 4 | Payment term options |
| `/inquiries` | GET | 4 | Customer inquiries |

### Not Accessible ❌

| Endpoint | Status | Issue |
|----------|--------|-------|
| `/orders/{id}/lineitemgroups` | 500 Error | Server error |
| `/fee_presets` | 500 Error | Server error |
| `/account` | 500 Error | Server error |

---

## Endpoint Details

### Orders `/api/v1/orders`

**List Orders:**
```
GET /api/v1/orders?email={email}&token={token}&page=1&per_page=100
```

**Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 25, max: 100)
- `sort_column` - Sort by field
- `direction` - `asc` or `desc`
- `in_production_after` - Filter by production date
- `in_production_before` - Filter by production date

**Search Orders:**
```
GET /api/v1/orders/search?email={email}&token={token}&query={search_term}
```

**Order Actions:**
- `GET /orders/{id}` - Show order
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order
- `DELETE /orders/{id}` - Delete order
- `PUT /orders/{id}/approve` - Approve order
- `GET /orders/{id}/unapprove` - Unapprove order
- `GET /orders/{id}/duplicate_order` - Duplicate order
- `PUT /orders/{id}/update_orderstatus` - Change status
- `POST /orders/{id}/email_invoice` - Email invoice
- `POST /orders/{id}/add_payment` - Add payment
- `POST /orders/{id}/request_payment` - Request payment

**Order Object Fields:**
```json
{
  "id": 123456,
  "order_id": 123456,
  "formatted_id": "10234",
  "visual_id": "10234",
  "nickname": "Order Name",
  "order_nickname": "Order Name",
  "orderstatus_id": 1,
  "orderstatus_name": "Quote",
  "customer_id": 789,
  "customer_name": "Company Name",
  "contact_id": 456,
  "user_id": 1,
  "sales_tax": "0.0",
  "discount": "0.0",
  "total": "500.00",
  "production_notes": "Notes here",
  "customer_note": "Customer facing notes",
  "customer_due_date": "2025-01-15",
  "production_date": "2025-01-10",
  "created_at": "2025-01-01T10:00:00.000Z",
  "updated_at": "2025-01-01T10:00:00.000Z",
  "approved": false,
  "approved_name": null,
  "approved_date": null,
  "lineitems": [...],
  "payments": [...],
  "expenses": [...]
}
```

### Customers `/api/v1/customers`

**List Customers:**
```
GET /api/v1/customers?email={email}&token={token}&page=1&per_page=100
```

**Parameters:**
- `sort_column` - Sort by: `first_name`, `last_name`, `company`, `email`
- `direction` - `asc` or `desc`
- `exclude_sub_customers` - `true` or `false`

**Search Customers:**
```
GET /api/v1/customers/search?email={email}&token={token}&query={search_term}
```

**Customer's Orders:**
```
GET /api/v1/customers/{id}/orders
```

**Customer Object Fields:**
```json
{
  "id": 789,
  "first_name": "John",
  "last_name": "Doe",
  "company": "Company Name",
  "email": "customer@email.com",
  "customer_email": "customer@email.com",
  "phone": "555-1234",
  "fax": "",
  "address_1": "123 Main St",
  "address_2": "Suite 100",
  "city": "Denver",
  "state": "CO",
  "zip": "80202",
  "country": "US",
  "resale_number": "",
  "internal_note": "VIP Customer",
  "sales_tax_total": "0.0",
  "orders_count": 15,
  "outstanding_balance": "250.00",
  "created_at": "2020-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### Products `/api/v1/products`

```
GET /api/v1/products?email={email}&token={token}
```

**Product Object:**
```json
{
  "id": 1,
  "name": "Product Name",
  "category_id": 1,
  "sku": "SKU-001",
  "price": "25.00"
}
```

### Tasks `/api/v1/tasks`

```
GET /api/v1/tasks?email={email}&token={token}
```

### Categories `/api/v1/categories`

```
GET /api/v1/categories?email={email}&token={token}
```

### Order Statuses `/api/v1/orderstatuses`

```
GET /api/v1/orderstatuses?email={email}&token={token}
```

### Messages `/api/v1/messages`

```
GET /api/v1/messages?email={email}&token={token}
POST /api/v1/messages
```

### Inquiries `/api/v1/inquiries`

```
GET /api/v1/inquiries?email={email}&token={token}
POST /api/v1/inquiries
GET /api/v1/inquiries/{id}
PUT /api/v1/inquiries/{id}
DELETE /api/v1/inquiries/{id}
```

### Preset Task Groups `/api/v1/preset_task_groups`

```
GET /api/v1/preset_task_groups?email={email}&token={token}
POST /api/v1/preset_task_groups
GET /api/v1/preset_task_groups/{id}
PUT /api/v1/preset_task_groups/{id}
```

---

## V2 GraphQL (Limited Access)

**Endpoint:** `https://www.printavo.com/api/v2`

**Authentication:** Same email + token as V1 (in query params or headers)

**Status:** Schema introspection works, but data queries return **"Unauthorized"**

### Available Query Types (Schema Only)
- `account` - Account info
- `orders` / `invoices` / `quotes` - Order data (union type)
- `customers` / `contacts` - Customer data
- `lineItem` / `lineItemGroup` - Line item data
- `statuses` - Order statuses
- `tasks` - Tasks
- `products` - Products
- `transactions` - Payments
- `threads` / `thread` - Messages

### Key Types

**Invoice/Quote (51 fields):**
- id, visualId, nickname, total, amountPaid, amountOutstanding
- contact, customer, status, lineItemGroups
- createdAt, dueAt, customerDueAt
- billingAddress, shippingAddress
- productionNote, customerNote

**LineItemGroup (7 fields):**
- id, position, lineItems, imprints, order

**LineItem (20 fields):**
- id, description, color, items, price
- category, itemNumber, lineItemGroup

**Imprint (via LineItemGroup):**
- Available through lineItemGroups connection
- Contains decoration/printing details

> **Note:** V2 access may require contacting Printavo support or having a higher-tier subscription.

---

## Data Extraction Summary

**Completed:** November 27, 2025

| Data Type | Records | File Size |
|-----------|---------|-----------|
| Orders | 12,867 | 61 MB |
| Line Items | 44,158 | 23 MB |
| Customers | 3,358 | 3.8 MB |
| Tasks | 1,463 | 864 KB |
| Expenses | 297 | 82 KB |
| Products | 105 | 17 KB |
| Order Statuses | 25 | 5.7 KB |
| Categories | 19 | 1 KB |
| Users | 4 | 4.1 KB |
| Payment Terms | 4 | 757 B |
| Inquiries | 4 | 3.2 KB |
| Delivery Methods | 2 | 343 B |

**Location:** `data/raw/printavo-exports/complete_2025-11-27_14-20-05/`

---

## Field Mapping to PrintShop OS

| Printavo Field | Strapi Content Type | Strapi Field |
|----------------|---------------------|--------------|
| `id` | order/customer | `printavoId` |
| `formatted_id` / `visual_id` | order | `orderNumber` |
| `nickname` / `order_nickname` | order | `nickname` |
| `orderstatus_name` | order | `status` |
| `customer_id` | order | `customer` (relation) |
| `total` | order | `totalAmount` |
| `sales_tax` | order | `salesTax` |
| `discount` | order | `discount` |
| `production_date` | order | `dueDate` |
| `production_notes` | order | `productionNotes` |
| `customer_note` | order | `customerNotes` |
| `company` | customer | `company` |
| `email` / `customer_email` | customer | `email` |
| `phone` | customer | `phone` |
| `address_1` + `address_2` | customer | `address` |
| `lineitems` | line-item | (separate collection) |

---

## Known Issues & Limitations

1. **Imprints not accessible via V1** - The `/lineitemgroups` endpoint returns 500 errors
2. **V2 requires special auth** - Schema works but data queries are unauthorized
3. **Rate limiting** - 10 requests per 5 seconds (use delays in scripts)
4. **Account endpoint broken** - Returns 500 error
5. **Fee presets broken** - Returns 500 error

---

## Scripts

- **Full Extraction:** `scripts/printavo-complete-extraction.py`
- **Basic Extraction:** `scripts/printavo-full-extraction.py`
- **Import to Strapi:** `scripts/import-all-data.py`
