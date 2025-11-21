# GitHub Labels Configuration
# 
# This file documents the label scheme for PrintShop OS issues.
# Labels help organize, filter, and track work across the project.
#
# Usage: Create these labels in GitHub → Settings → Labels
# Or use github-label-sync to automate: https://github.com/Financial-Times/github-label-sync
#

## STATUS LABELS
## Track issue state and progression through workflow

- name: status:planning
  color: "d4c5f9"
  description: "Issue needs research, design, or planning before implementation"

- name: status:ready
  color: "7057ff"
  description: "Issue is well-defined and ready for implementation"

- name: status:in-progress
  color: "fbca04"
  description: "Issue is currently being worked on"

- name: status:review
  color: "ffd3b5"
  description: "Implementation complete, awaiting code/design review"

- name: status:blocked
  color: "ff6b6b"
  description: "Issue is blocked by another issue or external dependency"

- name: status:done
  color: "0366d6"
  description: "Issue completed and merged"

---

## PRIORITY LABELS
## Indicate urgency and importance for MVP

- name: priority:critical
  color: "d73a49"
  description: "Blocks MVP completion, must be resolved immediately"

- name: priority:high
  color: "ff6b6b"
  description: "Important for MVP, should be completed soon"

- name: priority:medium
  color: "ffa726"
  description: "Nice to have for MVP, can be deferred if needed"

- name: priority:low
  color: "85ce36"
  description: "Post-MVP feature or nice-to-have enhancement"

- name: priority:backlog
  color: "cccccc"
  description: "Interesting but not currently prioritized"

---

## COMPONENT LABELS
## Organize issues by system architecture

- name: component:strapi
  color: "2f6b2f"
  description: "Phase 1: Strapi backend API and database"

- name: component:appsmith
  color: "1f6f6f"
  description: "Phase 2: Appsmith production dashboard"

- name: component:botpress
  color: "6f1f6f"
  description: "Phase 3: Botpress customer intake bot"

- name: component:postgres
  color: "336699"
  description: "PostgreSQL database layer"

- name: component:docker
  color: "0066cc"
  description: "Docker containerization and orchestration"

- name: component:docs
  color: "cccccc"
  description: "Documentation and guides"

- name: component:infra
  color: "990000"
  description: "Infrastructure, deployment, DevOps"

---

## TYPE LABELS
## Categorize work by type

- name: type:feature
  color: "a2eeef"
  description: "New functionality or capability"

- name: type:bug
  color: "d73a49"
  description: "Something isn't working as expected"

- name: type:enhancement
  color: "9933ee"
  description: "Improvement to existing functionality"

- name: type:docs
  color: "0075ca"
  description: "Documentation, guides, or comments"

- name: type:test
  color: "ffd700"
  description: "Testing, QA, or test coverage"

- name: type:chore
  color: "cccccc"
  description: "Maintenance, dependency updates, cleanup"

- name: type:refactor
  color: "ee99ff"
  description: "Code restructuring without functional change"

---

## WORKFLOW LABELS
## Connect issues to real-world Mint Prints workflows

- name: workflow:customer-intake
  color: "ffa500"
  description: "Workflow 1: 24/7 Automated customer order intake"

- name: workflow:job-management
  color: "ff6b6b"
  description: "Workflow 2: Production job management and tracking"

- name: workflow:time-tracking
  color: "228b22"
  description: "Workflow 3: Employee time tracking and payroll"

---

## PHASE LABELS
## Track which phase(s) an issue belongs to

- name: phase:1-strapi
  color: "2f6b2f"
  description: "Issue is part of Phase 1: Strapi backend"

- name: phase:2-appsmith
  color: "1f6f6f"
  description: "Issue is part of Phase 2: Appsmith dashboard"

- name: phase:3-botpress
  color: "6f1f6f"
  description: "Issue is part of Phase 3: Botpress integration"

- name: phase:integration
  color: "ff9800"
  description: "Issue is part of integration and testing phase"

- name: phase:post-mvp
  color: "cccccc"
  description: "Issue is planned for post-MVP development"

---

## SIZE LABELS
## Help with planning and sprint allocation

- name: size:xs
  color: "cccccc"
  description: "Trivial, < 30 minutes"

- name: size:s
  color: "ccffcc"
  description: "Small, 30 min - 2 hours"

- name: size:m
  color: "ffff99"
  description: "Medium, 2-4 hours"

- name: size:l
  color: "ffaa00"
  description: "Large, 4-8 hours"

- name: size:xl
  color: "ff6b6b"
  description: "Extra large, > 8 hours (break into smaller issues)"

---

## SPECIAL LABELS
## Meta labels for project management

- name: help-wanted
  color: "159818"
  description: "Seeking help or contributions"

- name: good-first-issue
  color: "7057ff"
  description: "Good starting point for new contributors"

- name: question
  color: "d876e3"
  description: "This is a question needing discussion or clarification"

- name: won't-fix
  color: "ffffff"
  description: "Issue not planned to be fixed"

- name: duplicate
  color: "cccccc"
  description: "This is a duplicate of another issue"

- name: invalid
  color: "e6e6e6"
  description: "Issue is invalid or not applicable"

---

## LABEL USAGE GUIDELINES

### Every issue should have:
1. **One Status label** (planning, ready, in-progress, review, done, blocked)
2. **One Priority label** (critical, high, medium, low, backlog)
3. **At least one Type label** (feature, bug, enhancement, docs, test, chore, refactor)

### Most issues will also have:
4. **One or more Component labels** (strapi, appsmith, botpress, postgres, docker, docs, infra)
5. **Relevant Phase labels** (1-strapi, 2-appsmith, 3-botpress, integration, post-mvp)

### Some issues may have:
6. **Workflow labels** if tied to specific Mint Prints workflows
7. **Size labels** for sprint planning
8. **Special labels** as needed (help-wanted, question, duplicate, etc.)

### Example Label Combinations:

**Strapi API Issue**:
- status:ready
- priority:critical
- type:feature
- component:strapi
- phase:1-strapi
- size:l

**Bug Report**:
- status:in-progress
- priority:high
- type:bug
- component:appsmith
- phase:2-appsmith

**Documentation Task**:
- status:planning
- priority:medium
- type:docs
- component:docs
- phase:1-strapi

**Post-MVP Feature**:
- status:backlog
- priority:low
- type:feature
- component:infra
- phase:post-mvp
- workflow:customer-intake

---

## AUTOMATED WORKFLOWS

### Recommended GitHub Actions:

1. **Add status:planning to new issues**
   - Trigger: issue opened without status label
   - Action: add status:planning label

2. **Auto-move status:review → status:done on merge**
   - Trigger: PR merged
   - Action: close related issues, add status:done label

3. **Flag critical priority issues**
   - Trigger: priority:critical label added
   - Action: post to Slack/Teams notification

4. **Remind of stale in-progress**
   - Trigger: status:in-progress for 3+ days
   - Action: post reminder comment

---

## RELATED DOCUMENTATION

- [PLANNING.md](.github/PLANNING.md) — Overall planning stack and strategy
- [IMPLEMENTATION_ROADMAP.md](.github/IMPLEMENTATION_ROADMAP.md) — Detailed phase roadmap
- [Contributing Guidelines](docs/CONTRIBUTING.md) — Code standards and PR process
