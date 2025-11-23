# 🎨 Frontend Integration Strategy for PrintShop OS

**Document:** Frontend UI/UX Architecture Map  
**Status:** Design Planning Phase (Spark AI Building)  
**Date:** November 23, 2025  
**Related:** Copilot Spark Frontend Development (In Progress)

---

## 🧠 Architecture Overview: Frontend ↔ Backend "Brain"

PrintShop OS has a sophisticated backend "brain" composed of multiple specialized services. The frontend built by Spark will serve as the **sensory interface** to this brain:

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Spark Building)                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Dashboard  │  │ Job Manager  │  │  Customer    │           │
│  │              │  │              │  │   Portal     │           │
│  │ (Real-time)  │  │ (Kanban/     │  │              │           │
│  │              │  │  Gantt)      │  │ (Web/Mobile) │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    HTTP/REST + WebSocket                        │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              BACKEND SERVICES (Operational Brain)                │
│                                                                   │
│  Layer 1: Data Hub                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  STRAPI CMS                                             │    │
│  │  • Central API gateway (port 1337)                     │    │
│  │  • Collections: Order, Quote, Customer, Product       │    │
│  │  • PostgreSQL database                                │    │
│  │  • REST API + GraphQL ready                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 2: Business Logic Services                              │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  API Service     │  │  Pricing Engine  │                    │
│  │  • Quote API     │  │  • Volume calc   │                    │
│  │  • Order API     │  │  • Rush pricing  │                    │
│  │  • Portal API    │  │  • Add-ons       │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Supplier Sync    │  │ Customer Service │                    │
│  │ • SS Activewear  │  │ AI (Future)      │                    │
│  │ • AS Colour      │  │ • Quote suggest  │                    │
│  │ • SanMar         │  │ • Recommendations│                    │
│  │ • Redis cache    │  │ • Chat support   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  Layer 3: Data Sources                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  External APIs                                         │    │
│  │  • Printavo (15-min polling)  → Live order sync       │    │
│  │  • Supplier APIs (cached)      → Product catalog      │    │
│  │  • EasyPost (Future)           → Shipping            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────┘

                  Redis Cache Layer (Performance)
                  PostgreSQL (Persistence)
```

---

## 📡 Frontend Components → Backend API Mapping

### 1. **Dashboard Component** (Real-time Operations View)

**What Spark Frontend Provides:**
- Real-time job status widgets
- Machine status indicators
- Revenue/cost analytics charts
- Upcoming deadlines calendar
- Quick action buttons
- System notifications panel

**Backend Connection Points:**

```typescript
// REST Endpoints the Dashboard Will Call
GET  /api/orders?status=in-progress          // Live order list
GET  /api/orders/summary/by-status            // Status breakdown chart
GET  /api/analytics/revenue?period=daily      // Revenue analytics
GET  /api/quotes/pending                      // Pending quotes
GET  /api/machines/status                     // Machine status (if enabled)

// WebSocket Events for Real-time Updates
socket.on('order:status-changed')             // Order status updates
socket.on('quote:created')                    // New quote notifications
socket.on('order:assigned-to-machine')        // Queue updates
```

**Backend Service Handling:**
- **Strapi**: Stores orders, quotes, status data
- **API Service** (`services/api/src/routes/`): REST endpoints
- **Production Dashboard Service** (Task 3.1 - Agent): WebSocket for real-time
- **Analytics Service** (Task 3.3): Revenue/KPI calculations

**Expected Latency:**
- Initial load: < 2 seconds (Strapi → REST)
- Real-time updates: < 500ms (WebSocket)
- Chart data: < 1 second (Redis cache hits)

---

### 2. **Job Management Component** (Kanban/Gantt Board)

**What Spark Frontend Provides:**
- Kanban board view (Quote → Design → Pre-press → Printing → Finishing → Delivery)
- Timeline/Gantt chart for scheduling
- Job details panel with specifications
- Customer communication thread
- File attachments section
- Cost calculator integration

**Backend Connection Points:**

```typescript
// Job Workflow Management
GET  /api/orders/{id}                         // Full job details
PATCH /api/orders/{id}/status                // Update job status
POST /api/orders/{id}/comments                // Add job notes
GET  /api/orders/{id}/files                   // Job attachments

