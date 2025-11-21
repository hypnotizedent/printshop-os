# PrintShop OS Implementation Roadmap

**Status**: 🚀 Ready for Phase 1 Kickoff  
**Last Updated**: November 21, 2025  
**MVP Target**: 60 days from Phase 1 start  

---

## 📋 Executive Summary

PrintShop OS is a mission-critical business operating system for apparel print shops. The implementation follows a three-phase approach over 60 days:

1. **Phase 1 (4-6h)**: Strapi backend with PostgreSQL — establishes central API and data repository
2. **Phase 2 (3-4h)**: Appsmith dashboard — provides production team interface
3. **Phase 3 (3-4h)**: Botpress integration — enables 24/7 customer order intake
4. **Integration & Testing (final)**: Connect all components and verify workflows

**Real-World Workflow Coverage**:
- ✅ Workflow 1: Customer Order Intake (Botpress → Strapi)
- ✅ Workflow 2: Production Job Management (Appsmith ↔ Strapi)
- ✅ Workflow 3: Employee Time Tracking (Appsmith → Strapi)

---

## 🎯 Phase 1: Strapi Backend (4-6 hours)

**Goal**: Build central API and data repository for all system components

### Phase 1A: Environment & Initialization (1-2h)
- [ ] Initialize Strapi project with Node.js 18+
- [ ] Configure PostgreSQL connection (local dev via Docker)
- [ ] Set up environment variables (.env)
- [ ] Initialize Git and commit initial setup
- [ ] Verify Strapi admin panel accessible at http://localhost:1337/admin

**Acceptance**: Strapi running with empty database ready for schema creation

**Issue**: #[to-be-created] Phase 1A: Strapi Project Initialization

---

### Phase 1B: Data Models & Collections (1-2h)
Create four core collection types in Strapi with relationships and validation:

#### Collection Type: Customer
```
- id (UUID, auto)
- name (Text, required)
- email (Email, required, unique)
- phone (Text, optional)
- address (JSON, optional)
- createdAt (DateTime, auto)
- updatedAt (DateTime, auto)
- jobs (Relation: 1:N with Job)
```

#### Collection Type: Job
```
- jobId (String, auto-generated, unique)
- customerId (Relation: N:1 with Customer, required)
- status (Enum: "Pending Artwork" | "In Production" | "Complete" | "Archived", default: "Pending Artwork")
- quantity (Integer, required, min: 1)
- mockupImageUrl (String, optional)
- artFileUrl (String, optional)
- designNotes (Text, optional)
- inkColors (JSON, optional) — e.g., ["Red", "Blue", "White"]
- imprintLocations (JSON, optional) — e.g., ["Chest", "Back"]
- estimatedTime (Integer, optional) — minutes
- completedAt (DateTime, optional)
- createdAt (DateTime, auto)
- updatedAt (DateTime, auto)
```

#### Collection Type: Employee
```
- employeeId (String, auto-generated, unique)
- name (Text, required)
- email (Email, required, unique)
- role (Enum: "Admin" | "Manager" | "Operator", default: "Operator")
- active (Boolean, default: true)
- hireDate (DateTime, optional)
- createdAt (DateTime, auto)
- updatedAt (DateTime, auto)
- timeEntries (Relation: 1:N with TimeClockEntry)
```

#### Collection Type: TimeClockEntry
```
- id (UUID, auto)
- employeeId (Relation: N:1 with Employee, required)
- entryType (Enum: "Clock In" | "Clock Out", required)
- timestamp (DateTime, auto-generated)
- notes (Text, optional) — e.g., "Starting job #JOB-001"
- createdAt (DateTime, auto)
```

**Validation Rules**:
- Customer email must be unique
- Job quantity must be ≥ 1
- TimeClockEntry employeeId must reference valid Employee
- Job status transitions must follow: Pending → In Production → Complete → Archived

**Acceptance**: All 4 collection types created, relationships defined, Strapi CMS shows correct schema

**Issue**: #[to-be-created] Phase 1B: Data Models & Collections

---

