/**
 * Department Constants
 * Shared constants for department assignment across API and Strapi
 */

export type Department = 'screen_printing' | 'embroidery' | 'digital';

// Pattern definitions for print method matching
export const SCREEN_PRINTING_PATTERNS = ['screen print', 'silk screen', 'screen-print', 'silkscreen', 'screen printing'];
export const EMBROIDERY_PATTERNS = ['embroidery', 'embroidered', 'embroider'];
export const DIGITAL_PATTERNS = ['dtg', 'vinyl', 'heat press', 'sublimation', 'heat transfer', 'direct to garment', 'dye sublimation'];

export const DEPARTMENT_DISPLAY_NAMES: Record<Department, string> = {
  screen_printing: 'Screen Printing',
  embroidery: 'Embroidery',
  digital: 'Digital',
};

export const ALL_DEPARTMENTS: Department[] = ['screen_printing', 'embroidery', 'digital'];
