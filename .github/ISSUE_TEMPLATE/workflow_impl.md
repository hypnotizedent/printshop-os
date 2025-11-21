name: Workflow Implementation
description: Implement a real-world Mint Prints workflow (order intake, job management, or time tracking)
title: "[WORKFLOW] "
labels: ["type: feature", "workflow: customer-intake"]
body:
  - type: markdown
    attributes:
      value: |
        # Real-World Workflow Implementation
        Map a Mint Prints business workflow to GitHub implementation tasks.

  - type: dropdown
    id: workflow
    attributes:
      label: Workflow
      options:
        - "Workflow 1: Customer Order Intake (24/7)"
        - "Workflow 2: Production Job Management"
        - "Workflow 3: Employee Time Tracking"
      description: Which end-to-end workflow are we implementing?
    validations:
      required: true

  - type: textarea
    id: overview
    attributes:
      label: Workflow Overview
      description: Describe the business process flow
      value: |
        ## Process
        1. Trigger: 
        2. Steps:
           - Step 1
           - Step 2
           - Step 3
        3. Success Outcome:
    validations:
      required: true

  - type: textarea
    id: technical
    attributes:
      label: Technical Components
      description: Which system components are involved?
      value: |
        - [ ] Strapi (backend data)
        - [ ] Appsmith (frontend interface)
        - [ ] Botpress (conversational layer)
        - [ ] PostgreSQL (persistence)
        - [ ] Docker (deployment)
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: End-to-End Acceptance Criteria
      description: Full workflow must be testable
      value: |
        - [ ] Process starts successfully
        - [ ] All data captured correctly
        - [ ] State transitions properly
        - [ ] Data persists in database
        - [ ] Manual testing completed
        - [ ] Documented in implementation guide
    validations:
      required: true

  - type: textarea
    id: implementation
    attributes:
      label: Implementation Tasks
      description: Specific code/config changes needed
      value: |
        - [ ] Backend implementation (Strapi APIs)
        - [ ] Frontend implementation (Appsmith UI)
        - [ ] Integration testing
        - [ ] Documentation updates
    validations:
      required: true

  - type: input
    id: estimation
    attributes:
      label: Story Points / Time Estimate
      placeholder: "e.g., 8 points or 3-4 hours"
    validations:
      required: false
