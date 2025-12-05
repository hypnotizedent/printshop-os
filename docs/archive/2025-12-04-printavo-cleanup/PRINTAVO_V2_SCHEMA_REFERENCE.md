# Printavo V2 GraphQL Schema Reference

> **Purpose**: Complete reference of all Printavo V2 API types and fields  
> **Last Updated**: December 2025  
> **API Version**: GraphQL v2

---

## Overview

This document provides a complete reference of Printavo's V2 GraphQL API schema, based on actual extraction scripts and data structures used in PrintShop OS.

**API Endpoint**: `https://www.printavo.com/api/v2/graphql`

**Authentication**: Bearer token (obtained via email/password)

---

## Core Types

### Invoice (Order)

The primary data structure containing order information, line items, and relationships.

```typescript
interface Invoice {
  // Identifiers
  id: string;                      // Unique identifier
  visualId: string;                // Human-readable ID (e.g., "12345")
  orderNumber?: string;            // Alternative order number
  nickname?: string;               // Order nickname/name
  
  // Status
  status: {
    id: string;
    name: string;                  // e.g., "Complete", "In Production"
    color: string;                 // Hex color code
  };
  productionStatus?: string;       // Production-specific status
  
  // Dates
  customerDueAt?: string;          // ISO 8601 timestamp
  inHandsDate?: string;            // ISO 8601 timestamp
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  
  // Financial
  total: number;                   // Total amount (includes tax)
  subtotal: number;                // Subtotal before tax
  taxTotal: number;                // Total tax amount
  discountTotal: number;           // Total discount amount
  depositAmount?: number;          // Deposit paid
  balance?: number;                // Remaining balance
  
  // Relationships
  customer: {
    id: string;
    company?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  
  // Line Items
  lineItemGroups: LineItemGroup[]; // Groups of related line items
  
  // Tasks
  tasks: Task[];                   // Production tasks
  
  // Payments
  payments: Payment[];             // Payment records
  
  // Notes
  productionNote?: string;         // Internal production notes
  customerNote?: string;           // Customer-facing notes
  privateNote?: string;            // Private internal notes
  
  // Additional Fields
  salesRep?: {
    id: string;
    name: string;
    email?: string;
  };
  
  // Files & Artwork
  artworkFiles?: ArtworkFile[];
  productionFiles?: ProductionFile[];
  invoiceFiles?: InvoiceFile[];
}
```

**Field Count**: 51+ fields

**Key Relationships**:
- `customer` → Customer
- `lineItemGroups` → LineItemGroup[]
- `tasks` → Task[]
- `payments` → Payment[]

---

### Customer

Customer records with contact information and addresses.

```typescript
interface Customer {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Basic Info
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  
  // Relationships
  addresses: Address[];            // Shipping/billing addresses
  contacts: Contact[];             // Associated contacts
  
  // Metadata
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  
  // Additional
  taxable?: boolean;               // Tax status
  taxRate?: number;                // Custom tax rate
  notes?: string;                  // Customer notes
  customerType?: string;           // Business/Individual
  
  // Stats (may not be in GraphQL, calculated)
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}
```

**Field Count**: 20+ fields

---

### LineItemGroup

Groups of related line items (e.g., all shirts for one design).

```typescript
interface LineItemGroup {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Organization
  position: number;                // Order within invoice
  name?: string;                   // Group name
  
  // Line Items
  lineItems: LineItem[];           // Individual items
  
  // Imprints
  imprints: Imprint[];             // Decoration details
  
  // Totals
  subtotal?: number;               // Group subtotal
  total?: number;                  // Group total
}
```

---

### LineItem

Individual product/service items.

```typescript
interface LineItem {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Product Info
  description: string;             // Item description
  color?: string;                  // Color name
  size?: string;                   // Size (S, M, L, XL, etc.)
  quantity: number;                // Quantity (deprecated, use 'items')
  items?: number;                  // Quantity (preferred)
  
  // Pricing
  price: number;                   // Unit price
  unitPrice?: number;              // Explicit unit price
  total?: number;                  // Line total
  
  // Classification
  category?: string;               // Category/type
  itemNumber?: string;             // SKU or item number
  
  // Tax
  taxable: boolean;                // Taxable flag
  
  // Product Reference
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  
  // Vendor
  vendor?: {
    id: string;
    name: string;
  };
  
  // Style
  style?: {
    id: string;
    name: string;
    styleNumber?: string;
  };
}
```

**Field Count**: 25+ fields

---

### Imprint

Decoration/printing details for line items.

