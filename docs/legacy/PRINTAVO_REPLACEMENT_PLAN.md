# PrintShop OS - Printavo Replacement Implementation Plan

**Created:** November 26, 2025  
**Status:** Planning Phase  
**Methodology:** HLBPA (Hashim Warren) + Copilot Instructions Compliance  
**Goal:** Implement critical gaps to fully replace Printavo

---

## 📊 Current State Assessment

### ✅ Working Systems (Nov 26, 2025)
- **Strapi CMS:** Running on port 1337, 10 content types operational
- **Data Imported:** 336 customers, 831 orders (2025 data)
- **Services:** 4 services operational (api, job-estimator, production-dashboard, supplier-sync)
- **Admin UI:** Strapi admin panel accessible

### ❌ Critical Gaps Identified

**Priority 1 (BLOCKER):**
1. Authentication system (customer login, employee PIN)
2. Quote workflow backend (approval state machine)
3. Create orders/quotes from PrintShop OS (not just view)

**Priority 2 (HIGH):**
4. Real-time job tracking (WebSocket → job status)
5. Support ticket API routes
6. Payment processing integration

**Priority 3 (NICE-TO-HAVE):**
7. Full supplier catalog (only 18 products synced)
8. Email notifications
9. PDF invoice branding

---

## 🎯 Implementation Strategy

### Principle: Code > Documentation
Following Copilot Instructions:
1. Write the code
2. Write tests
3. Update SERVICE_DIRECTORY.md (one line)
4. Done

**NO session reports, NO epic documents, NO implementation summaries**

### Service Constraints
**ONLY 4 services allowed:**
- `services/api/` - Printavo sync, data import, **auth, order management**
- `services/job-estimator/` - Pricing engine
- `services/production-dashboard/` - WebSocket + REST, **time clock**
- `services/supplier-sync/` - AS Colour, S&S, SanMar

**New features MUST fit into existing services.**

---

## 📋 Phase 1: Authentication & User Management (Week 1)

### 1.1 Customer Authentication
**Location:** `services/api/src/auth/` (new folder in existing service)

**Strapi Side:**
- Use Strapi's built-in user/auth system
- Extend with customer profile relation
- JWT token generation

**API Side (services/api):**
```
services/api/
└── src/
    └── auth/
        ├── customer-auth.ts      # Login, signup, password reset
        ├── auth.middleware.ts    # JWT validation
        └── __tests__/
            └── customer-auth.test.ts
```

**Endpoints:**
- `POST /api/auth/signup` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/me` - Get current user

**Strapi Changes:**
- Enable user registration in Strapi settings
- Create customer profile content type (relation to user)
- Configure JWT expiration (7 days)

**Tests:** 15+ tests for auth flows

**Deliverable:** Customers can create accounts and log in

---

### 1.2 Employee Authentication (PIN)
**Location:** `services/production-dashboard/` (existing service)

**Already exists:** `employee` content type with PIN field (bcrypt hashed)

**Enhancement Needed:**
```
services/production-dashboard/
└── src/
    └── auth/
        ├── employee-auth.ts     # PIN validation
        └── __tests__/
            └── employee-auth.test.ts
```

**Endpoints:**
- `POST /api/production/auth/validate-pin` - Check employee PIN
- `GET /api/production/auth/employee/:id` - Get employee details

**Tests:** 8+ tests for PIN validation

**Deliverable:** Employees can clock in with PIN

---

## 📋 Phase 2: Quote & Order Creation (Week 2)

### 2.1 Quote Content Type
**Location:** `printshop-strapi/src/api/quote/`

**Schema:** `quote/content-types/quote/schema.json`
```json
{
  "kind": "collectionType",
  "collectionName": "quotes",
  "info": {
    "singularName": "quote",
    "pluralName": "quotes",
    "displayName": "Quote"
  },
  "attributes": {
    "quoteNumber": { "type": "string", "unique": true, "required": true },
    "customer": { "type": "relation", "relation": "manyToOne", "target": "api::customer.customer" },
    "status": { 
      "type": "enumeration",
      "enum": ["DRAFT", "SENT", "VIEWED", "APPROVED", "REJECTED", "EXPIRED"]
    },
    "items": { "type": "json" },
    "totalAmount": { "type": "decimal" },
    "validUntil": { "type": "date" },
    "approvedAt": { "type": "datetime" },
    "notes": { "type": "text" }
  }
}
```

**Controllers/Routes/Services:**
```
printshop-strapi/src/api/quote/
├── content-types/quote/schema.json
├── controllers/quote.ts
├── routes/quote.ts
└── services/quote.ts
```

**Custom Endpoints:**
- `POST /api/quotes/:id/approve` - Approve quote
- `POST /api/quotes/:id/reject` - Reject quote
- `POST /api/quotes/:id/convert-to-order` - Create order from quote

**Tests:** 12+ tests for quote workflow

**Deliverable:** Quote approval workflow operational

---

### 2.2 Order Creation API
**Location:** `services/api/src/orders/` (new folder in existing service)

```
services/api/
└── src/
    └── orders/
        ├── create-order.ts       # POST /api/orders/create
        ├── order-validator.ts    # Validate order data
        └── __tests__/
            └── create-order.test.ts