### Phase 1C: API Endpoints & Authentication (1-2h)
- [ ] Enable REST API for all collection types
- [ ] Configure JWT authentication
- [ ] Set up role-based access control (RBAC):
  - **Admin**: Full access to all endpoints and collections
  - **Manager**: Read/write for Customer, Job, Employee; read-only TimeClockEntry
  - **Operator**: Read-only for Job; write for TimeClockEntry (own entries only)
- [ ] Create test API credentials for each role
- [ ] Document all REST endpoints in `/docs/api/strapi-endpoints.md`
- [ ] Test endpoints with Postman/cURL

**Endpoints** (to document):
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id

GET    /api/employees
POST   /api/employees
GET    /api/employees/:id

GET    /api/time-clock-entries
POST   /api/time-clock-entries
```

**Acceptance**: All endpoints tested and responding correctly; auth tokens working; RBAC enforced

**Issue**: #[to-be-created] Phase 1C: API Endpoints & Authentication

---

### Phase 1D: Admin Panel & Data Seeding (30m-1h)
- [ ] Configure Strapi admin panel UI for all collections
- [ ] Add 2-3 sample customers to database
- [ ] Add 2-3 sample jobs linked to customers
- [ ] Add 2-3 sample employees
- [ ] Create admin user for team access
- [ ] Document admin panel usage in contributing guide

**Acceptance**: Admin panel functional; sample data visible; team can log in

**Issue**: #[to-be-created] Phase 1D: Admin Panel & Data Seeding

---

### Phase 1 Integration Checkpoint
**Issue**: #[to-be-created] [CHECKPOINT] Phase 1 Complete: Strapi API Functional

**Verification**:
- [ ] Strapi admin panel loads and is accessible
- [ ] All 4 collection types visible with data
- [ ] REST API endpoints all respond with HTTP 200
- [ ] JWT authentication working
- [ ] Sample data persists in database
- [ ] Role-based access control enforced
- [ ] Ready for Phase 2 (Appsmith connection)

---

## 🎯 Phase 2: Appsmith Dashboard (3-4 hours)

**Goal**: Build internal production interface for team to manage jobs and track time

### Phase 2A: Appsmith Setup & Connection (30m-1h)
- [ ] Launch Appsmith instance (Docker container)
- [ ] Create new Appsmith application
- [ ] Add Strapi as REST API data source
  - Host: `http://localhost:1337`
  - Auth: Bearer token with Manager role
- [ ] Configure connection pool and response mapping
- [ ] Test data retrieval from each collection
- [ ] Verify real-time polling (5-second refresh rate)

**Acceptance**: Appsmith loads, Strapi connected, can query data

**Issue**: #[to-be-created] Phase 2A: Appsmith Setup & Strapi Connection

---

### Phase 2B: Job List View (1h)
Create responsive job list showing all jobs with filtering and quick actions.

**UI Components**:
- Table displaying:
  - Job ID (linked to details)
  - Customer Name (from related Customer)
  - Status (color-coded: yellow=Pending, orange=In Production, green=Complete)
  - Quantity
  - Created Date
  - Actions (View Details, Update Status)

- Filters:
  - Status dropdown (default: "In Production")
  - Customer name search
  - Date range

- Auto-refresh: Every 5 seconds

**Acceptance**: Jobs display correctly filtered; sorting works; responsive on mobile

**Issue**: #[to-be-created] Phase 2B: Job List View UI

---

### Phase 2C: Job Details Modal (1h)
Create detailed view with full job information and inline status updates.

**UI Elements**:
- Header: Job ID, customer name, current status
- Job Details:
  - Quantity
  - Ink colors (display as tags)
  - Imprint locations (display as tags)
  - Design notes (text area)
  - Mockup image (if URL provided)
  - Art file link (if URL provided)
- Action Buttons:
  - "Update Status" → dropdown to select new status
  - "Mark Complete" → confirmation dialog, then updates status to "Complete"
  - "Close" → return to list

**Validation**:
- Status can only move forward (Pending → In Production → Complete)
- Confirmation required before completing job

**Acceptance**: Modal opens correctly; data displays; status updates persist to Strapi

