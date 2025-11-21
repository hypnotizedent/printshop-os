# PrintShop OS - Complete Setup Instructions

**15-20 minute step-by-step guide to configure GitHub Issues, Milestones, and Project Board.**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Step 1: Verify GitHub CLI](#step-1-verify-github-cli)
4. [Step 2: Run Setup Scripts](#step-2-run-setup-scripts)
5. [Step 3: Create GitHub Projects Board](#step-3-create-github-projects-board)
6. [Step 4: Configure Board Automation](#step-4-configure-board-automation)
7. [Step 5: Team Onboarding](#step-5-team-onboarding)
8. [Verification Checklist](#verification-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- Access to `hypnotizedent/printshop-os` repository on GitHub
- GitHub CLI (`gh`) installed: https://cli.github.com
- Terminal/command line access
- Local checkout of the repository

### Recommended

- 15-20 minutes of uninterrupted time
- Calm internet connection
- Optional: Have team members ready after setup to test board

---

## Overview

This setup accomplishes:

1. ✅ Creates 6 sector-based milestones
2. ✅ Assigns existing 13 issues to sectors
3. ✅ Applies correct labels to issues
4. ✅ Sets up GitHub Projects board (manual via web)
5. ✅ Configures board automation rules
6. ✅ Prepares team for using the system

**Total time**: 15-20 minutes

---

## Step 1: Verify GitHub CLI

### 1.1 Check Installation

Open terminal and run:

```bash
gh --version
```

**Expected output**:
```
gh version 2.XX.X (20XX-XX-XX)
https://github.com/cli/cli/releases/tag/v2.XX.X
```

**If not installed**:
- Download from: https://cli.github.com
- Follow installation instructions for your OS (macOS, Windows, Linux)
- Come back here when installed

### 1.2 Check Authentication

Run:

```bash
gh auth status
```

**Expected output**:
```
github.com
  ✓ Logged in to github.com as hypnotizedent
  ✓ Git operations: https protocol
  ✓ Token: ghs_XXXXXXXXXXXXXXXX
  ✓ Token scopes: gist, public_repo, repo, workflow
```

**If not authenticated**:
```bash
gh auth login
```

Follow prompts:
- Select `github.com`
- Select `HTTPS` for protocol
- Select `Y` for authentication via login credentials
- Select browser-based login
- Complete login in browser
- Return to terminal

---

## Step 2: Run Setup Scripts

### 2.1 Navigate to Repository

```bash
cd /Users/ronnyworks/Projects/printshop-os
```

### 2.2 Make Scripts Executable

```bash
chmod +x .github/scripts/setup-milestones.sh
chmod +x .github/scripts/setup-issue-assignments.sh
chmod +x .github/scripts/setup-project-board.sh
```

Verify:

```bash
ls -la .github/scripts/
```

**Expected output** (scripts should have `x` permission):
```
-rwxr-xr-x  setup-milestones.sh
-rwxr-xr-x  setup-issue-assignments.sh
-rwxr-xr-x  setup-project-board.sh
-rw-r--r--  README.md
```

### 2.3 Run Script 1: Create Milestones

```bash
./.github/scripts/setup-milestones.sh
```

**Expected output**:
```
========================================
PrintShop OS - Sector Milestone Setup
========================================

Creating milestones...

  Creating milestone: Sales & Quoting... ✓
  Creating milestone: Production & Operations... ✓
  Creating milestone: CRM & Client Management... ✓
  Creating milestone: Finance & Invoicing... ✓
  Creating milestone: Automation & Integration... ✓
  Creating milestone: Customer Portal & Mobile... ✓

========================================
✓ Milestone setup complete!
========================================

Next steps:
  1. Run: ./setup-issue-assignments.sh
  2. Run: ./setup-project-board.sh
  3. View on GitHub: https://github.com/hypnotizedent/printshop-os/milestones
```

**If errors occur**: See [Troubleshooting](#troubleshooting)

### 2.4 Verify Milestones on GitHub

Visit: https://github.com/hypnotizedent/printshop-os/milestones

You should see 6 milestones:
- ✅ Sales & Quoting
- ✅ Production & Operations
- ✅ CRM & Client Management
- ✅ Finance & Invoicing
- ✅ Automation & Integration
- ✅ Customer Portal & Mobile

### 2.5 Run Script 2: Assign Issues

```bash
./.github/scripts/setup-issue-assignments.sh
```

**Expected output**:
```
========================================
PrintShop OS - Issue Assignment Setup
========================================

Assigning issues to milestones and labels...

  Issue #1: milestone ✓
  Issue #2: milestone ✓
  Issue #3: milestone ✓
  Issue #4: milestone ✓
  Issue #5: milestone ✓
  Issue #6: milestone ✓
  Issue #7: milestone ✓
  Issue #8: milestone ✓
  Issue #9: milestone ✓
  Issue #10: milestone ✓
  Issue #11: milestone ✓
  Issue #12: milestone ✓
  Issue #13: milestone ✓

========================================
✓ Issue assignments complete!
========================================

Next steps:
  1. Run: ./setup-project-board.sh
  2. View on GitHub: https://github.com/hypnotizedent/printshop-os/issues
```

### 2.6 Verify Issues on GitHub

Visit: https://github.com/hypnotizedent/printshop-os/issues

Each issue should show:
- ✅ Assigned milestone (sector)
- ✅ Labels (sector, type, priority where applicable)
- ✅ Status backlog (initial)

### 2.7 View Board Setup Instructions

```bash
./.github/scripts/setup-project-board.sh
```

This script displays instructions for the next manual step.

---

## Step 3: Create GitHub Projects Board

### 3.1 Go to Projects

Visit: https://github.com/hypnotizedent/printshop-os/projects

### 3.2 Create New Project

Click blue **"New project"** button

### 3.3 Configure Project

**Project name**:
```
PrintShop OS Development
```

**Template**: Select **"Table"** (for comprehensive issue view)

Click **"Create project"**

### 3.4 Add Issues to Board

The board will automatically populate with issues. If not, add them:
- Click **"Add issues"**
- Select issues #1-13
- Click **"Add"**

### 3.5 Configure Custom Fields

On the board, set up these columns for comprehensive tracking:

**Field 1: Status** (single-select)
- Backlog
- Planned
- Ready
- In Progress
- Review
- Done

**Field 2: Priority** (single-select)
- Critical
- High
- Medium
- Low

**Field 3: Sector** (single-select)
- Sales
- Production
- CRM
- Finance
- Automation
- Portal

**Field 4: Effort** (single-select)
- XS
- Small
- Medium
- Large
- XL

### 3.6 View Board Layout

You should see all issues in a table with rows = issues and columns = fields.

---

## Step 4: Configure Board Automation

**Note**: GitHub Projects v2 board automation is limited in the web UI. The primary automation is:
- Labels drive issue status/priority/effort
- Milestones organize by sector
- Manual updates via labels

### Recommended Automation (Manual)

#### When assigning an issue:
1. Set Milestone = Sector (Sales & Quoting, Production & Operations, etc.)
2. Add labels:
   - Sector: `sector:sales`, `sector:production`, etc.
   - Status: `status:backlog`, `status:planned`, `status:ready`, `status:in-progress`, `status:review`, `status:done`
   - Priority: `priority:high`, `priority:medium`, etc.
   - Type: `type:enhancement`, `type:bug`, etc.

#### Board automatically updates based on labels and milestones

### Example Workflow

```
1. Create issue
   ↓
2. Issue appears on board (automatically)
   Status = Backlog (default)
   
3. During triage meeting
   ↓
   Add labels: priority:high, sector:sales
   Change milestone: Sales & Quoting
   
4. Board updates (automatically)
   Status: Backlog
   Priority: High
   Sector: Sales
   
5. Issue fully specified
   ↓
   Add label: status:ready
   Add label: effort:medium
   
6. Board updates (automatically)
   Status: Ready
   Effort: Medium
   
7. Developer starts work
   ↓
   Add label: status:in-progress
   Assign issue to developer
   
8. Board updates (automatically)
   Status: In Progress
   Assigned: @developer-name
```

---

## Step 5: Team Onboarding

### 5.1 Share Quick Start Guide

Send team the **5-minute** guide:
- File: `.github/ISSUE_QUICK_START.md`
- Time: 5 minutes
- Why: Fast overview of how to create/work with issues

### 5.2 Deep Dive (Optional)

For team leads/technical people:
- File: `.github/ISSUE_INTAKE_PROCESS.md`
- Time: 20-30 minutes
- Why: Comprehensive workflow with real examples

### 5.3 Reference Materials

Keep handy:
- `.github/SECTOR_MILESTONE_INDEX.md` - Which sector for what work
- `.github/LABELS.md` - Complete label reference
- `.github/scripts/README.md` - How to run setup again if needed

### 5.4 Hold a Brief Demo (15 min)

1. Show the GitHub Projects board
2. Walk through creating one issue
3. Demonstrate assigning milestone and labels
4. Show how board updates automatically
5. Answer questions

---

## Verification Checklist

After setup, verify everything works:

### ✅ Milestones

- [ ] Visit https://github.com/hypnotizedent/printshop-os/milestones
- [ ] See 6 sector milestones
- [ ] Each milestone lists issues assigned to it
- [ ] Can click each milestone to see related issues

### ✅ Issues

- [ ] Visit https://github.com/hypnotizedent/printshop-os/issues
- [ ] All 13 issues visible (#1-13)
- [ ] Each issue has:
  - [ ] Sector milestone assigned
  - [ ] Sector label (`sector:sales`, etc.)
  - [ ] Type label (`type:enhancement`)
  - [ ] Priority label (where applicable)
- [ ] Can filter by label (click any label)
- [ ] Can filter by milestone

### ✅ GitHub Projects Board

- [ ] Visit https://github.com/hypnotizedent/printshop-os/projects
- [ ] "PrintShop OS Development" project visible
- [ ] Project displays issues in table format
- [ ] Can see custom fields (Status, Priority, Sector, Effort)
- [ ] All 13 issues visible on board
- [ ] Can update issue status/priority by clicking cells

### ✅ Filters Work

- [ ] Filter by sector: Click `sector:sales` label → Shows only Sales issues
- [ ] Filter by priority: Click `priority:high` → Shows only high priority
- [ ] Filter by milestone: Click "Sales & Quoting" → Shows Sales sector issues
- [ ] Combinations work: Filter by sector AND priority

### ✅ Team Access

- [ ] Team members can see issues
- [ ] Team members can see milestones
- [ ] Team members can see projects board
- [ ] Team members can edit issues (if repo permissions allow)

---

## Troubleshooting

### GitHub CLI Issues

#### Error: "gh: command not found"

**Solution**:
1. Install GitHub CLI: https://cli.github.com
2. Restart terminal
3. Try again: `gh --version`

#### Error: "Error: not authenticated"

**Solution**:
1. Run: `gh auth login`
2. Select `github.com`
3. Select `HTTPS`
4. Complete browser login
5. Try script again

#### Error: "Error: not found"

**Solution**:
1. Verify you're in correct directory: `pwd` should show `.../printshop-os`
2. Verify repository is accessible: `gh repo view hypnotizedent/printshop-os`
3. Verify you have permissions: Check GitHub repo settings

### Script Issues

#### Error: "Permission denied: ./setup-milestones.sh"

**Solution**:
```bash
chmod +x .github/scripts/*.sh
```

Then try again.

#### Error: "milestone already exists"

**Solution**:
This is normal - scripts handle existing milestones gracefully. Continue to next script.

#### Error: "Issues don't have labels"

**Solution**:
1. Verify labels exist: https://github.com/hypnotizedent/printshop-os/labels
2. They should auto-create. If not, create them manually
3. Run issue assignment script again

### Board Issues

#### Issues don't appear on board

**Solution**:
1. Refresh the page (Cmd+R or Ctrl+R)
2. Click "Add issues" button
3. Select issues #1-13 manually
4. Click "Add"

#### Can't edit issue fields on board

**Solution**:
1. Check you have edit permissions on repository
2. Try editing from issue page instead of board
3. Verify board is using correct custom fields

#### Board columns don't match documentation

**Solution**:
1. Delete board and recreate: Projects → Delete project
2. Create new project following Step 3 above
3. Configure fields exactly as documented

### Permission Issues

#### Error: "Error: insufficient permissions"

**Solution**:
1. Verify you own or have admin access to repo
2. Check GitHub settings: https://github.com/hypnotizedent/printshop-os/settings
3. Verify GitHub CLI has correct scopes: `gh auth status` should show `repo, workflow`
4. Re-authenticate if needed: `gh auth logout` then `gh auth login`

---

## Next Steps After Setup

### Immediate

1. ✅ All scripts completed
2. ✅ GitHub Projects board created
3. ✅ Team reviewed quick start guide

### Short Term (This Week)

1. Hold team demo of board
2. Assign first few issues to developers
3. Move issues through pipeline (backlog → in progress → done)
4. Verify team comfortable with workflow

### Medium Term (Next Sprint)

1. Evaluate effectiveness of sector organization
2. Adjust labels/milestones if needed
3. Create new sectors if business needs change
4. Document learnings and share with team

---

## Getting Help

**Quick questions?** Check ISSUE_QUICK_START.md

**Detailed workflow?** Check ISSUE_INTAKE_PROCESS.md

**Understanding sectors?** Check SECTOR_MILESTONE_INDEX.md

**Script documentation?** Check .github/scripts/README.md

**GitHub Help**: 
- Docs: https://docs.github.com/en/issues
- CLI: `gh --help` or `gh issue --help`

---

## Success Criteria

After setup, you should see:

✅ All team members comfortable creating issues
✅ Issues consistently assigned to sector milestones
✅ GitHub Projects board used for sprint planning
✅ Clear understanding of priorities and pipelines
✅ Smooth flow from idea → development → completion

---

**Estimated Time**: 15-20 minutes from start to team using board

**Date Completed**: [Your date here]

**Team Ready To Use**: [Mark when complete]

