/**
 * Comprehensive tests for the Press-Ready Checklist System
 * 
 * Tests cover:
 * - Template CRUD operations
 * - Checklist lifecycle (start, update, complete, approve)
 * - Photo upload handling
 * - Conditional step logic
 * - Manager approval workflow
 * - Production start blocking
 * - Checklist history
 */

import {
  templateService,
  checklistService,
  CreateTemplateRequest,
  StartChecklistRequest,
  UpdateStepRequest,
} from '../lib/production/checklists';

describe('Template Service', () => {
  beforeEach(() => {
    templateService.resetToDefaults();
  });

  describe('Default Templates', () => {
    test('should initialize with default templates', () => {
      const templates = templateService.getAllTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3);
      
      const screenPrint = templates.find(t => t.jobType === 'Screen Print');
      const dtg = templates.find(t => t.jobType === 'DTG');
      const embroidery = templates.find(t => t.jobType === 'Embroidery');
      
      expect(screenPrint).toBeDefined();
      expect(dtg).toBeDefined();
      expect(embroidery).toBeDefined();
    });

    test('should have correct step structure in screen print template', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      expect(templates.length).toBeGreaterThan(0);
      
      const template = templates[0];
      expect(template.steps.length).toBeGreaterThan(0);
      expect(template.steps[0]).toHaveProperty('id');
      expect(template.steps[0]).toHaveProperty('order');
      expect(template.steps[0]).toHaveProperty('title');
      expect(template.steps[0]).toHaveProperty('required');
      expect(template.steps[0]).toHaveProperty('type');
    });
  });

  describe('Template CRUD Operations', () => {
    test('should create a new template', () => {
      const request: CreateTemplateRequest = {
        name: 'Custom Screen Print',
        jobType: 'Screen Print',
        steps: [
          {
            order: 1,
            title: 'Custom Step 1',
            required: true,
            type: 'checkbox',
          },
          {
            order: 2,
            title: 'Custom Step 2',
            required: false,
            type: 'text',
          },
        ],
      };

      const template = templateService.createTemplate(request, 'user-123');
      
      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe('Custom Screen Print');
      expect(template.jobType).toBe('Screen Print');
      expect(template.version).toBe(1);
      expect(template.steps.length).toBe(2);
      expect(template.steps[0].id).toBeDefined();
      expect(template.createdBy).toBe('user-123');
    });

    test('should retrieve template by ID', () => {
      const templates = templateService.getAllTemplates();
      const templateId = templates[0].id;
      
      const retrieved = templateService.getTemplateById(templateId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(templateId);
    });

    test('should filter templates by job type', () => {
      const screenPrintTemplates = templateService.getTemplatesByJobType('Screen Print');
      const dtgTemplates = templateService.getTemplatesByJobType('DTG');
      
      expect(screenPrintTemplates.length).toBeGreaterThan(0);
      expect(dtgTemplates.length).toBeGreaterThan(0);
      
      screenPrintTemplates.forEach(t => {
        expect(t.jobType).toBe('Screen Print');
      });
    });

    test('should update template and increment version', () => {
      const templates = templateService.getAllTemplates();
      const templateId = templates[0].id;
      const originalVersion = templates[0].version;
      
      const updated = templateService.updateTemplate(templateId, {
        name: 'Updated Template Name',
      });
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Template Name');
      expect(updated?.version).toBe(originalVersion + 1);
    });

    test('should delete template', () => {
      const request: CreateTemplateRequest = {
        name: 'To Be Deleted',
        jobType: 'Screen Print',
        steps: [
          { order: 1, title: 'Step 1', required: true, type: 'checkbox' },
        ],
      };

      const template = templateService.createTemplate(request);
      const deleted = templateService.deleteTemplate(template.id);
      
      expect(deleted).toBe(true);
      expect(templateService.getTemplateById(template.id)).toBeNull();
    });

    test('should return null when updating non-existent template', () => {
      const updated = templateService.updateTemplate('non-existent-id', {
        name: 'Should Not Work',
      });
      
      expect(updated).toBeNull();
    });
  });
});

