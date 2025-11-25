# Quarterly Documentation Review Process

**Purpose:** Maintain documentation quality, identify duplicates, and ensure consistency  
**Frequency:** Every 3 months (Quarterly)  
**Owner:** Project maintainers or designated reviewer  
**Duration:** 2-4 hours per review

---

## Overview

The quarterly documentation review ensures PrintShop OS documentation remains organized, accurate, and useful. This process prevents documentation drift, identifies stale content, and maintains the single source of truth principle.

---

## Review Schedule

### Timing
- **Q1 Review:** End of March
- **Q2 Review:** End of June  
- **Q3 Review:** End of September
- **Q4 Review:** End of December

### Preparation
Create a GitHub issue 2 weeks before review date:
- Title: `Quarterly Documentation Review - Q[N] [YEAR]`
- Label: `documentation`, `maintenance`
- Assignee: Review owner
- Use template: `.github/ISSUE_TEMPLATE/quarterly-doc-review.md`

---

## Review Checklist

### Phase 1: Inventory (30 minutes)

- [ ] **Count all documentation files**
  ```bash
  find . -name "*.md" | wc -l
  ```
  Record total count and compare to previous quarter

- [ ] **List root-level docs**
  ```bash
  ls -1 *.md
  ```
  Verify all root docs are still relevant

- [ ] **Check service documentation**
  ```bash
  find services/ -name "*.md"
  ```
  Ensure each service has README.md and IMPLEMENTATION_SUMMARY.md

- [ ] **Review /docs/ folder structure**
  ```bash
  tree -L 2 docs/
  ```
  Verify categories are still appropriate

### Phase 2: Duplicate Detection (45 minutes)

- [ ] **Search for duplicate daily logs**
  ```bash
  find . -name "*TODAYS_WORK*" -o -name "*daily*log*" -o -name "202[0-9]-[0-9][0-9]-[0-9][0-9]*"
  ```
  Should only find `/DEVELOPMENT_LOG.md`

- [ ] **Check for duplicate planning docs**
  ```bash
  find . -name "*PLAN*.md" -o -name "*STRATEGY*.md"
  ```
  Consolidate or archive if needed

- [ ] **Find multiple IMPLEMENTATION_SUMMARY files per service**
  ```bash
  find services/ -name "IMPLEMENTATION_SUMMARY*"
  ```
  Each service should have exactly one

- [ ] **Identify README proliferation**
  ```bash
  find . -name "README.md" | wc -l
  ```
  Expected: ~25, review if significantly higher

- [ ] **Search for similar content**
  ```bash
  grep -r "AS Colour integration" --include="*.md"
  ```
  Manually review results for duplicates

### Phase 3: Content Quality (60 minutes)

- [ ] **Check for broken links**
  Use tool: `markdown-link-check` or manual review
  ```bash
  find . -name "*.md" -exec grep -H "\[.*\](.*)" {} \;
  ```

- [ ] **Verify dates are current**
  ```bash
  grep -r "Last Updated:" --include="*.md"
  ```
  Flag docs not updated in >6 months

- [ ] **Review DEVELOPMENT_LOG.md**
  - Entries follow standard format
  - Recent entries exist (last 30 days)
  - No gaps longer than 2 weeks

- [ ] **Check ROADMAP.md alignment**
  - Completed items moved to CHANGELOG.md
  - Future plans still relevant
  - Dates updated

- [ ] **Review STATUS.md accuracy**
  - Service status current
  - Metrics up-to-date
  - No stale information

### Phase 4: Organization Compliance (30 minutes)

- [ ] **Verify ENTERPRISE_FOUNDATION.md rules followed**
  - Daily logs in correct location
  - Service docs in service folders
  - Cross-service docs in /docs/
  - No orphaned files

- [ ] **Check for misplaced documentation**
  Common mistakes:
  - Service-specific docs in /docs/
  - Cross-service docs in service folders
  - Planning docs not archived

- [ ] **Review archive structure**
  ```bash
  ls -la docs/archive/
  ```
  Ensure archived docs have README explaining context