```typescript
interface Imprint {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Location
  location?: string;               // Print location (front, back, etc.)
  
  // Decoration Type
  decorationType?: string;         // Screen print, embroidery, DTG, etc.
  
  // Colors
  inkColors?: InkColor[];          // Ink colors used
  threadColors?: ThreadColor[];    // Thread colors (embroidery)
  
  // Artwork
  artworkFiles?: ArtworkFile[];    // Related artwork files
  
  // Pricing
  setupCharge?: number;            // Setup/screen fees
  runCharge?: number;              // Per-unit decoration cost
  
  // Details
  description?: string;            // Imprint description
  notes?: string;                  // Production notes
  
  // Dimensions
  width?: number;                  // Design width (inches)
  height?: number;                 // Design height (inches)
}
```

**Field Count**: 18+ fields

**Note**: Imprints are CRITICAL for production. They contain decoration details missing from basic line items.

---

### Task

Production tasks and workflow steps.

```typescript
interface Task {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Basic Info
  name: string;                    // Task name
  description?: string;            // Task description
  
  // Assignment
  assignee?: {
    id: string;
    name: string;
    email?: string;
  };
  
  // Status
  status?: string;                 // Task status
  completed: boolean;              // Completion flag
  
  // Dates
  dueAt?: string;                  // ISO 8601 timestamp
  completedAt?: string;            // ISO 8601 timestamp
  createdAt: string;               // ISO 8601 timestamp
  
  // Organization
  position?: number;               // Order in task list
  category?: string;               // Task category
}
```

---

### Payment

Payment and refund records.

```typescript
interface Payment {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Amount
  amount: number;                  // Payment amount
  
  // Method
  paymentMethod: string;           // Cash, Check, Credit Card, etc.
  paymentMethodDetails?: {
    cardType?: string;             // Visa, Mastercard, etc.
    last4?: string;                // Last 4 digits
  };
  
  // Status
  status?: string;                 // Pending, Complete, Failed
  
  // Metadata
  note?: string;                   // Payment notes
  createdAt: string;               // ISO 8601 timestamp
  processedAt?: string;            // ISO 8601 timestamp
  
  // Reference
  referenceNumber?: string;        // Check number, transaction ID
  
  // Relationships
  invoice?: {
    id: string;
    visualId: string;
  };
}
```

---

### Address

Shipping and billing addresses.

```typescript
interface Address {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Type
  type?: string;                   // Shipping, Billing
  name?: string;                   // Address name/label
  
  // Address Fields
  address1: string;                // Street address line 1
  address2?: string;               // Street address line 2
  city: string;                    // City
  state: string;                   // State/Province
  zip: string;                     // Postal code
  country?: string;                // Country (default: US)
  
  // Contact
  attention?: string;              // Attention line
  phone?: string;                  // Phone number
  
  // Flags
  default?: boolean;               // Default address
}
```

---

### Contact

Customer contact persons.

```typescript
interface Contact {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Name
  fullName?: string;               // Full name
  firstName?: string;              // First name
  lastName?: string;               // Last name
  title?: string;                  // Job title
  
  // Contact Info
  email?: string;                  // Email address
  phone?: string;                  // Phone number
  mobile?: string;                 // Mobile phone
  
  // Flags
  primary?: boolean;               // Primary contact
}
```

---

### Quote

Quote/estimate records.

```typescript
interface Quote {
  // Identifiers
  id: string;                      // Unique identifier
  visualId: string;                // Human-readable ID
  
  // Status
  status: {
    id: string;
    name: string;                  // Draft, Sent, Accepted, Declined
  };
  
  // Financial
  total: number;                   // Total amount
  subtotal: number;                // Subtotal
  taxTotal?: number;               // Tax amount
  
  // Dates
  expiresAt?: string;              // ISO 8601 timestamp
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
  acceptedAt?: string;             // ISO 8601 timestamp
  
  // Relationships
  customer: {
    id: string;
    company?: string;
    email?: string;
  };
  
  // Line Items
  lineItemGroups: LineItemGroup[]; // Same structure as orders
  
  // Conversion
  convertedToInvoiceId?: string;   // If accepted and converted
}
```

---

### Product

Product catalog entries.

```typescript
interface Product {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Basic Info
  name: string;                    // Product name
  sku?: string;                    // SKU/item number
  description?: string;            // Product description
  
  // Classification
  category?: string;               // Product category
  subcategory?: string;            // Product subcategory
  
  // Pricing
  defaultPrice?: number;           // Default unit price
  cost?: number;                   // Cost per unit
  
  // Variants
  variants: ProductVariant[];      // Size/color variants
  
  // Vendor
  vendor?: {
    id: string;
    name: string;
  };
  
  // Metadata
  active: boolean;                 // Active flag
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
}
```

