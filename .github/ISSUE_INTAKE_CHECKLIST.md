# ⚡ Issue Intake Quick Checklist

**Copy this and use before submitting each issue:**

```
ISSUE INTAKE CHECKLIST
═══════════════════════════════════════════════════════════

Title: _________________________________________________
(Specific, actionable, 50-100 chars)

✓ Description includes:
  □ What's needed (1-2 sentences)
  □ Why it matters (business impact)
  □ Acceptance criteria (if feature)
  □ Related issues (#numbers)

Milestone (pick ONE):
  □ Sales & Quoting
  □ Production & Operations
  □ CRM & Client Management
  □ Finance & Invoicing
  □ Automation & Integration
  □ Customer Portal & Mobile
  □ Marketing & Content Site
  □ Supplier & Product Data
  □ AI & Intelligence Layer

Labels (pick at least 3):
  Type:     □ feature  □ bug  □ enhancement  □ chore  □ documentation
  Priority: □ critical □ high □ medium       □ low
  Effort:   □ s        □ m    □ l            □ xl
  Sector:   □ (auto-filled based on milestone)

Assignee: □ Leave blank for now

═══════════════════════════════════════════════════════════
Submit → Issue appears in GitHub + Projects board
═══════════════════════════════════════════════════════════
```

## 🎯 Decision Trees

### How to choose a Milestone?

```
Start here: "What does this affect most?"
│
├─ Customer quotes/pricing?              → Sales & Quoting
├─ Production floor operations?          → Production & Operations
├─ Customer relationships/history?       → CRM & Client Management
├─ Billing/payments/reports?            → Finance & Invoicing
├─ External integrations/workflows?     → Automation & Integration
├─ Customer-facing portal/mobile?       → Customer Portal & Mobile
├─ Website/marketing/content?           → Marketing & Content Site
├─ Supplier APIs/product catalog?       → Supplier & Product Data
└─ AI/analytics/intelligence?           → AI & Intelligence Layer
```

### How to choose Effort?

```
Ask: "How many developer days?"
│
├─ 1-3 days of work        → effort:s (small)
├─ 3-5 days of work        → effort:m (medium)
├─ 1-2 weeks of work       → effort:l (large)
└─ 2+ weeks of work        → effort:xl (extra large)

Unsure? Default to effort:m and adjust later.
```

### How to choose Priority?

```
Ask: "What happens if this waits?"
│
├─ Business stops/revenue lost    → priority:critical (do this week)
├─ Important but not urgent       → priority:high (do this sprint)
├─ Nice to have feature           → priority:medium (next sprint)
└─ Tech debt / nice-to-know      → priority:low (backlog)
```

---

## 📋 Copy-Paste Templates

### Template: Feature Request
```markdown
## What's needed
[1-2 sentence description of feature]

## Why it matters
[Business impact: revenue, efficiency, customer satisfaction]

## Acceptance criteria
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Related issues
[Link to #issue-numbers if applicable]
```

### Template: Bug Report
```markdown
## What's happening
[Describe the bug clearly]

## What should happen
[Expected behavior]

## Steps to reproduce
1. Step 1
2. Step 2
3. Step 3

## Why it matters
[Business impact]

## Related issues
[Link to #issue-numbers if applicable]
```

### Template: Enhancement
```markdown
## What we have
[Current state]

## What we need
[Improved state]

## Why it matters
[Business impact]

## Acceptance criteria
- [ ] Improvement 1
- [ ] Improvement 2

## Related issues
[Link to #issue-numbers if applicable]
```

---

## 🔗 Useful Links

| What | Link |
|------|------|
| **New Issue** | https://github.com/hypnotizedent/printshop-os/issues/new |
| **All Issues** | https://github.com/hypnotizedent/printshop-os/issues |
| **Milestones** | https://github.com/hypnotizedent/printshop-os/milestones |
| **Projects Board** | https://github.com/hypnotizedent/printshop-os/projects |
| **Labels** | https://github.com/hypnotizedent/printshop-os/labels |
| **Edit Guide** | .github/DAILY_ISSUE_INTAKE.md |

---

**Time to create issue: ~2 minutes**  
**Frequency: As you encounter things throughout the day**  
**Result: Organized, prioritized, ready for sprint planning**