// Quote Integration
GET  /api/quotes/{id}                         // Quote details
POST /api/quotes                              // Generate new quote
PATCH /api/quotes/{id}/approve                // Approve quote → create order

// Customer Communication
GET  /api/orders/{id}/messages                // Customer messages
POST /api/orders/{id}/messages                // Send update to customer

// Pricing Integration
POST /api/jobs/estimate                       // Call pricing engine
GET  /api/products/pricing/{sku}              // Get product pricing
```

**Backend Service Handling:**
- **Strapi Collections**: Order, Quote, Customer, Product
- **API Service** (Task 2.1): Quote generation endpoint
- **Job Estimator Service** (Agent 3): Pricing calculations
- **Customer Portal API** (Task 2.4): Message threading

**Expected Flow:**
1. User drags job → "Printing" column
2. Frontend calls `PATCH /api/orders/{id}/status`
3. Strapi updates status
4. WebSocket broadcasts to other users
5. Production team sees update in real-time

---

### 3. **File System Component** (File Explorer)

**What Spark Frontend Provides:**
- Visual file explorer (mirrors project structure)
- Drag-and-drop upload
- Real-time file preview
- Version control visualization
- File metadata display
- Quick actions (archive, delete, print)

**Backend Connection Points:**

```typescript
// File Operations
POST /api/files/upload                        // Upload design file
GET  /api/files/{id}                          // Get file metadata
GET  /api/files/{id}/preview                  // Generate preview
DELETE /api/files/{id}                        // Archive/delete file

// File Storage Metadata in Strapi
GET  /api/orders/{id}/files                   // All files for order
POST /api/orders/{id}/files                   // Attach file to order

// Preview Service (Future)
GET  /api/preview/pdf/{fileId}                // PDF preview
GET  /api/preview/image/{fileId}              // Image preview
GET  /api/preview/document/{fileId}           // Document preview
```

**Backend Service Handling:**
- **API Service**: File metadata endpoints
- **File Storage**: Local filesystem or S3 (configure in .env)
- **Preview Service** (Future): PDF/image generation

**Architecture Note:**
```
Frontend File Upload Flow:
┌─────────────┐
│   Frontend  │─── POST with FormData ──→ ┌──────────┐
│  (Dropzone) │                            │ API      │
└─────────────┘                            │ Service  │
                                            └────┬─────┘
                                                 │
                                        ┌────────▼──────────┐
                                        │  Validate file    │
                                        │  Save to disk     │
                                        │  Update Strapi    │
                                        │  Generate preview │
                                        └───────────────────┘
```

---

### 4. **Customer Portal Component** (Web + Mobile)

**What Spark Frontend Provides:**
- Client database with search/filter
- Order history timeline
- Communication log
- Quote/invoice generator
- Customer preferences storage
- Quote request form

**Backend Connection Points:**

```typescript
// Authentication
POST /api/auth/login                          // Customer login
POST /api/auth/logout                         // Logout
POST /api/auth/register                       // New customer signup
GET  /api/auth/me                             // Current user info

// Customer Operations
GET  /api/customer/orders                     // Order history
GET  /api/customer/orders/{id}                // Order details
GET  /api/customer/quotes                     // Quote history
POST /api/customer/quotes                     // Request quote

// Quote Form
POST /api/quotes/request                      // Send quote request
  Body: {
    service: "screen",
    quantity: 100,
    colors: 1,
    design_url: "...",
    deadline: "2025-12-01"
  }
  Response: {
    quote_id: "...",
    total_price: 751.78,
    breakdown: {...},
    valid_until: "2025-12-05"
  }

// Profile Management
GET  /api/customer/profile                    // Get profile
PATCH /api/customer/profile                   // Update profile
```

**Backend Service Handling:**
- **Strapi**: Customer collection + authentication
- **API Service** (Task 2.4): Portal REST endpoints
- **Job Estimator**: Quote calculations
- **Auth Middleware**: JWT token validation

**Expected User Journey:**
1. Customer visits portal → login/register
2. Submits quote request form
3. Frontend calls `POST /api/quotes/request`
4. Backend calls pricing engine
5. Quote returned to customer
6. Customer can approve → creates order
7. Order appears in Strapi
8. Staff notified via dashboard

---

### 5. **Inventory Management Component** (Future Phase)

**What Spark Frontend Provides:**
- Stock level visualizations
- Low stock alerts
- Supplier management interface
- Order tracking
- Cost analysis tools

**Backend Connection Points:**

```typescript
// Stock Management
GET  /api/inventory/levels                    // Current stock
POST /api/inventory/adjust                    // Manual adjustment
POST /api/inventory/reorder                   // Reorder from supplier

