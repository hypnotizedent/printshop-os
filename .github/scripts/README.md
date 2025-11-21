# PrintShop OS Setup Scripts

Automated scripts to configure GitHub Issues, Milestones, and Project Board for PrintShop OS development workflow.

## Scripts Overview

### 1. setup-milestones.sh
**Purpose**: Creates 6 business sector milestones on GitHub

**What it does**:
- Creates "Sales & Quoting" milestone
- Creates "Production & Operations" milestone
- Creates "CRM & Client Management" milestone
- Creates "Finance & Invoicing" milestone
- Creates "Automation & Integration" milestone
- Creates "Customer Portal & Mobile" milestone

**Requirements**:
- GitHub CLI (`gh`) installed: https://cli.github.com
- Authenticated with GitHub: `gh auth login`
- Access to hypnotizedent/printshop-os repository

**Usage**:
```bash
chmod +x setup-milestones.sh
./setup-milestones.sh
```

**Output**: Creates 6 milestones visible at https://github.com/hypnotizedent/printshop-os/milestones

---

### 2. setup-issue-assignments.sh
**Purpose**: Assigns existing issues to sector milestones and applies labels

**What it does**:
- Assigns issues #1-13 to appropriate sector milestones
- Adds `enhancement` label to all issues
- Adds sector labels: `sector:sales`, `sector:production`, `sector:crm`, `sector:finance`, `sector:automation`, `sector:portal`
- Adds priority labels where applicable: `priority:high`, `priority:medium`

**Requirements**:
- GitHub CLI (`gh`) installed
- Authenticated with GitHub
- Milestones already created (run `setup-milestones.sh` first)
- Issues #1-13 exist in repository

**Usage**:
```bash
chmod +x setup-issue-assignments.sh
./setup-issue-assignments.sh
```

**Output**: Issues configured with milestones and labels visible at https://github.com/hypnotizedent/printshop-os/issues

---

### 3. setup-project-board.sh
**Purpose**: Displays instructions for manually setting up GitHub Projects v2 board

**What it does**:
- Shows step-by-step instructions for creating GitHub Projects board
- Explains how to configure custom fields and automation rules
- References relevant documentation files
- No direct API calls (board setup currently requires web UI)

**Requirements**:
- Access to GitHub Projects on repository
- Web browser for manual setup

**Usage**:
```bash
chmod +x setup-project-board.sh
./setup-project-board.sh
```

**Output**: Displays setup instructions for manual GitHub Projects board creation

---

## Complete Setup Workflow

Execute these scripts in order to fully set up the GitHub workflow:

```bash
# 1. Make scripts executable
chmod +x setup-milestones.sh setup-issue-assignments.sh setup-project-board.sh

# 2. Create sector milestones
./setup-milestones.sh

# 3. Assign issues to milestones and add labels
./setup-issue-assignments.sh

# 4. View instructions for board setup
./setup-project-board.sh

# 5. Manually create and configure GitHub Projects board following the instructions
```

**Estimated time**: 10-15 minutes

---

## Troubleshooting

### "gh: command not found"
Install GitHub CLI from https://cli.github.com

### "Error: not authenticated"
Run: `gh auth login` and follow the prompts

### "Error: milestone already exists"
This is normal - the script handles existing milestones gracefully

### "Issues not being assigned"
- Verify issues #1-13 exist in the repository
- Check GitHub authentication with: `gh auth status`
- Review script output for specific error messages

### "Can't create labels"
- Verify the labels exist in the repository
- Existing labels from Phase 1 setup are automatically recognized
- New labels are auto-created by GitHub when referenced

---

## Manual Verification

After running all scripts, verify setup on GitHub:

1. **Milestones**: https://github.com/hypnotizedent/printshop-os/milestones
   - Should see 6 sector milestones
   - Each should have issues assigned

2. **Issues**: https://github.com/hypnotizedent/printshop-os/issues
   - Should see issues #1-13 with sector labels
   - Should see priority labels on key issues
   - Each issue should have a milestone

3. **Projects**: https://github.com/hypnotizedent/printshop-os/projects
   - Project board should be created (manual step)
   - Should display issues in table format
   - Should have sector/priority/status columns

---

## References

- **Full Setup Guide**: ../.github/SETUP_INSTRUCTIONS.md
- **Issue Quick Reference**: ../.github/ISSUE_QUICK_START.md
- **Issue Intake Workflow**: ../.github/ISSUE_INTAKE_PROCESS.md
- **Milestone Index**: ../.github/SECTOR_MILESTONE_INDEX.md
- **Setup Summary**: ../.github/SECTOR_SETUP_SUMMARY.md

---

## Support

For questions or issues:
1. Check relevant documentation files
2. Review GitHub CLI help: `gh --help`
3. Verify repository access and authentication
4. Check repository permissions at https://github.com/hypnotizedent/printshop-os/settings/access

