name: Integration Checkpoint
description: Track integration testing between phases and verify end-to-end workflows
title: "[CHECKPOINT] "
labels: ["type: test", "priority: critical"]
body:
  - type: markdown
    attributes:
      value: |
        # Integration Checkpoint
        Verify that completed phases work together and real-world workflows function end-to-end.

  - type: dropdown
    id: checkpoint
    attributes:
      label: Checkpoint Type
      options:
        - "Post-Phase 1: Strapi API functional"
        - "Post-Phase 2: Appsmith dashboard connected"
        - "Post-Phase 3: End-to-end workflow test"
        - "Pre-Release: Full system integration"
    validations:
      required: true

  - type: textarea
    id: verification
    attributes:
      label: Verification Checklist
      description: Tests and validations to perform
      value: |
        ## System Health
        - [ ] All services running (docker ps shows all containers)
        - [ ] No error logs in any service
        - [ ] Database accessible with correct schema
        
        ## API Testing
        - [ ] Strapi admin panel loads
        - [ ] API endpoints respond with 200 status
        - [ ] Authentication working
        - [ ] CORS configured correctly
        
        ## UI Testing
        - [ ] Appsmith loads and connects to Strapi
        - [ ] All UI components render
        - [ ] Data displays correctly
        - [ ] Forms submit successfully
        
        ## Workflow Testing
        - [ ] Workflow 1 (Intake): Complete order creation end-to-end
        - [ ] Workflow 2 (Jobs): Job appears in queue and updates
        - [ ] Workflow 3 (Time): Clock in/out records timestamps
        
        ## Data Verification
        - [ ] Data persists across service restarts
        - [ ] Relationships between entities correct
        - [ ] No data corruption or loss
    validations:
      required: true

  - type: textarea
    id: issues
    attributes:
      label: Issues Found
      description: Any blockers or bugs discovered during checkpoint
      placeholder: "Document any failures or unexpected behavior"
    validations:
      required: false

  - type: textarea
    id: signoff
    attributes:
      label: Sign-Off
      value: |
        - [ ] All checks passed
        - [ ] No critical issues
        - [ ] Ready to proceed to next phase
    validations:
      required: true
