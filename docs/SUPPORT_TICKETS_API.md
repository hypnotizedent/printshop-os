# Support Tickets API Documentation

## Overview

The Support Tickets API provides endpoints for customers to create, view, and manage support tickets. This enables customers to submit issues, track responses, and communicate with the support team without relying on email or phone.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

All endpoints require authentication. Include the customer ID or authentication token in the request.

## Endpoints

### List Customer Tickets

Get all tickets for a customer with optional filters.

**Request:**
```http
GET /api/customer/tickets?customerId={id}&status={status}&category={category}&search={query}&page={page}&pageSize={size}
```

**Query Parameters:**
- `customerId` (required) - Customer ID
- `status` (optional) - Filter by status: `Open`, `In Progress`, `Waiting`, `Resolved`, `Closed`
- `category` (optional) - Filter by category: `Order Issue`, `Art Approval`, `Shipping`, `Billing`, `General`
- `search` (optional) - Search in subject, description, or ticket number
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "TKT-2025-001",
      "customerId": "uuid",
      "category": "Order Issue",
      "priority": "High",
      "status": "Open",
      "subject": "Wrong items received",
      "description": "I received the wrong items in my order",
      "orderNumber": "ORD-001",
      "createdAt": "2025-11-24T10:30:00Z",
      "updatedAt": "2025-11-24T10:30:00Z",
      "closedAt": null,
      "assignedTo": null
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "pageCount": 1,
      "total": 3
    }
  }
}
```

### Create Ticket

Create a new support ticket.

**Request:**
```http
POST /api/customer/tickets
Content-Type: application/json

{
  "customerId": "uuid",
  "category": "Order Issue",
  "priority": "High",
  "subject": "Wrong items received",
  "description": "I received the wrong items in my order. I ordered 100 red t-shirts but got blue ones instead.",
  "orderNumber": "ORD-001"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-2025-001",
    "customerId": "uuid",
    "category": "Order Issue",
    "priority": "High",
    "status": "Open",
    "subject": "Wrong items received",
    "description": "I received the wrong items in my order. I ordered 100 red t-shirts but got blue ones instead.",
    "orderNumber": "ORD-001",
    "createdAt": "2025-11-24T10:30:00Z",
    "updatedAt": "2025-11-24T10:30:00Z"
  }
}
```

**Email Notification:**
- Customer receives confirmation email with ticket number

### Get Ticket Details

Get full details of a specific ticket including comments.

**Request:**
```http
GET /api/customer/tickets/{id}?customerId={customerId}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-2025-001",
    "customerId": "uuid",
    "category": "Order Issue",
    "priority": "High",
    "status": "In Progress",
    "subject": "Wrong items received",
    "description": "I received the wrong items in my order",
    "orderNumber": "ORD-001",
    "createdAt": "2025-11-24T10:30:00Z",
    "updatedAt": "2025-11-24T11:00:00Z",
    "comments": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userType": "staff",
        "message": "We apologize for the mix-up. We're arranging a replacement shipment.",
        "createdAt": "2025-11-24T11:00:00Z",
        "attachments": []
      }
    ],
    "attachments": []
  }
}
```

**Security:**
- Internal notes (isInternal: true) are filtered out for customers
- Customers can only access their own tickets

### Add Comment

Add a comment to an existing ticket.

**Request:**
```http
POST /api/customer/tickets/{id}/comments
Content-Type: application/json

{
  "userId": "uuid",
  "userType": "customer",
  "message": "Thank you! When can I expect the replacement?"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticketId": "uuid",
    "userId": "uuid",
    "userType": "customer",
    "message": "Thank you! When can I expect the replacement?",
    "isInternal": false,
    "createdAt": "2025-11-24T11:15:00Z"
  }
}
```

**Behavior:**
- If ticket is `Resolved` or `Closed`, it's automatically reopened to `In Progress`
- Staff responses trigger email notification to customer

### Update Ticket Status

Update the status of a ticket (staff only).

**Request:**
```http
PATCH /api/customer/tickets/{id}/status
Content-Type: application/json

{
  "status": "Resolved"
}
```

**Valid Status Values:**
- `Open`
- `In Progress`
- `Waiting`
- `Resolved`
- `Closed`

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-2025-001",
    "status": "Resolved",
    "closedAt": "2025-11-24T12:00:00Z",
    "updatedAt": "2025-11-24T12:00:00Z"
  }
}
```

