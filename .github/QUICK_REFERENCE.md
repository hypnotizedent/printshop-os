# PrintShop OS Planning Stack: Quick Reference

## 📚 Documentation Map

**Getting Started**:
- [README.md](../README.md) — Project overview and quick start
- [PLANNING.md](PLANNING.md) — Planning stack overview and structure

**Implementation**:
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) — Detailed phase-by-phase roadmap
- [PROJECT_BOARD.md](PROJECT_BOARD.md) — GitHub Projects board workflow
- [LABELS.md](LABELS.md) — Issue label scheme and usage

**Architecture**:
- [System Overview](../docs/architecture/system-overview.md)
- [Data Flow](../docs/architecture/data-flow.md)
- [Component Architecture](../docs/architecture/component-architecture.md)

**Phase-by-Phase**:
- [Phase 1: Strapi](../docs/phases/phase-1-strapi.md)
- [Phase 2: Appsmith](../docs/phases/phase-2-appsmith.md)
- [Phase 3: Botpress](../docs/phases/phase-3-botpress.md)

**Deployment**:
- [Docker Setup](../docs/deployment/docker-setup.md)
- [Environment Variables](../docs/deployment/environment-variables.md)
- [Disaster Recovery](../docs/deployment/disaster-recovery.md)

**Contributing**:
- [Contributing Guidelines](../docs/CONTRIBUTING.md)

---

## 🎯 Core Workflows

### Workflow 1: Customer Order Intake (24/7 Automation)
- **Who**: Customers (public)
- **How**: Botpress bot on website/WhatsApp
- **Result**: Customer + Job created in system
- **Related Phase**: Phase 3 (Botpress)
- **Related Issue Label**: `workflow:customer-intake`

### Workflow 2: Production Job Management
- **Who**: Production team
- **How**: Appsmith dashboard
- **Result**: Job status updated from Pending → Complete
- **Related Phase**: Phase 2 (Appsmith) + Phase 1 (Strapi)
- **Related Issue Label**: `workflow:job-management`

### Workflow 3: Employee Time Tracking
- **Who**: Production team
- **How**: Appsmith time clock interface
- **Result**: Clock in/out timestamps recorded
- **Related Phase**: Phase 2 (Appsmith) + Phase 1 (Strapi)
- **Related Issue Label**: `workflow:time-tracking`

---

## 📊 Phase Timeline

| Phase | Component | Duration | Status | Depends On |
|-------|-----------|----------|--------|-----------|
| **Phase 1** | Strapi Backend | 4-6h | Ready | None |
| **Phase 2** | Appsmith Dashboard | 3-4h | Ready | Phase 1 ✅ |
| **Phase 3** | Botpress Integration | 3-4h | Ready | Phase 1 ✅ |
| **Integration** | E2E Testing | 2-3h | Ready | Phases 1,2,3 ✅ |
| **MVP Release** | Production Ready | — | Planned | All complete |

**Total**: ~12-15 hours of development + integration/testing

---

## 🏗️ System Architecture (Simple)

```
┌─────────────────────────────────────────────────────────────┐
│                     CUSTOMERS                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  BOTPRESS BOT   │ (Phase 3)
                    │  (Order Intake) │
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌────────────────────┐             ┌─────────────────────┐
│  APPSMITH          │             │  STRAPI REST API    │
│  Dashboard         │◄────────────►│  (Phase 1)          │
│  (Phase 2)         │             │                     │
│                    │             │  - Customers        │
│  - Job Queue       │             │  - Jobs             │
│  - Time Clock      │             │  - Employees        │
│  - Status Updates  │             │  - Time Entries     │
└────────────────────┘             └────────────┬────────┘
    (Internal Team)                             │
                                    ┌───────────▼──────────┐
                                    │ PostgreSQL Database  │
                                    │ (Single Source Truth)│
                                    └──────────────────────┘
```

---

## 🚀 Getting Started: First Steps

### Step 1: Read the Docs
1. [ ] Read [README.md](../README.md) — project overview
2. [ ] Read [System Overview](../docs/architecture/system-overview.md) — architecture
3. [ ] Skim [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) — what we're building

