/**
 * Checklist Service for Managing Checklist Instances
 * 
 * Handles checklist lifecycle: start, update steps, complete, approve
 */

const { v4: uuidv4 } = require('uuid');
import {
  ChecklistInstance,
  StartChecklistRequest,
  UpdateStepRequest,
  CompleteChecklistRequest,
  ApproveChecklistRequest,
  PhotoUploadRequest,
  ChecklistHistoryEntry,
} from './checklist.types';
import { templateService } from './template.service';

/**
 * Service for managing checklist instances
 */
class ChecklistService {
  private instances: Map<string, ChecklistInstance[]> = new Map();
  private photoStorage: Map<string, string[]> = new Map();

  /**
   * Start a new checklist for a job
   */
  startChecklist(request: StartChecklistRequest): ChecklistInstance | null {
    const template = templateService.getTemplateById(request.templateId);
    if (!template) {
      return null;
    }

    const now = new Date();
    const instance: ChecklistInstance = {
      id: uuidv4(),
      jobNumber: request.jobNumber,
      templateId: request.templateId,
      templateVersion: template.version,
      status: 'In Progress',
      startedAt: now,
      startedBy: request.startedBy,
      steps: template.steps.map(step => ({
        stepId: step.id,
        completed: false,
      })),
    };

    // Store instance by job number
    const jobInstances = this.instances.get(request.jobNumber) || [];
    jobInstances.push(instance);
    this.instances.set(request.jobNumber, jobInstances);

    return instance;
  }

  /**
   * Get checklist for a job (returns most recent)
   */
  getChecklistByJobNumber(jobNumber: string): ChecklistInstance | null {
    const jobInstances = this.instances.get(jobNumber);
    if (!jobInstances || jobInstances.length === 0) {
      return null;
    }
    
    // Return most recent (last in array)
    return jobInstances[jobInstances.length - 1];
  }

