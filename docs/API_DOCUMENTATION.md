# PrintShop OS - API Documentation

This document provides an overview of all APIs in PrintShop OS with links to detailed OpenAPI specifications.

## API Overview

PrintShop OS consists of multiple services, each with its own API:

| Service | Port | Description | OpenAPI Spec |
|---------|------|-------------|--------------|
| **Strapi CMS** | 1337 | Content management for customers, orders, jobs, quotes | [`printshop-strapi/openapi.yaml`](../printshop-strapi/openapi.yaml) |
| **API Service** | 3001 | Analytics, authentication, inventory | [`services/api/openapi.yaml`](../services/api/openapi.yaml) |
| **Job Estimator** | 3001* | Pricing engine with rule-based calculations | [`services/job-estimator/openapi.yaml`](../services/job-estimator/openapi.yaml) |
| **Production Dashboard** | 3000 | Real-time production floor management | [`services/production-dashboard/openapi.yaml`](../services/production-dashboard/openapi.yaml) |

\* Job Estimator and API Service share port 3001 in different deployment scenarios.

## Quick Access

### Swagger UI

When services are running, you can access Swagger UI at:
- **API Service**: http://localhost:3001/api-docs
- **Strapi**: Built-in documentation at http://localhost:1337/admin

### OpenAPI Specifications

All OpenAPI specs are in YAML format and follow OpenAPI 3.0.3 specification.

## Service Details

### Strapi CMS API (Port 1337)

**Base URL**: `http://localhost:1337/api`

The Strapi CMS provides CRUD operations for all content types:

#### Content Types
- **Customers** - `/api/customers` - Customer accounts and information
- **Orders** - `/api/orders` - Order management with status tracking
- **Jobs** - `/api/jobs` - Production job tracking
- **Quotes** - `/api/quotes` - Quote creation and approval workflow
- **Products** - `/api/products` - Supplier product catalog
- **Employees** - `/api/employees` - Employee records
- **Time Clock Entries** - `/api/time-clock-entries` - Time tracking
- **Payments** - `/api/payments` - Payment records
- **Colors** - `/api/colors` - Ink and thread colors
- **SOPs** - `/api/sops` - Standard operating procedures

#### Authentication
- Bearer token authentication using API tokens from Strapi Admin
- Many endpoints are configured for public access (find/findOne)

---

### API Service (Port 3001)

**Base URL**: `http://localhost:3001/api`

The main API service provides:

#### Authentication (`/api/auth/*`)
- User registration with email activation
- Login with email/password
- Two-factor authentication (2FA)
- Token refresh and logout
- Password reset flow

**Security Features**:
- Rate limiting on login attempts (5/15min)
- Rate limiting on registration (3/hour)
- JWT access and refresh tokens
- bcrypt password hashing

#### Analytics (`/api/analytics/*`)
- Revenue metrics with forecasting
- Product performance tracking
- Customer lifetime value analysis
- Order pipeline metrics
- CSV/PDF export

#### Inventory (`/api/inventory/*`)
- Real-time supplier inventory queries
- Automatic supplier routing by SKU prefix
- Redis caching (15-minute TTL)
- Batch inventory checks
- Color and size availability
- Volume pricing

**Supported Suppliers**:
- AS Colour (AC-* SKUs, 4-5 digit numbers)
- S&S Activewear (SS-* SKUs)
- SanMar (SM-* SKUs, alphanumeric codes)

---

### Job Estimator / Pricing Engine (Port 3001)

**Base URL**: `http://localhost:3001`

JSON-driven pricing calculator with sub-100ms performance.

#### Features
- Volume discounts
- Print location surcharges
- Color multipliers (screen printing)
- Embroidery stitch count pricing
- Configurable margin targets (35% default)
- Rule precedence system
- Calculation history and audit trail

#### Endpoints
- `POST /pricing/calculate` - Calculate pricing for an order
- `GET /pricing/history` - View calculation history
- `GET /pricing/metrics` - Performance metrics
- `GET /admin/rules` - List pricing rules
- `POST /admin/rules` - Create pricing rule
- `PUT /admin/rules/:id` - Update pricing rule
- `DELETE /admin/rules/:id` - Delete pricing rule

**⚠️ Security Note**: Admin endpoints should be protected in production.

---

### Production Dashboard (Port 3000)

**Base URL**: `http://localhost:3000/api/production`

Real-time production floor management with WebSocket support.

#### REST Endpoints
- **Queue Management** - Production queue viewing and reordering
- **Resource Tracking** - Machine and employee status
- **Time Clock** - Clock in/out, time entry management
- **SOPs** - Standard operating procedure library
- **Analytics** - Production KPIs and metrics

#### WebSocket Events

**Server → Client**:
- `employee:clocked-in` - Employee clock in notification
- `employee:clocked-out` - Employee clock out notification
- `timer:update` - Timer state update
- `order:status_changed` - Order status change

**Client → Server**:
- `subscribe:queue` - Subscribe to queue updates
- `subscribe:order:{id}` - Subscribe to specific order

#### Role-Based Access
- **operator** - Basic queue access, own time clock
- **supervisor** - Queue reordering, resource allocation
- **admin** - Full system access

---

## Security Recommendations

### ⚠️ Routes Needing Improvement

1. **Strapi Public Access** - Many content types have public access enabled. Consider:
   - Restricting create/update/delete to authenticated users
   - Adding role-based permissions for sensitive data

2. **Job Estimator Admin Routes** - Currently no authentication:
   - Add JWT authentication for `/admin/*` endpoints
   - Implement role-based access control

3. **Quote Approval Tokens** - Token-based access for public quote approval:
   - Ensure tokens are cryptographically secure
   - Add token expiration
   - Rate limit approval endpoints

4. **Inventory API** - Public access to supplier data:
   - Consider adding API key authentication
   - Rate limit to prevent abuse

---

## Viewing API Documentation

### Using Swagger UI

1. Install Swagger UI locally:
   ```bash
   npm install -g swagger-ui-cli
   ```

2. View any OpenAPI spec:
   ```bash
   swagger-ui --file services/api/openapi.yaml
   ```

### Using VS Code

Install the "OpenAPI (Swagger) Editor" extension for syntax highlighting and preview.

### Using Redoc

Generate static HTML documentation:
```bash
npx @redocly/cli build-docs services/api/openapi.yaml -o docs/api-reference.html
```

---

## API Versioning

Currently all APIs are at version 1.0.0. Breaking changes will increment the major version.

## Error Handling

All services return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed description",
  "code": "ERROR_CODE"
}
```

HTTP status codes follow REST conventions:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)