### Step 2: Set Up Development Environment
1. [ ] Clone repository
2. [ ] Copy `.env.example` → `.env`
3. [ ] Run `docker-compose up` to start services
4. [ ] Verify Strapi loads at http://localhost:1337

### Step 3: Create First Issues
1. [ ] Create Phase 1A issue (Strapi initialization)
2. [ ] Create Phase 1B issue (Data models)
3. [ ] Create Phase 1C issue (API endpoints)
4. [ ] Create Phase 1D issue (Admin panel)

### Step 4: Begin Implementation
1. [ ] Assign Phase 1A issue
2. [ ] Follow [Phase 1 Guide](../docs/phases/phase-1-strapi.md)
3. [ ] Push code to feature branch
4. [ ] Open PR, request review
5. [ ] Merge when approved
6. [ ] Close issue and move to "Done" column

---

## 📋 Issue Labeling Quick Guide

### Minimum Labels (Every Issue Needs)
```
status:planning       (issue needs work before ready)
status:ready          (issue ready to work on)
status:in-progress    (actively being worked)
status:review         (code review in progress)
status:blocked        (waiting on something else)
status:done           (complete and merged)

priority:critical     (MVP blocker)
priority:high         (important for MVP)
priority:medium       (nice to have)
priority:low          (post-MVP or future)

type:feature          (new functionality)
type:bug              (broken functionality)
type:docs             (documentation)
type:test             (testing/QA)
type:chore            (maintenance/setup)
```

### Component Labels (Add Relevant Ones)
```
component:strapi      (Phase 1 backend)
component:appsmith    (Phase 2 dashboard)
component:botpress    (Phase 3 bot)
component:postgres    (database)
component:docker      (containerization)
component:docs        (documentation)
component:infra       (deployment/ops)
```

### Phase Labels (Add Relevant Ones)
```
phase:1-strapi        (Phase 1 issue)
phase:2-appsmith      (Phase 2 issue)
phase:3-botpress      (Phase 3 issue)
phase:integration     (cross-phase testing)
phase:post-mvp        (future work)
```

### Workflow Labels (If Relevant)
```
workflow:customer-intake   (bot order taking)
workflow:job-management    (team dashboard)
workflow:time-tracking     (employee clocking)
```

---

## 🏁 MVP Success Criteria

### Functional Completeness
- ✅ Botpress bot collects customer orders (Workflow 1)
- ✅ Order creates customer + job in Strapi automatically
- ✅ Job appears in Appsmith dashboard immediately
- ✅ Team can update job status (Pending → In Progress → Complete) (Workflow 2)
- ✅ Team can clock in/out via time clock (Workflow 3)
- ✅ All data persists in PostgreSQL across service restarts

### Quality Standards
- ✅ 70%+ code coverage (Phase 1 & critical paths)
- ✅ Functional testing 100% of workflows
- ✅ End-to-end testing passing
- ✅ No critical bugs at release

### Documentation
- ✅ README with quick start
- ✅ API documentation complete
- ✅ Phase implementation guides done
- ✅ Architecture documentation updated
- ✅ Contributing guidelines followed

### Performance
- ✅ API response time < 200ms (95th percentile)
- ✅ Dashboard load time < 2 seconds
- ✅ Bot response time < 1 second
- ✅ System uptime > 99% (post-deployment)

---

## 🔗 Critical Issue Flow

### Phase 1 → Phase 2 → Phase 3 Sequence

```
START
  │
  ├─► Phase 1A: Strapi Setup
  │   (Initialize, verify admin panel)
  │
  ├─► Phase 1B: Data Models
  │   (Create collections, relationships)
  │
  ├─► Phase 1C: API Endpoints
  │   (Configure REST, auth, RBAC)
  │
  ├─► Phase 1D: Admin & Seeding
  │   (Sample data, documentation)
  │
  ├─► [CHECKPOINT] Phase 1 ✅
  │   (Verify Strapi API functional)
  │
  ├─► Phase 2A: Appsmith Setup
  │   (Initialize, connect to Strapi)
  │
  ├─► Phase 2B-2E: Dashboard UI
  │   (List, Details, Time Clock, Layout)
  │
  ├─► [CHECKPOINT] Phase 2 ✅
  │   (Verify Appsmith dashboard works)
  │
  ├─► Phase 3A-3D: Botpress Integration
  │   (Bot flow, API integration, channels, error handling)
  │
  ├─► [CHECKPOINT] Phase 3 ✅
  │   (Verify end-to-end workflow)
  │
  ├─► Integration Testing
  │   (Run all three workflows, verify system)
  │
  ├─► [CHECKPOINT] MVP Complete ✅
  │   (System ready for production)
  │
  └─► 🚀 RELEASE
```

