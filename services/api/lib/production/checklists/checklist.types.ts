/**
 * Types for the Press-Ready Checklist System
 * 
 * This module defines the core data structures for production checklist management,
 * including templates, instances, and steps.
 */

/**
 * Step types available in checklists
 */
export type StepType = 'checkbox' | 'photo' | 'text' | 'signature' | 'number';

/**
 * Checklist instance status states
 */
export type ChecklistStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Approved';

/**
 * Job types that can have checklists
 */
export type JobType = 'Screen Print' | 'DTG' | 'Embroidery' | 'Other';

/**
 * Validation rules for checklist steps
 */
export interface StepValidation {
  min?: number;
  max?: number;
  regex?: string;
}

/**
 * Individual step in a checklist template
 */
export interface ChecklistStep {
  id: string;
  order: number;
  title: string;
  description?: string;
  required: boolean;
  type: StepType;
  conditionalOn?: string;      // Show only if step with this ID is completed
  conditionalValue?: any;      // Expected value to show this step
  options?: string[];          // For select/radio types
  validation?: StepValidation;
}

/**
 * Checklist template definition
 */
export interface ChecklistTemplate {
  id: string;
  name: string;
  jobType: JobType;
  version: number;
  steps: ChecklistStep[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Completed step in a checklist instance
 */
export interface CompletedStep {
  stepId: string;
  completed: boolean;
  value?: any;                 // Checkbox, text, number, photo URL, signature URL
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  photoUrls?: string[];
}

/**
 * Checklist instance for a specific job
 */
export interface ChecklistInstance {
  id: string;
  jobNumber: string;
  templateId: string;
  templateVersion: number;
  status: ChecklistStatus;
  startedAt?: Date;
  startedBy?: string;
  completedAt?: Date;
  completedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  steps: CompletedStep[];
}

/**
 * Request to create a new template
 */
export interface CreateTemplateRequest {
  name: string;
  jobType: JobType;
  steps: Omit<ChecklistStep, 'id'>[];
}

/**
 * Request to update a template
 */
export interface UpdateTemplateRequest {
  name?: string;
  jobType?: JobType;
  steps?: ChecklistStep[];
}

/**
 * Request to start a checklist
 */
export interface StartChecklistRequest {
  templateId: string;
  jobNumber: string;
  startedBy: string;
}

/**
 * Request to update a step
 */
export interface UpdateStepRequest {
  stepId: string;
  completed: boolean;
  value?: any;
  notes?: string;
  completedBy: string;
}

/**
 * Request to complete a checklist
 */
export interface CompleteChecklistRequest {
  completedBy: string;
}

/**
 * Request to approve a checklist (manager)
 */
export interface ApproveChecklistRequest {
  approvedBy: string;
}

/**
 * Photo upload request
 */
export interface PhotoUploadRequest {
  stepId: string;
  photo: Buffer | string;      // Base64 encoded or file buffer
  contentType: string;
  uploadedBy: string;
}

/**
 * Checklist history entry
 */
export interface ChecklistHistoryEntry {
  id: string;
  jobNumber: string;
  templateName: string;
  status: ChecklistStatus;
  startedAt?: Date;
  startedBy?: string;
  completedAt?: Date;
  completedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  duration?: number;           // Duration in minutes
}