**Email Notification:**
- Customer receives email about status change

### Upload Files

Upload file attachments to a ticket or comment.

**Request:**
```http
POST /api/customer/tickets/{id}/files
Content-Type: multipart/form-data

files: [File, File, ...]
commentId: "uuid" (optional)
```

**File Constraints:**
- Maximum file size: 10MB per file
- Maximum files: 5 per upload
- Allowed types: JPG, PNG, PDF, AI, EPS, PSD, ZIP
- Files are validated by both extension and MIME type

**Security Note:**
For production use, consider implementing additional file validation:
- Magic number (file signature) verification to prevent file type spoofing
- Virus scanning for uploaded files
- Content Security Policy headers for serving files
- Separate storage domain for user uploads

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "fileName": "proof_screenshot.png",
      "fileUrl": "/uploads/tickets/abc123.png",
      "fileSize": 1024000,
      "mimeType": "image/png"
    }
  ]
}
```

### Download File

Download a file attachment.

**Request:**
```http
GET /api/customer/tickets/{ticketId}/files/{fileId}
```

**Response:**
- Redirects to file URL or serves file directly

**Security:**
- File access restricted to ticket participants only

## Data Models

### Ticket

```typescript
{
  id: string                // UUID
  ticketNumber: string      // TKT-YYYY-###
  customerId: string        // UUID
  category: string          // Enum: Order Issue, Art Approval, Shipping, Billing, General
  priority: string          // Enum: Low, Medium, High, Urgent
  status: string            // Enum: Open, In Progress, Waiting, Resolved, Closed
  subject: string
  description: string
  orderNumber?: string      // Optional related order
  createdAt: timestamp
  updatedAt: timestamp
  closedAt?: timestamp      // Set when status is Resolved or Closed
  assignedTo?: string       // Staff member UUID
}
```

### Comment

```typescript
{
  id: string
  ticketId: string
  userId: string
  userType: 'customer' | 'staff'
  message: string
  isInternal: boolean       // Staff notes, hidden from customers
  createdAt: timestamp
}
```

### Attachment

```typescript
{
  id: string
  ticketId: string
  commentId?: string        // Optional, if attached to specific comment
  fileName: string
  fileUrl: string
  fileSize: number          // Bytes
  mimeType: string
}
```

## Email Notifications

The system sends automatic email notifications for:

1. **Ticket Created** - Confirmation to customer with ticket number
2. **Staff Response** - When staff adds a non-internal comment
3. **Status Changed** - When ticket status is updated

All emails include:
- Ticket number
- Subject
- Link to customer portal

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Ticket not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- Ticket creation: 10 per hour per customer
- Comment creation: 30 per hour per customer
- File uploads: 20 per hour per customer

## Testing

Run the test suite:

```bash
cd printshop-strapi
npm test -- src/api/support-ticket/controllers/__tests__/support-ticket.test.ts
```

21 tests covering:
- Ticket creation with validation
- Listing with filters and pagination
- Search functionality
- Comment addition
- Status updates
- Permission checks
- Email notifications

## Example Integration

```typescript
// Create a ticket
const response = await fetch('/api/customer/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-123',
    category: 'Order Issue',
    priority: 'High',
    subject: 'Missing items in order',
    description: 'Order #12345 is missing 20 t-shirts',
    orderNumber: '12345',
  }),
})

const { data: ticket } = await response.json()
console.log('Ticket created:', ticket.ticketNumber)

// Upload files
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)

await fetch(`/api/customer/tickets/${ticket.id}/files`, {
  method: 'POST',
  body: formData,
})

// Add comment
await fetch(`/api/customer/tickets/${ticket.id}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'customer-123',
    userType: 'customer',
    message: 'Thank you for looking into this!',
  }),
})
```

## Performance

Expected performance metrics:
- Ticket creation: < 2 seconds
- File upload: < 3 seconds per file
- Ticket list load: < 1 second
- Comment post: < 500ms

## Caching

- Ticket list cached for 2 minutes
- Ticket details fetched fresh on each request
- File URLs are permanent (no expiration)