```

**Features:**
- Create order from scratch
- Create order from approved quote
- Validate customer, items, pricing
- Generate order number (auto-increment)
- Link to customer
- Set initial status

**Endpoints:**
- `POST /api/orders/create` - Create new order
- `POST /api/orders/from-quote/:quoteId` - Convert quote to order

**Tests:** 10+ tests for order creation

**Deliverable:** Can create orders from PrintShop OS

---

## 📋 Phase 3: Real-Time Job Tracking (Week 3)

### 3.1 Job Status Updates
**Location:** `services/production-dashboard/` (existing service)

**Enhancement:**
```
services/production-dashboard/
└── src/
    └── jobs/
        ├── job-status.ts         # Update job status
        ├── job-websocket.ts      # Broadcast status changes
        └── __tests__/
            └── job-status.test.ts
```

**WebSocket Events:**
- `job:status_changed` - Broadcast when job status updates
- `job:assigned` - When job assigned to employee
- `job:completed` - When job marked complete

**API Endpoints:**
- `PATCH /api/production/jobs/:id/status` - Update job status
- `GET /api/production/jobs/queue` - Get production queue

**Tests:** 8+ tests for job tracking

**Deliverable:** Real-time job status updates on dashboard

---

## 📋 Phase 4: Support Tickets (Week 4)

### 4.1 Support Ticket API
**Location:** `services/api/src/support/` (new folder in existing service)

**Strapi Content Type:** Already exists (`support-ticket`)

**API Routes:**
```
services/api/
└── src/
    └── support/
        ├── ticket-routes.ts      # CRUD operations
        ├── ticket-service.ts     # Business logic
        └── __tests__/
            └── ticket-routes.test.ts
```

**Endpoints:**
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets` - List tickets (filtered by customer)
- `GET /api/support/tickets/:id` - Get ticket details
- `PATCH /api/support/tickets/:id` - Update ticket
- `POST /api/support/tickets/:id/comments` - Add comment

**Tests:** 15+ tests for ticket operations

**Deliverable:** Support ticket system operational

---

## 📋 Phase 5: Payment Processing (Week 5)

### 5.1 Payment Intent API
**Location:** `services/api/src/payments/` (new folder in existing service)

**Strategy:** Stripe integration (standard for SMBs)

```
services/api/
└── src/
    └── payments/
        ├── stripe-client.ts      # Stripe API wrapper
        ├── payment-routes.ts     # Payment endpoints
        ├── invoice-service.ts    # Invoice generation
        └── __tests__/
            └── payment-routes.test.ts
```

**Order Schema Enhancement:**
Add to `order` content type:
```json
{
  "amountPaid": { "type": "decimal", "default": 0 },
  "amountOutstanding": { "type": "decimal" },
  "paymentStatus": { 
    "type": "enumeration",
    "enum": ["UNPAID", "PARTIAL", "PAID", "REFUNDED"]
  },
  "stripePaymentIntentId": { "type": "string" }
}
```

**Endpoints:**
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm/:orderId` - Confirm payment
- `GET /api/payments/invoice/:orderId` - Download invoice PDF

**Tests:** 12+ tests for payment flows

**Deliverable:** Customers can pay invoices online

---

## 📋 Implementation Guidelines

### File Organization
**Follow existing patterns:**
```
services/api/
└── src/
    ├── auth/           # NEW: Customer authentication
    ├── orders/         # NEW: Order creation
    ├── support/        # NEW: Support tickets
    ├── payments/       # NEW: Payment processing
    ├── customer/       # EXISTING: Customer routes
    └── analytics/      # EXISTING: Analytics routes
