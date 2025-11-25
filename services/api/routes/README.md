# Customer Orders API

REST API endpoints for customer portal order history and details.

## Endpoints

### GET `/api/customer/orders`

List customer orders with pagination, filtering, sorting, and search.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sort` (string): Sort field and direction (e.g., "timeline.createdAt:desc", "totals.total:asc")
- `status` (string): Filter by status (comma-separated for multiple)
- `dateFrom` (string): Filter by start date (ISO 8601 format)
- `dateTo` (string): Filter by end date (ISO 8601 format)
- `search` (string): Search by order number, product name, or PO number

**Example Request:**
```bash
GET /api/customer/orders?page=1&limit=10&sort=timeline.createdAt:desc&status=completed,in_production&dateFrom=2025-01-01&search=12345
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "printavoId": "12345",
        "customer": {
          "name": "John Smith",
          "email": "john@example.com",
          "company": "Acme Corp"
        },
        "status": "completed",
        "totals": {
          "subtotal": 845.00,
          "tax": 75.15,
          "shipping": 0,
          "discount": 0,
          "fees": 200.00,
          "total": 1120.15,
          "amountPaid": 1120.15,
          "amountOutstanding": 0
        },
        "lineItems": [...],
        "timeline": {
          "createdAt": "2025-11-15T14:30:00Z",
          "updatedAt": "2025-11-18T19:45:00Z",
          "dueDate": "2025-11-20T00:00:00Z"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### GET `/api/customer/orders/:id`

Get detailed information for a specific order.

**Example Request:**
```bash
GET /api/customer/orders/1
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "printavoId": "12345",
      "customer": {...},
      "billingAddress": {...},
      "shippingAddress": {...},
      "status": "completed",
      "totals": {...},
      "lineItems": [...],
      "timeline": {...}
    }
  }
}
```

### GET `/api/customer/orders/:id/invoice`

Download invoice PDF for a specific order.

**Example Request:**
```bash
GET /api/customer/orders/1/invoice
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=invoice-12345.pdf`

### GET `/api/customer/orders/:id/files`

Download art files as a zip archive for a specific order.

**Example Request:**
```bash
GET /api/customer/orders/1/files
```

**Response:**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename=order-12345-files.zip`

## Running the Server

### Development
```bash
cd services/api
npm install
npm run dev
```

The server will start on port 3002 by default.

### Production
```bash
cd services/api
npm install
npm run build
npm start
```

### Environment Variables

Create a `.env` file in the `services/api` directory:

```env
PORT=3002
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here
NODE_ENV=production
```

## Testing

Run the test suite:

```bash
cd services/api
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## API Client Example

```typescript
// Fetch orders
const response = await fetch('http://localhost:3002/api/customer/orders?page=1&limit=10');
const data = await response.json();

// Get order details
const orderResponse = await fetch('http://localhost:3002/api/customer/orders/1');
const orderData = await orderResponse.json();

// Download invoice
window.open('http://localhost:3002/api/customer/orders/1/invoice', '_blank');

// Download files
window.open('http://localhost:3002/api/customer/orders/1/files', '_blank');
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `404 Not Found` - Order not found
- `500 Internal Server Error` - Server error

Error responses include a message:

```json
{
  "error": "Order not found",
  "message": "Order with ID 999 does not exist"
}
```
