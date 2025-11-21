# 📝 Daily Issue Intake Pipeline

## Quick Start (2 minutes per issue)

### 1️⃣ Go to GitHub Issues
- **URL:** https://github.com/hypnotizedent/printshop-os/issues
- Click **"New issue"** button (top right)

---

### 2️⃣ Fill Out the Form

#### **Title** (Required)
Specific problem or feature request. Be clear and actionable.

**Examples:**
- ✅ "Add visual mockup preview to quote emails"
- ✅ "Fix S&S API timeout handling"
- ✅ "Create supplier data sync dashboard"
- ❌ "Fix stuff" (too vague)

---

#### **Description** (Required)
Use this template:

```markdown
## What's needed
Describe the problem or feature in 1-2 sentences.

## Why it matters
Business impact - revenue, efficiency, customer experience?

## Acceptance criteria (if feature)
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Related issues
Link to related: #15, #24, etc.
```

**Examples:**
```markdown
## What's needed
Customers need to approve quotes on mobile without login friction.

## Why it matters
Mobile approval rate is our biggest drop-off point (50% abandonment).
This could recover ~$5K/month in quotes.

## Acceptance criteria
- [ ] Quote displays properly on iOS/Android
- [ ] One-tap approve button
- [ ] Works without customer login
- [ ] Email link expires after 7 days
```

---

#### **Milestone** (Required)
Choose ONE:
- 🎯 **Sales & Quoting** - Quote generation, pricing, deposit collection
- 🎯 **Production & Operations** - Job scheduling, time tracking, checklists
- 🎯 **CRM & Client Management** - Customer profiles, history, reorders
- 🎯 **Finance & Invoicing** - Billing, payments, reporting
- 🎯 **Automation & Integration** - Workflows, external services, n8n
- 🎯 **Customer Portal & Mobile** - Self-service portal, mobile apps
- 🎯 **Marketing & Content Site** - Website, blog, case studies
- 🎯 **Supplier & Product Data** - APIs, inventory, catalog sync
- 🎯 **AI & Intelligence Layer** - AI assistants, analytics, intelligence

**How to choose:** Think about the PRIMARY area of impact. If it spans multiple, pick the main one.

---

#### **Labels** (Required - pick at least one per category)

**Type (Pick ONE):**
- `type:feature` - New capability
- `type:bug` - Something broken
- `type:enhancement` - Improve existing feature
- `type:chore` - Internal work, tech debt
- `type:documentation` - Docs, guides, wiki

**Priority (Pick ONE):**
- `priority:critical` - Blocks business (do this week)
- `priority:high` - Important (do this sprint)
- `priority:medium` - Nice to have (next sprint)
- `priority:low` - Can wait (backlog)

**Effort (Pick ONE):**
- `effort:s` - 1-3 days
- `effort:m` - 3-5 days
- `effort:l` - 1-2 weeks
- `effort:xl` - 2+ weeks

**Sector (Auto-applied based on milestone, optional override):**
- `sector:sales`, `sector:production`, `sector:crm`, `sector:finance`, `sector:automation`, `sector:portal`, `sector:marketing`, `sector:supplier`, `sector:ai`

**Example label combo:**
```
type:feature, priority:high, effort:m, sector:marketing
```

---

#### **Assignee** (Optional)
Leave blank for now, assign during sprint planning.

---

### 3️⃣ Submit
Click **"Create issue"**

✅ Issue auto-appears in GitHub
✅ Syncs to Projects board (organized by milestone + status)
✅ Team gets notified
✅ Moves through pipeline: **Backlog → Planned → Ready → In Progress → Review → Done**

---

## 📊 View Your Issues

**By Milestone:**
- https://github.com/hypnotizedent/printshop-os/milestones

**By Status (Projects Board):**
- https://github.com/hypnotizedent/printshop-os/projects (if configured)

**By Priority:**
- Filter: `is:open sort:updated-desc label:priority:critical`

**By Sector:**
- Filter: `is:open label:sector:marketing` (replace with your sector)

---

## 🚀 Best Practices

1. **One issue = one thing** - Don't combine features/bugs
2. **Be specific** - "Add logo" not "Improve site"
3. **Add context** - Why matters + business impact
4. **Link related** - Use `#issue-number` to cross-reference
5. **Update status** - Move through pipeline as work progresses
6. **Close when done** - Mark as complete, link PR if applicable

---

## 💡 Real-World Examples

### Example 1: Feature Request
```
Title: Add email template editor to quote system

Milestone: Sales & Quoting
Type: feature
Priority: high
Effort: m

Description:
## What's needed
Marketing needs to customize quote email templates without code.

## Why it matters
Currently quotes are one-size-fits-all. Custom branding could improve 
response rate by ~10-15% based on A/B test data.

## Acceptance criteria
- [ ] Drag-and-drop template builder UI
- [ ] Preview before send
- [ ] Save multiple templates
- [ ] Variables for customer name, quote amount, etc.
- [ ] Default fallback template

Related: #14, #20
```

### Example 2: Bug Report
```
Title: S&S Activewear API returns 500 on size variant queries

Milestone: Supplier & Product Data
Type: bug
Priority: critical
Effort: s

Description:
## What's needed
API integration breaks when fetching products with 5+ size variants.

## Why it matters
Blocks daily inventory sync. ~500 products can't be imported.

## Acceptance criteria
- [ ] Identify API rate limit or timeout issue
- [ ] Implement pagination for variants
- [ ] Add error logging
- [ ] Test with 10+ variant products

Related: #24, #28
```

### Example 3: Enhancement
```
Title: Add real-time status notifications to mobile app

Milestone: Customer Portal & Mobile
Type: enhancement
Priority: medium
Effort: m

Description:
## What's needed
Customers should get push notifications when job status changes.

## Why it matters
Reduces support tickets and improves customer confidence.
Easy competitive differentiator vs manual updates.

## Acceptance criteria
- [ ] Push notification on status change
- [ ] In-app notification center
- [ ] User preferences for notification types
- [ ] iOS + Android support

Related: #30, #31
```

---

## 📞 Questions?

- **Can't decide on milestone?** Pick the one with most direct impact.
- **Multiple priorities?** Use `priority:critical` only for true blockers.
- **Effort estimation uncertain?** Use `effort:l` and refine during planning.
- **Need to update later?** Yes! Edit anytime before work starts.

---

**Last Updated:** November 21, 2025  
**Status:** Active - Use this every day
