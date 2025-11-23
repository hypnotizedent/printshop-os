# 🚀 Spark + PrintShop OS Backend Integration Technical Brief

**Audience:** Copilot Spark (Frontend AI Building)  
**Purpose:** Provide Spark with technical requirements to build frontend that integrates with PrintShop OS backend  
**Status:** Active - Spark currently building  
**Date:** November 23, 2025

---

## 📌 Quick Reference: Your Backend API Endpoints

### Core Services Running

```
Strapi (Central Data Hub)    → http://localhost:1337
- API Gateway               → http://localhost:1337/api
- Admin Panel              → http://localhost:1337/admin

PostgreSQL Database         → localhost:5432 (internal)
Redis Cache               → localhost:6379 (internal)
```

### Phase 1 Complete - These Exist Now

```
Job Estimator Service     → Port 3001 (Pricing calculations)
Printavo Mapper           → Integrated (Order transformation)
Mock API Responses        → Available (Agent 2 reference)
```

### Phase 2 In Progress - These Are Being Built

```
API Service               → Port 3002 (Quote, Orders, Portal APIs)
- Task 1.1: Live Printavo Sync (Agent assigned - Issue #89)
- Task 1.2: Strapi Schema Migration (Agent assigned - Issue #91)
- Task 2.1: Quote API Endpoint (Queued)
- Task 2.4: Customer Portal API (Queued)

Supplier Sync Service     → Port 3003 (Product catalog)
- Task 2.2: Supplier Connectors (Agent assigned - Issue #92)
- Task 2.3: Redis Caching Layer (Queued)

Production Dashboard      → Port 3004 (WebSocket for real-time)
- Task 3.1: Dashboard API with WebSocket (Queued)
```

---

## 🔌 Spark Component → API Mapping Reference

### 1. Dashboard (Real-Time Operations)

**What You're Building:**
```
- Job status widgets (in-progress, pending, complete)
- Revenue/cost analytics
- Notification center
- Machine status indicators
```

**APIs You'll Call:**
```typescript
// Fetch Overview Data
GET /api/orders?status=in-progress
GET /api/orders/summary/by-status
GET /api/analytics/revenue?period=daily
GET /api/quotes/pending

// Response Format (from Agent 2's mock data):
{
  success: true,
  data: {
    orders: [
      {
        id: "order-123",
        order_number: "PO-001",
        customer: "Acme Corp",
        service: "screen",
        quantity: 100,
        status: "printing",
        deadline: "2025-11-25",
        progress: 65
      }
    ],
    summary: {
      total_orders: 24,
      in_progress: 8,
      completed_today: 3,
      pending_quotes: 5
    },
    revenue: {
      today: 2845.50,
      week: 12340.00,
      month: 52100.00
    }
  }
}

// WebSocket Events (Real-Time)
socket.on('order:status-changed', (data) => {
  // Update UI immediately - no refresh needed
})

socket.on('order:created', (data) => {
  // New order notification
})
```

**Implementation Notes:**
- Use polling initially (until Task 3.1 WebSocket ready)
- Fallback: Refresh every 30 seconds
- Cache analytics data (1 hour TTL)
- Show timestamps of last update

---

### 2. Job Manager (Kanban/Gantt Board)

**What You're Building:**
```
- Kanban columns: Quote → Design → Pre-press → Printing → Finishing → Delivery
- Drag-to-reorder jobs
- Job details panel
- File attachment section
```

**APIs You'll Call:**
```typescript
// Load All Jobs (for Kanban)
GET /api/orders?status=all&sort=deadline

// Drag job → Update Status
PATCH /api/orders/{id}/status
{
  "status": "printing"  // or "pre-press", "finishing", etc.
}

// Get Full Job Details
GET /api/orders/{id}
Response: {
  id: "order-123",
  order_number: "PO-001",
  customer_id: "cust-456",
  service: "screen",
  quantity: 100,
  colors: 1,
  location: "chest",
  print_size: "M",
  files: [
    {id: "file-1", name: "design.pdf", url: "...", preview: "..."},
    {id: "file-2", name: "logo.ai", url: "..."}
  ],
  status: "printing",
  timeline: {
    created: "2025-11-20",
    deadline: "2025-11-25",
    estimated_completion: "2025-11-24"
  },
  pricing: {
    base_price: 500.00,
    rush_multiplier: 1.0,
    discount: 0,
    total: 500.00
  },
  assigned_to: "John Smith"
}

// Add Job Note/Comment
POST /api/orders/{id}/comments
{
  "message": "Design ready for production"
}
```