```

**DO NOT create:**
- ❌ New services (only 4 allowed)
- ❌ Session reports
- ❌ Epic documents
- ❌ Implementation summaries

**DO update:**
- ✅ `SERVICE_DIRECTORY.md` (one line per feature)
- ✅ Test files alongside implementation
- ✅ `package.json` if dependencies added

---

## 🧪 Testing Strategy

### Test Coverage Targets
- **Auth:** 15+ tests (signup, login, reset, JWT)
- **Quotes:** 12+ tests (create, approve, reject, convert)
- **Orders:** 10+ tests (create, validate, link)
- **Jobs:** 8+ tests (status updates, WebSocket)
- **Tickets:** 15+ tests (CRUD, comments)
- **Payments:** 12+ tests (intent, confirm, invoice)

**Total New Tests:** 72+ tests

**Running Tests:**
```bash
# All tests
npm test

# Specific service
cd services/api && npm test

# Watch mode
npm test -- --watch
```

---

## 📊 Success Criteria

### Phase 1 Complete When:
- [ ] Customer can sign up
- [ ] Customer can log in
- [ ] Employee can clock in with PIN
- [ ] JWT authentication working
- [ ] 23+ tests passing

### Phase 2 Complete When:
- [ ] Quote can be created
- [ ] Quote can be approved/rejected
- [ ] Order can be created from scratch
- [ ] Order can be created from quote
- [ ] 22+ tests passing

### Phase 3 Complete When:
- [ ] Job status can be updated
- [ ] WebSocket broadcasts status changes
- [ ] Production dashboard shows real-time updates
- [ ] 8+ tests passing

### Phase 4 Complete When:
- [ ] Support ticket can be created
- [ ] Tickets can be viewed/updated
- [ ] Comments can be added
- [ ] 15+ tests passing

### Phase 5 Complete When:
- [ ] Payment intent can be created
- [ ] Payment can be confirmed
- [ ] Invoice PDF can be generated
- [ ] 12+ tests passing

---

## 🚀 Deployment Strategy

### Development (Now)
- SQLite database
- Local ports (1337, 3000, 3002, 5173)
- Environment variables in `.env` files

### Staging (Before Prod)
- PostgreSQL database
- Test payment integration (Stripe test mode)
- Load testing (100+ concurrent users)

### Production (After Testing)
- Managed PostgreSQL
- Redis for caching
- SSL certificates
- Backup strategy
- Monitoring (Sentry, LogRocket)

---

## 📅 Timeline

| Phase | Duration | Completion Date |
|-------|----------|-----------------|
| Phase 1: Authentication | 5 days | Dec 3, 2025 |
| Phase 2: Quotes & Orders | 5 days | Dec 10, 2025 |
| Phase 3: Job Tracking | 3 days | Dec 13, 2025 |
| Phase 4: Support Tickets | 4 days | Dec 17, 2025 |
| Phase 5: Payments | 5 days | Dec 24, 2025 |
| **Total** | **22 days** | **Dec 24, 2025** |

**Buffer:** 3 days for bug fixes and testing (Dec 27, 2025)

**Printavo Cancellation Target:** January 1, 2026

---

## 🔄 Maintenance Plan

### Weekly Tasks
- Review error logs
- Check test coverage
- Update dependencies
- Archive old session reports

### Monthly Tasks
- Database backup verification
- Performance review
- Security audit
- Documentation sync

---

## 📚 Reference Documentation

**Primary References:**
1. [Copilot Instructions](.github/copilot-instructions.md) - MUST follow
2. [SERVICE_DIRECTORY.md](SERVICE_DIRECTORY.md) - Where everything lives
3. [ARCHITECTURE.md](ARCHITECTURE.md) - How systems connect
4. [HLBPA Methodology](https://github.com/github/awesome-copilot/blob/main/agents/hlbpa.agent.md)
5. [Hashim Warren Guidelines](https://gist.github.com/hashimwarren/2a0026b048412b4c7a6d95e58c22818d)

**DO NOT create new documentation files unless absolutely necessary.**

---

## ✅ Next Actions

1. **Start Phase 1:** Authentication system
   - Create `services/api/src/auth/` folder
   - Implement customer signup/login
   - Write 15+ tests
   - Update SERVICE_DIRECTORY.md (1 line)

2. **Verify Existing Systems:**
   - Confirm Strapi is running
   - Verify 831 orders are imported
   - Check employee content type

3. **Set Up Development Environment:**
   - Install Stripe SDK: `npm install stripe`
   - Configure `.env` files
   - Run tests to establish baseline

---

**Last Updated:** November 26, 2025  
**Methodology:** HLBPA + Copilot Instructions Compliance  
**Status:** Planning Phase → Ready for Implementation
