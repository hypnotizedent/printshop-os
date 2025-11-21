# PrintShop OS Project Organization Guide

## Overview
This guide outlines the organizational structure for managing the PrintShop OS project, including labels, milestones, project boards, and best practices.

## Project Boards

We've created dedicated project boards for each major functional area:

### 1. [Sales & Quoting](https://github.com/users/hypnotizedent/projects/3)
**Focus:** Quote generation, pricing, customer approval workflows, and Stripe integration

**Key Features:**
- Quote template library
- Pricing engine architecture
- Deposit collection and payment processing
- Quote approval workflows
- Bundle/package pricing logic

### 2. [Production & Operations](https://github.com/users/hypnotizedent/projects/4)
**Focus:** Job management, scheduling, time tracking, and production workflows

**Key Features:**
- Press-ready checklists
- SOP library integration
- Time tracking for press operators
- Mobile views for production team
- Supervisor dashboards

### 3. [CRM & Client Management](https://github.com/users/hypnotizedent/projects/5)
**Focus:** Customer profiles, history tracking, and relationship management

**Key Features:**
- Client job history and reordering
- Client tagging system (nonprofit, VIP, etc.)
- Quote approval tracking
- Client login portal

### 4. [Finance & Invoicing](https://github.com/users/hypnotizedent/projects/6)
**Focus:** Billing, payments, and financial reporting

**Key Features:**
- Retainer/card storage
- Auto-recharge capability
- Job reordering via duplication
- Financial tracking and reporting

### 5. [AI & Intelligence Layer](https://github.com/users/hypnotizedent/projects/7)
**Focus:** AI assistants, automation, and intelligent features

**Key Features:**
- Per-task assistants (Marketing, Financial, Customer Service)
- Local AI stack (Ollama/Mistral/LLaMA)
- Embeddings and vector database for RAG
- Prompt management system

## Labels System

### By Type
- `type:feature` - New functionality or capability
- `type:bug` - Something isn't working correctly
- `type:enhancement` - Improvement to existing feature
- `type:chore` - Maintenance, refactoring, or technical debt
- `type:test` - Testing-related work

### By Priority
- `priority:critical` - System down, data loss, blocking issue
- `priority:high` - Major functionality broken or important feature
- `priority:medium` - Standard feature work or moderate issue
- `priority:low` - Nice-to-have or minor improvement

### By Effort
- `effort:s` - Small (few hours, minor changes)
- `effort:m` - Medium (1-3 days, moderate changes)
- `effort:l` - Large (1-2 weeks, significant changes)
- `effort:xl` - Extra Large (multiple weeks, major architectural changes)

### By Sector
- `sector:sales` - Sales and quoting functionality
- `sector:crm` - Customer relationship management
- `sector:production` - Production and operations
- `sector:automation` - Workflow automation and integrations
- `sector:finance` - Financial management and invoicing
- `sector:portal` - Customer-facing portal
- `sector:marketing` - Marketing website and content
- `sector:supplier` - Supplier integrations and product data
- `sector:ai` - AI assistants and intelligence features

### General Labels
- `documentation` - Documentation updates or improvements
- `good first issue` - Good for newcomers or first-time contributors
- `help wanted` - Extra attention or expertise needed
- `question` - Questions about usage or implementation
- `duplicate` - Duplicate of another issue
- `invalid` - Invalid or incorrect issue
- `wontfix` - Will not be addressed

## Milestones

### 1. Sales & Quoting
**Description:** Quote generation pipeline with Stripe integration
- 12 open issues
- Focus on customer-facing quote and payment workflows

### 2. Production & Operations
**Description:** Manage print jobs, scheduling, and queue management
- 7 open issues
- Focus on internal production workflows

### 3. CRM & Client Management
**Description:** Customer profiles, history, and relationship tracking
- 6 open issues
- Focus on customer data and relationship management

### 4. Finance & Invoicing
**Description:** Billing, payments, and financial reporting
- 1-2 open issues
- Focus on financial management features

### 5. Automation & Integration
**Description:** External service connections and workflow automation
- 4 open issues
- Focus on integrations with external systems

### 6. Customer Portal & Mobile
**Description:** Self-service portal and mobile app for clients
- 2 open issues
- Focus on customer-facing portal features

### 7. Marketing & Content Site
**Description:** Website and marketing materials
- 11 open issues
- Focus on mintprints.com website

### 8. Supplier & Product Data
**Description:** Supplier APIs and product catalog
- 15 open issues
- Focus on AS Colour, SanMar, S&S Activewear integrations

### 9. AI & Intelligence Layer
**Description:** AI assistants and intelligence
- 14 open issues
- Focus on AI-powered features

## Issue Templates

We maintain the following issue templates:

### 1. Bug Report
Use for reporting bugs or unexpected behavior. Includes:
- Bug description
- Environment details
- Steps to reproduce
- Impact assessment
- Classification fields (priority, effort, sector)

