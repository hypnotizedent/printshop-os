# PrintShop OS GitHub Projects Board Configuration

## MVP Project Board Overview

The GitHub Projects board provides a visual workflow for organizing and tracking PrintShop OS development.

**URL**: https://github.com/hypnotizedent/printshop-os/projects/1  
**View**: Board view with swim lanes for each phase  
**Automation**: Issues auto-move based on status labels  

---

## Board Columns (Workflow)

### 1. 📋 Backlog
**Status**: `status:planning`  
**Purpose**: Issues awaiting analysis, refinement, or prioritization

**When to use**:
- New feature requests
- Issues needing more definition
- Research/investigation tasks

**Actions**:
- Add acceptance criteria
- Add relevant labels (priority, component, phase)
- Link to documentation
- Break down into smaller issues if needed

**Move to**: "Phase 1: Strapi" (or appropriate phase column) when ready

---

### 2. 🎯 Phase 1: Strapi Backend
**Status**: `status:ready`, `phase:1-strapi`  
**Purpose**: Issues actively being worked on for Strapi implementation

**Priority**: Critical path for MVP  
**Timeline**: Days 1-2 of development  
**Estimated Hours**: 4-6 hours total

**Issues in this column**:
- Strapi Project Initialization
- Data Models & Collections
- API Endpoints & Authentication
- Admin Panel & Data Seeding

**Actions**:
- Assign to team member
- Move to "🔄 In Review" when PR opened
- Verify acceptance criteria met before moving to "✅ Testing & Integration"

**Move to**: "✅ Testing & Integration" when all tasks complete

---

### 3. 🎯 Phase 2: Appsmith Dashboard
**Status**: `status:ready`, `phase:2-appsmith`  
**Purpose**: Issues for dashboard development

**Depends On**: Phase 1 completion  
**Timeline**: Days 3-4 of development  
**Estimated Hours**: 3-4 hours total

**Issues in this column**:
- Appsmith Setup & Strapi Connection
- Job List View UI
- Job Details Modal & Status Updates
- Time Clock Interface
- Dashboard Layout & Navigation

**Actions**:
- Verify Phase 1 complete before starting
- Mark issues with `status:in-progress` when work begins
- Test dashboard against live Strapi API
- Update acceptance criteria based on testing

**Move to**: "✅ Testing & Integration" after review

---

### 4. 🎯 Phase 3: Botpress Integration
**Status**: `status:ready`, `phase:3-botpress`  
**Purpose**: Issues for customer intake bot

**Depends On**: Phase 1 completion  
**Timeline**: Days 5-6 of development  
**Estimated Hours**: 3-4 hours total

**Issues in this column**:
- Botpress Setup & Flow Design
- Botpress ↔ Strapi Integration
- Multi-Channel Configuration
- Error Handling & Validation

**Actions**:
- Design conversation flow first
- Thoroughly test Strapi API integration
- Test error handling with edge cases
- Verify end-to-end workflow functioning

**Move to**: "✅ Testing & Integration" after review

---

### 5. ✅ Testing & Integration
**Status**: `status:review`, `phase:integration`  
**Purpose**: Cross-component testing and integration verification

**Timeline**: Final 1-2 days before MVP release  
**Critical Path**: All phases must be verified

**Issues in this column**:
- [CHECKPOINT] Phase 1 Complete: Strapi API Functional
- [CHECKPOINT] Phase 2 Complete: Appsmith Dashboard Functional
- [CHECKPOINT] Phase 3 Complete: End-to-End Workflow
- [CHECKPOINT] MVP Complete: Full System Integration

**Actions**:
- Run full end-to-end workflow tests
- Verify all three Mint Prints workflows functioning
- Performance testing (response times, load)
- Documentation final review
- Bug triage and fixes

**Move to**: "🚀 Done" when all checkpoints pass

---

### 6. 🚀 Done
**Status**: `status:done`  
**Purpose**: Completed work merged to main branch

**When moved here**:
- Code review approved
- Tests passing
- PR merged to main
- Issue closed

**Note**: This column represents shipped functionality

---

## Issue Templates by Component

### Strapi (Phase 1) Issues

```
Title: [PHASE 1] Strapi {Specific Task}
Labels: phase:1-strapi, component:strapi, type:feature, priority:critical
Status: status:ready (when queued for work)

Example:
- [PHASE 1] Strapi Project Initialization
- [PHASE 1] Data Models & Collections
- [PHASE 1] API Endpoints & Authentication
- [PHASE 1] Admin Panel & Data Seeding
```

### Appsmith (Phase 2) Issues

```
Title: [PHASE 2] Appsmith {Specific Task}
Labels: phase:2-appsmith, component:appsmith, type:feature, priority:high
Status: status:ready (when queued for work)

Example:
- [PHASE 2] Appsmith Setup & Strapi Connection
- [PHASE 2] Job List View
- [PHASE 2] Job Details Modal
- [PHASE 2] Time Clock Interface
```

### Botpress (Phase 3) Issues

```
Title: [PHASE 3] Botpress {Specific Task}
Labels: phase:3-botpress, component:botpress, type:feature, priority:high
Status: status:ready (when queued for work)

Example:
- [PHASE 3] Botpress Flow Design
- [PHASE 3] Botpress ↔ Strapi Integration
- [PHASE 3] Multi-Channel Configuration
```

### Checkpoint Issues

```
Title: [CHECKPOINT] {Phase} Complete: {Verification}
Labels: phase:integration, type:test, priority:critical
Status: status:ready when starting

Example:
- [CHECKPOINT] Phase 1 Complete: Strapi API Functional
- [CHECKPOINT] Phase 2 Complete: Appsmith Dashboard Functional
- [CHECKPOINT] Phase 3 Complete: End-to-End Workflow
- [CHECKPOINT] MVP Complete: Full System Integration
```