**Implementation Notes:**
- Fetch on component mount
- Refresh every 60 seconds (or use WebSocket when ready)
- Drag handler: debounce status updates (500ms)
- Show conflict resolution if multiple users edit same job

---

### 3. Quote Generation (Customer Portal)

**What You're Building:**
```
- Quote request form
- Real-time price calculation
- Save/send to customer
```

**APIs You'll Call:**
```typescript
// Generate Quote
POST /api/quotes
{
  "service": "screen",           // "screen" | "dtg" | "embroidery" | ...
  "quantity": 100,
  "colors": 1,
  "location": "chest",           // "chest" | "sleeve" | "full-back" | ...
  "print_size": "M",             // "XS" | "S" | "M" | "L" | "XL"
  "rush": "standard",            // "standard" | "2-day" | "next-day" | "same-day"
  "customer_id": "cust-456",
  "deadline": "2025-11-25",
  "design_url": "https://..."    // optional
}

Response: {
  success: true,
  data: {
    quote_id: "quote-789",
    customer_id: "cust-456",
    breakdown: {
      service: "Screen Printing",
      quantity: 100,
      base_price: 400.00,
      location_multiplier: 1.0,    // "chest" = 1.0x
      rush_multiplier: 1.0,        // "standard" = 1.0x
      volume_discount: -20.00,     // 5-6% bracket = -5%
      subtotal: 380.00,
      tax_rate: 0.0825,
      taxes: 31.35,
      total: 411.35
    },
    valid_until: "2025-11-30",
    expires_in: "7 days"
  }
}

// Expected Quote Response (from Agent 3 test cases):
// 100 shirts, screen, 1 color, chest, standard = $411.35 ✓
// 500 shirts, screen, 2 colors, back, 2-day = $847.50 ✓
// See: services/job-estimator/tests/advanced-pricing.test.ts for all cases

// Save Quote (Convert to Order)
POST /api/quotes/{quote_id}/approve
Response: {
  success: true,
  data: {
    quote_id: "quote-789",
    order_id: "order-new-123",
    status: "quote-approved",
    next_step: "Customer to upload design files"
  }
}

// Customer Views Their Quotes
GET /api/customer/quotes
Response: {
  data: [
    {
      quote_id: "quote-789",
      created: "2025-11-20",
      total: 411.35,
      status: "pending",
      expires: "2025-11-30"
    }
  ]
}
```

**Implementation Notes:**
- Call pricing engine endpoint (Task 2.1) - coming soon
- Until Task 2.1 ready: Use Agent 3's test pricing logic locally
- Show real-time calculation as user changes values
- Store draft quotes in localStorage

---

### 4. File Management (Design Uploads)

**What You're Building:**
```
- Drag-and-drop file upload
- File preview (PDF, images)
- File list with metadata
```

**APIs You'll Call:**
```typescript
// Upload File
POST /api/files/upload
Headers: {
  "Content-Type": "multipart/form-data"
}
FormData: {
  file: File,
  order_id: "order-123"
}

Response: {
  success: true,
  data: {
    file_id: "file-456",
    name: "design.pdf",
    size: 2048576,       // bytes
    url: "/uploads/file-456.pdf",
    preview_url: "/uploads/file-456-thumb.jpg",
    status: "uploaded",
    preview_ready: true
  }
}

// Get File Preview
GET /api/files/{id}/preview
Response: {
  success: true,
  data: {
    file_id: "file-456",
    preview_url: "/uploads/file-456-preview.jpg",
    format: "jpg",
    generated_at: "2025-11-23T10:30:00Z"
  }
}

// List Order Files
GET /api/orders/{order_id}/files
Response: {
  data: [
    {
      file_id: "file-456",
      name: "design.pdf",
      uploaded_at: "2025-11-23T10:00:00Z",
      size: 2048576
    }
  ]
}
```