**Issue**: #[to-be-created] Phase 2C: Job Details Modal & Status Updates

---

### Phase 2D: Time Clock Interface (30m-1h)
Create simple, large-button interface for employees to clock in/out.

**UI Design**:
- Large clear display of current time
- Two prominent buttons: "Clock In" (green) | "Clock Out" (red)
- Shows last clock event timestamp
- Employee name display (from login context)
- Simple notes field for shift details

**Functionality**:
- Click "Clock In" → creates TimeClockEntry with entryType="Clock In" and current timestamp
- Click "Clock Out" → creates TimeClockEntry with entryType="Clock Out" and current timestamp
- Display success notification
- Disable "Clock In" if already clocked in; disable "Clock Out" if not clocked in

**Acceptance**: Clock events record correctly; timestamps accurate; buttons disabled appropriately

**Issue**: #[to-be-created] Phase 2D: Time Clock Interface

---

### Phase 2E: Dashboard Layout & Navigation (30m)
- [ ] Create responsive layout with navigation
- [ ] Add tabs/sections:
  - Production Queue (Job List View)
  - Time Clock
  - Reports (placeholder for future)
- [ ] Add logout functionality
- [ ] Mobile-optimize all views
- [ ] Test on tablets and phones

**Acceptance**: All sections accessible; mobile responsive; navigation intuitive

**Issue**: #[to-be-created] Phase 2E: Dashboard Layout & Navigation

---

### Phase 2 Integration Checkpoint
**Issue**: #[to-be-created] [CHECKPOINT] Phase 2 Complete: Appsmith Dashboard Functional

**Verification**:
- [ ] Appsmith loads and connects to Strapi
- [ ] Job list displays with correct data
- [ ] Can view job details
- [ ] Can update job status (persists to Strapi)
- [ ] Time clock records entries correctly
- [ ] Mobile interface works
- [ ] Ready for Phase 3 (Botpress integration)

---

## 🎯 Phase 3: Botpress Integration (3-4 hours)

**Goal**: Enable 24/7 automated customer order intake

### Phase 3A: Botpress Setup & Flow Design (1h)
- [ ] Launch Botpress Studio
- [ ] Create new bot project
- [ ] Design conversation flow:
  ```
  Start
  ├─ Greeting: "Hi! Ready to place an order?"
  ├─ Ask: "What's your name?"
  ├─ Ask: "What's your email?"
  ├─ Ask: "How many items?"
  ├─ Ask: "Any design notes?"
  └─ Confirmation: "Thanks! We'll be in touch at [email]"
  ```
- [ ] Set up NLU intents for common responses
- [ ] Configure webhook to Strapi API

**Acceptance**: Bot flow runs through completion; conversation natural

**Issue**: #[to-be-created] Phase 3A: Botpress Flow Design

---

### Phase 3B: Strapi Integration Actions (1-1.5h)
Create HTTP request actions in Botpress to interact with Strapi API.

**Action 1: Create or Get Customer**
```
GET /api/customers?filters[email][$eq]={email}

If exists: use existing customer ID
If not: 
  POST /api/customers
  Body: { name, email }
  Return: new customer ID
```

**Action 2: Create Job**
```
POST /api/jobs
Body: {
  customerId: {customer_id},
  quantity: {quantity},
  designNotes: {notes},
  status: "Pending Artwork"
}
Return: job ID
```

**Error Handling**:
- Catch API errors (500, 400, etc.)
- Return user-friendly error messages
- Log errors for debugging

**Testing**:
- Test with valid inputs → job created in Strapi
- Test with invalid inputs → error handled gracefully
- Verify data in Appsmith dashboard appears

**Acceptance**: All API calls working; data created in Strapi; errors handled

**Issue**: #[to-be-created] Phase 3B: Botpress ↔ Strapi Integration

---

### Phase 3C: Multi-Channel Configuration (30m-1h)
- [ ] Configure web widget deployment
  - Add widget code snippet for website integration
  - Test widget loads and functions
