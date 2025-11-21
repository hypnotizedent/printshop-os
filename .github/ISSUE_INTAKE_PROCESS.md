# PrintShop OS - Complete Issue Intake Process

**8-stage issue lifecycle with detailed workflow, labels, and real-world examples.**

---

## 📚 Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [8-Stage Lifecycle](#8-stage-lifecycle)
3. [Stage 1: Observation & Discussion](#stage-1-observation--discussion)
4. [Stage 2: Issue Creation](#stage-2-issue-creation)
5. [Stage 3: Triage & Assessment](#stage-3-triage--assessment)
6. [Stage 4: Specification](#stage-4-specification)
7. [Stage 5: Planning & Estimation](#stage-5-planning--estimation)
8. [Stage 6: Development](#stage-6-development)
9. [Stage 7: Review & Testing](#stage-7-review--testing)
10. [Stage 8: Completion & Documentation](#stage-8-completion--documentation)
11. [Real-World Examples](#real-world-examples)
12. [Label Reference](#label-reference)
13. [Edge Cases](#edge-cases)

---

## Overview & Philosophy

**Why this process?**

Without a clear intake process, issues pile up in various states of incompleteness, wasting time when developers pick them up. This process ensures:

✅ Issues are clearly described before work starts
✅ Effort is estimated so planning is accurate
✅ Dependencies are visible
✅ Work flows smoothly from idea to completion
✅ Team understands priority and context

**Key principle**: Never let a developer start work on an issue without a clear spec and effort estimate.

---

## 8-Stage Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    ISSUE LIFECYCLE                          │
└─────────────────────────────────────────────────────────────┘

Stage 1: Observation & Discussion
    ↓ (decide to formalize)
Stage 2: Issue Creation (status:backlog)
    ↓ (triage meeting)
Stage 3: Triage & Assessment (status:backlog → status:planned)
    ↓ (assigned to PM/product person)
Stage 4: Specification (status:planned)
    ↓ (spec complete)
Stage 5: Planning & Estimation (status:planned → status:ready)
    ↓ (ready to assign)
Stage 6: Development (status:ready → status:in-progress)
    ↓ (dev complete)
Stage 7: Review & Testing (status:in-progress → status:review)
    ↓ (approved)
Stage 8: Completion & Documentation (status:review → status:done)
    ↓
CLOSED
```

---

## Stage 1: Observation & Discussion

**Situation**: A problem is noticed or a feature idea emerges.

**Who**: Anyone on the team

**Duration**: 15 minutes to several days

**Activities**:
- Notice a problem or opportunity
- Discuss with team members
- Determine if it's worth formalizing as an issue
- Get rough consensus that this is something to do

**When NOT to create an issue**:
- It's a quick fix (just do it and ship)
- It's unclear if it's needed (still discussing)
- It's someone's personal to-do item

**When TO create an issue**:
- Multiple people might work on it
- It requires planning or approval
- It depends on other issues
- It's a feature or bug that needs tracking

**Example**:
```
Sarah (Salesperson): "Our quote tool doesn't show the discount 
percentages we apply. Customers get confused."

Tom (Tech Lead): "Yeah, I noticed that too. We need to add 
discount column to the quote table."

Sarah: "Let's create an issue for this."

Tom: "Good idea. This probably ties into our quote redesign work."
```

---

## Stage 2: Issue Creation

**Situation**: Idea has been discussed, team agrees it's worth tracking.

**Who**: Anyone (usually who brought it up)

**Duration**: 5 minutes

**Activities**:
1. Go to GitHub Issues → New Issue
2. Enter title (clear, specific)
3. Enter description (what, why, context)
4. Select sector milestone
5. Add sector label
6. Add type label
7. (Usually leave other fields empty for triage)
8. Click Create

**GitHub Actions**:
- Title field: max 100 chars, clear and specific
- Description field: 
  - What is the problem?
  - Why does it matter?
  - Any context for developer?
- Milestone: Select the sector (required)
- Labels: Add sector + type (required)
- Assignee: Leave blank (will be assigned later)
- Status label: Automatically `status:backlog`

**Example**:
```
Title: "Add discount percentage display to quote table"

Description:
When customers view quotes, they see the final price but not 
the discount we applied. This causes confusion about pricing.

We need to add a "Discount %" column to the quote table showing 
the discount percentage applied.

Related: Quote redesign task (if any)
```

**After Creation**: 
Issue exists with:
- ✅ Title and description
- ✅ Milestone: "Sales & Quoting"
- ✅ Labels: `sector:sales`, `type:enhancement`
- ✅ Status: `status:backlog` (implied by new issue)
- ❌ Effort estimate (added later)
- ❌ Acceptance criteria (added in Stage 4)
- ❌ Priority (added in triage)

---

## Stage 3: Triage & Assessment

**Situation**: Issue exists but not yet planned.

**Who**: PM/Product lead + Tech lead + optional stakeholder

**Duration**: 5-10 minutes per issue (in triage meeting)

**Activities**:
1. Review issue
2. Discuss:
   - Is this really needed?
   - Does description make sense?
   - Any blockers or dependencies?
   - What sector does it belong in?
3. Decide priority
4. Update labels based on discussion

**GitHub Actions**:
- Review title and description - is it clear?
- Add/change priority label: `priority:critical`, `priority:high`, `priority:medium`, or `priority:low`
- Change status: Keep `status:backlog` if deprioritized, or change to `status:planned` if accepted
- Add any dependency notes in comments
- Add special labels if applicable: `blocked`, `needs-decision`, etc.

**Decision Points**:
```
Is this clearly needed?
├─ YES → Add priority label + change status:planned
└─ NO → Add `wontfix` label + close issue

Does it have blockers?
├─ YES → Add `blocked` label + document blocker
└─ NO → Proceed

Is the description clear?
├─ YES → Proceed
└─ NO → Add comment asking for clarification
```

**Example**:
```
Issue #42: "Add discount percentage display to quote table"

Triage Decision:
✓ Clearly needed - customers report confusion
✓ No blockers - can be implemented immediately
✓ Description is clear
→ Set priority:high (customer-impacting)
→ Change status:planned
→ Add to Sales & Quoting milestone
```

**After Triage**:
- ✅ Priority set
- ✅ Status: `status:planned`
- ✅ Blockers identified (if any)
- ✅ Clear on sector
- ❌ Acceptance criteria (added next)
- ❌ Effort estimate (added next)

---

## Stage 4: Specification

**Situation**: Issue is prioritized and planned. Now need to specify exactly what to build.

**Who**: PM/Product person (primary) + Tech lead (technical review)

**Duration**: 15-30 minutes per issue

**Activities**:
1. Write detailed acceptance criteria
2. Gather any additional requirements
3. Answer technical questions (with tech lead)
4. Create wireframes/mockups if needed
5. Identify dependencies
6. Answer "why" and "what success looks like"

**GitHub Actions**:
Add detailed acceptance criteria to issue description. Format:

```markdown
## What

Add a "Discount %" column to the quote table showing discount percentage.

## Why

Customers get confused about pricing when they see the final price 
but not the discount applied. This causes support questions and 
trust issues.

## Acceptance Criteria

- [ ] Quote table has new "Discount %" column
- [ ] Column appears between "Original Price" and "Final Price"
- [ ] Shows discount as percentage (e.g., "15%")
- [ ] If no discount, shows "—" (dash)
- [ ] Column is right-aligned
- [ ] Works on desktop and mobile
- [ ] Works for all quote types (print, services, etc.)
- [ ] No performance degradation (load time < 100ms)

## Technical Notes

- Database already has discount % calculation
- UI component already supports new columns
- No API changes needed
- Update quote table template in frontend/quote.html
- Consider: localization for non-US markets

## Mockup

[Attach screenshot or link to design]

## Related Issues

#40 - Quote redesign project
#38 - Mobile quote view
```

**GitHub Labels to Add**:
- `needs-review` (if needs stakeholder approval)
- `needs-design` (if needs design input)
- Other special labels as needed

**Example Questions Answered in Spec**:
- What exactly should this look like?
- When should this appear?
- What are the edge cases?
- What should happen in error scenarios?
- Does this affect other systems?

**After Specification**:
- ✅ Clear acceptance criteria
- ✅ Why/what/success defined
- ✅ Dependencies identified
- ✅ Technical approach documented
- ❌ Effort estimate (added next stage)
- ✅ Status: still `status:planned`

---

## Stage 5: Planning & Estimation

**Situation**: Issue is fully specified. Now estimate effort and prepare for development.

**Who**: Tech lead + the developer who will do it (ideal) or similar developer

**Duration**: 5-10 minutes per issue

**Activities**:
1. Review spec
2. Estimate effort:
   - XS: < 1 hour
   - Small: 1-4 hours
   - Medium: 4-8 hours (1 day)
   - Large: 8-24 hours (2-3 days)
   - XL: 24+ hours (1+ week)
3. Identify any technical risks
4. Break into smaller issues if too large
5. Mark as "Ready" for assignment

**GitHub Actions**:
- Add effort label: `effort:xs`, `effort:small`, `effort:medium`, `effort:large`, or `effort:xl`
- Add any technical risk notes in comments
- Change status to `status:ready`
- If issue is too large (XL), break into smaller issues:
  - Create child issues for each piece
  - Link them in main issue with "Related:" section
  - Keep main issue open as tracking

**Decision Point: Is this too big?**
```
Effort estimate is XL (24+ hours / 1+ week)?
├─ YES → Break into smaller issues
│        (each ~1-3 days of work)
└─ NO → Proceed to assignment
```

**Example**:
```
Issue #42: "Add discount percentage display to quote table"

Estimated Effort: medium (4-8 hours, 1 day)
  • Database query: already exists (10 min)
  • Frontend component: add column (2-3 hours)
  • Mobile responsive: test/fix (1-2 hours)
  • Testing: verify across quote types (1 hour)

Technical Risk: None - straightforward change

Status: status:ready
Ready for: Any frontend developer
```

**After Estimation**:
- ✅ Effort estimated
- ✅ Technical risks identified
- ✅ Status: `status:ready`
- ✅ Ready to assign to developer
- ✅ Fully specified
- ✅ Priority set
- ✅ All stakeholders aligned

---

## Stage 6: Development

**Situation**: Issue is fully prepared. Developer is ready to work on it.

**Who**: Developer (assigned to issue)

**Duration**: Varies (estimated in Stage 5)

**Activities**:
1. Developer claims issue (self-assigns or is assigned)
2. Creates feature branch
3. Implements feature
4. Tests locally
5. Commits changes
6. Opens Pull Request

**GitHub Actions**:
- Developer assigns themselves
- Change status to `status:in-progress`
- If scope changes, update effort estimate in comments
- If blocked, add `blocked` label and document blocker

**Development Rules**:
- Never start work on an issue without `status:ready`
- If you find the spec incomplete, ask questions (don't guess)
- If effort estimate was wrong, document in comments
- If you get blocked, add `blocked` label and ask for help

**Example**:
```
Issue #42 is assigned to @developer-alice

@developer-alice moves to status:in-progress
Creates branch: feature/quote-discount-column
Commits to: feature/quote-discount-column
Opens: PR #234 linking to issue

In PR description:
- Adds discount % column
- Responsive on mobile
- Tested with all quote types
- Performance: <100ms ✓
```

**After Development Started**:
- ✅ Status: `status:in-progress`
- ✅ Developer assigned
- ✅ Branch created
- ⏳ Awaiting PR completion

---

## Stage 7: Review & Testing

**Situation**: Feature is implemented. Code/feature needs review.

**Who**: Code reviewer + QA/tester

**Duration**: 1-5 hours (code review + testing)

**Activities**:
1. Reviewer reviews code
   - Does it match spec?
   - Is code quality good?
   - Are tests included?
   - Any concerns?
2. Tester tests feature
   - Do acceptance criteria pass?
   - Does it work on target browsers/devices?
   - Any edge cases broken?
   - Performance acceptable?
3. If issues found, back to development
4. If approved, merge to main

**GitHub Actions**:
- Change status to `status:review`
- Link to PR in issue
- PR review comments in GitHub
- If issues, update PR and stay in review
- If approved, merge PR

**Review Checklist**:
```
Code Review:
- [ ] Matches acceptance criteria
- [ ] Code is clean and readable
- [ ] Tests are included
- [ ] No performance regressions
- [ ] No security issues
- [ ] Follows coding standards

QA Testing:
- [ ] Acceptance criteria all pass
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on mobile and desktop
- [ ] Edge cases tested
- [ ] Error cases handled
- [ ] Performance acceptable
```

**Example**:
```
PR #234 linked to Issue #42

Code Review: 
@reviewer-bob approves
✓ Code is clean
✓ Tests included
✓ Matches spec
✓ Performance good

QA Testing:
@qa-alice tests
✓ All acceptance criteria pass
✓ Works on Chrome, Firefox, Safari, Mobile
✓ Edge cases handled
✓ Performance: 87ms ✓

Status: status:review → Ready to merge
```

**After Review Approved**:
- ✅ PR merged
- ✅ Code in main branch
- ✅ Feature shipped/deployed
- ⏳ Awaiting closure

---

## Stage 8: Completion & Documentation

**Situation**: Feature is merged and live. Issue needs to be documented and closed.

**Who**: Developer + Tech lead (documentation)

**Duration**: 10-20 minutes

**Activities**:
1. Add summary comment to issue
2. Link to merged PR
3. Update relevant documentation
4. Add to changelog
5. Close issue

**GitHub Actions**:
- Add final comment with:
  - What was shipped
  - Link to merged PR
  - Any documentation updated
  - Any follow-up issues created
- Change status to `status:done`
- Close issue
- Create follow-up issues if needed

**Documentation to Update**:
- README.md (if user-facing feature)
- API docs (if API changes)
- User guide (if changes behavior)
- CHANGELOG.md (what's new)
- Tech docs (if internal)

**Example**:
```
Issue #42: "Add discount percentage display to quote table"

Final Comment:
✓ Implemented and merged in PR #234
✓ Discount % column now appears in quote table
✓ Works on all browsers and mobile
✓ Performance: 87ms (under 100ms target)
✓ Updated README.md with feature description
✓ Added to CHANGELOG.md v2.3
✓ No follow-up issues needed

Status: status:done
Issue: CLOSED
```

**After Completion**:
- ✅ Feature shipped
- ✅ Documentation updated
- ✅ Issue closed
- ✅ Status: `status:done`
- ✅ In changelog
- ✅ Complete!

---

## Real-World Examples

### Example 1: High Priority Bug (1-2 days)

```
Issue Created: "Quote calculator shows wrong total with bulk discount"

Stage 1-2: Discussion & Creation
Time: 15 minutes
How: User reports bug, captured as GitHub issue

Stage 3: Triage
Time: 5 minutes
Action: 
- Priority: priority:critical (customer-impacting)
- Status: status:planned
- Sector: sector:sales
- Add: type:bug

Stage 4: Specification
Time: 10 minutes
Spec:
- [ ] Bulk discount (10+ items) incorrectly subtracts
- [ ] Calculate correct total with bulk discount
- [ ] Verify all discount types still work
- [ ] Customer quote #12345 shows correct total

Stage 5: Estimation
Time: 5 minutes
Effort: medium (4-8 hours)
- Bug analysis: 1 hour
- Fix: 1-2 hours
- Testing: 1-2 hours
- Verification with customer: 1 hour
Status: status:ready

Stage 6: Development
Time: 2-3 hours
- Developer finds bug in discount calculation logic
- Fix applied
- Local testing passes
- PR #250 opened

Stage 7: Review
Time: 1 hour
- Code reviewed by @tech-lead
- QA tests with customer quote
- Edge cases verified
- Approved and merged

Stage 8: Completion
Time: 10 minutes
- PR merged
- Customer quote #12345 re-generated
- Correct total displayed ✓
- Issue closed
```

### Example 2: Medium Feature (1 week)

```
Issue Created: "Integrate Zapier for order automation"

Stage 1-2: Discussion & Creation
Time: 30 minutes
How: Sales team requests, to improve order workflow

Stage 3: Triage
Time: 10 minutes
Action:
- Priority: priority:high
- Status: status:planned
- Sector: sector:automation
- Add: type:enhancement

Stage 4: Specification
Time: 2 hours (with Zapier docs and tech lead)
Spec:
- [ ] Connect PrintShop to Zapier
- [ ] OAuth integration set up
- [ ] Triggers: when order created/updated/shipped
- [ ] Actions: send to external service
- [ ] Handles errors gracefully
- [ ] API rate limits respected
- [ ] Documentation updated
- [ ] Log all Zapier calls for debugging
Mockup: [Zapier integration flow diagram]

Stage 5: Estimation
Time: 30 minutes
Effort: large (8-24 hours)
Breaks into:
- Auth setup: 3-4 hours
- Trigger implementation: 2-3 hours
- Testing/edge cases: 3-4 hours
- Documentation: 1 hour
Status: status:ready (might break into smaller issues for team)

Stage 6: Development
Time: 2-3 days (part-time, alongside other work)
Assigned to: @developer-carlos
- Creates feature branch: feature/zapier-integration
- Implements OAuth auth flow (4 hours)
- Implements trigger system (3 hours)
- Tests with sample workflows (2 hours)
- PR #271 opened

Stage 7: Review
Time: 1-2 hours
- Code review passes
- QA tests with real Zapier workflows
- Tested error scenarios
- Performance acceptable
- Approved

Stage 8: Completion
Time: 30 minutes
- PR merged
- Documentation updated
- CHANGELOG updated
- Sales team notified
- Zapier integration is live ✓
```

### Example 3: Quick Enhancement (2-4 hours)

```
Issue Created: "Add sort by discount on quote list"

Stage 1-2: Discussion & Creation
Time: 10 minutes
How: Quick request from sales team

Stage 3: Triage
Time: 3 minutes
Action:
- Priority: priority:medium
- Status: status:planned
- Sector: sector:sales
- Add: type:enhancement, good-first-issue

Stage 4: Specification
Time: 5 minutes
Spec:
- [ ] Add "Sort by Discount" button to quote list
- [ ] Highest discount first (descending)
- [ ] Works with existing filters
- [ ] Same styling as other sort buttons

Stage 5: Estimation
Time: 3 minutes
Effort: small (1-4 hours)
Status: status:ready

Stage 6: Development
Time: 1-2 hours
Assigned to: @junior-developer (good first issue)
- Adds sort button to UI (30 min)
- Implements sorting logic (30 min)
- Tests (30 min)
- PR #285 opened

Stage 7: Review
Time: 15 minutes
- Code review: approved
- QA: passes
- Merged

Stage 8: Completion
Time: 5 minutes
- Issue closed
- Feature live ✓
```

---

## Label Reference

### Status Labels (required, choose 1)

| Label | Stage | Meaning | Next |
|-------|-------|---------|------|
| `status:backlog` | 2 | Created but not prioritized | → `status:planned` |
| `status:planned` | 3-4 | Prioritized and being specified | → `status:ready` |
| `status:ready` | 5-6 | Specified and estimated, ready to assign | → `status:in-progress` |
| `status:in-progress` | 6 | Currently being developed | → `status:review` |
| `status:review` | 7 | Dev complete, awaiting review/testing | → `status:done` |
| `status:done` | 8 | Complete, merged, shipped | CLOSED |

### Priority Labels (recommended)

| Label | Meaning | Action | Example |
|-------|---------|--------|---------|
| `priority:critical` | Must fix immediately, blocks work | Do today | System down, major bug |
| `priority:high` | Important, do this sprint | Schedule now | Customer-impacting feature |
| `priority:medium` | Should do, but not urgent | Plan for future sprint | Enhancement, nice-to-have |
| `priority:low` | Can wait, lower priority | Do after high priority | Polish, minor improvement |

### Type Labels (required, choose 1)

| Label | Meaning | Stages | Example |
|-------|---------|--------|---------|
| `type:enhancement` | New feature or improvement | All | Add discount column |
| `type:bug` | Something broken | All | Quote math wrong |
| `type:documentation` | Docs, guides, README | Skips development | Update API docs |
| `type:chore` | Maintenance, refactoring | All | Update dependencies |
| `type:question` | Needs decision or discussion | 1-3 | Should we use Zapier? |

### Sector Labels (required, choose 1)

| Label | Milestone |
|-------|-----------|
| `sector:sales` | Sales & Quoting |
| `sector:production` | Production & Operations |
| `sector:crm` | CRM & Client Management |
| `sector:finance` | Finance & Invoicing |
| `sector:automation` | Automation & Integration |
| `sector:portal` | Customer Portal & Mobile |

### Effort Labels (added in Stage 5)

| Label | Meaning | Developer Time |
|-------|---------|-----------------|
| `effort:xs` | Trivial | < 1 hour |
| `effort:small` | Small | 1-4 hours |
| `effort:medium` | Medium | 4-8 hours (1 day) |
| `effort:large` | Large | 8-24 hours (2-3 days) |
| `effort:xl` | Very Large | 24+ hours (1+ week) |

### Special Labels (as needed)

| Label | When to Use | Action |
|-------|------------|--------|
| `blocked` | Can't proceed, waiting for something | Document blocker in comments |
| `good-first-issue` | Great for new team members | Share with onboarding |
| `help-wanted` | Need input from team | Tag stakeholders for feedback |
| `needs-design` | Waiting for design input | Assign to designer |
| `needs-review` | Code ready for review | Tag reviewer |
| `needs-test` | Feature ready for QA | Send to QA |
| `needs-docs` | Needs documentation | Update docs before closing |
| `duplicate` | Same as another issue | Close and link to original |
| `wontfix` | Decided not to do | Close with explanation |

---

## Edge Cases

### Issue Scope Changes During Development

**Situation**: Developer starts work, realizes scope is bigger than estimated.

**Action**:
1. Post comment: "Scope has changed. Original estimate was X, now appears to be Y."
2. Document what additional work was found
3. **Option A**: Complete the additional work (if still reasonable)
4. **Option B**: Split into new issues and close this one after current scope
5. Update acceptance criteria if needed

### Issue Blocked on Another Issue

**Situation**: Issue can't proceed because it depends on something not done yet.

**Action**:
1. Add `blocked` label
2. Add comment: "Blocked waiting for #[other-issue] to complete"
3. Link to blocking issue
4. Don't assign to developer yet
5. Move to `status:in-progress` only when blocker resolved

### Issue Has Dependencies Across Multiple Sectors

**Situation**: One issue affects multiple sectors.

**Action**:
1. Assign to primary sector (where main work happens)
2. Add cross-sector dependencies as child issues
3. Document in comments which issues it affects
4. Coordinate with other sector leads

Example:
```
Issue #100: "Redesign customer portal" (Portal sector)
├─ Depends on: CRM system API (#50)
├─ Affects: Quote display system (#60) - Sales sector
├─ Affects: Invoice display (#75) - Finance sector
Dependencies documented in issue comments
```

### Bug Found During Development

**Situation**: Developer finds a bug in existing code while working on an issue.

**Action**:
1. **If small fix** (< 15 min): Fix it as part of current work
2. **If medium fix** (15 min - 1 hour): Create new issue, link to current issue, decide if fix now or later
3. **If large fix** (> 1 hour): Create new issue, add to backlog, continue current work

### Multiple People Want to Work on One Issue

**Situation**: Issue is popular and multiple developers want to work on it.

**Action**:
1. First person to comment/assign gets it
2. Break into smaller issues if possible (so multiple can work in parallel)
3. Collaborate on same PR if working together
4. Update issue to note collaboration

### Issue Status Unclear or Stuck

**Situation**: Issue has been in review for days, unclear what's needed.

**Action**:
1. Add comment: "@person - what's the status here?"
2. Set a deadline (24-48 hours to respond)
3. If no response, escalate to tech lead or product
4. Reassign if needed

### Acceptance Criteria Not Met But Close Enough

**Situation**: Developer says "95% done, good enough to ship."

**Action**:
1. **No** - Standards are standards
2. Create follow-up issue for remaining 5%
3. Keep current issue in `status:review` until full acceptance criteria met
4. Then close current issue and create new one for remaining work

---

## Checklist for Each Stage

### ✅ Before Closing an Issue

- [ ] Acceptance criteria all checked/passed
- [ ] PR merged to main branch
- [ ] Code deployed to production
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Final comment posted to issue
- [ ] Issue marked `status:done`
- [ ] Issue closed

### ✅ Before Starting Development

- [ ] Issue has `status:ready` label
- [ ] Effort estimate added
- [ ] Acceptance criteria clear
- [ ] No blockers listed
- [ ] Developer assigned
- [ ] All questions answered

### ✅ Before Going to Review

- [ ] Feature complete and working locally
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] PR created with description
- [ ] PR links to GitHub issue
- [ ] No obvious code issues

### ✅ Before Creating Issue

- [ ] Title is clear (< 10 words)
- [ ] Description explains why this matters
- [ ] Sector determined
- [ ] Type determined (enhancement/bug/etc)
- [ ] Not a duplicate of existing issue
- [ ] Not something that just needs a quick chat

---

## Performance Metrics

After implementing this process, track:

- **Average time from backlog → ready**: < 1 week
- **Average time from ready → in progress**: < 2 weeks
- **Average time from in progress → done**: Varies by effort
- **% of issues with clear acceptance criteria**: 95%+
- **% of developers starting work with status:ready**: 100%
- **Average estimate accuracy**: ±1 effort size

---

## Conclusion

This 8-stage process ensures:

✅ Issues are well-understood before work starts
✅ Effort is estimated accurately
✅ Priorities are clear
✅ Dependencies are visible
✅ Work flows smoothly
✅ Team is aligned
✅ Nothing gets stuck in limbo

**The key principle**: Never let a developer start work on an issue that isn't fully specified and estimated.

---

**Questions?** See ISSUE_QUICK_START.md for quick reference, or SECTOR_MILESTONE_INDEX.md for sector organization.

