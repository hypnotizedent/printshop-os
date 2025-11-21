# PrintShop OS Planning Stack

## Overview
This document organizes the PrintShop OS project planning layer, connecting GitHub issues, milestones, and real-world Mint Prints workflows to the technical roadmap.

**Project Vision**: Build a mission-critical business operating system for apparel print shops in 60 days (MVP).

**Timeline**: Phase 1 (Strapi: 4-6h) → Phase 2 (Appsmith: 3-4h) → Phase 3 (Botpress: 3-4h) → Integration & Testing

---

## Milestone Structure

### 🎯 MVP Milestone (60-day target)
**Goal**: Functional end-to-end print shop workflow
- Phase 1: Strapi backend API & database
- Phase 2: Appsmith production dashboard
- Phase 3: Botpress customer intake bot

**Success Criteria**:
- Customer can place order via Botpress
- Job appears in Appsmith production queue
- Team can update job status and clock time
- All data persists in PostgreSQL

---

### Phase 1: Strapi Backend (4-6 hours)
**Goal**: Central API & data repository

**Core Issues**:
1. Initialize Strapi project with PostgreSQL connection
2. Create Collection Types: Customer, Job, Employee, TimeClockEntry
3. Configure role-based access control and API permissions
4. Set up admin panel and data validation
5. Create RESTful API endpoints documentation

**Mint Prints Workflow Integration**:
- Customer model stores name, email, order history
- Job model tracks status progression (Pending → In Production → Complete)
- Employee model manages production team access

---

### Phase 2: Appsmith Dashboard (3-4 hours)
**Goal**: Mobile-optimized production interface for internal team

**Core Issues**:
1. Set up Appsmith project and Strapi data source connection
2. Build Job List View (filtered by "In Production" status)
3. Build Job Details Page with status update capability
4. Implement Time Clock interface (Clock In/Out buttons)
5. Create Mark as Complete workflow

**Mint Prints Workflow Integration**:
- Production team views assigned jobs in real-time queue
- Update job status from "Pending Artwork" → "In Production" → "Complete"
- Clock in/out with one-click interface

---

### Phase 3: Botpress Integration (3-4 hours)
**Goal**: 24/7 automated customer order intake

**Core Issues**:
1. Set up Botpress project and conversation flow
2. Design NLU intents for order collection (customer name, email, quantity)
3. Implement API calls to Strapi for customer/job creation
4. Configure multi-channel deployment (web widget, WhatsApp prep)
5. Test end-to-end order flow

**Mint Prints Workflow Integration**:
- Customers place orders 24/7 via web chat or messaging
- Bot collects: name, email, quantity, design requirements
- Automatically creates customer record and job (status: "Pending Artwork")

---

## Real-World Mint Prints Workflows

### Workflow 1: Customer Order Intake (24/7 Automation)
**Trigger**: Customer visits website or messages WhatsApp
**Flow**: 
1. Botpress bot greets customer
2. Collects: name, email, quantity, design info
3. Creates new customer in Strapi (if new)
4. Creates job with "Pending Artwork" status
5. Sends confirmation to customer
**Success**: Order appears in Appsmith production queue within seconds

**Related Issues**: Phase 3 entire, Botpress API integration

---

### Workflow 2: Production Job Management (Team Efficiency)
**Trigger**: Job created by customer order
**Flow**:
1. Job appears in Appsmith "In Production" view
2. Team member reviews job details (qty, ink colors, imprint locations)
3. Updates status to "In Production" (when starting)
4. Closes job (Mark as Complete) when finished
5. Job moves to Archive
**Success**: Real-time visibility into job queue and completion status

**Related Issues**: Phase 2 entire, Appsmith status update workflow

---

### Workflow 3: Employee Time Tracking (Payroll Accuracy)
**Trigger**: Employee starts/ends shift
**Flow**:
1. Employee opens Appsmith time clock interface
2. Clicks "Clock In" button (records timestamp)
3. Works on jobs throughout shift
4. Clicks "Clock Out" button (records timestamp)
5. Time entries stored in PostgreSQL with date/shift duration
**Success**: Automated time tracking for payroll integration

**Related Issues**: Phase 2 time clock UI, Strapi TimeClockEntry model, Phase 1 schema

---

## Issue Labeling Scheme

### Status Labels
- `status: planning` - Needs research/planning
- `status: ready` - Ready for implementation
- `status: in-progress` - Currently being worked on
- `status: review` - In code/design review
- `status: done` - Completed and merged

### Priority Labels
- `priority: critical` - Blocks MVP completion
- `priority: high` - Important for MVP
- `priority: medium` - Nice to have for MVP
- `priority: low` - Future/post-MVP