  /**
   * Get checklist by ID
   */
  getChecklistById(id: string): ChecklistInstance | null {
    for (const instances of this.instances.values()) {
      const found = instances.find(i => i.id === id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Update a step in the checklist
   */
  updateStep(checklistId: string, request: UpdateStepRequest): ChecklistInstance | null {
    const checklist = this.getChecklistById(checklistId);
    if (!checklist) {
      return null;
    }

    const step = checklist.steps.find(s => s.stepId === request.stepId);
    if (!step) {
      return null;
    }

    // Update step
    step.completed = request.completed;
    step.value = request.value;
    step.notes = request.notes;
    step.completedAt = new Date();
    step.completedBy = request.completedBy;

    return checklist;
  }

  /**
   * Upload photo for a step
   */
  uploadPhoto(checklistId: string, request: PhotoUploadRequest): string | null {
    const checklist = this.getChecklistById(checklistId);
    if (!checklist) {
      return null;
    }

    const step = checklist.steps.find(s => s.stepId === request.stepId);
    if (!step) {
      return null;
    }

    // Generate photo URL (in production, this would upload to S3 or similar)
    const photoId = uuidv4();
    const photoUrl = `/api/production/checklists/${checklistId}/photos/${photoId}`;

    // Store photo
    const key = `${checklistId}-${request.stepId}`;
    const photos = this.photoStorage.get(key) || [];
    photos.push(photoUrl);
    this.photoStorage.set(key, photos);

    // Update step with photo URL
    if (!step.photoUrls) {
      step.photoUrls = [];
    }
    step.photoUrls.push(photoUrl);

    return photoUrl;
  }

  /**
   * Complete a checklist (all required steps must be done)
   */
  completeChecklist(checklistId: string, request: CompleteChecklistRequest): ChecklistInstance | null {
    const checklist = this.getChecklistById(checklistId);
    if (!checklist) {
      return null;
    }

    // Get template to check required steps
    const template = templateService.getTemplateById(checklist.templateId);
    if (!template) {
      return null;
    }

    // Check only visible required steps (respects conditional logic)
    const visibleSteps = this.getVisibleSteps(checklist, template.steps);
    const allVisibleRequired = visibleSteps
      .filter(s => s.required)
      .every(templateStep => {
        const completedStep = checklist.steps.find(s => s.stepId === templateStep.id);
        return completedStep && completedStep.completed;
      });

    if (!allVisibleRequired) {
      const missingSteps = visibleSteps
        .filter(s => {
          if (!s.required) return false;
          const completedStep = checklist.steps.find(cs => cs.stepId === s.id);
          return !completedStep || !completedStep.completed;
        })
        .map(s => s.title);
      throw new Error(`Cannot complete checklist: not all required steps are completed. Missing: ${missingSteps.join(', ')}`);
    }

    checklist.status = 'Completed';
    checklist.completedAt = new Date();
    checklist.completedBy = request.completedBy;

    return checklist;
  }

  /**
   * Approve a completed checklist (manager only)
   */
  approveChecklist(checklistId: string, request: ApproveChecklistRequest): ChecklistInstance | null {
    const checklist = this.getChecklistById(checklistId);
    if (!checklist) {
      return null;
    }

    if (checklist.status !== 'Completed') {
      throw new Error('Cannot approve checklist: checklist must be completed first');
    }

    checklist.status = 'Approved';
    checklist.approvedAt = new Date();
    checklist.approvedBy = request.approvedBy;

    return checklist;
  }

  /**
   * Get checklist history for a job
   */
  getChecklistHistory(jobNumber: string): ChecklistHistoryEntry[] {
    const jobInstances = this.instances.get(jobNumber) || [];
    
    return jobInstances.map(instance => {
      const template = templateService.getTemplateById(instance.templateId);
      const duration = instance.startedAt && instance.completedAt
        ? Math.floor((instance.completedAt.getTime() - instance.startedAt.getTime()) / 60000)
        : undefined;

      return {
        id: instance.id,
        jobNumber: instance.jobNumber,
        templateName: template?.name || 'Unknown Template',
        status: instance.status,
        startedAt: instance.startedAt,
        startedBy: instance.startedBy,
        completedAt: instance.completedAt,
        completedBy: instance.completedBy,
        approvedAt: instance.approvedAt,
        approvedBy: instance.approvedBy,
        duration,
      };
    });
  }

  /**
   * Check if production can start for a job
   */
  canStartProduction(jobNumber: string): { canStart: boolean; reason?: string; missingSteps?: string[] } {
    const checklist = this.getChecklistByJobNumber(jobNumber);
    
    if (!checklist) {
      return { canStart: false, reason: 'No checklist started for this job' };
    }

    if (checklist.status === 'Approved') {
      return { canStart: true };
    }

    if (checklist.status === 'Completed') {
      return { canStart: false, reason: 'Checklist completed but awaiting manager approval' };
    }

    // Get template and check missing steps
    const template = templateService.getTemplateById(checklist.templateId);
    if (!template) {
      return { canStart: false, reason: 'Template not found' };
    }

    const visibleSteps = this.getVisibleSteps(checklist, template.steps);
    const missingSteps = visibleSteps
      .filter(step => {
        if (!step.required) return false;
        const completedStep = checklist.steps.find(s => s.stepId === step.id);
        return !completedStep || !completedStep.completed;
      })
      .map(step => step.title);

    if (missingSteps.length > 0) {
      return {
        canStart: false,
        reason: `${missingSteps.length} required step(s) incomplete`,
        missingSteps,
      };
    }

    return { canStart: false, reason: 'Checklist not completed' };
  }

  /**
   * Get visible steps based on conditional logic
   */
  private getVisibleSteps(checklist: ChecklistInstance, templateSteps: any[]): any[] {
    return templateSteps.filter(step => {
      if (!step.conditionalOn) {
        return true; // Always visible if no condition
      }

      const conditionalStep = checklist.steps.find(s => s.stepId === step.conditionalOn);
      if (!conditionalStep) {
        return false;
      }

      // Check if conditional value matches
      if (step.conditionalValue !== undefined) {
        return conditionalStep.value === step.conditionalValue;
      }

      // Default: show if conditional step is completed
      return conditionalStep.completed;
    });
  }

  /**
   * Clear all checklists (for testing)
   */
  clearAllChecklists(): void {
    this.instances.clear();
    this.photoStorage.clear();
  }

  /**
   * Get all checklists (for testing/admin)
   */
  getAllChecklists(): ChecklistInstance[] {
    const all: ChecklistInstance[] = [];
    for (const instances of this.instances.values()) {
      all.push(...instances);
    }
    return all;
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();
