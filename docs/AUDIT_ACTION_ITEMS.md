# PrintShop OS - Living Audit Dashboard

**Last Updated:** November 30, 2025  
**Parent Issue:** GitHub Issue for tracking audit action items  
**Status:** 🟢 Active

---

## Overview

This document serves as the **Living Audit Dashboard** for PrintShop OS, breaking down the [Repository Audit Report](../REPOSITORY_AUDIT.md) into actionable, trackable sub-issues. Each section contains detailed action items that can be converted into GitHub Issues.

---

## 📋 Issue Categories

| Category | Priority | Items | Status |
|----------|----------|-------|--------|
| [Branch Review](#1-branch-review) | High | 8 branches | ⏳ Pending |
| [Test Coverage](#2-test-coverage-inventory) | Medium | 8 services | ✅ Audited |
| [Documentation](#3-service-documentation) | Medium | 4 services | ⏳ Pending |
| [Doc Consolidation](#4-documentation-consolidation) | Low | 3 issues | ⏳ Pending |
| [Archive Cleanup](#5-archive-cleanup) | Low | 3 directories | ⏳ Pending |
| [Audit Automation](#6-audit-automation) | Medium | 2 scripts | ⏳ Pending |
| [Service Inventory](#7-service-inventory-gaps) | Medium | 4 services | ✅ Audited |
| [Undiscoverable Files](#8-undiscoverable-files) | Low | ~130 files | ✅ Audited |

---

## 1. Branch Review

**Parent:** Repository Audit → Branch Analysis  
**Priority:** 🔴 High  
**Effort:** ~2-4 hours

The following 8 branches have unique commits that need to be reviewed, summarized, and decided upon (merge or archive).

### Branch Sub-Issues

| # | Branch | Commits Ahead | Summary | Action | Sub-Issue |
|---|--------|--------------|---------|--------|-----------|
| 1.1 | `copilot/add-feature-classification` | 5 | Feature classification system | Review & decide | Create issue |
| 1.2 | `copilot/add-live-printavo-sync-service` | 5 | Live Printavo sync service | Review & decide | Create issue |
| 1.3 | `copilot/add-sendgrid-quote-delivery` | 5 | SendGrid quote email delivery | Review & decide | Create issue |
| 1.4 | `copilot/add-supplier-api-connectors` | 4 | Supplier API connectors | Review & decide | Create issue |
| 1.5 | `copilot/ai-quote-optimizer-development` | 6 | AI quote optimizer development | Review & decide | Create issue |
| 1.6 | `copilot/build-analytics-reporting-api` | 5 | Analytics reporting API | Review & decide | Create issue |
| 1.7 | `copilot/create-strapi-collections-migration` | 5 | Strapi collections migration | Review & decide | Create issue |
| 1.8 | `feature/customer-service-ai` | 1 | Customer service AI feature | Review & decide | Create issue |

### Template for Branch Review Issues

```markdown
### Branch: `{branch-name}`

**Commits Ahead:** {N}
**Last Activity:** {date}

#### Summary of Changes
- [ ] List key files changed
- [ ] Describe feature/fix implemented
- [ ] Note any dependencies added

#### Decision
- [ ] **Merge to main** - Feature is complete and tested
- [ ] **Partial merge** - Cherry-pick specific commits
- [ ] **Archive** - Close branch, document learnings
- [ ] **Continue development** - Branch contains WIP

#### Notes
{Add context about the branch}
```

---

## 2. Test Coverage Inventory

**Parent:** Repository Audit → Code Quality  
**Priority:** 🟡 Medium  
**Effort:** ~4-6 hours  
**Status:** ✅ Audited (November 30, 2025)

Detailed test coverage inventory for each service with identified gaps.

### Current Test File Count

| Service | Test Files | Test Count (est.) | Coverage Tool | Status |
|---------|-----------|-------------------|---------------|--------|
| `services/api` | 13 | ~100+ | Jest | ✅ Well covered |
| `services/job-estimator` | 7 | ~50+ | Jest | ✅ Well covered |
| `services/production-dashboard` | 4 | ~75+ | Jest | ✅ Covered |
| `services/supplier-sync` | 2 | ~10+ | Jest | ⚠️ Minimal coverage |
| `services/customer-service-ai` | 1 | ~5+ | Jest | ⚠️ Minimal coverage |
| `services/vector-store` | 1 | ~5+ | Jest | ⚠️ Minimal coverage |
| `frontend` | 5 | ~30+ | Vitest | ✅ Component tests |
| `printshop-strapi` | 4 | ~30+ | Jest | ✅ Covered |

### Test Coverage Sub-Issues

| # | Issue Title | Description | Priority |
|---|-------------|-------------|----------|
| 2.1 | [API] Create test coverage inventory | Document all tests in services/api, identify gaps | Medium |
| 2.2 | [Job Estimator] Create test coverage inventory | Document all tests, ensure pricing logic covered | Medium |
| 2.3 | [Production Dashboard] Create test coverage inventory | Document WebSocket and time clock tests | Medium |
| 2.4 | [Supplier Sync] Increase test coverage | Only 2 test files - needs comprehensive tests | High |
| 2.5 | [Customer Service AI] Increase test coverage | Only 1 test file - needs RAG/chat tests | High |
| 2.6 | [Vector Store] Increase test coverage | Only 1 test file - needs embedding tests | High |
| 2.7 | [Frontend] Add E2E tests | No E2E tests - add critical flow tests | Medium |
| 2.8 | [All Services] Configure coverage reporting | Enable Jest/Vitest coverage across all services | Low |

### Template for Test Coverage Issues

```markdown
### Service: `{service-name}`

#### Current State
- Test files: {count}
- Test framework: {Jest/Vitest}
- Coverage tool configured: {Yes/No}

#### Test Inventory
| Test File | Type | # Tests | Key Coverage |
|-----------|------|---------|--------------|
| {file.test.ts} | Unit/Integration | N | {description} |

#### Coverage Gaps
- [ ] {Area not covered}
- [ ] {Missing edge cases}

#### Recommendations
- [ ] Add tests for {area}
- [ ] Configure coverage reporting
- [ ] Set coverage threshold (e.g., 80%)
```

---

## 3. Service Documentation

**Parent:** Repository Audit → Documentation  
**Priority:** 🟡 Medium  
**Effort:** ~3-4 hours

Review and verify README and API documentation for each service.

### Current Documentation Status

| Service | README | API Docs | OpenAPI Spec | Status |
|---------|--------|----------|--------------|--------|
| `services/api` | ✅ Exists | Partial | ❌ None | ⏳ Needs update |
| `services/job-estimator` | ✅ Exists | ✅ Complete | ❌ None | ✅ Good |
| `services/production-dashboard` | ✅ Exists | ✅ Complete | ✅ openapi.yaml | ✅ Good |
| `services/supplier-sync` | ✅ Exists | Partial | ❌ None | ⏳ Needs update |

### Service Documentation Sub-Issues

| # | Issue Title | Description | Priority |
|---|-------------|-------------|----------|
| 3.1 | [API Service] Update README and API documentation | Document all endpoints, add examples | Medium |
| 3.2 | [Job Estimator] Verify README accuracy | Ensure docs match current implementation | Low |
| 3.3 | [Production Dashboard] Verify README accuracy | Confirm OpenAPI spec is current | Low |
| 3.4 | [Supplier Sync] Update README and API documentation | Document CLI tools, sync process | Medium |

### Documentation Checklist per Service

- [ ] README.md exists and is current
- [ ] Quick start guide included
- [ ] API endpoints documented with examples
- [ ] Environment variables documented
- [ ] Dependencies listed
- [ ] Build/run instructions verified
- [ ] Contributing guidelines (if applicable)

---

## 4. Documentation Consolidation

**Parent:** Repository Audit → Single Source of Truth  
**Priority:** 🟢 Low  
**Effort:** ~2-3 hours

Resolve duplicate and overlapping documentation to maintain single source of truth.

### Duplicate Documentation Identified

| # | Files | Issue | Resolution |
|---|-------|-------|------------|
| D1 | `ARCHITECTURE.md` vs `docs/ARCHITECTURE_OVERVIEW.md` | Different perspectives on architecture | Keep both - different scopes (implementation vs. overview) |
| D2 | `docs/architecture/*.md` files | 5 files that may overlap with root ARCHITECTURE.md | Review for consolidation |
| D3 | Multiple session summary files | 8+ session files in docs/ARCHIVE_2025_11_27 | Archive or delete |

### Documentation Consolidation Sub-Issues

| # | Issue Title | Description | Priority |
|---|-------------|-------------|----------|
| 4.1 | Clarify ARCHITECTURE.md vs ARCHITECTURE_OVERVIEW.md | Add cross-references, define scope of each | Low |
| 4.2 | Review docs/architecture/ folder for consolidation | Merge or archive redundant files | Low |
| 4.3 | Remove stale session summary files | Clean up 8+ session reports in archives | Low |

### Files to Review in `docs/architecture/`

```
docs/architecture/
├── SERVICES_ARCHITECTURE.md     ← May overlap with SERVICE_DIRECTORY.md
├── ai-integration-guide.md      ← Unique - keep
├── component-architecture.md    ← May overlap with ARCHITECTURE.md
├── system-overview.md           ← May overlap with ARCHITECTURE.md
└── data-flow.md                 ← May overlap with ARCHITECTURE.md
```

---

## 5. Archive Cleanup

**Parent:** Repository Audit → File Organization  
**Priority:** 🟢 Low  
**Effort:** ~1-2 hours

Clean up archived and legacy files to reduce repository bloat.

### Archive Directories

| Directory | Files | Size | Last Modified | Action |
|-----------|-------|------|---------------|--------|
| `docs/ARCHIVE_2025_11_26/` | 16+ | ~200KB | Nov 26, 2025 | Review for deletion |
| `docs/ARCHIVE_2025_11_27/` | 48+ | ~700KB | Nov 27, 2025 | Review for deletion |
| `docs/legacy/` | 3 | ~50KB | Nov 2025 | Review for deletion |

### Archive Cleanup Sub-Issues

| # | Issue Title | Description | Priority |
|---|-------------|-------------|----------|
| 5.1 | Review and clean docs/ARCHIVE_2025_11_26 | Archive is 3+ days old - consider removal | Low |
| 5.2 | Review and clean docs/ARCHIVE_2025_11_27 | Archive is 2+ days old - consider removal | Low |
| 5.3 | Review docs/legacy folder | Contains old pricing-tool-reference and website-roadmap | Low |

### Archive Cleanup Decision Matrix

| Keep If | Archive If | Delete If |
|---------|------------|-----------|
| Referenced in current docs | May be useful for reference | No external references |
| Contains unique information | Historical value only | Superseded by newer docs |
| Active development dependency | Learning/post-mortem value | Duplicate information |

---

## 6. Audit Automation

**Parent:** Repository Audit → CI/CD  
**Priority:** 🟡 Medium  
**Effort:** ~4-6 hours

Automate the audit process to run regularly via CI/CD.

### Current Audit Tools

| Script | Purpose | Status |
|--------|---------|--------|
| `scripts/validate-docs.sh` | Validate documentation consistency | ✅ Exists |
| `scripts/audit.sh` | Full repository audit | ❌ Not created |

### Audit Automation Sub-Issues

| # | Issue Title | Description | Priority |
|---|-------------|-------------|----------|
| 6.1 | Create scripts/audit.sh | Automated audit script covering branches, docs, tests | Medium |
| 6.2 | Add audit workflow to CI/CD | Run audit.sh on schedule or PR | Medium |

### Proposed `scripts/audit.sh` Features

```bash
#!/bin/bash
# PrintShop OS - Repository Audit Script

# 1. Branch Analysis
# - Count total branches
# - Identify stale branches (no commits in 30 days)
# - List branches with unique commits ahead of main

# 2. Documentation Check
# - Verify root docs count (should be 10)
# - Check for duplicate documentation
# - Validate SERVICE_DIRECTORY.md references

# 3. Test Coverage Summary
# - Count test files per service
# - Run coverage report if configured
# - Flag services with <80% coverage

# 4. File Organization
# - Check for uncommitted node_modules
# - Identify large files (>10MB)
# - Count files in archive folders

# 5. Generate Report
# - Output markdown report
# - Create JSON summary for CI/CD
```

### Proposed CI/CD Workflow

```yaml
# .github/workflows/audit.yml
name: Repository Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
  workflow_dispatch:  # Manual trigger

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for branch analysis
      
      - name: Run Audit
        run: ./scripts/audit.sh
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: audit-report.md
```

---

## 📊 Progress Tracking

### Overall Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Branch Review | ⏳ Pending | 0% |
| Phase 2: Test Coverage | ⏳ Pending | 0% |
| Phase 3: Documentation | ⏳ Pending | 0% |
| Phase 4: Consolidation | ⏳ Pending | 0% |
| Phase 5: Archive Cleanup | ⏳ Pending | 0% |
| Phase 6: Automation | ⏳ Pending | 0% |

### Recommended Execution Order

1. **Week 1:** Branch Review (High Priority)
   - Review 8 branches
   - Make merge/archive decisions
   - Clean up branch backlog

2. **Week 2:** Test Coverage + Documentation
   - Create test inventories
   - Identify coverage gaps
   - Update service READMEs

3. **Week 3:** Consolidation + Cleanup
   - Resolve duplicate docs
   - Clean archive folders
   - Verify single source of truth

4. **Week 4:** Automation
   - Create audit.sh script
   - Add to CI/CD pipeline
   - Establish recurring audit schedule

---

## 🔗 Related Documents

| Document | Purpose |
|----------|---------|
| [REPOSITORY_AUDIT.md](../REPOSITORY_AUDIT.md) | Original audit report |
| [SERVICE_DIRECTORY.md](../SERVICE_DIRECTORY.md) | Service locations and structure |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture |
| [docs/INDEX.md](INDEX.md) | Documentation index |

---

## 7. Service Inventory Gaps

**Parent:** Repository Audit → Service Inventory  
**Priority:** 🟡 Medium  
**Status:** ✅ Audited (November 30, 2025)

Identified gaps in service documentation and integration.

| Service | Issue | Action Required |
|---------|-------|-----------------|
| `services/customer-service-ai` | Missing API documentation | Create API docs for RAG, chat, sentiment endpoints |
| `services/vector-store` | Missing API documentation | Create API docs for embedding and search functions |
| `services/production-dashboard` | Missing Dockerfile | Create Dockerfile for containerized deployment |
| `services/supplier-sync` | Missing Dockerfile | Create Dockerfile for containerized deployment |

---

## 8. Undiscoverable Files

**Parent:** Repository Audit → Undiscoverable Files Audit  
**Priority:** 🟢 Low  
**Status:** ✅ Audited (November 30, 2025)

Files not linked from root documentation:

### Active Documentation Needing Links
- `docs/setup/strapi-collections-setup.md` → Link from DEVELOPMENT_GUIDE.md
- `docs/setup/SUPPLIER_INTEGRATION_QUICKSTART.md` → Link from SERVICE_DIRECTORY.md
- `docs/architecture/SERVICES_ARCHITECTURE.md` → Link from ARCHITECTURE.md
- `docs/architecture/ai-integration-guide.md` → Link from SERVICE_DIRECTORY.md
- `docs/reference/colors.md` → Link from SERVICE_DIRECTORY.md
- `docs/FRONTEND_V1.1_ROADMAP.md` → Link from ROADMAP.md

### Archive Directories for Review
| Directory | File Count | Recommendation |
|-----------|------------|----------------|
| `docs/ARCHIVE_2025_11_26/` | 16 files | Review for deletion |
| `docs/ARCHIVE_2025_11_27/` | 59 files | Review for deletion |
| `docs/legacy/` | 44 files | Archive or delete |

---

## 📝 Issue Creation Checklist

When creating GitHub Issues from this dashboard:

- [ ] Use consistent title format: `[Category] Action item title`
- [ ] Link to parent issue (this dashboard)
- [ ] Add appropriate labels: `audit`, `documentation`, `testing`, `cleanup`
- [ ] Set appropriate priority/milestone
- [ ] Assign to relevant team member
- [ ] Add to Project Board

### Label Recommendations

| Label | Use For |
|-------|---------|
| `audit` | All audit-related issues |
| `documentation` | Documentation updates |
| `testing` | Test coverage improvements |
| `cleanup` | Archive and consolidation |
| `automation` | CI/CD and scripting |
| `branch-review` | Branch merge/archive decisions |
| `service-inventory` | Service documentation gaps |

---

**Next Steps:**
1. Create GitHub Issues for each sub-item
2. Link issues to this dashboard
3. Assign owners and set milestones
4. Begin with Phase 1 (Branch Review)

---

*This document is based on the Repository Audit and should be kept in sync with GitHub Issues.*