### Component Labels
- `component: strapi` - Phase 1 backend
- `component: appsmith` - Phase 2 dashboard
- `component: botpress` - Phase 3 intake bot
- `component: postgres` - Database layer
- `component: docker` - Deployment/containerization
- `component: docs` - Documentation

### Type Labels
- `type: feature` - New functionality
- `type: bug` - Bug fix
- `type: enhancement` - Improvement to existing feature
- `type: docs` - Documentation
- `type: test` - Testing/QA
- `type: chore` - Maintenance/setup

### Workflow Labels
- `workflow: customer-intake` - Maps to Workflow 1
- `workflow: job-management` - Maps to Workflow 2
- `workflow: time-tracking` - Maps to Workflow 3

---

## Post-MVP Roadmap

### Operations Deepening (Month 2-3)
**Goal**: Deeper operational insights and automation

**Epics**:
- Production analytics (job cycle time, team productivity)
- Inventory management (ink stock, substrate levels)
- Supplier management and ordering automation
- Cost tracking (ink, substrates, labor per job)

---

### CRM Module (Month 2-3)
**Goal**: Customer relationship and repeat order management

**Epics**:
- Customer segmentation and profiles
- Order history and repeat order functionality
- Customer communication (email, SMS)
- Loyalty and discount programs

---

### Automation Framework (Month 3)
**Goal**: Workflow automation and integrations

**Epics**:
- Email notifications (order status, delivery)
- Payment processing integration (Stripe)
- Shipping label generation and carrier integration
- Accounting software integration (QuickBooks)

---

### Frontend UX Improvements (Month 3)
**Goal**: Customer-facing portal and enhanced interfaces

**Epics**:
- Customer self-service portal (order history, tracking)
- Mobile app (iOS/Android native)
- Advanced dashboard analytics and reporting
- Designer collaboration tools

---

## Issue Acceptance Criteria Template

Each issue should include:

```
## Acceptance Criteria
- [ ] Criterion 1: Specific, measurable outcome
- [ ] Criterion 2: Integrated with existing component
- [ ] Criterion 3: Tested and verified
- [ ] Criterion 4: Documentation updated

## Related Documentation
- [Phase X Documentation](docs/phases/phase-x-*.md)
- [Architecture Guide](docs/architecture/system-overview.md)

## Definition of Done
- [ ] Code follows Airbnb JavaScript Style Guide
- [ ] Tests written (70%+ coverage)
- [ ] PR reviewed and approved
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## GitHub Projects Board Structure

### MVP Board
**Columns**:
1. 📋 Backlog - Planning queue
2. 🎯 Phase 1: Strapi - Backend work
3. 🎯 Phase 2: Appsmith - Dashboard work
4. 🎯 Phase 3: Botpress - Integration work
5. ✅ Testing & Integration - Pre-release
6. 🚀 Done - Completed work

**Automation**:
- Auto-move issues to "Done" when PR merged
- Auto-move to "In Progress" when assigned
- Status labels sync with board position

---

## Getting Started: First Issues to Create

### Phase 1 (Priority: Critical)
1. **Strapi Project Setup**
   - Initialize Strapi with PostgreSQL
   - Configure Docker environment
   - Set up admin credentials
   
2. **Data Models - Strapi**
   - Create Customer collection type
   - Create Job collection type
   - Create Employee collection type
   - Create TimeClockEntry collection type
   - Add validation and relationships

3. **API Security & Roles**
   - Configure authentication (JWT)
   - Set up role-based access control
   - Document API endpoints

### Phase 2 (Priority: High)
4. **Appsmith Setup & Connection**
   - Initialize Appsmith project
   - Connect Strapi data source
   - Set up authentication

5. **Production Dashboard UI**
   - Job List View component
   - Job Details modal
   - Status update workflow
   - Time Clock interface

### Phase 3 (Priority: High)
6. **Botpress Setup & Flow**
   - Initialize Botpress project
   - Design conversation flow for order intake
   - Create NLU intents

7. **Botpress → Strapi Integration**
   - HTTP request actions to create customers
   - HTTP request actions to create jobs
   - Error handling and validation

---

## Success Metrics

- **MVP Completion**: 60-day target
- **Workflow Execution**: All 3 workflows (intake, production, time-tracking) functioning
- **Test Coverage**: 70%+ code coverage across all phases
- **Documentation**: 100% of features documented
- **Performance**: API response time < 200ms for 95th percentile
- **Availability**: System uptime > 99% (after production deployment)

---

## References

- [System Overview](../architecture/system-overview.md)
- [Data Flow Diagram](../architecture/data-flow.md)
- [Phase 1 Strapi Guide](../phases/phase-1-strapi.md)
- [Phase 2 Appsmith Guide](../phases/phase-2-appsmith.md)
- [Phase 3 Botpress Guide](../phases/phase-3-botpress.md)
- [Contributing Guidelines](CONTRIBUTING.md)