### Workflow-Specific Issues

```
Title: [WORKFLOW] {Workflow Name}: {Feature}
Labels: workflow:{name}, component:{relevant}, type:feature
Related workflow labels:
- workflow:customer-intake → Botpress + Strapi integration
- workflow:job-management → Appsmith + Strapi
- workflow:time-tracking → Appsmith + Strapi

Example:
- [WORKFLOW] Customer Intake: Order Collection
- [WORKFLOW] Job Management: Status Updates
- [WORKFLOW] Time Tracking: Clock In/Out
```

---

## Workflow: From Backlog to Done

### Step 1: Issue Created (Backlog)
```
→ Auto-labeled: status:planning
→ Appears in Backlog column
→ Needs: description, acceptance criteria, labels
```

**Action**: Team reviews, refines, prioritizes

---

### Step 2: Ready for Implementation (Phase Column)
```
→ Status updated: status:ready
→ Phase label added: phase:1-strapi (or 2/3)
→ Moves to appropriate phase column
→ Needs: assignment, estimation
```

**Action**: Developer picks up issue, moves to "In Progress"

---

### Step 3: In Development
```
→ Assigned to developer
→ Label changed: status:in-progress
→ Developer creates feature branch
→ Work proceeds per contributing guidelines
```

**Action**: Commit frequently, test locally

---

### Step 4: Ready for Review
```
→ Pull request created (auto-links related issue)
→ Label changed: status:review
→ Issue moves to Testing & Integration column
→ Needs: code review, tests passing
```

**Action**: Team reviews, provides feedback

---

### Step 5: Merged & Done
```
→ PR approved and merged
→ Label changed: status:done
→ Issue automatically closed
→ Issue moves to Done column
```

**Verification**:
- Acceptance criteria met
- Tests passing
- Documentation updated
- Code style follows guidelines

---

## Labels by Phase

### Phase 1: Strapi
- `phase:1-strapi`
- `component:strapi`
- `component:postgres`
- `type:feature` or `type:docs`

### Phase 2: Appsmith
- `phase:2-appsmith`
- `component:appsmith`
- `type:feature` or `type:test`

### Phase 3: Botpress
- `phase:3-botpress`
- `component:botpress`
- `type:feature` or `type:docs`

### Integration
- `phase:integration`
- `type:test`
- `priority:critical`

---

## Sprint/Daily Workflow

### Daily Standup
**Check**: MVP project board → identify blockers

**Questions**:
1. What's in "In Progress"? (Should be 1-3 items max)
2. Are there any "Blocked" items?
3. What's next to move into a phase column?

### Mid-Day Check
**Verify**: Current work is on track

**Actions**:
- Move issues as status changes
- Close blocked issues (update label to `status:blocked`)
- Update progress in issue comments

### Daily Close
**Update**: Board state for tomorrow

**Checklist**:
- [ ] All in-progress items have status labels
- [ ] No issues stuck in "In Review" > 1 day
- [ ] Backlog has prioritized items ready for tomorrow
- [ ] Any critical blockers surfaced to team

---

## Metrics & Reporting

### Board Velocity
- **Issues/hour**: How many issues close per hour of team work
- **Phase completion time**: How long each phase actually takes vs. estimate
- **Review cycle time**: Time from PR opened to merged

### Quality Metrics
- **Acceptance criteria compliance**: % of issues that met all criteria
- **Test coverage**: Minimum 70% on Phase 1, test coverage on 2 & 3
- **Bug rate**: Post-merge bugs found (aim for 0 critical)

### Health Checks
- **Backlog age**: Issues in backlog > 1 week should be triaged
- **Review turnaround**: PRs in review > 2 days need escalation
- **Blocker count**: More than 1 active blocker is a red flag

---

## Board Rules & Norms

1. **Every issue must have one status label** (planning, ready, in-progress, review, done, blocked)

2. **Issues in Phase columns = active work** (not planning, not done)

3. **Move issues to reflect reality** — don't let board get out of sync with actual work

4. **Acceptance criteria are checklist** — use them to verify "done"

5. **One reviewer per issue minimum** — code quality gate

6. **Close blocked issues** — update label to `status:blocked`, comment with reason

7. **Backlog is sacred** — prioritized list of next work, reviewed weekly

8. **Testing column is pass/fail** — no ambiguity, checkpoint either passes or doesn't

---

## Troubleshooting

### Issue stuck in "In Progress" > 2 days?
- [ ] Comment asking for status
- [ ] Check if it's blocked (missing dependency, unclear requirement)
- [ ] Break into smaller issues if too large
- [ ] Offer pair programming/help if needed

### Too many issues in backlog?
- [ ] Prioritize (move high priority to top)
- [ ] Close or label `won't-fix` for low-priority items
- [ ] Archive/hide post-MVP items (use `phase:post-mvp` to filter)

### Phase column empty?
- [ ] Backlog has no ready issues for next phase
- [ ] Break down larger backlog items into smaller tasks
- [ ] Complete current phase checkpoint before starting next

### Can't move issue between columns?
- [ ] Check if correct status label is set
- [ ] Board automation might need status label to move
- [ ] May need to manually drag if automation broken

---

## Automation Commands

### GitHub Issue Commands (in comments)

```
# Link to project
@github-actions link #15 to project 1

# Change status
@github-actions set-status #15 to status:review

# Add labels
@github-actions add-labels #15 phase:1-strapi component:strapi
```

---

## References

- [PLANNING.md](PLANNING.md) — Overall planning strategy
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) — Detailed roadmap
- [LABELS.md](LABELS.md) — Complete label documentation
- [Contributing Guidelines](../docs/CONTRIBUTING.md) — Development standards
