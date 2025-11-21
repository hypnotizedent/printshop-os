# GitHub Project Workflows Setup Guide

## Overview
This guide explains how to configure automated workflows for GitHub Projects to streamline your project management process.

## Accessing Workflows
1. Navigate to your project board (e.g., [Production & Operations](https://github.com/users/hypnotizedent/projects/4))
2. Click on the **Workflows** tab in the top-right corner (next to **Insights**)
3. Review the available workflows

## Available Default Workflows

### 1. Auto-add sub-issues to project
**Purpose:** Automatically adds sub-issues to the project when a parent issue has sub-issues.

**How to Enable:**
- Click **Edit** on the workflow
- Ensure it's toggled **On**
- Save changes

### 2. Auto-close issue
**Purpose:** Automatically closes issues when specific conditions are met.

**How to Configure:**
- Click **Edit**
- Set trigger conditions (e.g., when all sub-issues are closed)
- Save changes

### 3. Item added to project
**Purpose:** Performs actions when items are added to the project.

**Recommended Configuration:**
- Set status to `Todo` when items are first added
- Add default labels if needed

### 4. Item closed
**Purpose:** Moves items to `Done` status when the linked issue is closed.

**How to Configure:**
- Click **Edit**
- Set action to move item to `Done` column
- Enable auto-archiving if desired

### 5. Pull request linked to issue
**Purpose:** Updates project status when a PR is linked to an issue.

**Recommended Configuration:**
- Move item to `In Progress` when PR is linked
- Update status field automatically

### 6. Pull request merged
**Purpose:** Updates project status when a PR is merged.

**Recommended Configuration:**
- Move item to `Done` when PR is merged
- Close linked issues automatically

## Custom Workflow Ideas

### Auto-Move Items Based on Assignment
**Trigger:** When an issue is assigned
**Action:** Move to `In Progress` status

### Auto-Archive Stale Items
**Trigger:** Item hasn't been updated for 30 days
**Action:** Archive the item

### Code Review Workflow
**Trigger:** Code changes requested in PR
**Action:** Move to `Needs Changes` status

### Milestone Tracking
**Trigger:** Issue added to milestone
**Action:** Add to project and update milestone field

## Best Practices

1. **Start with Default Workflows:** Enable the built-in workflows first before creating custom ones
2. **Test Thoroughly:** Create test issues to verify workflows behave as expected
3. **Document Custom Workflows:** Keep track of any custom workflows you create
4. **Review Regularly:** Periodically review workflow effectiveness and adjust as needed
5. **Avoid Over-Automation:** Only automate workflows that genuinely save time

## Troubleshooting

### Workflow Not Triggering
- Verify the workflow is enabled (toggle is **On**)
- Check that trigger conditions match your use case
- Ensure you have necessary permissions

### Items Not Moving Between Columns
- Verify Status field is properly configured
- Check that column names match exactly
- Review workflow action settings

### Conflicts Between Workflows
- Review all enabled workflows
- Disable conflicting workflows
- Create clear workflow hierarchy

## Project Boards

- [Sales & Quoting](https://github.com/users/hypnotizedent/projects/3)
- [Production & Operations](https://github.com/users/hypnotizedent/projects/4)
- [CRM & Client Management](https://github.com/users/hypnotizedent/projects/5)
- [Finance & Invoicing](https://github.com/users/hypnotizedent/projects/6)
- [AI & Intelligence Layer](https://github.com/users/hypnotizedent/projects/7)

## Additional Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Actions for Projects](https://docs.github.com/en/actions/managing-issues-and-pull-requests)