- [ ] **Validate IMPLEMENTATION_SUMMARY format**
  Compare against `/docs/templates/IMPLEMENTATION_SUMMARY_TEMPLATE.md`

### Phase 5: Remediation Planning (15 minutes)

- [ ] **Create issue for each problem found**
  - Label: `documentation`, `cleanup`
  - Priority: High for broken links, Medium for duplicates, Low for formatting

- [ ] **Estimate effort for fixes**
  - Quick wins: <30 min
  - Medium tasks: 1-2 hours
  - Large tasks: >2 hours (break into subtasks)

- [ ] **Assign cleanup tasks**
  - Immediate: Critical issues (broken production docs)
  - This month: High priority issues
  - Next quarter: Low priority improvements

---

## Review Report Template

Copy this template to the GitHub issue:

```markdown
# Quarterly Documentation Review - Q[N] [YEAR]

**Date:** YYYY-MM-DD  
**Reviewer:** [Name]  
**Duration:** [hours]

## Summary

**Documentation Count:**
- Total .md files: [N] (Previous: [N], Change: +/- [N])
- Root level: [N]
- Services: [N]
- /docs/ folder: [N]

**Health Score:** [N]/10

---

## Findings

### ✅ Positive Findings
- Item 1
- Item 2

### ⚠️ Issues Identified
1. **[Issue Type]:** Description
   - Location: [path]
   - Impact: High/Medium/Low
   - Action: [what needs to be done]

2. **[Issue Type]:** Description
   - Location: [path]
   - Impact: High/Medium/Low
   - Action: [what needs to be done]

---

## Metrics

| Metric | Current | Previous | Target | Status |
|--------|---------|----------|--------|--------|
| Total docs | [N] | [N] | Stable | ✅/⚠️ |
| Duplicates found | [N] | [N] | 0 | ✅/⚠️ |
| Broken links | [N] | [N] | 0 | ✅/⚠️ |
| Outdated docs (>6mo) | [N] | [N] | <5 | ✅/⚠️ |
| DEVELOPMENT_LOG gaps | [N] days | [N] | <14 | ✅/⚠️ |

---

## Compliance Check

- [ ] ✅ ENTERPRISE_FOUNDATION.md rules followed
- [ ] ✅ No duplicate daily logs
- [ ] ✅ Service docs in correct locations
- [ ] ✅ IMPLEMENTATION_SUMMARY standardized
- [ ] ✅ Archive properly structured

---

## Cleanup Plan

### Immediate (This Week)
- [ ] Task 1: Description (#issue-number)
- [ ] Task 2: Description (#issue-number)

### Short Term (This Month)
- [ ] Task 3: Description (#issue-number)
- [ ] Task 4: Description (#issue-number)

### Next Quarter
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

---

## Recommendations

1. **Recommendation 1:** Description and rationale
2. **Recommendation 2:** Description and rationale

---

## Next Review

**Scheduled:** [Date 3 months from now]  
**Owner:** [Assign next reviewer]
```

---

## Success Metrics

### Health Score Calculation

Score out of 10 based on:

| Metric | Points | Criteria |
|--------|--------|----------|
| **Duplicate docs** | 2 | 0 = 2pts, 1-3 = 1pt, >3 = 0pts |
| **Broken links** | 2 | 0 = 2pts, 1-5 = 1pt, >5 = 0pts |
| **Outdated docs** | 2 | <5 = 2pts, 5-10 = 1pt, >10 = 0pts |
| **Compliance** | 2 | All rules = 2pts, 1-2 violations = 1pt, >2 = 0pts |
| **DEVELOPMENT_LOG** | 2 | Current = 2pts, 1-2 week gap = 1pt, >2 weeks = 0pts |

**Target:** 8/10 or higher

### Trend Tracking

Track over time:
- Total documentation count (should be stable)
- Issues found per review (should decrease)
- Average health score (should increase or maintain >8)
- Time to remediate issues (should decrease)

---

## Tools & Scripts

### Automated Checks

