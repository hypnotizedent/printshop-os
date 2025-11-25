# 🏭 Production Dashboard Epic - Consolidated

**Status:** Phase 2 - Internal Operations  
**Priority:** High  
**Effort:** 3-4 weeks  
**Dependencies:** Strapi (Phase 1), Job system

---

## 📋 Epic Overview

**Goal:** Build mobile-first internal dashboard for production team that enables:
- ✅ Real-time job visibility (queue, in progress, completed)
- ✅ Time tracking (clock in/out per job)
- ✅ Quality checklists (pre-production verification)
- ✅ SOP access (production guides)
- ✅ Supervisor oversight (bottleneck detection)
- ✅ Analytics (team productivity)

**Why This Matters:**
- Transparency = Accountability (catch delays early)
- Mobile-first = Usable on production floor
- Checklists = Quality assurance (prevent $500+ mistakes)
- Real-time data = Supervisor visibility = Better planning

---

## 🎯 Consolidated Sub-Tasks

### Phase 1: Foundation (Week 1-2)

#### Sub-Task 1: Job Queue Dashboard (Base)
**What:** Mobile-first view of jobs in production status

**Features:**
- ✅ List all "In Production" jobs (priority ordered)
- ✅ Show: Mockup image, JobID, Customer name, Due date
- ✅ One-tap to open job details
- ✅ Filter by service type (screen print, DTG, embroidery)
- ✅ Search by job ID or customer name
- ✅ Status badges (On Track, At Risk, Urgent)

**UI:**
```
┌─────────────────────────┐
│ 🏭 Production Queue     │
├─────────────────────────┤
│ ▌ Job #1234 - URGENT   │  ← DueToday (Red)
│  [Mockup] Acme Corp    │
│  Quick Ship: 2hr ago   │
│                         │
│ ▌ Job #1235 - ON TRACK│  ← Due Tomorrow (Green)
│  [Mockup] Tech Co      │
│  Standard: 4hr ago     │
│                         │
│ ▌ Job #1236 - ON TRACK│  ← Due in 2 days (Green)
│  [Mockup] StartupXYZ   │
│  Standard: 10 min ago  │
└─────────────────────────┘
```

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Strapi job data

---

#### Sub-Task 2: Job Details & Time Clock (Issue #9)
**What:** Detailed job view with time tracking

**Features:**
- ✅ Full job details (mockup, colors, print location, quantity, notes)
- ✅ One-tap Clock In/Out buttons
- ✅ Track time by phase (setup, printing, cleanup)
- ✅ Show elapsed time for current activity
- ✅ Notes field (issues, handoffs)
- ✅ Mark job complete (updates status in Strapi)

**Time Tracking:**
```
Clock In (Setup)    10:00 AM
  ↓ [30 min setup time]
Clock Out Setup
Clock In (Print)    10:30 AM
  ↓ [45 min print time]
Clock Out Print
Clock In (Cleanup)  11:15 AM
  ↓ [15 min cleanup]
Clock Out + Mark Complete
  ↓
Total: 1hr 30min (logged to TimeEntry)
```

**Effort:** 3-4 days  
**Priority:** HIGH  
**Blockers:** Sub-task 1

---

#### Sub-Task 3: Press-Ready Checklist (Issue #49)
**What:** Pre-production verification checklist

**Checklist Items:**
- ✅ Mockup received & approved
- ✅ Design file verified
- ✅ Ink colors confirmed (Pantone codes)
- ✅ Garments received & checked
- ✅ Print location marked/verified
- ✅ Special instructions reviewed
- ✅ Quality notes documented

**UI:**
```
Press-Ready Checklist

□ Mockup Approved
  [Upload mockup image]

□ Design File Ready
  [Approved by: John | Timestamp]

□ Ink Colors Confirmed
  Color 1: Black (Pantone 419)
  Color 2: Red (Pantone 185)
  [✓ Verified]

□ Garments Received
  Qty: 100 confirmed
  Size breakdown: S/M/L/XL

□ Print Location Marked
  Front center, 4"x4"

□ Special Instructions
  "Avoid creases on front"

□ Quality Notes
  "High visibility - check for bubbles"

[Checkbox] Complete - Mark Job Ready for Press
[Checkbox] Block job start until complete ✓
```

**Effort:** 2-3 days  
**Priority:** HIGH  
**Blockers:** Sub-task 1

---

### Phase 2: Advanced Features (Week 2-3)

#### Sub-Task 4: SOP Library & Documentation (Issue #50)
**What:** Searchable production guides built into dashboard

**SOPs Needed:**
1. **Screen Printing Setup** (5-10 min video + written guide)
   - Choosing screen mesh (100, 110, 156, 180)
   - Ink selection & mixing
   - Registration setup
   - Squeegee adjustment

2. **DTG Process** (3-5 min video + written guide)
   - Pre-treatment
   - Design preparation
   - Heat press settings
   - Quality check

3. **Embroidery Setup** (5-10 min video + written guide)
   - Hoop setup
   - Stabilizer selection
   - Tension adjustment
   - Needle threading

4. **Finishing & Packaging** (3-5 min video + written guide)
   - Labeling application
   - Hanger attachment
   - Quality inspection
   - Box packing

**UI:**
```
SOP Library

Search: _____________ [Find SOP]

Recommended for this job:
> Screen Printing: 4-Color Placement
  [Video 3:45] [View Full Guide]
  Last updated: Nov 20, 2025

All SOPs:
▾ Screen Printing
  - Mesh Selection
  - Ink Mixing
  - Registration Setup
  - Color Separation

▾ DTG Printing
  - Pre-treatment
  - Design Preparation
  - Heat Press Setup

▾ Embroidery
  - Hoop Setup
  - Tension Adjustment

▾ Finishing
  - Labeling
  - Packaging
```