**Implementation Notes:**
- Max file size: 50MB (configurable in .env)
- Allowed types: PDF, JPG, PNG, AI, EPS, CDR
- Show upload progress bar
- Auto-generate preview on upload
- Cache preview URLs (30 days)

---

### 5. Customer Authentication

**What You're Building:**
```
- Login form
- Registration form
- Profile management
- JWT token handling
```

**APIs You'll Call:**
```typescript
// Register New Customer
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "secure_password_123",
  "company": "Acme Corp"
}

Response: {
  success: true,
  data: {
    user_id: "user-789",
    token: "eyJhbGciOiJIUzI1NiIs...",  // JWT token
    user: {
      id: "user-789",
      name: "John Doe",
      email: "john@acme.com",
      role: "customer"
    }
  }
}

// Login
POST /api/auth/login
{
  "email": "john@acme.com",
  "password": "secure_password_123"
}

Response: {
  success: true,
  data: {
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {...}
  }
}

// Get Current User
GET /api/auth/me
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Response: {
  success: true,
  data: {
    id: "user-789",
    name: "John Doe",
    email: "john@acme.com",
    role: "customer",
    company: "Acme Corp"
  }
}

// Logout
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer ..."
}

// Update Profile
PATCH /api/customer/profile
{
  "name": "John Doe Updated",
  "phone": "+1-555-0123",
  "company": "Acme Corp"
}
```

**Implementation Notes:**
- Store JWT in localStorage (`printshop_auth_token`)
- Include token in all subsequent requests
- Refresh token every 5 minutes
- Handle 401 errors → redirect to login
- Auto-logout on token expiration

---

## 🏗️ Strapi Schema Reference (Being Created Now)

**Collections Your Frontend Will Work With:**

### Order Collection (Represents Print Jobs)
```typescript
{
  id: string,                    // UUID
  order_number: string,          // "PO-001", auto-generated
  customer_id: FK,               // Link to Customer
  
  // Job Details
  service: string,               // "screen" | "dtg" | "embroidery" | ...
  quantity: number,
  colors: number,
  location: string,              // "chest", "sleeve", "full-back", etc.
  print_size: string,            // "XS" | "S" | "M" | "L" | "XL"
  
  // Files & Design
  files: [FK],                   // Links to File objects
  design_url: string | null,     // URL to design file
  
  // Pricing
  total_price: number,           // Final price
  currency: string,              // "USD" (default)
  
  // Status & Timeline
  status: string,                // "quote-pending" → "quote-approved" → 
                                 // "design-in-progress" → "pre-press" → 
                                 // "printing" → "finishing" → "ready" → "shipped"
  created_at: datetime,
  updated_at: datetime,
  deadline: datetime,            // When customer needs it
  assigned_to: FK | null,        // Staff member assignment
  
  // Tracking
  printavo_order_id: string,     // Link to source data
  notes: string                  // Internal notes
}
```

### Quote Collection
```typescript
{
  id: string,
  customer_id: FK,
  
  // Quote Details
  service: string,
  quantity: number,
  colors: number,
  location: string,
  print_size: string,
  
  // Pricing Breakdown
  base_price: number,
  location_multiplier: number,   // 1.0 | 1.1 | 1.2 | 1.25
  rush_multiplier: number,       // 1.0 | 1.1 | 1.25 | 1.5
  volume_discount: number,       // -0.05 for 5% discount
  
  subtotal: number,
  tax_rate: number,              // 0.0825
  taxes: number,
  total: number,
  
  // Status
  status: string,                // "pending" | "approved" | "rejected" | "expired"
  valid_until: datetime,
  created_at: datetime,
  
  // Design File (optional)
  design_url: string | null
}
```