### When Phase is Blocked
- [ ] Add `status:blocked` label
- [ ] Comment with blocking issue number
- [ ] Notify team lead
- [ ] When blocker resolved, move back to appropriate status

---

## 📞 Quick Links & Commands

### GitHub Project Board
- **URL**: https://github.com/hypnotizedent/printshop-os/projects/1
- **View**: Board view (best for visual workflow)
- **Filter**: By phase, priority, component

### Create New Issue
```
Title: [PHASE X] or [WORKFLOW] Component: Description
Labels: phase:X-component status:planning priority:critical/high/medium/low
Assign: Team member when ready to start
```

### Move Issue to Ready
```
1. Add acceptance criteria checklist
2. Link to relevant documentation
3. Change label: status:ready
4. Add labels: component:X, phase:X, priority:X
5. Move to phase column on project board
```

### Working on an Issue
```
1. Assign to self
2. Change label: status:in-progress
3. Create feature branch: feature/issue-xxx-description
4. Make commits with related issue number: "Fixes #123: description"
5. When done: create PR linking to issue
```

---

## 🎓 Learning Resources

### Understanding the System
- Start with [System Overview](../docs/architecture/system-overview.md)
- Watch how data flows in [Data Flow](../docs/architecture/data-flow.md)
- Review [Component Architecture](../docs/architecture/component-architecture.md)

### Implementing a Phase
- Read the corresponding phase guide (Phase 1, 2, or 3)
- Follow the step-by-step instructions
- Reference API documentation as needed

### Contributing Code
- Read [Contributing Guidelines](../docs/CONTRIBUTING.md)
- Follow Airbnb JavaScript Style Guide
- Write tests (70%+ coverage target)
- Get code review before merging

### Troubleshooting
- Check [Disaster Recovery](../docs/deployment/disaster-recovery.md) for common issues
- Review Docker setup in [Docker Setup](../docs/deployment/docker-setup.md)
- Ask questions in GitHub issue (label: `type:question`)

---

## 🎯 Next Action Items

Based on the planning stack being established:

**Immediate** (Before Phase 1 starts):
1. [ ] Set up GitHub labels (create all labels in LABELS.md)
2. [ ] Create Phase 1-4 checkpoint issues
3. [ ] Assign first developer to Phase 1A
4. [ ] Create GitHub Projects board
5. [ ] Schedule daily standups

**During Phase 1** (First 4-6 hours):
1. [ ] Verify Strapi running with correct schema
2. [ ] Test API endpoints with Postman
3. [ ] Add sample data to database
4. [ ] Document any deviations from roadmap

**Before Phase 2** (Checkpoint 1):
1. [ ] Verify Phase 1 checkpoint passes
2. [ ] Prepare Appsmith project
3. [ ] Review Phase 2 guide
4. [ ] Plan time for Phase 2 developer

**Final** (Before MVP release):
1. [ ] All workflows tested end-to-end
2. [ ] Documentation complete
3. [ ] Code review completed
4. [ ] Ready for production deployment

---

## 📞 Support & Questions

- **GitHub Issues**: Ask questions with `type:question` label
- **Contributing**: See [Contributing Guidelines](../docs/CONTRIBUTING.md)
- **Bugs**: Report with `type:bug` label and reproduction steps
- **Features**: Request with `type:feature` label and use case

---

**PrintShop OS Planning Stack Established**: November 21, 2025  
**Status**: Ready for Phase 1 Implementation  
**MVP Timeline**: 60 days from Phase 1 start  

