/**
 * Job Lifecycle Hooks
 * Auto-assigns department when job is created or updated with print method
 */

// Department patterns for print method matching
const SCREEN_PRINTING_PATTERNS = ['screen print', 'silk screen', 'screen-print', 'silkscreen', 'screen printing'];
const EMBROIDERY_PATTERNS = ['embroidery', 'embroidered', 'embroider'];
const DIGITAL_PATTERNS = ['dtg', 'vinyl', 'heat press', 'sublimation', 'heat transfer', 'direct to garment', 'dye sublimation'];

type Department = 'screen_printing' | 'embroidery' | 'digital';

/**
 * Determines department based on print method string
 */
function getDepartmentForPrintMethod(printMethod: string | undefined | null): Department | null {
  if (!printMethod || typeof printMethod !== 'string' || printMethod.trim() === '') {
    return null;
  }

  const normalizedMethod = printMethod.toLowerCase().trim();

  // Check screen printing patterns
  for (const pattern of SCREEN_PRINTING_PATTERNS) {
    if (normalizedMethod.includes(pattern)) {
      return 'screen_printing';
    }
  }

  // Check embroidery patterns
  for (const pattern of EMBROIDERY_PATTERNS) {
    if (normalizedMethod.includes(pattern)) {
      return 'embroidery';
    }
  }

  // Check digital patterns
  for (const pattern of DIGITAL_PATTERNS) {
    if (normalizedMethod.includes(pattern)) {
      return 'digital';
    }
  }

  return null;
}

/**
 * Auto-assigns department based on job data
 */
function autoAssignDepartment(data: any): Department | null {
  // Try print method first
  let department = getDepartmentForPrintMethod(data.printMethod);
  
  // Fall back to product description
  if (!department && data.productDescription) {
    department = getDepartmentForPrintMethod(data.productDescription);
  }
  
  // Fall back to production notes
  if (!department && data.productionNotes) {
    department = getDepartmentForPrintMethod(data.productionNotes);
  }
  
  return department;
}

export default {
  async beforeCreate(event: { params: { data: any } }) {
    const { data } = event.params;
    
    // Only auto-assign if department is not already set
    if (!data.department) {
      const department = autoAssignDepartment(data);
      if (department) {
        data.department = department;
      }
    }
  },

  async beforeUpdate(event: { params: { data: any } }) {
    const { data } = event.params;
    
    // Re-evaluate department if print method, product description, or production notes changed
    // and department is not explicitly set in this update
    if ((data.printMethod || data.productDescription || data.productionNotes) && data.department === undefined) {
      const department = autoAssignDepartment(data);
      if (department) {
        data.department = department;
      }
    }
  },
};
