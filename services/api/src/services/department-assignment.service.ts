/**
 * Department Assignment Service
 * Handles auto-routing of jobs to the correct department based on print method
 */

import {
  Department,
  SCREEN_PRINTING_PATTERNS,
  EMBROIDERY_PATTERNS,
  DIGITAL_PATTERNS,
  DEPARTMENT_DISPLAY_NAMES,
  ALL_DEPARTMENTS,
} from './department-constants';

// Re-export the Department type for external consumers
export type { Department };

export interface DepartmentAssignmentResult {
  department: Department | null;
  matchedPattern: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: Department;
  isActive: boolean;
}

export interface Job {
  id: string;
  jobNumber: string;
  printMethod?: string;
  productDescription?: string;
  productionNotes?: string;
  department?: Department | null;
  assignedEmployee?: Employee | null;
}

export interface DepartmentOverview {
  departments: {
    name: Department;
    displayName: string;
    employeeCount: number;
    activeJobCount: number;
  }[];
  totalEmployees: number;
  totalActiveJobs: number;
}

/**
 * Department Assignment Service
 * Provides methods for determining job departments and assigning jobs to employees
 */
export class DepartmentAssignmentService {
  /**
   * Determines the appropriate department based on the print method string
   * @param printMethod - The print method description
   * @returns The assignment result with department and confidence level
   */
  static getDepartmentForPrintMethod(printMethod: string | undefined | null): DepartmentAssignmentResult {
    if (!printMethod || typeof printMethod !== 'string' || printMethod.trim() === '') {
      return {
        department: null,
        matchedPattern: null,
        confidence: 'none',
      };
    }

    const normalizedMethod = printMethod.toLowerCase().trim();

    // Check screen printing patterns
    for (const pattern of SCREEN_PRINTING_PATTERNS) {
      if (normalizedMethod.includes(pattern)) {
        return {
          department: 'screen_printing',
          matchedPattern: pattern,
          confidence: 'high',
        };
      }
    }

    // Check embroidery patterns
    for (const pattern of EMBROIDERY_PATTERNS) {
      if (normalizedMethod.includes(pattern)) {
        return {
          department: 'embroidery',
          matchedPattern: pattern,
          confidence: 'high',
        };
      }
    }

    // Check digital patterns
    for (const pattern of DIGITAL_PATTERNS) {
      if (normalizedMethod.includes(pattern)) {
        return {
          department: 'digital',
          matchedPattern: pattern,
          confidence: 'high',
        };
      }
    }

    // No match found
    return {
      department: null,
      matchedPattern: null,
      confidence: 'none',
    };
  }

  /**
   * Assigns a job to the appropriate department based on print method
   * Updates the job object with the determined department
   * @param job - The job to assign
   * @returns The updated job with department assigned
   */
  static assignJobByPrintMethod(job: Job): Job {
    // Try to determine department from print method
    let result = this.getDepartmentForPrintMethod(job.printMethod);

    // If no match from print method, try product description
    if (result.department === null && job.productDescription) {
      result = this.getDepartmentForPrintMethod(job.productDescription);
    }

    // If still no match, try production notes
    if (result.department === null && job.productionNotes) {
      result = this.getDepartmentForPrintMethod(job.productionNotes);
    }

    return {
      ...job,
      department: result.department,
    };
  }

  /**
   * Assigns a job to an employee based on department and availability
   * @param job - The job to assign
   * @param employees - Available employees
   * @returns The job with assigned employee, or null if no suitable employee found
   */
  static assignJobToEmployee(job: Job, employees: Employee[]): Job {
    // First, ensure the job has a department
    const jobWithDepartment = job.department ? job : this.assignJobByPrintMethod(job);

    if (!jobWithDepartment.department) {
      // Cannot assign without a department
      return jobWithDepartment;
    }

    // Find active employees in the matching department
    const eligibleEmployees = employees.filter(
      (emp) => emp.isActive && emp.department === jobWithDepartment.department
    );

    if (eligibleEmployees.length === 0) {
      // No eligible employees in this department
      return jobWithDepartment;
    }

    // For now, assign to the first available employee
    // In a real implementation, this could consider workload balancing
    const assignedEmployee = eligibleEmployees[0];

    return {
      ...jobWithDepartment,
      assignedEmployee,
    };
  }

  /**
   * Gets an overview of all departments with employee and job counts
   * @param employees - All employees
   * @param jobs - All active jobs
   * @returns Department overview with counts
   */
  static getDepartmentOverview(employees: Employee[], jobs: Job[]): DepartmentOverview {
    const departments = ALL_DEPARTMENTS.map((name) => ({
      name,
      displayName: DEPARTMENT_DISPLAY_NAMES[name],
      employeeCount: employees.filter((emp) => emp.department === name && emp.isActive).length,
      activeJobCount: jobs.filter((job) => job.department === name).length,
    }));

    return {
      departments,
      totalEmployees: employees.filter((emp) => emp.isActive).length,
      totalActiveJobs: jobs.length,
    };
  }

  /**
   * Validates that a department value is valid
   * @param department - The department to validate
   * @returns True if valid, false otherwise
   */
  static isValidDepartment(department: string | undefined | null): department is Department {
    if (!department) return false;
    return (ALL_DEPARTMENTS as readonly string[]).includes(department);
  }

  /**
   * Gets all valid department values
   * @returns Array of valid department values
   */
  static getAllDepartments(): Department[] {
    return [...ALL_DEPARTMENTS];
  }

  /**
   * Gets the display name for a department
   * @param department - The department
   * @returns Human-readable display name
   */
  static getDepartmentDisplayName(department: Department): string {
    return DEPARTMENT_DISPLAY_NAMES[department];
  }
}

export default DepartmentAssignmentService;