---

### ProductVariant

Product size/color combinations.

```typescript
interface ProductVariant {
  // Identifiers
  id: string;                      // Unique identifier
  
  // Variant Details
  sku?: string;                    // Variant-specific SKU
  color?: string;                  // Color name
  size?: string;                   // Size name
  
  // Pricing
  price?: number;                  // Variant-specific price
  cost?: number;                   // Variant-specific cost
  
  // Inventory
  quantityOnHand?: number;         // Current stock
  quantityAvailable?: number;      // Available stock
  reorderPoint?: number;           // Reorder threshold
  
  // Status
  active: boolean;                 // Active flag
}
```

---

### ArtworkFile

Artwork file references.

```typescript
interface ArtworkFile {
  // Identifiers
  id: string;                      // Unique identifier
  
  // File Info
  filename: string;                // Original filename
  url: string;                     // Download URL (Filestack/CDN)
  
  // Type
  fileType: string;                // MIME type
  extension?: string;              // File extension
  
  // Metadata
  size?: number;                   // File size in bytes
  uploadedAt: string;              // ISO 8601 timestamp
  uploadedBy?: {
    id: string;
    name: string;
  };
  
  // Purpose
  category?: string;               // Mockup, Proof, Final Art
  approved?: boolean;              // Approval status
}
```

---

### ProductionFile

Production-ready files (DST, EPS, etc.).

```typescript
interface ProductionFile {
  // Identifiers
  id: string;                      // Unique identifier
  
  // File Info
  filename: string;                // Original filename
  url: string;                     // Download URL
  
  // Type
  fileType: string;                // application/octet-stream, etc.
  extension: string;               // dst, eps, ai, etc.
  
  // Production Details
  location?: string;               // Front, Back, Left Chest, etc.
  decorationType?: string;         // Embroidery, Screen Print, etc.
  
  // Metadata
  size?: number;                   // File size in bytes
  createdAt: string;               // ISO 8601 timestamp
}
```

---

## GraphQL Queries

### Authenticate

```graphql
mutation Authenticate($email: String!, $password: String!) {
  authenticate(input: { email: $email, password: $password }) {
    token
    user {
      id
      email
      name
    }
  }
}
```

### Get Customers

```graphql
query GetCustomers($first: Int!, $after: String) {
  customers(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      firstName
      lastName
      company
      email
      phone
      createdAt
      updatedAt
      addresses {
        id
        name
        address1
        address2
        city
        state
        zip
        country
      }
      contacts {
        id
        fullName
        firstName
        lastName
        email
        phone
      }
    }
  }
}
```

### Get Orders (Invoices)

```graphql
query GetOrders($first: Int!, $after: String) {
  orders(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      visualId
      nickname
      total
      subtotal
      taxTotal
      discountTotal
      productionNote
      customerNote
      createdAt
      updatedAt
      customerDueAt
      inHandsDate
      status {
        id
        name
        color
      }
      customer {
        id
        company
        email
      }
      lineItemGroups {
        id
        position
        lineItems {
          id
          description
          color
          size
          items
          price
          category
          itemNumber
          taxable
        }
        imprints {
          id
          location
          decorationType
          inkColors {
            id
            name
            pantone
          }
          threadColors {
            id
            name
          }
        }
      }
      tasks {
        id
        name
        description
        dueAt
        completedAt
        completed
        assignee {
          id
          name
        }
      }
      payments {
        id
        amount
        paymentMethod
        createdAt
        note
      }
    }
  }
}
```

### Get Quotes

```graphql
query GetQuotes($first: Int!, $after: String) {
  quotes(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      visualId
      status {
        id
        name
      }
      total
      subtotal
      expiresAt
      createdAt
      updatedAt
      customer {
        id
        company
        email
      }
      lineItemGroups {
        id
        position
        lineItems {
          id
          description
          color
          size
          items
          price
        }
      }
    }
  }
}
```

---

## Pagination

All list queries use **cursor-based pagination**:

```typescript
interface PageInfo {
  hasNextPage: boolean;            // More results available
  endCursor: string | null;        // Cursor for next page
}

// Usage
let cursor: string | null = null;
let hasMore = true;

while (hasMore) {
  const response = await query({
    first: 100,                    // Page size
    after: cursor                  // Previous page's endCursor
  });
  
  // Process response.nodes...
  
  cursor = response.pageInfo.endCursor;
  hasMore = response.pageInfo.hasNextPage;
}
```

**Page Size Limits**:
- Minimum: 1
- Maximum: 100
- Recommended: 50-100 for efficiency