// Supplier Products
GET  /api/suppliers/products                  // All supplier products
GET  /api/suppliers/{id}/catalog              // Specific supplier catalog
GET  /api/products/{sku}/pricing              // Product pricing

// Alerts
GET  /api/inventory/alerts                    // Low stock alerts
```

**Backend Service Handling:**
- **Supplier Sync Service** (Task 2.2): Product catalog management
- **Redis Cache**: Product data caching (configured in Task 2.3)
- **Strapi**: Product collection (schema created in Task 1.2)

**Integration Points:**
- Supplier connectors (S&S, AS Colour, SanMar)
- Real-time price sync
- Low-stock alert notifications

---

### 6. **Machine Control Panel Component** (Advanced)

**What Spark Frontend Provides:**
- Real-time machine status dashboard
- Maintenance schedule calendar
- Performance metrics graphs
- Remote control capabilities
- Error log viewer

**Backend Connection Points:**

```typescript
// Machine Operations (If integrated)
GET  /api/machines/status                     // All machine status
GET  /api/machines/{id}/metrics               // Performance data
GET  /api/machines/{id}/maintenance           // Maintenance logs
POST /api/machines/{id}/control               // Send commands

// Alerts
GET  /api/machines/alerts                     // Machine errors/warnings
```

**Backend Service Handling:**
- **Production Dashboard Service** (Task 3.1): WebSocket updates
- **MongoDB/PostgreSQL**: Machine state persistence
- **IoT Integration** (Future): Direct machine communication

---

## 🔌 API Service Integration Matrix

### Service Port Allocation
```
Frontend (Spark)           → Port (To be determined - 3000 or 5000)
Strapi Central API         → Port 1337
Job Estimator Service      → Port 3001
API Service                → Port 3002
Supplier Sync Service      → Port 3003
Production Dashboard WS    → Port 3004
PostgreSQL Database        → Port 5432 (internal)
Redis Cache                → Port 6379 (internal)
```

### Frontend-to-Backend Communication Sequence

**Example: Customer Creates Quote**

```
1. FRONTEND (Spark Portal)
   └─ User fills quote form (service, quantity, colors, etc)

2. FRONTEND → API SERVICE
   └─ POST /api/quotes/request
      Body: {service, quantity, colors, design_url, deadline}

3. API SERVICE → JOB ESTIMATOR
   └─ Calls pricing calculation
      Input: {service, quantity, colors, location, rush}
      Output: {subtotal, discounts, taxes, total}

4. API SERVICE → STRAPI
   └─ Create Quote record
      Fields: {customer_id, service, quantity, total, status: "pending"}

5. API SERVICE → FRONTEND
   └─ Response 200 OK with quote details + quote_id

6. FRONTEND (Spark Portal)
   └─ Display quote to customer
      Show "Approve" button → creates order

7. FRONTEND → API SERVICE
   └─ POST /api/quotes/{quote_id}/approve

8. API SERVICE → STRAPI
   └─ Create Order from Quote
      ├─ Copy quote data
      ├─ Set status: "quote-approved"
      └─ Link to customer

9. FRONTEND (Spark Dashboard)
   └─ Staff sees new order via WebSocket broadcast
      └─ Notified of pending job

10. STRAPI
    └─ Job now visible in:
        ├─ Orders collection
        ├─ Dashboard real-time view
        └─ Production queue
```

---

## 🔄 Real-time Communication: WebSocket Integration

### Production Dashboard Real-Time Updates

```typescript
// WebSocket Namespace: /production
socket.on('connect', () => {
  console.log('Connected to production dashboard');
  socket.emit('subscribe', {room: 'dashboard'});
});

// Listen for Order Status Changes
socket.on('order:status-changed', (data) => {
  // {order_id, new_status, timestamp}
  // Update UI automatically - no page refresh needed
  updateKanbanBoard(data);
});