describe('Checklist Service', () => {
  beforeEach(() => {
    templateService.resetToDefaults();
    checklistService.clearAllChecklists();
  });

  describe('Checklist Lifecycle', () => {
    test('should start a new checklist', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const request: StartChecklistRequest = {
        templateId: template.id,
        jobNumber: 'JOB-001',
        startedBy: 'user-123',
      };

      const checklist = checklistService.startChecklist(request);
      
      expect(checklist).toBeDefined();
      expect(checklist?.id).toBeDefined();
      expect(checklist?.jobNumber).toBe('JOB-001');
      expect(checklist?.status).toBe('In Progress');
      expect(checklist?.startedAt).toBeDefined();
      expect(checklist?.startedBy).toBe('user-123');
      expect(checklist?.steps.length).toBe(template.steps.length);
    });

    test('should return null when starting checklist with invalid template', () => {
      const request: StartChecklistRequest = {
        templateId: 'non-existent-template',
        jobNumber: 'JOB-001',
        startedBy: 'user-123',
      };

      const checklist = checklistService.startChecklist(request);
      expect(checklist).toBeNull();
    });

    test('should retrieve checklist by job number', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-002',
        startedBy: 'user-123',
      });

      const retrieved = checklistService.getChecklistByJobNumber('JOB-002');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.jobNumber).toBe('JOB-002');
    });

    test('should retrieve checklist by ID', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-003',
        startedBy: 'user-123',
      });

      const retrieved = checklistService.getChecklistById(checklist!.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(checklist!.id);
    });
  });

  describe('Step Updates', () => {
    test('should update a step', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-004',
        startedBy: 'user-123',
      });

      const stepId = checklist!.steps[0].stepId;
      const updateRequest: UpdateStepRequest = {
        stepId,
        completed: true,
        value: true,
        notes: 'Step completed successfully',
        completedBy: 'user-123',
      };

      const updated = checklistService.updateStep(checklist!.id, updateRequest);
      
      expect(updated).toBeDefined();
      const updatedStep = updated?.steps.find(s => s.stepId === stepId);
      expect(updatedStep?.completed).toBe(true);
      expect(updatedStep?.value).toBe(true);
      expect(updatedStep?.notes).toBe('Step completed successfully');
      expect(updatedStep?.completedAt).toBeDefined();
      expect(updatedStep?.completedBy).toBe('user-123');
    });

    test('should return null when updating step in non-existent checklist', () => {
      const updateRequest: UpdateStepRequest = {
        stepId: 'step-id',
        completed: true,
        completedBy: 'user-123',
      };

      const updated = checklistService.updateStep('non-existent-checklist', updateRequest);
      expect(updated).toBeNull();
    });
  });

  describe('Photo Upload', () => {
    test('should upload photo for a step', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-005',
        startedBy: 'user-123',
      });

      // Find a photo step
      const photoStep = template.steps.find(s => s.type === 'photo');
      expect(photoStep).toBeDefined();

      const photoUrl = checklistService.uploadPhoto(checklist!.id, {
        stepId: photoStep!.id,
        photo: 'base64-encoded-data',
        contentType: 'image/jpeg',
        uploadedBy: 'user-123',
      });

      expect(photoUrl).toBeDefined();
      expect(photoUrl).toContain('/photos/');

      const updated = checklistService.getChecklistById(checklist!.id);
      const step = updated?.steps.find(s => s.stepId === photoStep!.id);
      expect(step?.photoUrls).toBeDefined();
      expect(step?.photoUrls?.length).toBe(1);
      expect(step?.photoUrls?.[0]).toBe(photoUrl);
    });

    test('should allow multiple photos for a step', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-006',
        startedBy: 'user-123',
      });

      const photoStep = template.steps.find(s => s.type === 'photo');
      
      checklistService.uploadPhoto(checklist!.id, {
        stepId: photoStep!.id,
        photo: 'photo1-data',
        contentType: 'image/jpeg',
        uploadedBy: 'user-123',
      });

      checklistService.uploadPhoto(checklist!.id, {
        stepId: photoStep!.id,
        photo: 'photo2-data',
        contentType: 'image/jpeg',
        uploadedBy: 'user-123',
      });

      const updated = checklistService.getChecklistById(checklist!.id);
      const step = updated?.steps.find(s => s.stepId === photoStep!.id);
      expect(step?.photoUrls?.length).toBe(2);
    });
  });

  describe('Checklist Completion', () => {
    test('should complete checklist when all required steps are done', () => {
      const templates = templateService.getTemplatesByJobType('DTG');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-007',
        startedBy: 'user-123',
      });

      // Complete all required steps
      template.steps.filter(s => s.required).forEach(step => {
        checklistService.updateStep(checklist!.id, {
          stepId: step.id,
          completed: true,
          completedBy: 'user-123',
        });
      });

      const completed = checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      expect(completed).toBeDefined();
      expect(completed?.status).toBe('Completed');
      expect(completed?.completedAt).toBeDefined();
      expect(completed?.completedBy).toBe('user-123');
    });

    test('should throw error when completing checklist with incomplete required steps', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-008',
        startedBy: 'user-123',
      });

      // Complete only some steps
      checklistService.updateStep(checklist!.id, {
        stepId: template.steps[0].id,
        completed: true,
        completedBy: 'user-123',
      });

      expect(() => {
        checklistService.completeChecklist(checklist!.id, {
          completedBy: 'user-123',
        });
      }).toThrow('Cannot complete checklist');
    });
  });

  describe('Manager Approval', () => {
    test('should approve completed checklist', () => {
      const templates = templateService.getTemplatesByJobType('DTG');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-009',
        startedBy: 'user-123',
      });

      // Complete all required steps
      template.steps.filter(s => s.required).forEach(step => {
        checklistService.updateStep(checklist!.id, {
          stepId: step.id,
          completed: true,
          completedBy: 'user-123',
        });
      });

      checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      const approved = checklistService.approveChecklist(checklist!.id, {
        approvedBy: 'manager-456',
      });

      expect(approved).toBeDefined();
      expect(approved?.status).toBe('Approved');
      expect(approved?.approvedAt).toBeDefined();
      expect(approved?.approvedBy).toBe('manager-456');
    });

    test('should throw error when approving non-completed checklist', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-010',
        startedBy: 'user-123',
      });

      expect(() => {
        checklistService.approveChecklist(checklist!.id, {
          approvedBy: 'manager-456',
        });
      }).toThrow('Cannot approve checklist');
    });
  });

  describe('Production Start Blocking', () => {
    test('should allow production start when checklist is approved', () => {
      const templates = templateService.getTemplatesByJobType('DTG');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-011',
        startedBy: 'user-123',
      });

      // Complete all required steps
      template.steps.filter(s => s.required).forEach(step => {
        checklistService.updateStep(checklist!.id, {
          stepId: step.id,
          completed: true,
          completedBy: 'user-123',
        });
      });

      checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      checklistService.approveChecklist(checklist!.id, {
        approvedBy: 'manager-456',
      });

      const result = checklistService.canStartProduction('JOB-011');
      
      expect(result.canStart).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('should block production when checklist not started', () => {
      const result = checklistService.canStartProduction('JOB-NO-CHECKLIST');
      
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('No checklist started');
    });

    test('should block production when checklist incomplete', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-012',
        startedBy: 'user-123',
      });

      const result = checklistService.canStartProduction('JOB-012');
      
      expect(result.canStart).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.missingSteps).toBeDefined();
      expect(result.missingSteps!.length).toBeGreaterThan(0);
    });

    test('should block production when checklist completed but not approved', () => {
      const templates = templateService.getTemplatesByJobType('DTG');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-013',
        startedBy: 'user-123',
      });

      // Complete all required steps
      template.steps.filter(s => s.required).forEach(step => {
        checklistService.updateStep(checklist!.id, {
          stepId: step.id,
          completed: true,
          completedBy: 'user-123',
        });
      });

      checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      const result = checklistService.canStartProduction('JOB-013');
      
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('awaiting manager approval');
    });
  });

  describe('Checklist History', () => {
    test('should retrieve checklist history for a job', () => {
      const templates = templateService.getTemplatesByJobType('Screen Print');
      const template = templates[0];
      
      // Create first checklist
      checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-014',
        startedBy: 'user-123',
      });

      // Create second checklist
      checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-014',
        startedBy: 'user-456',
      });

      const history = checklistService.getChecklistHistory('JOB-014');
      
      expect(history.length).toBe(2);
      expect(history[0].jobNumber).toBe('JOB-014');
      expect(history[0].templateName).toBe(template.name);
    });

    test('should calculate duration in checklist history', () => {
      const templates = templateService.getTemplatesByJobType('DTG');
      const template = templates[0];
      
      const checklist = checklistService.startChecklist({
        templateId: template.id,
        jobNumber: 'JOB-015',
        startedBy: 'user-123',
      });

      // Complete all required steps
      template.steps.filter(s => s.required).forEach(step => {
        checklistService.updateStep(checklist!.id, {
          stepId: step.id,
          completed: true,
          completedBy: 'user-123',
        });
      });

      checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      const history = checklistService.getChecklistHistory('JOB-015');
      
      expect(history.length).toBe(1);
      expect(history[0].duration).toBeDefined();
      expect(history[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Conditional Steps', () => {
    test('should handle conditional steps correctly', () => {
      // Create template with conditional step
      const template = templateService.createTemplate({
        name: 'Test with Conditionals',
        jobType: 'Screen Print',
        steps: [
          {
            order: 1,
            title: 'Test Print',
            required: true,
            type: 'checkbox',
          },
          {
            order: 2,
            title: 'Reprint Setup',
            description: 'Only show if test print fails',
            required: true,
            type: 'text',
          },
        ],
      });

      // Manually add conditional logic to the template
      const step1Id = template.steps[0].id;
      const step2Id = template.steps[1].id;
      
      templateService.updateTemplate(template.id, {
        steps: [
          {
            ...template.steps[0],
            id: step1Id,
          },
          {
            ...template.steps[1],
            id: step2Id,
            conditionalOn: step1Id,
            conditionalValue: false,
          },
        ],
      });

      const updatedTemplate = templateService.getTemplateById(template.id);

      const checklist = checklistService.startChecklist({
        templateId: updatedTemplate!.id,
        jobNumber: 'JOB-016',
        startedBy: 'user-123',
      });

      // Complete first step with success (true)
      checklistService.updateStep(checklist!.id, {
        stepId: step1Id,
        completed: true,
        value: true,
        completedBy: 'user-123',
      });

      // Try to complete checklist - should succeed because conditional step is hidden
      const completed = checklistService.completeChecklist(checklist!.id, {
        completedBy: 'user-123',
      });

      expect(completed).toBeDefined();
      expect(completed?.status).toBe('Completed');
    });
  });
});