- [ ] Set up WhatsApp channel (preview configuration)
  - Document WhatsApp Business Account requirements
  - Configure webhook for future
- [ ] Add analytics tracking
- [ ] Test on web, mobile, chat interfaces

**Acceptance**: Web widget functional; WhatsApp ready for future deployment; responsive design

**Issue**: #[to-be-created] Phase 3C: Multi-Channel Configuration

---

### Phase 3D: Error Handling & Validation (30m-1h)
- [ ] Validate user inputs (name, email format, quantity > 0)
- [ ] Handle API failures gracefully
- [ ] Implement retry logic for transient failures
- [ ] Log all conversations for debugging
- [ ] Add user feedback mechanisms

**Acceptance**: Bot handles all error scenarios; no crashes; logs informative

**Issue**: #[to-be-created] Phase 3D: Error Handling & Validation

---

### Phase 3 Integration Checkpoint
**Issue**: #[to-be-created] [CHECKPOINT] Phase 3 Complete: End-to-End Workflow

**Verification**:
- [ ] Botpress bot running
- [ ] Can complete full conversation flow
- [ ] Customer created in Strapi
- [ ] Job created with correct status
- [ ] Job appears in Appsmith dashboard
- [ ] Web widget functional
- [ ] Ready for final system integration

---

## 🔗 Integration & Final Testing (2-3 hours)

### Integration Checkpoint: Full System
**Issue**: #[to-be-created] [CHECKPOINT] MVP Complete: Full System Integration

**End-to-End Workflow Testing**:

#### Workflow 1: Customer Order Intake
```
1. Customer visits website
2. Botpress widget opens
3. Customer provides: name, email, quantity
4. Bot creates customer + job in Strapi
5. Verify in Appsmith: Job appears in queue
```

#### Workflow 2: Production Job Management
```
1. Team member opens Appsmith
2. Sees job in "In Production" queue
3. Clicks "View Details"
4. Reviews job specs
5. Clicks "Mark Complete"
6. Job status updates to "Complete"
7. Verify in Strapi admin panel: status changed
```

#### Workflow 3: Employee Time Tracking
```
1. Employee opens Appsmith
2. Clicks "Clock In" → records timestamp
3. Works on jobs
4. Clicks "Clock Out" → records timestamp
5. Verify in Strapi: TimeClockEntry created with duration
```

**System Validation**:
- [ ] All services running (docker ps)
- [ ] No error logs across all components
- [ ] Database contains expected data
- [ ] API response times < 200ms (95th percentile)
- [ ] UI responsive on all device sizes
- [ ] Mobile experience optimal

**Documentation**:
- [ ] Complete README with quick start
- [ ] API documentation finalized
- [ ] Troubleshooting guide created
- [ ] Architecture documentation updated

**Acceptance**: All workflows functional end-to-end; system production-ready

---

## 📊 Success Criteria & Metrics

### MVP Completion Criteria
- ✅ Botpress → Strapi: Orders created automatically (Workflow 1)
- ✅ Appsmith ↔ Strapi: Job management functional (Workflow 2)
- ✅ Appsmith → Strapi: Time tracking working (Workflow 3)
- ✅ All data persists in PostgreSQL
- ✅ 70%+ code coverage for critical paths
- ✅ Documentation 100% complete
- ✅ No critical bugs

### Performance Targets
- API response time: < 200ms (95th percentile)
- Dashboard load time: < 2 seconds
- Bot response time: < 1 second
- Uptime: > 99% (post-deployment)

### Coverage Targets
- Phase 1 (Backend): 70%+ test coverage
- Phase 2 (Frontend): Functional testing 100% of workflows
- Phase 3 (Integration): End-to-end testing 100% of workflows

---

## 📅 Timeline & Milestones

### Week 1: Phase 1 (4-6 hours)
- Day 1: Phase 1A (Setup) + 1B (Models)
- Day 2: Phase 1C (API) + 1D (Admin)
- Checkpoint: Strapi API functional

### Week 2: Phase 2 (3-4 hours)
- Day 1: Phase 2A (Setup) + 2B (List View)
- Day 2: Phase 2C (Details) + 2D (Time Clock) + 2E (Layout)
- Checkpoint: Appsmith dashboard functional

