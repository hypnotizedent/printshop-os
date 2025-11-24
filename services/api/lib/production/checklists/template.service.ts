/**
 * Template Service for Checklist Management
 * 
 * Handles CRUD operations for checklist templates
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ChecklistTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  JobType,
} from './checklist.types';

/**
 * In-memory storage for templates (in production, this would use a database)
 */
class TemplateService {
  private templates: Map<string, ChecklistTemplate> = new Map();

  /**
   * Initialize service with default templates
   */
  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create default templates for each job type
   */
  private initializeDefaultTemplates(): void {
    // Screen Print template
    this.createTemplate({
      name: 'Screen Print Setup',
      jobType: 'Screen Print',
      steps: [
        {
          order: 1,
          title: 'Screens Prepared',
          description: 'Verify all screens are prepared and ready',
          required: true,
          type: 'photo',
        },
        {
          order: 2,
          title: 'Ink Colors Mixed',
          description: 'Mix and verify all required ink colors',
          required: true,
          type: 'photo',
        },
        {
          order: 3,
          title: 'Test Print Quality',
          description: 'Verify registration, color match, and coverage',
          required: true,
          type: 'checkbox',
        },
        {
          order: 4,
          title: 'Garment Check',
          description: 'Verify correct brand, color, sizes, and count',
          required: true,
          type: 'number',
          validation: { min: 0 },
        },
        {
          order: 5,
          title: 'Press Setup',
          description: 'Configure platen and check tension',
          required: true,
          type: 'checkbox',
        },
        {
          order: 6,
          title: 'Flash Unit Temperature',
          description: 'Set and verify flash unit temperature',
          required: true,
          type: 'number',
          validation: { min: 250, max: 400 },
        },
        {
          order: 7,
          title: 'Conveyor Dryer Settings',
          description: 'Configure temperature and belt speed',
          required: true,
          type: 'text',
        },
        {
          order: 8,
          title: 'Final Sign-Off',
          description: 'Manager approval to begin production',
          required: true,
          type: 'signature',
        },
      ],
    }, 'system');

    // DTG template
    this.createTemplate({
      name: 'DTG Setup',
      jobType: 'DTG',
      steps: [
        {
          order: 1,
          title: 'Pre-treatment Applied',
          required: true,
          type: 'checkbox',
        },
        {
          order: 2,
          title: 'Pre-treatment Dried',
          required: true,
          type: 'checkbox',
        },
        {
          order: 3,
          title: 'Design Alignment Check',
          required: true,
          type: 'checkbox',
        },
        {
          order: 4,
          title: 'Test Print',
          description: 'Verify print quality on test garment',
          required: true,
          type: 'photo',
        },
        {
          order: 5,
          title: 'Color Calibration',
          required: true,
          type: 'checkbox',
        },
        {
          order: 6,
          title: 'Garment Count Verified',
          required: true,
          type: 'number',
          validation: { min: 0 },
        },
        {
          order: 7,
          title: 'Final Sign-Off',
          required: true,
          type: 'signature',
        },
      ],
    }, 'system');

    // Embroidery template
    this.createTemplate({
      name: 'Embroidery Setup',
      jobType: 'Embroidery',
      steps: [
        {
          order: 1,
          title: 'Digitized File Loaded',
          required: true,
          type: 'checkbox',
        },
        {
          order: 2,
          title: 'Thread Colors Matched',
          required: true,
          type: 'checkbox',
        },
        {
          order: 3,
          title: 'Bobbin Check',
          required: true,
          type: 'checkbox',
        },
        {
          order: 4,
          title: 'Hoop Selection',
          required: true,
          type: 'text',
        },
        {
          order: 5,
          title: 'Backing Material Loaded',
          required: true,
          type: 'checkbox',
        },
        {
          order: 6,
          title: 'Test Stitch',
          description: 'Verify stitch quality on test material',
          required: true,
          type: 'photo',
        },
        {
          order: 7,
          title: 'Tension Adjustment',
          required: true,
          type: 'checkbox',
        },
        {
          order: 8,
          title: 'Final Sign-Off',
          required: true,
          type: 'signature',
        },
      ],
    }, 'system');
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ChecklistTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by job type
   */
  getTemplatesByJobType(jobType: JobType): ChecklistTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.jobType === jobType);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): ChecklistTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Create a new template
   */
  createTemplate(request: CreateTemplateRequest, createdBy: string = 'system'): ChecklistTemplate {
    const now = new Date();
    const template: ChecklistTemplate = {
      id: uuidv4(),
      name: request.name,
      jobType: request.jobType,
      version: 1,
      steps: request.steps.map((step, index) => ({
        ...step,
        id: uuidv4(),
        order: step.order ?? index + 1,
      })),
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Update an existing template (creates new version)
   */
  updateTemplate(id: string, request: UpdateTemplateRequest): ChecklistTemplate | null {
    const existing = this.templates.get(id);
    if (!existing) {
      return null;
    }

    const updated: ChecklistTemplate = {
      ...existing,
      name: request.name ?? existing.name,
      jobType: request.jobType ?? existing.jobType,
      steps: request.steps ?? existing.steps,
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Clear all templates (for testing)
   */
  clearAllTemplates(): void {
    this.templates.clear();
  }

  /**
   * Reset to default templates (for testing)
   */
  resetToDefaults(): void {
    this.clearAllTemplates();
    this.initializeDefaultTemplates();
  }
}

// Export singleton instance
export const templateService = new TemplateService();
