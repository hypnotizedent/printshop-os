# PrintShop OS - Issue Quick Start

**5-minute quick reference for working with GitHub Issues in PrintShop OS.**

---

## ⚡ TL;DR

**Sectors**: Issues belong to one of 6 business areas (Sales, Production, CRM, Finance, Automation, Portal)

**Milestones**: Each sector is a milestone. When creating an issue, pick a milestone.

**Labels**: Mark issue with sector, status, priority, and type labels.

**Pipeline**: Issues move through 6 stages: Backlog → Planned → Ready → In Progress → Review → Done

**Board**: View all work at GitHub Projects board.

---

## 📋 Creating an Issue (2 minutes)

### 1. Go to Issues → New Issue

### 2. Choose Sector
Pick which business area this work belongs to:
- 💰 **Sales & Quoting** - Quotes, payments, customer pricing
- 🏭 **Production & Operations** - Print jobs, scheduling, queue
- 👥 **CRM & Client Management** - Customer data, profiles, history
- 💳 **Finance & Invoicing** - Billing, payments, financial reports
- ⚙️ **Automation & Integration** - Zapier, webhooks, integrations
- 📱 **Customer Portal & Mobile** - Customer-facing portal and app

### 3. Fill in Details
- **Title**: What needs to be done? (e.g., "Implement quote generator")
- **Description**: Why? What problem does it solve? (2-3 sentences)
- **Acceptance Criteria**: How do we know it's done? (bullet list)

### 4. Set Milestone
Click Milestone dropdown → Select sector (e.g., "Sales & Quoting")

### 5. Add Labels
Click Labels → Select:
- **Sector label**: `sector:sales`, `sector:production`, etc.
- **Type label**: `type:enhancement` (most common) or `type:bug`, `type:documentation`
- **Priority label** (if applicable): `priority:high`, `priority:medium`, `priority:low`
- **Other labels** (optional): `good-first-issue`, `help-wanted`, etc.

### 6. Submit
Click "Create issue" - you're done!

---

## 🔄 Issue Status Labels

Issues progress through 6 stages. Use these labels to mark current status:

| Stage | Label | Meaning | Action |
|-------|-------|---------|--------|
| **1️⃣ Backlog** | `status:backlog` | Not yet planned | Waiting for prioritization |
| **2️⃣ Planned** | `status:planned` | Scheduled for upcoming work | Planned for sprint |
| **3️⃣ Ready** | `status:ready` | Fully specified, ready to build | Ready to assign to developer |
| **4️⃣ In Progress** | `status:in-progress` | Currently being worked on | Developer assigned, work started |
| **5️⃣ Review** | `status:review` | Code written, awaiting review | Review/testing in progress |
| **6️⃣ Done** | `status:done` | Complete and shipped | Issue closed |

### How to Update Status

Edit issue → Remove old status label → Add new status label → Save

**Example**:
```
Issue created with status:backlog
↓ (after planning meeting)
Remove status:backlog, Add status:planned
↓ (after writing spec)
Remove status:planned, Add status:ready
↓ (dev starts work)
Remove status:ready, Add status:in-progress
↓ (dev submits for review)
Remove status:in-progress, Add status:review
↓ (review approved)
Remove status:review, Add status:done, Close issue
```

---

## 🎯 Priority Quick Reference

Use priority labels to show urgency:

| Label | Meaning | Action |
|-------|---------|--------|
| `priority:critical` | This must be done immediately, blocks other work | Do this first |
| `priority:high` | Important, should do this sprint | Schedule soon |
| `priority:medium` | Should eventually do, but not urgent | Plan for future sprint |
| `priority:low` | Nice to have, can wait | Do after high priority items |

---

## 🏷️ Sector Labels (Must Have One)

| Label | Sector | Example |
|-------|--------|---------|
| `sector:sales` | Sales & Quoting | "Implement quote generator" |
| `sector:production` | Production & Operations | "Add print job queue" |
| `sector:crm` | CRM & Client Management | "Create customer profiles" |
| `sector:finance` | Finance & Invoicing | "Add invoice generation" |
| `sector:automation` | Automation & Integration | "Connect to Zapier" |
| `sector:portal` | Customer Portal & Mobile | "Build customer portal" |

---

## 📦 Type Labels (Recommended)

| Label | Meaning | Example |
|-------|---------|---------|
| `type:enhancement` | New feature or improvement | Most common |
| `type:bug` | Something is broken | Should fix ASAP |
| `type:documentation` | Docs, README, guides | Keep docs updated |
| `type:chore` | Maintenance, cleanup, refactoring | Behind the scenes |
| `type:question` | Question or discussion | Needs decision |

---

## 📌 Special Labels (Optional)

| Label | Use When | Action |
|-------|----------|--------|
| `good-first-issue` | New contributors can pick this up | Great for team onboarding |
| `help-wanted` | Asking for input from team | Waiting for discussion/approval |
| `blocked` | Can't proceed due to dependency | Document blocker in comments |
| `needs-review` | Code ready for review | Assign reviewers |
| `needs-test` | Feature ready for QA | Test before deploying |
| `needs-docs` | Feature needs documentation | Update docs before closing |

---

## 💪 Effort Labels (For Planning)

After specifying an issue, add effort estimate:

| Label | Meaning | Developer Time |
|-------|---------|-----------------|
| `effort:xs` | Trivial | < 1 hour |
| `effort:small` | Small | 1-4 hours |
| `effort:medium` | Medium | 4-8 hours (1 day) |
| `effort:large` | Large | 8-24 hours (2-3 days) |
| `effort:xl` | Very Large | 24+ hours (1+ week) |

---

## 📊 Sector at a Glance

### Sales & Quoting Issues
- Quote generation pipeline
- Stripe payment integration
- Quote templates and history

### Production & Operations Issues
- Print job queue management
- Job scheduling system
- Order routing and tracking

### CRM & Client Management Issues
- Customer profile system
- Client history and preferences
- Communication history

### Finance & Invoicing Issues
- Invoice generation
- Payment tracking
- Financial reporting

### Automation & Integration Issues
- Zapier workflow integration
- Webhook system
- External API connections

### Customer Portal & Mobile Issues
- Self-service portal
- Mobile app development
- Account management

---

## 🎨 Label Combination Examples

### Good First Issue
```
Issue: "Fix typo in README"
Labels: type:documentation, good-first-issue, sector:sales
Status: status:ready
Priority: (none - trivial)
```

### High Priority Bug
```
Issue: "Quote calculator showing wrong total"
Labels: type:bug, priority:high, sector:sales, needs-review
Status: status:in-progress
Priority: priority:critical (handle today)
```

### Complex Enhancement
```
Issue: "Implement Zapier integration"
Labels: type:enhancement, sector:automation, priority:high, effort:large
Status: status:planned
Milestone: Automation & Integration
```

### Blocked Feature
```
Issue: "Build mobile app checkout"
Labels: type:enhancement, sector:portal, blocked, needs-design
Status: status:backlog
Comment: "Blocked waiting for design approval from @designer"
```

---

## ✏️ Updating an Issue

### To Change Milestone
Issue → Milestone dropdown → Select new sector → Save

### To Add/Remove Labels
Issue → Labels → Check/uncheck → Save

### To Change Status
Issue → Labels → Remove old status label → Add new status label → Save

### To Close an Issue
Issue → Close issue (marks as `status:done` automatically) → Click "Close issue"

---

## 🔍 Filtering Issues by Sector

### On GitHub Web UI
1. Go to Issues
2. Click Filters
3. Select Labels → Choose sector label (e.g., `sector:sales`)
4. View all Sales sector issues

### By Status
Filters → Labels → `status:in-progress` (see what's being worked on)

### By Priority
Filters → Labels → `priority:high` (see critical work)

---

## 🎯 Workflow Templates

### Creating a Feature
```
1. Create issue with type:enhancement
2. Add sector and priority labels
3. Set to status:backlog
4. Wait for prioritization
5. (Later) Change to status:planned
6. (Later) Spec out acceptance criteria
7. (Later) Add effort estimate + change to status:ready
8. (Later) Assign to developer + change to status:in-progress
9. (Later) Change to status:review for testing
10. (Later) Change to status:done when complete
```

### Reporting a Bug
```
1. Create issue with type:bug
2. Add sector label
3. Set to status:backlog
4. Add priority:high if urgent
5. Describe: what you expected vs what happened
6. (Quickly) Change to status:planned
7. (Dev picks up) Change to status:in-progress
8. (Dev submits) Change to status:review
9. (Verified fixed) Change to status:done
```

### Documentation Work
```
1. Create issue with type:documentation
2. Set to status:ready (docs usually skip backlog/planned)
3. Assign to writer
4. Change to status:in-progress
5. Change to status:done when written and merged
```

---

## ❓ Quick FAQ

**Q: Where do I see all issues in my sector?**
A: GitHub Issues → Filters → Labels → Select `sector:sales` (or your sector)

**Q: How do I see what I'm assigned to?**
A: GitHub Issues → Filters → Assignee → Your name

**Q: How do I mark something as done?**
A: Close the issue (go to issue, click "Close issue")

**Q: Can I change a sector after creating an issue?**
A: Yes - change Milestone and update sector label. Add comment explaining why.

**Q: What if something needs work across multiple sectors?**
A: Break it into separate issues, one per sector. Link them in comments.

**Q: How do I discuss something before creating an issue?**
A: Use Discussions (GitHub) or your team chat - create issue after decision

---

## 📱 GitHub Projects Board

All issues automatically appear on the GitHub Projects board organized by:
- **Row**: Sector (which business area)
- **Column**: Status (Backlog → Planned → Ready → In Progress → Review → Done)

Just update labels on the issue, and the board updates automatically!

---

## 🚀 Getting Started in 5 Minutes

1. **Read this page** (2 min) ✓
2. **Go to Issues** (1 min)
3. **Create your first issue** (2 min)
   - Pick a sector
   - Write title and description
   - Select milestone (the sector)
   - Add labels
   - Click Create!

Done! You've created your first issue.

---

## 📚 More Information

**Want deeper info?** See:
- SECTOR_MILESTONE_INDEX.md - All 6 sectors explained
- ISSUE_INTAKE_PROCESS.md - Complete workflow with examples
- SETUP_INSTRUCTIONS.md - Full configuration guide

**Need scripts?** See: scripts/README.md

---

**Print this page** for quick reference while working!