**Count documentation:**
```bash
#!/bin/bash
echo "Total .md files:"
find . -name "*.md" | wc -l

echo "\nBy location:"
echo "Root: $(ls *.md 2>/dev/null | wc -l)"
echo "Services: $(find services/ -name "*.md" | wc -l)"
echo "Docs: $(find docs/ -name "*.md" | wc -l)"
```

**Find duplicates:**
```bash
#!/bin/bash
echo "Checking for duplicate daily logs..."
find . \( -name "*TODAYS_WORK*" -o -name "*daily*" -o -name "202[0-9]-[0-9][0-9]-[0-9][0-9].md" \) -not -path "*/node_modules/*" -not -path "*/.git/*"

echo "\nChecking for multiple IMPLEMENTATION_SUMMARY files..."
find services/ -name "IMPLEMENTATION_SUMMARY*" | awk -F/ '{print $2}' | sort | uniq -c | awk '$1 > 1'
```

**Check for outdated docs:**
```bash
#!/bin/bash
echo "Docs not modified in >180 days:"
find . -name "*.md" -mtime +180 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/docs/archive/*"
```

### Manual Review Aids

**Link checker:** Install and run
```bash
npm install -g markdown-link-check
find . -name "*.md" -not -path "*/node_modules/*" -exec markdown-link-check {} \;
```

**Duplicate content:** Use file comparison
```bash
# Compare similar files
diff file1.md file2.md
```

---

## Common Issues & Fixes

### Issue: Duplicate IMPLEMENTATION_SUMMARY

**Fix:**
1. Compare content of duplicates
2. Merge into canonical version (use template)
3. Delete duplicates
4. Update git history

### Issue: Broken Links

**Fix:**
1. Find target file: `find . -name "target-file.md"`
2. Update link in source document
3. Test link works

### Issue: Outdated Content

**Fix:**
1. Review if still relevant
2. If yes: Update dates and content
3. If no: Archive to `/docs/archive/`

### Issue: Misplaced Documentation

**Fix:**
1. Determine correct location (use decision tree)
2. Move file: `git mv old/path/file.md new/path/file.md`
3. Update all references
4. Commit with message: `docs: relocate [file] to proper location`

---

## GitHub Issue Template

Create `.github/ISSUE_TEMPLATE/quarterly-doc-review.md`:

```markdown
---
name: Quarterly Documentation Review
about: Quarterly audit of project documentation
title: 'Quarterly Documentation Review - Q[N] [YEAR]'
labels: documentation, maintenance
assignees: ''
---

## Review Schedule

**Quarter:** Q[N] [YEAR]  
**Due Date:** [Date]  
**Reviewer:** @[username]

## Checklist

- [ ] Phase 1: Inventory (30 min)
- [ ] Phase 2: Duplicate Detection (45 min)
- [ ] Phase 3: Content Quality (60 min)
- [ ] Phase 4: Organization Compliance (30 min)
- [ ] Phase 5: Remediation Planning (15 min)
- [ ] Post review report as comment
- [ ] Create cleanup issues
- [ ] Schedule next review

## Resources

- [Review Process](../docs/project-management/DOCUMENTATION_REVIEW.md)
- [ENTERPRISE_FOUNDATION.md](../ENTERPRISE_FOUNDATION.md)
- [Previous Review](#link-to-previous-review)
```

---

## Process Evolution

### After Each Review

1. **Update this document** if process improvements identified
2. **Refine success metrics** based on what's actually useful
3. **Add automation** for repetitive manual checks
4. **Document lessons learned** in review report

### Yearly Review

At end of year (Q4 review):
- Evaluate entire year's documentation health
- Identify trends and patterns
- Propose major improvements for next year
- Update ENTERPRISE_FOUNDATION.md if needed

---

## Related Documentation

- [ENTERPRISE_FOUNDATION.md](../../ENTERPRISE_FOUNDATION.md) - Organization rules
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Documentation standards
- [DEVELOPMENT_LOG.md](../../DEVELOPMENT_LOG.md) - Daily work log

---

**Created:** November 25, 2025  
**Last Updated:** November 25, 2025  
**Next Review:** End of Q1 2026