// Listen for New Orders
socket.on('order:created', (data) => {
  // {order_id, customer_name, service, quantity}
  // Add to "Quote Approved" column
  addNotification('New order from ' + data.customer_name);
});

// Listen for Machine Status
socket.on('machine:status-changed', (data) => {
  // {machine_id, status, error_code}
  updateMachineIndicator(data);
});
```

### Broadcast Mechanism (Backend)

```typescript
// When order status updates in Strapi
orders.on('update', (order) => {
  io.to('dashboard').emit('order:status-changed', {
    order_id: order.id,
    new_status: order.status,
    timestamp: new Date(),
    updated_by: 'system'
  });
});

// When new quote is approved
quotes.on('approve', (quote) => {
  // 1. Create order in Strapi
  // 2. Emit to dashboard
  io.to('dashboard').emit('order:created', quote);
  
  // 3. Notify customer
  io.to(`customer:${quote.customer_id}`).emit('quote:approved', {
    message: 'Your quote has been processed'
  });
});
```

---

## 🔐 Authentication & Authorization Architecture

### JWT-Based Auth Flow

```
┌──────────────────┐
│     Frontend     │
│   (Spark App)    │
└────────┬─────────┘
         │ 1. POST /auth/login
         │    {email, password}
         ▼
┌──────────────────┐
│   API Service    │ 2. Verify credentials
│                  │    Check Strapi users
└────────┬─────────┘
         │ 3. Generate JWT token
         │    {user_id, role, exp}
         ▼
┌──────────────────┐
│     Frontend     │ 4. Store token in localStorage
│  (Auth State)    │    Include in Authorization header
└──────────────────┘

Subsequent Requests:
┌──────────────────┐
│  GET /api/orders │
│  Headers:        │
│  Authorization:  │ JWT token
│  Bearer <token>  │
└────────┬─────────┘
         │
         ▼
    Middleware verifies token
    │
    ├─ Valid → Proceed to endpoint
    └─ Invalid → Return 401 Unauthorized
```

### Role-Based Access Control (RBAC)

```
User Roles in Strapi:
├─ admin           → All endpoints + system config
├─ staff           → Orders, quotes, inventory, analytics
├─ production      → Orders, files, job status only
├─ customer        → Own orders, quotes, profile only
└─ guest           → Public portal only (quote requests)

Frontend Access Control:
├─ Dashboard       → admin, staff, production
├─ Job Manager     → admin, staff, production
├─ Inventory       → admin, staff
├─ Analytics       → admin, staff
└─ Customer Portal → customer, guest
```

---

## 📊 Data Schema Integration

### Strapi Collections Referenced by Frontend

**Created by Task 1.2 (Strapi Schema Migration):**

```typescript
// Order Collection
{
  id: string,
  order_number: string,
  customer_id: FK → Customer,
  service: 'screen' | 'dtg' | 'embroidery' | 'sublimation' | 'heat' | 'vinyl',
  quantity: number,
  colors: number,
  location: string,
  print_size: string,
  files: [FK → File],
  status: 'quote-pending' | 'quote-approved' | 'design-in-progress' | 
          'pre-press' | 'printing' | 'finishing' | 'ready' | 'shipped',
  total_price: number,
  created_at: datetime,
  updated_at: datetime,
  deadline: datetime,
  assigned_to: FK → Staff | null
}

// Quote Collection
{
  id: string,
  customer_id: FK → Customer,
  service: string,
  quantity: number,
  base_price: number,
  discounts: number,
  taxes: number,
  total: number,
  valid_until: datetime,
  status: 'pending' | 'approved' | 'rejected' | 'expired',
  created_at: datetime,
  design_url: string | null
}

// Customer Collection
{
  id: string,
  name: string,
  email: string (unique),
  phone: string,
  company: string,
  address: string,
  billing_address: string,
  payment_method: string | null,
  total_orders: number,
  total_spent: number,
  created_at: datetime,
  notes: string
}