**Features:**
- ✅ Markdown with embedded videos
- ✅ Full-text search (find "tension" → Embroidery SOP)
- ✅ Context-aware suggestions (show relevant SOP for job type)
- ✅ Version control & history
- ✅ "Mark helpful" rating system

**Effort:** 3-4 days  
**Priority:** MEDIUM  
**Blockers:** None (can parallelize)

---

#### Sub-Task 5: Team Productivity Metrics (Issue #51)
**What:** Admin view of team performance & bottlenecks

**Metrics Dashboard:**
```
Team Performance (Today)

John Smith
  Jobs completed: 8
  Avg time/job: 45 min
  Quality score: 98%
  Status: On pace

Sarah Johnson
  Jobs completed: 6
  Avg time/job: 52 min
  Quality score: 100%
  Status: At risk (1 job pending >2hr)

Mike Chen
  Jobs completed: 7
  Avg time/job: 41 min
  Quality score: 97%
  Status: Ahead of pace

Floor Status:
  Total jobs: 15
  Completed: 12
  In progress: 2
  Pending: 1
  
Bottlenecks:
  ⚠️ Screen washing: 4 jobs delayed
  ⚠️ Heat press: 2 jobs pending >30min
  ⚠️ Embroidery: None
```

**Features:**
- ✅ Real-time metrics (updated every 5 min)
- ✅ Bottleneck alerts (job stuck >2 hours)
- ✅ Team member performance trends
- ✅ Historical data (daily, weekly, monthly)
- ✅ PDF export for reports

**Effort:** 3-4 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 2 (time tracking)

---

#### Sub-Task 6: Supervisor Mobile Dashboard (Issue #53)
**What:** Supervisor-specific view for on-floor management

**Features:**
- ✅ Status change log (who did what, when)
- ✅ Bottleneck detection (highlight problems)
- ✅ Quick reassign buttons
- ✅ Team member activity feed
- ✅ Push notifications for issues

**Supervisor Actions:**
```
┌─────────────────────────────┐
│ 👔 Supervisor View          │
├─────────────────────────────┤
│ ⚠️ BOTTLENECK ALERT         │
│ Job #1234 stuck in press    │
│ Time: 2hr 15min             │
│ [Investigate] [Reassign]    │
│                              │
│ Team Activity               │
│ 10:30 - John started #1230  │
│ 10:35 - Sarah completed #1228 │
│ 10:45 - John marked #1230 issue │
│ 10:48 - Mike reassigned #1230 │
│                              │
│ Quick Actions               │
│ [Call Break] [Huddle] [Help]│
└─────────────────────────────┘
```

**Effort:** 2-3 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 5

---

### Phase 3: Analytics & Reporting (Week 3-4)

#### Sub-Task 7: Historical Analytics
**What:** Trend analysis & forecasting

**Reports:**
- ✅ Daily/weekly/monthly productivity
- ✅ Per-team-member performance trends
- ✅ By-service-type metrics (screen print vs DTG vs embroidery)
- ✅ Quality metrics over time
- ✅ Forecasting (projected capacity based on trends)

**Effort:** 2-3 days  
**Priority:** LOW  
**Blockers:** Sub-task 5

---

#### Sub-Task 8: Role-Based Permissions
**What:** Access control (who sees what)

**Roles:**
- **Press Operator:** See own job queue, time clock, relevant SOPs
- **Supervisor:** See all jobs, team metrics, bottlenecks, reassign authority
- **Admin:** Full access + analytics + SOP management
- **Manager:** High-level metrics, forecasting, historical trends

**Effort:** 1-2 days  
**Priority:** MEDIUM  
**Blockers:** Sub-task 1

---

#### Sub-Task 9: Mobile Optimization & Testing
**What:** Ensure usability on production floor

**Test Devices:**
- ✅ iPhone (newer & older)
- ✅ Android (various versions)
- ✅ Tablets (iPad, Samsung Tab)

**Offline Mode:**
- ✅ Cache job data locally
- ✅ Allow clock in/out offline
- ✅ Sync when back online
- ✅ Show "offline" indicator

**Performance:**
- ✅ <2 second page load
- ✅ <100ms for interactions
- ✅ Battery efficiency

**Effort:** 2-3 days  
**Priority:** HIGH  
**Blockers:** All sub-tasks

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| **Load Time** | <2 seconds on 4G |
| **Uptime** | 99.9% |
| **Accuracy** | 100% time tracking vs manual |
| **Adoption** | 100% of team using daily |
| **Error Reduction** | 95% fewer checklist misses |
| **Quality Improvement** | 10% fewer defects |

---

## 🚀 Execution Timeline

```
Week 1-2: Core Features
├─ Sub-task 1: Job queue (3-4 days)
├─ Sub-task 2: Time clock (3-4 days)
└─ Sub-task 3: Checklist (2-3 days)

Week 2-3: Advanced
├─ Sub-task 4: SOP library (3-4 days)
├─ Sub-task 5: Metrics (3-4 days)
└─ Sub-task 6: Supervisor view (2-3 days)

Week 3-4: Polish
├─ Sub-task 7: Analytics (2-3 days)
├─ Sub-task 8: Permissions (1-2 days)
└─ Sub-task 9: Testing (2-3 days)

Total: 3-4 weeks
```

---

## 💼 Technology Stack

- **Frontend:** React or React Native (mobile-first)
- **Backend:** Express.js + Node.js
- **Database:** Strapi (job data)
- **Real-time:** WebSockets for live updates
- **Hosting:** Docker containers
- **Mobile:** Progressive Web App (PWA) for offline support

---

**Status:** Ready for implementation  
**Created:** November 23, 2025  
**Reference:** Consolidated Production Dashboard Epic