### Week 3: Phase 3 (3-4 hours)
- Day 1: Phase 3A (Bot Flow) + 3B (Integration)
- Day 2: Phase 3C (Multi-channel) + 3D (Error Handling)
- Checkpoint: End-to-end workflow functional

### Week 4: Integration & Polish (2-3 hours)
- Final integration testing
- Bug fixes and optimization
- Documentation finalization
- **MVP Release** ✅

**60-Day Total**: 12-15 hours of development + ongoing support

---

## 🚀 Post-MVP Roadmap

Once MVP is complete and stable, layer in deeper capabilities:

### Month 2-3: Operations Deepening
- Production analytics (cycle time, productivity)
- Inventory management (ink, substrates)
- Supplier ordering automation
- Cost tracking per job

### Month 2: Workflow Automation (Level 2)
**Features**:
- Quote-to-approval pipeline with status tracking (Draft → Sent → Feedback → Approved)
- Automated email reminders for unapproved quotes (3-day reminder)
- Production gatekeeping system (prevent job start without all required assets)
- Team role assignment and job ownership per role (Sales Rep, Production Lead, Press Op, Finishing)
- Automated email/SMS follow-ups (unapproved quotes, post-job feedback, reorder suggestions)

### Month 2-3: CRM Module (Level 3)
**Features**:
- Customer profiles with lifetime spend, avg order size, first/last order dates
- Customer tags (monthly, nonprofit, VIP, etc.)
- Repeat order workflows and job duplication (reuse assets, quick reorder)
- Email/SMS communications
- Loyalty programs

### Month 3: Invoicing & Quoting (Level 4)
**Features**:
- Visual quote & invoice generator with PDF export
- Mockup preview integration
- Cost per item + total cost calculation
- Client approval via email link or portal
- Invoice branding and customization

### Month 3: Customer Portal (Level 4)
**Features**:
- Customer self-service portal (order history, tracking, reorders, approvals)
- Secure authentication (token/email login)
- Upload area for new orders
- Reorder button from past jobs
- Invoice download area

### Month 3: Time Tracking Enhancement (Level 3)
**Features**:
- Per-job time tracking for press operators
- Separate tracking for setup, printing, cleanup
- Export time logs as CSV
- Mobile-friendly pressroom interface

### Month 3: Automation Framework (Level 5)
**Features**:
- n8n/Make integration for advanced workflows
- Payment processing (Stripe, PayPal)
- Shipping label generation and carrier integration
- Accounting integration (QuickBooks)
- Email notifications (order status, delivery)

### Month 3: Frontend UX (Level 5)
**Features**:
- Customer self-service portal (already listed under Level 4)
- Native mobile apps (iOS/Android)
- Advanced analytics dashboards
- Designer collaboration tools

---

## 📚 Related Documentation

- [System Overview](docs/architecture/system-overview.md) — Full architecture guide
- [Data Flow](docs/architecture/data-flow.md) — How data moves through system
- [Component Architecture](docs/architecture/component-architecture.md) — Component details
- [Phase 1 Strapi Guide](docs/phases/phase-1-strapi.md) — Detailed Strapi implementation
- [Phase 2 Appsmith Guide](docs/phases/phase-2-appsmith.md) — Detailed Appsmith implementation
- [Phase 3 Botpress Guide](docs/phases/phase-3-botpress.md) — Detailed Botpress implementation
- [Docker Setup](docs/deployment/docker-setup.md) — Local development environment
- [Contributing Guidelines](docs/CONTRIBUTING.md) — Development standards
- [Planning Stack](PLANNING.md) — Issue tracking and workflow organization

---

## 📝 Notes

- All times are estimates; actual duration depends on team size and experience
- Implementation should follow Git flow: feature branches, PRs, code review
- Testing should be continuous throughout each phase
- Documentation should be updated as implementation progresses
- Team should sync daily during 4-6 hour sprint phases
- Post-MVP, prioritize based on Mint Prints business needs