// Product Collection
{
  id: string,
  sku: string (unique),
  supplier: 's&s' | 'as-colour' | 'sanmar',
  name: string,
  color: string,
  size: string,
  base_price: number,
  stock_level: number,
  last_updated: datetime,
  url: string
}
```

---

## 🔗 API Response Format Standards

### Standardized REST API Responses

```typescript
// Success Response (200)
{
  success: true,
  data: {
    id: "123",
    // ... resource data
  },
  meta: {
    timestamp: "2025-11-23T10:30:00Z",
    version: "1.0"
  }
}

// Paginated Response
{
  success: true,
  data: [{...}, {...}],
  meta: {
    pagination: {
      page: 1,
      per_page: 20,
      total: 150,
      pages: 8
    }
  }
}

// Error Response (400, 401, 403, 404, 500)
{
  success: false,
  error: {
    code: "QUOTE_CALCULATION_FAILED",
    message: "Unable to calculate quote - invalid service type",
    details: {
      service: "invalid-service"
    }
  }
}
```

### WebSocket Message Format

```typescript
// Broadcast
{
  event: "order:status-changed",
  data: {
    order_id: "123",
    old_status: "design-in-progress",
    new_status: "pre-press",
    timestamp: "2025-11-23T10:30:00Z"
  },
  source: "api-service"
}

// Acknowledgment
{
  id: "msg-123",
  success: true,
  ack: true
}
```

---

## ⚙️ Configuration & Environment Variables

### Frontend .env (Spark will reference)

```bash
# API Endpoints
VITE_API_URL=http://localhost:3002              # API Service
VITE_STRAPI_URL=http://localhost:1337           # Strapi CMS
VITE_WS_URL=ws://localhost:3004                 # WebSocket (Production Dashboard)

# Authentication
VITE_JWT_STORAGE_KEY=printshop_auth_token
VITE_JWT_REFRESH_INTERVAL=5m

# Feature Flags
VITE_ENABLE_ADVANCED_PRICING=true
VITE_ENABLE_SUPPLIER_SYNC=true
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ANALYTICS=true

# Analytics (Optional)
VITE_SENTRY_DSN=https://...
VITE_SEGMENT_KEY=...

# Uploads
VITE_MAX_FILE_SIZE=52428800                     # 50MB
VITE_ALLOWED_FILE_TYPES=pdf,jpg,png,ai,eps,cdr
```

---

## 📈 Performance Optimization Strategy

### Frontend Caching Strategy

```typescript
// API Response Caching
export const cacheConfig = {
  // Long-lived data (1 hour)
  'GET /api/products': { ttl: 3600 },
  'GET /api/suppliers': { ttl: 3600 },
  
  // Medium-lived (15 minutes)
  'GET /api/orders': { ttl: 900 },
  'GET /api/quotes': { ttl: 900 },
  
  // Short-lived (real-time via WebSocket)
  'GET /api/orders/{id}/status': { ttl: 0, realtime: true },
  
  // No cache
  'GET /api/auth/me': { cache: false },
  'POST /api/quotes': { cache: false }
};
```

### Image/File Optimization

```
Design files:
├─ PDF → Store at full resolution in S3
├─ Preview → Generate thumbnail on first upload
├─ Thumbnail cache → Redis (30 days)

Product images (Supplier Catalog):
├─ Original → Cache 7 days
├─ Optimized (webp) → Serve via CDN
├─ Thumbnail → Serve from Redis
```

### Bundle Optimization

```
Target: < 500KB initial load

Code Splitting:
├─ Core (auth, dashboard) → 150KB
├─ Admin (job manager) → 120KB (lazy loaded)
├─ Portal (customer) → 100KB (lazy loaded)
├─ Analytics → 80KB (lazy loaded)
└─ Vendor (React, UI libs) → 150KB (cached)

Compression:
├─ Gzip for JSON responses
├─ Brotli for CSS/JS
└─ WebP for images
```

---

## 🚀 Deployment Architecture

### Frontend Deployment

```
Development:
  npm run dev             → Vite dev server (port 5173)
  
Production Build:
  npm run build           → Optimized bundle
  → dist/                 → Static files
  
Deployment Options:
  1. Vercel/Netlify       → Recommended (CDN + auto-deploy)
  2. Docker               → Same as backend (printshop-os network)
  3. S3 + CloudFront      → For AWS deployment