### Customer Collection
```typescript
{
  id: string,
  name: string,
  email: string,                 // Unique
  phone: string,
  company: string,
  
  // Address
  address: string,
  city: string,
  state: string,
  zip: string,
  
  // Billing
  billing_address: string,
  payment_method: string | null,
  
  // Account Stats
  total_orders: number,          // Auto-calculated
  total_spent: number,           // Auto-calculated
  created_at: datetime,
  
  // Notes
  notes: string
}
```

### Product Collection (From Suppliers)
```typescript
{
  id: string,
  sku: string,                   // Unique identifier
  supplier: string,              // "s&s" | "as-colour" | "sanmar"
  
  // Product Info
  name: string,
  color: string,
  size: string,
  
  // Pricing
  base_price: number,
  cost: number,
  
  // Stock
  stock_level: number,
  reorder_level: number,
  
  // Metadata
  last_updated: datetime,
  supplier_url: string,
  image_url: string
}
```

**Note:** Exact fields determined by Agent currently building Task 1.2 (Strapi Schema Migration). This is the reference structure.

---

## 🔐 Authentication Implementation Guide

### JWT Token Structure

```javascript
// Encoded JWT contains:
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "user-123",
    "email": "john@acme.com",
    "role": "customer",  // "customer" | "staff" | "admin"
    "iat": 1234567890,   // issued at
    "exp": 1234571490    // expires in 1 hour
  },
  "signature": "..." // Server-signed
}
```

### Frontend Token Management

```typescript
// Store token
localStorage.setItem('printshop_auth_token', token);

// Retrieve token
const token = localStorage.getItem('printshop_auth_token');

// Include in requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Handle expiration
if (response.status === 401) {
  localStorage.removeItem('printshop_auth_token');
  redirectToLogin();
}
```

---

## 📡 WebSocket Events (When Task 3.1 Ready)

### Production Dashboard Real-Time

```javascript
// Connect
const socket = io('ws://localhost:3004');

socket.on('connect', () => {
  console.log('Connected to production dashboard');
  socket.emit('subscribe', {room: 'dashboard'});
});

// Listen for Events
socket.on('order:status-changed', (data) => {
  // {order_id, new_status, old_status, timestamp, updated_by}
  console.log('Order updated:', data);
  updateKanbanBoard(data);
});

socket.on('order:created', (data) => {
  // {order_id, order_number, customer_name, service, quantity}
  console.log('New order:', data);
  addNotification(`New order: ${data.order_number}`);
});

socket.on('order:assigned', (data) => {
  // {order_id, assigned_to, assigned_by, timestamp}
  console.log('Order assigned:', data);
});

socket.on('machine:status-changed', (data) => {
  // {machine_id, status, error_code}
  updateMachineIndicator(data);
});

// Disconnect handling
socket.on('disconnect', () => {
  console.log('Disconnected - attempting reconnect');
  // Frontend should fall back to polling
});
```

---

## 🛠️ Development Environment Setup for Spark

### Prerequisites
```bash
Node.js 18+
npm or yarn
Git
```

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Header, Footer, Sidebar
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── jobs/           # Job manager components
│   │   ├── files/          # File upload, preview
│   │   ├── customers/      # Customer portal
│   │   └── auth/           # Login, register forms
│   │
│   ├── services/
│   │   ├── api.ts          # HTTP client
│   │   ├── websocket.ts    # WebSocket manager
│   │   └── auth.ts         # Authentication helpers
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrders.ts
│   │   ├── useQuotes.ts
│   │   └── useWebSocket.ts
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── JobManager.tsx
│   │   ├── CustomerPortal.tsx
│   │   └── Login.tsx
│   │
│   └── App.tsx
│
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### Environment Variables (.env)
```bash
# API Endpoints
VITE_API_URL=http://localhost:3002
VITE_STRAPI_URL=http://localhost:1337
VITE_WS_URL=ws://localhost:3004

# JWT Configuration
VITE_JWT_STORAGE_KEY=printshop_auth_token

# Feature Flags
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ADVANCED_PRICING=true

# File Upload
VITE_MAX_FILE_SIZE=52428800        # 50MB
```