### 2. Feature Request
Use for suggesting new features or enhancements. Includes:
- Feature description
- Use case and business value
- Proposed solution
- Implementation complexity
- Classification fields

### 3. Phase Milestone
Use for tracking completion of major phases. Includes:
- Phase overview
- Acceptance criteria
- Supported workflows
- Subtasks breakdown

### 4. Workflow Implementation
Use for implementing real-world Mint Prints workflows. Includes:
- Workflow overview
- Technical components
- End-to-end acceptance criteria
- Implementation tasks

### 5. Integration Checkpoint
Use for tracking integration testing between phases. Includes:
- Checkpoint type
- Verification checklist
- Issues found
- Sign-off criteria

### 6. Question
Use for asking questions about setup, usage, or architecture. Includes:
- Question category
- Context and background
- Troubleshooting steps tried

## Best Practices

### Issue Creation
1. **Use Templates:** Always use the appropriate issue template
2. **Add Labels:** Add type, priority, effort, and sector labels
3. **Link to Milestone:** Associate issues with appropriate milestones
4. **Add to Project:** Add issues to the relevant project board
5. **Link Related Issues:** Reference related issues, dependencies, and blockers

### Issue Management
1. **Regular Grooming:** Review and update issues weekly
2. **Clear Titles:** Use descriptive titles with context
3. **Detailed Descriptions:** Provide enough detail for anyone to understand
4. **Update Status:** Keep issue status current
5. **Close When Done:** Close issues promptly when completed

### Project Board Usage
1. **Use Status Field:** Move items between Todo, In Progress, and Done
2. **Assign Owners:** Assign team members to issues
3. **Track Progress:** Monitor milestone progress regularly
4. **Update Custom Fields:** Keep custom fields like effort and priority current

### Label Guidelines
1. **Always Include Type:** Every issue should have a type label
2. **Add Priority:** Assign priority to help with triage
3. **Estimate Effort:** Add effort label to help with planning
4. **Tag Sector:** Use sector labels for filtering and organization
5. **Keep Current:** Update labels as issues evolve

## Workflow

### New Issue
1. Create issue using appropriate template
2. Fill out all required fields
3. Add classification labels (type, priority, effort, sector)
4. Link to appropriate milestone
5. Add to relevant project board
6. Assign owner if known
7. Link related issues

### In Progress
1. Move to "In Progress" status on project board
2. Update issue with progress notes
3. Link pull requests when created
4. Request reviews as needed

### Completed
1. Ensure acceptance criteria met
2. Update documentation if needed
3. Move to "Done" status on project board
4. Close the issue
5. Update related issues if needed

## Automation

### GitHub Actions
We use GitHub Actions for:
- Auto-approving pull requests (see `.github/workflows/auto-approve.yml`)
- CI/CD pipelines (future)
- Automated testing (future)

### Project Workflows
Configure these manually in the GitHub web interface:
- Auto-add sub-issues to project
- Auto-close issue when linked PR merged
- Move to "In Progress" when assigned
- Move to "Done" when closed
- Auto-archive stale items

See [Workflow Setup Guide](./workflow-setup.md) for detailed instructions.

## Resources

### Project Links
- [Repository](https://github.com/hypnotizedent/printshop-os)
- [Issues](https://github.com/hypnotizedent/printshop-os/issues)
- [Milestones](https://github.com/hypnotizedent/printshop-os/milestones)
- [Labels](https://github.com/hypnotizedent/printshop-os/labels)

### Documentation
- [README](../../README.md)
- [ROADMAP](../../ROADMAP.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [Architecture Overview](../architecture/system-overview.md)

### External Tools
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Quick Reference

### Common Commands

```bash
# List all issues
gh issue list

# Create new issue
gh issue create --title "Title" --body "Description" --label "type:feature,priority:medium"

# Add issue to project
gh project item-add 3 --owner hypnotizedent --url "https://github.com/hypnotizedent/printshop-os/issues/123"

# Edit issue labels
gh issue edit 123 --add-label "sector:sales,priority:high"

# Link issue to milestone
gh issue edit 123 --milestone "Sales & Quoting"

# List project boards
gh project list --owner hypnotizedent

# View project
gh project view 3 --owner hypnotizedent
```

### Label Combinations

**Critical Bug:**
```
type:bug, priority:critical, effort:m, sector:production
```

**New Feature:**
```
type:feature, priority:high, effort:l, sector:sales
```

**Technical Debt:**
```
type:chore, priority:medium, effort:s, documentation
```

**Enhancement:**
```
type:enhancement, priority:medium, effort:m, sector:crm
```

## Troubleshooting

### Issue Not Showing in Project Board
- Verify issue is added to project
- Check project filters
- Ensure issue has correct labels

### Milestone Not Updating
- Refresh the page
- Check that milestone is properly linked
- Verify permissions

### Labels Not Applying
- Ensure labels exist in repository
- Check label names for typos
- Verify you have write access

## Support

For questions or issues with project organization:
1. Check this documentation
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Create an issue with the `question` label
4. Contact project maintainers
