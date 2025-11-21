name: Phase Milestone
description: Track completion of a major phase (Strapi, Appsmith, or Botpress)
title: "[PHASE] "
labels: ["type: feature", "priority: critical"]
body:
  - type: markdown
    attributes:
      value: |
        # Phase Milestone Tracking
        Use this to track a complete phase implementation with all its components.
  
  - type: dropdown
    id: phase
    attributes:
      label: Phase
      options:
        - Phase 1: Strapi Backend
        - Phase 2: Appsmith Dashboard
        - Phase 3: Botpress Integration
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Phase Overview
      description: High-level description of what this phase accomplishes
      placeholder: "This phase implements..."
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance Criteria
      description: Checklist of requirements for phase completion
      value: |
        - [ ] Criterion 1
        - [ ] Criterion 2
        - [ ] Criterion 3
        - [ ] All tests passing
        - [ ] Documentation complete
        - [ ] Code reviewed and approved
    validations:
      required: true

  - type: textarea
    id: workflow
    attributes:
      label: Mint Prints Workflows Supported
      description: Which real-world workflows does this phase enable?
      placeholder: |
        - Workflow 1: Order Intake
        - Workflow 2: Job Management
        - Workflow 3: Time Tracking
    validations:
      required: false

  - type: textarea
    id: subtasks
    attributes:
      label: Subtasks
      description: Break down the phase into specific implementation tasks
      value: |
        ### Tasks
        - [ ] Task 1
        - [ ] Task 2
        - [ ] Task 3
    validations:
      required: true

  - type: textarea
    id: documentation
    attributes:
      label: Related Documentation
      placeholder: |
        - [Phase Guide](../docs/phases/phase-x-*.md)
        - [Architecture](../docs/architecture/system-overview.md)
    validations:
      required: false

  - type: input
    id: timeline
    attributes:
      label: Estimated Timeline
      placeholder: "e.g., 4-6 hours"
    validations:
      required: false