### Build & Run
```bash
# Development
npm install
npm run dev                    # Starts on http://localhost:5173

# Production Build
npm run build                  # Creates optimized dist/

# Testing
npm run test                   # Jest tests
npm run test:e2e              # Cypress E2E tests
```

---

## 🧪 Testing Strategy

### Use Agent 2's Mock Data for Component Testing

```typescript
// Example: Mock API response (from Agent 2 delivery)
import { mockOrderResponse, mockQuoteResponse } from '@/mocks/strapi-responses';

// Component test
test('Dashboard displays orders correctly', () => {
  const {getByText} = render(<Dashboard orders={mockOrderResponse.data} />);
  expect(getByText('PO-001')).toBeInTheDocument();
});
```

### Component Testing Pattern
```typescript
// Use Storybook for isolated component development
// storybook/Dashboard.stories.tsx

export const Default = () => (
  <Dashboard 
    orders={mockOrderResponse.data}
    loading={false}
    error={null}
  />
);

export const Loading = () => (
  <Dashboard orders={[]} loading={true} error={null} />
);

export const Error = () => (
  <Dashboard 
    orders={[]} 
    loading={false} 
    error="Failed to load orders"
  />
);
```

### E2E Testing Pattern
```typescript
// cypress/e2e/quote-flow.cy.ts

describe('Customer Quote Flow', () => {
  it('generates quote and converts to order', () => {
    cy.visit('/quotes');
    cy.get('[data-testid="service-select"]').select('screen');
    cy.get('[data-testid="quantity-input"]').type('100');
    cy.get('[data-testid="calculate-btn"]').click();
    
    cy.get('[data-testid="quote-total"]')
      .should('contain', '$411.35');  // Expected from Agent 3 tests
    
    cy.get('[data-testid="approve-btn"]').click();
    cy.url().should('include', '/orders/');
  });
});
```

---

## 📊 Performance Checklist for Spark

- [ ] Initial bundle < 500KB (target 300KB)
- [ ] First paint < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] API responses cached appropriately
- [ ] Images optimized (webp format)
- [ ] Code split for lazy loading
- [ ] Service worker for offline support
- [ ] Lighthouse score > 90 (Performance)

---

## 🚀 Go-Live Checklist

- [ ] All APIs tested with real backend
- [ ] Authentication fully integrated
- [ ] WebSocket connection fallback working
- [ ] File upload tested with various file types
- [ ] Mobile responsiveness verified
- [ ] All forms validated server-side
- [ ] Error handling + user feedback complete
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Documentation complete
- [ ] Deployment configured

---

## 📞 Current Status & Timeline

**Today (Nov 23):**
- ✅ Backend ready (Strapi + Job Estimator)
- 🔄 Agents working (Tasks 1.1, 1.2, 2.2)
- 🔄 Spark building frontend components

**Day 2-3:**
- Basic UI ready
- Agents complete foundational tasks
- Integration with mock data begins

**Day 4-5:**
- Full API integration
- Real data flowing
- Testing begins

**Week 2:**
- Production-ready
- Performance optimized
- Deployed

---

## 📚 Reference Deliverables from Agents

**Use these in your development:**

1. **Agent 2 Mock Responses** → `services/api/mocks/`
   - `printavo-responses.ts` (10+ examples)
   - `strapi-responses.ts` (API patterns)

2. **Agent 3 Pricing Test Cases** → `services/job-estimator/tests/`
   - 40+ pricing scenarios
   - Expected values for all configurations

3. **Postman Collection** → `services/api/postman-collection.json`
   - Pre-configured requests
   - Test cases with assertions

4. **API Documentation** → `docs/api/strapi-endpoints.md`
   - Complete endpoint reference
   - Request/response formats

---

**Questions for Spark development? Reference this document and the linked backend code.**