```

### Docker Configuration (When Ready)

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Build stage
COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN npm install -g serve
COPY --from=0 /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Docker Compose Update (Future)

```yaml
services:
  frontend:
    image: printshop-os/frontend:latest
    container_name: printshop-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://api:3002
      VITE_STRAPI_URL: http://strapi:1337
      VITE_WS_URL: ws://localhost:3004
    networks:
      - printshop_network
    depends_on:
      - strapi
      - api
```

---

## 🗺️ Spark Development Roadmap → Backend Ready State

### What's Ready RIGHT NOW for Frontend to Use

✅ **AVAILABLE IMMEDIATELY:**

1. **Strapi CMS** (Running on port 1337)
   - PostgreSQL database connected
   - RESTful API ready
   - Authentication system ready
   - Collections ready to be populated

2. **Job Estimator Service** (Port 3001)
   - Pricing engine complete (Agent 3 deliverable)
   - All 40+ tests passing
   - Ready to be called via API

3. **API Service** (Port 3002)
   - Task 1.1: Live Printavo sync (Agent in progress)
   - Task 2.1: Quote API (Task queued)
   - Task 2.4: Customer Portal API (Task queued)

4. **Real-Time Capabilities** (WebSocket)
   - Task 3.1: Production Dashboard WebSocket (Task queued)
   - Can push to all connected clients

❌ **NOT YET READY (Agents Still Working):**

- Task 1.2: Strapi schema (Assigned to Agent, issue #91)
- Task 1.3: Historical import (Queued after 1.2)
- Task 2.2: Supplier connectors (Assigned to Agent, issue #92)
- Task 2.3: Redis caching (Queued after 2.2)
- Task 3.2: AI Quote optimizer (Phase 3)
- Task 3.3: Analytics endpoints (Phase 3)

### Spark Development Timeline vs. Agent Deployment

```
NOW (Nov 23):
├─ Spark building UI components
└─ 3 agents deployed (Tasks 1.1, 1.2, 2.2)

Day 2-3:
├─ Spark: Component library & layout
├─ Agents: Completing Task 1.1, 1.2, 2.2
└─ Ready: Basic UI without live data

Day 4-5:
├─ Spark: Integration testing
├─ Agents: Tasks 1.3, 2.1, 2.3, 2.4
└─ Ready: Full feature set

Week 2:
├─ Spark: Optimization & polish
├─ Agents: Tasks 3.1, 3.2, 3.3
└─ Ready: Production MVP
```

---

## 🎯 Summary: Frontend "Taps Into" Backend Brain

The frontend built by Spark will serve as the **interface layer** to PrintShop OS's sophisticated backend:

| Frontend Layer | Backend Brain | Connection |
|---|---|---|
| **Dashboard** | Strapi + Analytics Service | REST + WebSocket |
| **Job Manager** | API Service + Job Estimator | REST + Real-time |
| **File System** | API Service + Storage | REST + File upload |
| **Customer Portal** | Strapi + Pricing Engine | REST + JWT Auth |
| **Inventory** | Supplier Sync + Cache | REST + Polling |
| **Notifications** | Production Dashboard | WebSocket |

**Key Insight:** The frontend doesn't "replace" any backend logic—it **visualizes and controls** the backend orchestration. All business logic remains server-side.

---

## 📞 Next Steps for Frontend Development

1. **Configure API Endpoints**
   - Point Spark to: `http://localhost:1337` (Strapi)
   - Point Spark to: `http://localhost:3002` (API Service)
   - Configure WebSocket: `ws://localhost:3004`

2. **Design System Implementation**
   - Color palette (deep blue, cyan, magenta, yellow)
   - Component library (8px grid system)
   - Responsive breakpoints (1920px+, 768-1919px, 320-767px)

3. **API Integration Preparation**
   - Create API service layer in frontend
   - Implement error handling
   - Setup request/response interceptors
   - JWT token management

4. **Real-Time Features**
   - WebSocket connection manager
   - Event subscription system
   - Auto-reconnection logic
   - Fallback to polling

5. **Testing Strategy**
   - Mock API responses (use Agent 2's mock data)
   - Component testing with Storybook
   - Integration testing with Cypress
   - E2E testing scenarios

---

**This document will be updated as Spark development progresses and agents complete their tasks.**