---

## Rate Limiting

**Printavo API Limits**:
- **10 requests per 5 seconds** (burst)
- **120 requests per minute** (sustained)

**Recommended Settings**:
```typescript
const RATE_LIMIT_MS = 500;         // 500ms between requests
const MAX_RETRIES = 3;             // Retry on 429 errors
const BACKOFF_MULTIPLIER = 2;      // Exponential backoff
```

**Error Response**:
```json
{
  "errors": [{
    "message": "Rate limit exceeded",
    "extensions": {
      "code": "RATE_LIMITED"
    }
  }]
}
```

---

## Field Descriptions

### Financial Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `subtotal` | number | Sum of line items before tax | 1000.00 |
| `taxTotal` | number | Total tax amount | 85.00 |
| `discountTotal` | number | Total discounts applied | 50.00 |
| `total` | number | Final total (subtotal + tax - discount) | 1035.00 |
| `depositAmount` | number | Deposit paid | 500.00 |
| `balance` | number | Remaining balance | 535.00 |

### Status Fields

| Status | Description |
|--------|-------------|
| `Draft` | Quote in progress |
| `Pending` | Awaiting approval |
| `Approved` | Quote accepted |
| `In Production` | Order being produced |
| `Ready to Ship` | Order complete, ready to ship |
| `Complete` | Order shipped/delivered |
| `Canceled` | Order canceled |

### Decoration Types

| Type | Description |
|------|-------------|
| `Screen Print` | Screen printing |
| `Embroidery` | Machine embroidery |
| `DTG` | Direct-to-garment printing |
| `Heat Transfer` | Heat press vinyl |
| `Sublimation` | Dye sublimation |
| `Laser Engraving` | Laser engraving |

---

## Example Data

### Complete Order JSON

```json
{
  "id": "order_123",
  "visualId": "12345",
  "nickname": "ABC Corp T-Shirts",
  "status": {
    "id": "status_1",
    "name": "Complete",
    "color": "#00FF00"
  },
  "total": 1535.50,
  "subtotal": 1450.00,
  "taxTotal": 85.50,
  "discountTotal": 0,
  "customerDueAt": "2025-12-15T00:00:00Z",
  "createdAt": "2025-12-01T10:30:00Z",
  "updatedAt": "2025-12-10T14:20:00Z",
  "customer": {
    "id": "customer_456",
    "company": "ABC Corporation",
    "email": "orders@abccorp.com"
  },
  "lineItemGroups": [{
    "id": "group_1",
    "position": 1,
    "lineItems": [{
      "id": "item_1",
      "description": "Gildan 5000 T-Shirt",
      "color": "Black",
      "size": "L",
      "items": 24,
      "price": 12.50,
      "category": "Apparel",
      "itemNumber": "G5000",
      "taxable": true
    }],
    "imprints": [{
      "id": "imprint_1",
      "location": "Front Center",
      "decorationType": "Screen Print",
      "inkColors": [{
        "id": "color_1",
        "name": "White",
        "pantone": "White"
      }]
    }]
  }],
  "tasks": [{
    "id": "task_1",
    "name": "Screen Setup",
    "description": "Burn 1-color screen",
    "completed": true,
    "completedAt": "2025-12-05T09:00:00Z"
  }],
  "payments": [{
    "id": "payment_1",
    "amount": 767.75,
    "paymentMethod": "Credit Card",
    "createdAt": "2025-12-01T11:00:00Z",
    "note": "50% deposit"
  }]
}
```

---

## Type Mappings

### Printavo → Strapi

| Printavo Type | Strapi Content Type | Notes |
|---------------|---------------------|-------|
| `Invoice` (Order) | `order` | Main order record |
| `Customer` | `customer` | Customer record |
| `LineItem` | `line-item` | Individual line items |
| `LineItemGroup` | N/A | Flattened into line items |
| `Imprint` | `imprint` | Decoration details |
| `Task` | `task` | Production tasks |
| `Payment` | `payment` | Payment records |
| `Address` | Embedded in `customer` | JSON field |
| `Contact` | Embedded in `customer` | JSON field |

---

## Related Documentation

- [PRINTAVO_EXTRACTION_IMPLEMENTATION.md](PRINTAVO_EXTRACTION_IMPLEMENTATION.md) - Complete extraction guide
- [MINIO_STORAGE_GUIDE.md](MINIO_STORAGE_GUIDE.md) - MinIO configuration
- [N8N_PRINTAVO_WORKFLOWS.md](N8N_PRINTAVO_WORKFLOWS.md) - n8n integration

---

<small>Generated by PrintShop OS | December 2025</small>
