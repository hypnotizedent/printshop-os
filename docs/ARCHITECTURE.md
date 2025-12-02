# PrintShop OS - System Architecture

**Last Updated:** November 26, 2025

> **📚 Related Documentation:**
> - **[ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md)** ⭐ **START HERE** - High-level system design with Mermaid diagrams (30-45 min read)
> - **[Diagrams](docs/diagrams/)** - Standalone Mermaid diagram files for embedding and reference
> - **[ARCHITECTURE_SYNC_CHECKLIST.md](ARCHITECTURE_SYNC_CHECKLIST.md)** - Checklist for keeping documentation synchronized
> - **[SERVICE_DIRECTORY.md](SERVICE_DIRECTORY.md)** - Service locations and responsibilities
> - **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Project status and goals
>
> 💡 **Documentation Philosophy:** This file contains technical implementation details. For interface-focused architectural understanding, see ARCHITECTURE_OVERVIEW.md first.

---

## System Overview

PrintShop OS uses a **microservices architecture** with a central CMS (Strapi) acting as the single source of truth for all data. Services communicate via REST APIs and WebSocket for real-time updates.

### Three-Portal Architecture

The frontend implements a three-portal system separating user experiences:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PrintShop OS                             │
├─────────────────┬────────────────────┬─────────────────────────┤
│  Customer Portal │   Employee Portal  │    Admin Dashboard      │
│   /portal/*      │   /production/*    │      /admin/*           │
├─────────────────┼────────────────────┼─────────────────────────┤
│ • Order History  │ • My Jobs          │ • Full Dashboard        │
│ • Quote Requests │ • Production       │ • All Jobs              │
│ • Profile        │   Schedule         │ • All Customers         │
│ • Support        │ • Help             │ • Reports               │
│                  │ • Clock In/Out     │ • Settings              │
│                  │                    │ • Invoices              │
│                  │                    │ • AI Assistant          │
└─────────────────┴────────────────────┴─────────────────────────┘
```

**Route Structure:**
- `/` - Customer Landing (public)
- `/login/customer` - Customer email/password login
- `/login/employee` - Employee PIN login (tablet-friendly)
- `/login/admin` - Owner email/password + 2FA login
- `/portal/*` - Customer Portal (auth: customer)
- `/production/*` - Employee Portal (auth: employee)
- `/admin/*` - Owner Dashboard (auth: owner)
- `/designer` - Online Designer (public)
- `/track/:orderNumber` - Public order tracking
- `/quote/:token` - Public quote approval

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Customer Portal  │  │ Admin Dashboard  │  │ Production   │  │
│  │    (React)       │  │    (React)       │  │   Floor UI   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Main API Service (Express)                  │   │
│  │  - Authentication (JWT)                                   │   │
│  │  - Rate Limiting                                          │   │
│  │  - Request Routing                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Production   │  │ Customer     │  │ AI Quote           │   │
│  │ Dashboard    │  │ Service      │  │ Optimizer          │   │
│  │ API          │  │ API          │  │ (OpenAI Vision)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Supplier     │  │ Analytics    │  │ Notification       │   │
│  │ Sync         │  │ Service      │  │ Service            │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Strapi CMS (Central Hub)                  │     │
│  │  - Content Types (Orders, Customers, Products, etc.)  │     │
│  │  - Custom Controllers                                  │     │
│  │  - Authentication & Permissions                        │     │
│  │  - File Management                                     │     │
│  └───────────────────────────────────────────────────────┘     │
│                              ↓                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   PostgreSQL     │  │      Redis       │                    │
│  │   (Primary DB)   │  │    (Caching)     │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Integrations                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ SS Activewear│  │   SanMar     │  │  AS Colour   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Printavo   │  │  OpenAI API  │  │ Email (SMTP) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. Strapi CMS (Central Database)
**Location:** `printshop-strapi/`  
**Port:** 1337  
**Role:** Single source of truth for all data

**Content Types:**
- `order` - Customer orders
- `customer` - Customer accounts
- `product` - Product catalog
- `time-clock-entry` - Time tracking
- `employee` - Staff management
- `support-ticket` - Customer support
- `sop` - Standard Operating Procedures

**Key Features:**
- Auto-generated REST API
- Custom controllers for complex logic
- File upload/download
- User authentication & permissions
- Lifecycle hooks for automation

### 2. Production Dashboard API
**Location:** `services/production-dashboard/`  
**Port:** 3000  
**Role:** Real-time production floor management

**Features:**
- WebSocket server (Socket.io)
- Time clock with PIN authentication
- Job tracking and status updates
- SOP library management
- Role-based permissions
- Real-time labor cost calculation

**Endpoints:**
- `/api/production/time-clock/*` - Clock in/out operations
- `/api/production/queue` - Production queue management
- `/api/production/resources` - Machine/employee tracking
- `/api/production/sops/*` - SOP operations

**WebSocket Events:**
- `employee:clocked-in/out`
- `timer:update/pause/resume`
- `order:status_changed`
- `resource:allocated`

### 3. Analytics Service
**Location:** `services/api/` (integrated)  
**Port:** 3002  
**Role:** Business intelligence and reporting

**Features:**
- Revenue analytics with forecasting
- Product performance tracking
- Customer lifetime value
- Production KPIs
- CSV/PDF export
- Redis caching (15-60min TTL)

**Endpoints:**
- `/api/analytics/revenue` - Revenue metrics
- `/api/analytics/products` - Product analytics
- `/api/analytics/customers` - Customer insights
- `/api/analytics/orders` - Order metrics
- `/api/analytics/export` - Data export

### 4. AI Quote Optimizer
**Location:** `services/customer-service-ai/`  
**Role:** AI-powered design analysis and quote optimization

**Features:**
- OpenAI GPT-4 Vision API integration
- Automatic design analysis (<5s)
- Print recommendation engine
- Issue detection (resolution, bleed, color)
- Cost optimization suggestions
- 1-hour response caching

**API:**
- `createQuoteOptimizer()` - Initialize optimizer
- `optimizeQuote()` - Analyze design and generate recommendations

**Cost:** ~$0.01 per analysis (target <$0.02)

### 5. Supplier Sync Service
**Location:** `services/api/supplier-sync/`  
**Role:** Normalize and sync supplier data

**Features:**
- Multi-supplier support (SS Activewear, SanMar, AS Colour)
- Data normalization (sizes, colors, SKUs, pricing)
- Fuzzy product matching
- Schema validation
- Batch processing

**Suppliers:**
- **SS Activewear:** JSON API
- **SanMar:** OAuth + XML
- **AS Colour:** REST API

### 6. Customer Portal API
**Location:** `services/api/` (customer routes)  
**Role:** Customer-facing functionality

**Features:**
- Order history and details
- Support ticket system
- Invoice/file downloads
- Quote management
- Account management

**Endpoints:**
- `/api/customer/orders/*` - Order operations
- `/api/customer/tickets/*` - Support tickets
- `/api/customer/quotes/*` - Quote management

### 7. Label Formatter Service (Planned)
**Location:** `services/label-formatter/`  
**Role:** Automated shipping label processing and formatting

**Features:**
- PDF and image label processing
- Auto-rotation detection
- Smart cropping to label boundaries
- Format conversion to 4x6 Rollo printer specs
- Batch processing support
- Label processing history

**API:**
- `POST /api/labels/format` - Upload and format label
- `GET /api/labels/:id` - Retrieve formatted label
- `GET /api/labels/history` - Processing history

**Technology:**
- Node.js/TypeScript or Python/FastAPI
- PDF processing: pdf-lib or PyPDF2
- Image processing: sharp or Pillow
- Auto-detection algorithms for orientation

**Performance:**
- Processing time: <2 seconds per label
- Supports PDF, PNG, JPG inputs
- Output: Print-ready 4x6 PDF

**Business Value:**
- Eliminates 6-step manual Photoshop workflow
- Time savings: 95% reduction (3-5 min → <10 sec)
- Annual savings: ~40 hours (~$800-$2000 value)

**Status:** Issue #143 - Agent assigned

## Data Flow Patterns

### Order Creation Flow
```
Customer → Frontend → API Gateway → Strapi
                                      ↓
                            Create Order Record
                                      ↓
                              Update Inventory
                                      ↓
                            Trigger Notifications
                                      ↓
                          WebSocket Broadcast
                                      ↓
                        Production Dashboard Update
```

### Time Clock Flow
```
Employee PIN → Production Dashboard → Validate PIN
                                          ↓
                                    Create Time Entry
                                          ↓
                                    Strapi API Call
                                          ↓
                                  Store in PostgreSQL
                                          ↓
                                Calculate Labor Cost
                                          ↓
                              WebSocket Broadcast
                                          ↓
                            Update Dashboard UI
```

### Quote Optimization Flow
```
Customer Upload → Frontend → AI Quote Optimizer
                                      ↓
                              OpenAI Vision API
                                      ↓
                          Design Analysis (<5s)
                                      ↓
                        Recommendation Engine
                                      ↓
                          Generate Suggestions
                                      ↓
                            Cache Response
                                      ↓
                         Return to Frontend
```

### Supplier Sync Flow
```
Scheduled Job → Supplier Sync Service → Supplier API
                                             ↓
                                      Fetch Products
                                             ↓
                                  Normalize Data
                                             ↓
                              Fuzzy Match Existing
                                             ↓
                            Update/Create in Strapi
                                             ↓
                          Invalidate Redis Cache
```

### Label Formatting Flow (Planned)
```
User Upload → Frontend → Label Formatter Service
   (PDF/Image)                      ↓
                            Parse Document
                                    ↓
                         Extract Label Image
                                    ↓
                        Detect Orientation
                                    ↓
                    Auto-Rotate if Needed
                                    ↓
                   Detect Label Boundaries
                                    ↓
                      Smart Crop to Label
                                    ↓
                    Resize to 4x6 Format
                                    ↓
                    Optimize for Printing
                                    ↓
                  Save to data/labels/
                                    ↓
                Return Print-Ready PDF
                                    ↓
              Frontend → Download/Print
```

## Authentication & Security

### Authentication Flow
```
User Login → API → JWT Token → Frontend
                        ↓
                  Store in Memory
                        ↓
              Attach to Requests
                        ↓
            API Validates Token
                        ↓
        Extract User/Role Info
                        ↓
          Check Permissions
                        ↓
          Allow/Deny Access
```

### Security Layers

1. **API Gateway Level**
   - Rate limiting (100 req/15min global)
   - JWT validation
   - CORS configuration
   - Input sanitization

2. **Service Level**
   - Role-based access control (RBAC)
   - Permission checks per endpoint
   - Audit logging
   - Data-level restrictions

3. **Database Level**
   - PostgreSQL permissions
   - Prepared statements (SQL injection prevention)
   - Encrypted sensitive fields (PINs with bcrypt)

4. **External APIs**
   - OAuth for suppliers
   - API key rotation
   - Rate limiting per provider

## Caching Strategy

### Redis Cache Layers

**Layer 1: API Response Cache**
- TTL: 15-60 minutes based on data volatility
- Keys: `cache:{service}:{endpoint}:{params-hash}`
- Use: Analytics, product listings, customer data

**Layer 2: Computed Data Cache**
- TTL: 5-15 minutes
- Keys: `computed:{type}:{id}:{calculation}`
- Use: Labor costs, totals, aggregations

**Layer 3: Session Cache**
- TTL: 24 hours
- Keys: `session:{token-hash}`
- Use: User sessions, temporary data

**Cache Invalidation:**
- Time-based (TTL expiration)
- Event-based (data updates)
- Manual (API endpoint)

### Caching Performance
- **Hit Rate Target:** >80%
- **Response Time Improvement:** 5-10x faster
- **Database Load Reduction:** ~80%
- **Cost Savings:** $500+/month

## Real-Time Updates

### WebSocket Architecture

**Server:** Socket.io on Production Dashboard API  
**Port:** 3000  
**Transport:** WebSocket with fallback to polling

**Room Structure:**
```
/production - All production updates
/production/orders - Order-specific updates
/production/employees/{id} - Employee-specific
/admin - Admin notifications
/customer/{id} - Customer-specific updates
```

**Event Types:**
- **order:*** - Order lifecycle events
- **employee:*** - Time clock events
- **resource:*** - Machine/employee allocation
- **alert:*** - System alerts
- **timer:*** - Real-time timer updates

**Connection Flow:**
```
Client Connect → Authenticate → Join Rooms → Subscribe to Events
                                                       ↓
                                            Receive Updates
                                                       ↓
                                             Update UI
```

## Database Schema (High-Level)

### Core Tables
```
orders
├── id (UUID)
├── orderNumber (String, unique)
├── customerId (FK → customers)
├── status (Enum)
├── items (JSON)
├── totalAmount (Decimal)
├── createdAt, updatedAt

customers
├── id (UUID)
├── name (String)
├── email (String, unique)
├── companyName (String)
├── createdAt, updatedAt

employees
├── id (UUID)
├── name (String)
├── pin (String, hashed)
├── role (Enum)
├── hourlyRate (Decimal)
├── createdAt, updatedAt

time_clock_entries
├── id (UUID)
├── employeeId (FK → employees)
├── jobNumber (String)
├── clockIn, clockOut (Timestamp)
├── totalTime, breakTime (Integer)
├── laborCost (Decimal)
├── status (Enum)

products
├── id (UUID)
├── sku (String, unique)
├── name (String)
├── brand (String)
├── category (String)
├── pricing (JSON)
├── supplierId (String)

support_tickets
├── id (UUID)
├── ticketNumber (String, unique)
├── customerId (FK → customers)
├── category, priority, status (Enum)
├── subject, description (Text)
├── createdAt, updatedAt
```

### Relationships
- One-to-Many: Customer → Orders
- One-to-Many: Employee → TimeClockEntries
- One-to-Many: Order → OrderItems
- Many-to-Many: Products ↔ Suppliers (via product variants)

## Performance Considerations

### Optimization Strategies

1. **Database Optimization**
   - Indexed fields: orderNumber, customerId, status, createdAt
   - Pagination on all list endpoints (20-100 items/page)
   - Selective field loading (avoid SELECT *)

2. **API Performance**
   - Redis caching (80%+ hit rate)
   - Response compression (gzip)
   - Async operations where possible
   - Connection pooling (PostgreSQL)

3. **Frontend Performance**
   - Code splitting (Vite)
   - Lazy loading components
   - Debounced search (300ms)
   - Virtualized lists for large datasets

4. **Real-Time Performance**
   - Room-based broadcasting (targeted updates)
   - Event throttling (max 10/sec per client)
   - Automatic reconnection with backoff

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response (cached) | <100ms | 50-80ms ✅ |
| API Response (fresh) | <500ms | 200-400ms ✅ |
| WebSocket Latency | <100ms | <100ms ✅ |
| Page Load | <3s | TBD |
| Cache Hit Rate | >80% | 80%+ ✅ |
| Concurrent Users | 100+ | 100+ ✅ |

## Error Handling

### Error Propagation
```
Service Error → Log to Console → Format Error Response
                                         ↓
                               Return HTTP Status Code
                                         ↓
                                Client Receives Error
                                         ↓
                                 Display User Message
                                         ↓
                                 (Optional) Retry
```

### Error Categories

1. **Validation Errors (400)**
   - Invalid input
   - Missing required fields
   - Format errors

2. **Authentication Errors (401)**
   - Invalid/expired token
   - Missing credentials

3. **Authorization Errors (403)**
   - Insufficient permissions
   - Role restrictions

4. **Not Found Errors (404)**
   - Resource doesn't exist

5. **Server Errors (500)**
   - Database errors
   - External API failures
   - Unexpected exceptions

### Error Response Format
```json
{
  "error": true,
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {}, // Development only
  "timestamp": "2025-11-24T12:00:00Z"
}
```

## Deployment Architecture

### Development Environment
```
Docker Compose:
├── PostgreSQL (port 5432)
├── Redis (port 6379)
├── Strapi (port 1337)
├── Production Dashboard API (port 3000)
├── Analytics API (port 3002)
└── Frontend Dev Server (port 5173)
```

### Production Environment (Planned)
```
Load Balancer
├── Frontend (Static hosting)
├── API Gateway (Nginx)
│   ├── Strapi CMS (PM2)
│   ├── Production Dashboard (PM2)
│   └── Analytics Service (PM2)
├── PostgreSQL (Managed DB)
└── Redis (Managed Cache)
```

## Service Communication

### Inter-Service Communication

**Method:** REST API calls via HTTP  
**Authentication:** Service-to-service JWT tokens  
**Timeout:** 5-30 seconds depending on operation  
**Retry:** 3 attempts with exponential backoff

**Example:**
```
Production Dashboard → Strapi API
GET /api/orders?status=InProduction
Authorization: Bearer {service-token}

Response:
{
  "data": [...],
  "meta": { "pagination": {...} }
}
```

## Monitoring & Logging

### Logging Strategy

**Levels:**
- ERROR: Critical failures
- WARN: Potential issues
- INFO: Significant events
- DEBUG: Development details

**What to Log:**
- API requests/responses
- Authentication attempts
- Database queries (slow queries)
- External API calls
- Error stack traces
- Performance metrics

**Where:**
- Console (development)
- Files (production)
- External service (planned: LogRocket, Sentry)

### Health Checks

**Endpoints:**
- `/health` - Service status
- `/ready` - Ready to accept traffic
- `/metrics` - Prometheus-compatible metrics

## Scalability Considerations

### Horizontal Scaling

**Services that can scale:**
- Production Dashboard API (stateless + Redis session)
- Analytics Service (stateless + shared cache)
- Customer Portal API (stateless)

**Services with limitations:**
- Strapi (database bottleneck)
- WebSocket (requires sticky sessions)

### Vertical Scaling

**Priority order:**
1. PostgreSQL (most impactful)
2. Redis (if cache hit rate drops)
3. Application servers (CPU/memory)

### Database Scaling
- Read replicas for analytics
- Connection pooling
- Query optimization
- Archival strategy for old data

## Technology Decisions

### Why These Choices?

**Strapi:**
- Rapid API development
- Built-in admin panel
- Extensible with plugins
- Strong TypeScript support

**Redis:**
- In-memory speed
- Simple key-value caching
- Pub/sub for WebSocket scaling
- Battle-tested reliability

**Socket.io:**
- WebSocket with fallbacks
- Room-based broadcasting
- Automatic reconnection
- Cross-platform support

**OpenAI Vision:**
- State-of-the-art image analysis
- Structured output support
- Reasonable cost (~$0.01/analysis)
- Easy integration

**PostgreSQL:**
- ACID compliance
- JSON support
- Full-text search
- Mature ecosystem

## Future Architecture Improvements

### Planned Enhancements

1. **Message Queue** (RabbitMQ/Redis Streams)
   - Async job processing
   - Email sending
   - Report generation

2. **API Gateway** (Kong/Nginx)
   - Centralized routing
   - Rate limiting
   - Request transformation

3. **Service Mesh** (Istio - if needed)
   - Service discovery
   - Load balancing
   - Circuit breaking

4. **CDN** (Cloudflare/CloudFront)
   - Static asset delivery
   - Global distribution
   - DDoS protection

5. **Monitoring Stack**
   - Prometheus for metrics
   - Grafana for dashboards
   - Sentry for error tracking
   - LogRocket for session replay

---

**Last Major Update:** November 24, 2025  
**Next Review:** When new major service is added  
**Maintained By:** Development team
