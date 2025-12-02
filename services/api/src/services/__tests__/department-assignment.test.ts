/**
 * Department Assignment Service Tests
 * Tests for getDepartmentForPrintMethod(), assignJobByPrintMethod(), and related functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  DepartmentAssignmentService,
  Employee,
  Job,
} from '../department-assignment.service';

describe('DepartmentAssignmentService', () => {
  describe('getDepartmentForPrintMethod', () => {
    // Test 1: Screen printing detection
    it('should detect screen_printing for "screen print" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('screen print');
      expect(result.department).toBe('screen_printing');
      expect(result.matchedPattern).toBe('screen print');
      expect(result.confidence).toBe('high');
    });

    // Test 2: Screen printing with "silk screen"
    it('should detect screen_printing for "silk screen" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('silk screen printing');
      expect(result.department).toBe('screen_printing');
      // Note: "screen print" pattern may match before "silk screen" if substring is found first
      expect(result.confidence).toBe('high');
    });

    // Test 3: Embroidery detection
    it('should detect embroidery department for "embroidery" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('embroidery');
      expect(result.department).toBe('embroidery');
      expect(result.matchedPattern).toBe('embroidery');
      expect(result.confidence).toBe('high');
    });

    // Test 4: DTG detection (digital department)
    it('should detect digital department for "dtg" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('dtg printing');
      expect(result.department).toBe('digital');
      expect(result.matchedPattern).toBe('dtg');
      expect(result.confidence).toBe('high');
    });

    // Test 5: Vinyl detection (digital department)
    it('should detect digital department for "vinyl" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('vinyl transfer');
      expect(result.department).toBe('digital');
      expect(result.matchedPattern).toBe('vinyl');
      expect(result.confidence).toBe('high');
    });

    // Test 6: Heat press detection (digital department)
    it('should detect digital department for "heat press" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('heat press application');
      expect(result.department).toBe('digital');
      expect(result.matchedPattern).toBe('heat press');
      expect(result.confidence).toBe('high');
    });

    // Test 7: Sublimation detection (digital department)
    it('should detect digital department for "sublimation" method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('dye sublimation printing');
      expect(result.department).toBe('digital');
      expect(result.matchedPattern).toBe('sublimation');
      expect(result.confidence).toBe('high');
    });

    // Test 8: Case insensitivity
    it('should handle case insensitive matching', () => {
      const result1 = DepartmentAssignmentService.getDepartmentForPrintMethod('SCREEN PRINT');
      const result2 = DepartmentAssignmentService.getDepartmentForPrintMethod('Embroidery');
      const result3 = DepartmentAssignmentService.getDepartmentForPrintMethod('DTG');

      expect(result1.department).toBe('screen_printing');
      expect(result2.department).toBe('embroidery');
      expect(result3.department).toBe('digital');
    });

    // Test 9: Empty/null input handling
    it('should return null department for empty or null input', () => {
      expect(DepartmentAssignmentService.getDepartmentForPrintMethod('')).toEqual({
        department: null,
        matchedPattern: null,
        confidence: 'none',
      });
      expect(DepartmentAssignmentService.getDepartmentForPrintMethod(null)).toEqual({
        department: null,
        matchedPattern: null,
        confidence: 'none',
      });
      expect(DepartmentAssignmentService.getDepartmentForPrintMethod(undefined)).toEqual({
        department: null,
        matchedPattern: null,
        confidence: 'none',
      });
    });

    // Test 10: Unknown print method
    it('should return null department for unknown print method', () => {
      const result = DepartmentAssignmentService.getDepartmentForPrintMethod('laser etching');
      expect(result.department).toBeNull();
      expect(result.matchedPattern).toBeNull();
      expect(result.confidence).toBe('none');
    });
  });

  describe('assignJobByPrintMethod', () => {
    it('should assign job department based on print method', () => {
      const job: Job = {
        id: '1',
        jobNumber: 'JOB-001',
        printMethod: 'screen print',
      };

      const result = DepartmentAssignmentService.assignJobByPrintMethod(job);
      expect(result.department).toBe('screen_printing');
      expect(result.id).toBe('1');
      expect(result.jobNumber).toBe('JOB-001');
    });

    it('should fall back to product description if print method has no match', () => {
      const job: Job = {
        id: '2',
        jobNumber: 'JOB-002',
        printMethod: 'unknown',
        productDescription: 'Custom embroidery on polo shirts',
      };

      const result = DepartmentAssignmentService.assignJobByPrintMethod(job);
      expect(result.department).toBe('embroidery');
    });

    it('should fall back to production notes if product description has no match', () => {
      const job: Job = {
        id: '3',
        jobNumber: 'JOB-003',
        printMethod: 'custom',
        productDescription: 'T-shirts',
        productionNotes: 'Use DTG printer for small order',
      };

      const result = DepartmentAssignmentService.assignJobByPrintMethod(job);
      expect(result.department).toBe('digital');
    });

    it('should return null department if no match found anywhere', () => {
      const job: Job = {
        id: '4',
        jobNumber: 'JOB-004',
        printMethod: 'unknown method',
        productDescription: 'Custom products',
        productionNotes: 'Standard processing',
      };

      const result = DepartmentAssignmentService.assignJobByPrintMethod(job);
      expect(result.department).toBeNull();
    });
  });

  describe('assignJobToEmployee', () => {
    const mockEmployees: Employee[] = [
      { id: 'e1', firstName: 'John', lastName: 'Doe', department: 'screen_printing', isActive: true },
      { id: 'e2', firstName: 'Jane', lastName: 'Smith', department: 'embroidery', isActive: true },
      { id: 'e3', firstName: 'Bob', lastName: 'Wilson', department: 'digital', isActive: true },
      { id: 'e4', firstName: 'Alice', lastName: 'Brown', department: 'screen_printing', isActive: false },
    ];

    it('should assign job to an employee in the matching department', () => {
      const job: Job = {
        id: 'j1',
        jobNumber: 'JOB-001',
        printMethod: 'screen print',
      };

      const result = DepartmentAssignmentService.assignJobToEmployee(job, mockEmployees);
      expect(result.department).toBe('screen_printing');
      expect(result.assignedEmployee?.id).toBe('e1');
      expect(result.assignedEmployee?.department).toBe('screen_printing');
    });

    it('should not assign inactive employees', () => {
      // e4 is inactive, so even though they're in screen_printing, they shouldn't be assigned
      const inactiveOnlyEmployees: Employee[] = [
        { id: 'e4', firstName: 'Alice', lastName: 'Brown', department: 'screen_printing', isActive: false },
      ];

      const job: Job = {
        id: 'j2',
        jobNumber: 'JOB-002',
        printMethod: 'screen print',
      };

      const result = DepartmentAssignmentService.assignJobToEmployee(job, inactiveOnlyEmployees);
      expect(result.department).toBe('screen_printing');
      expect(result.assignedEmployee).toBeUndefined();
    });

    it('should not assign employee if no matching department employees exist', () => {
      const limitedEmployees: Employee[] = [
        { id: 'e1', firstName: 'John', lastName: 'Doe', department: 'screen_printing', isActive: true },
      ];

      const job: Job = {
        id: 'j3',
        jobNumber: 'JOB-003',
        printMethod: 'embroidery',
      };

      const result = DepartmentAssignmentService.assignJobToEmployee(job, limitedEmployees);
      expect(result.department).toBe('embroidery');
      expect(result.assignedEmployee).toBeUndefined();
    });
  });

  describe('getDepartmentOverview', () => {
    const mockEmployees: Employee[] = [
      { id: 'e1', firstName: 'John', lastName: 'Doe', department: 'screen_printing', isActive: true },
      { id: 'e2', firstName: 'Jane', lastName: 'Smith', department: 'embroidery', isActive: true },
      { id: 'e3', firstName: 'Bob', lastName: 'Wilson', department: 'digital', isActive: true },
      { id: 'e4', firstName: 'Alice', lastName: 'Brown', department: 'screen_printing', isActive: true },
      { id: 'e5', firstName: 'Charlie', lastName: 'Davis', department: 'digital', isActive: false },
    ];

    const mockJobs: Job[] = [
      { id: 'j1', jobNumber: 'JOB-001', department: 'screen_printing' },
      { id: 'j2', jobNumber: 'JOB-002', department: 'screen_printing' },
      { id: 'j3', jobNumber: 'JOB-003', department: 'embroidery' },
      { id: 'j4', jobNumber: 'JOB-004', department: 'digital' },
    ];

    it('should return correct department overview', () => {
      const overview = DepartmentAssignmentService.getDepartmentOverview(mockEmployees, mockJobs);

      expect(overview.totalEmployees).toBe(4); // Only active employees
      expect(overview.totalActiveJobs).toBe(4);
      expect(overview.departments).toHaveLength(3);

      const screenPrinting = overview.departments.find((d) => d.name === 'screen_printing');
      expect(screenPrinting?.employeeCount).toBe(2);
      expect(screenPrinting?.activeJobCount).toBe(2);
      expect(screenPrinting?.displayName).toBe('Screen Printing');

      const embroidery = overview.departments.find((d) => d.name === 'embroidery');
      expect(embroidery?.employeeCount).toBe(1);
      expect(embroidery?.activeJobCount).toBe(1);

      const digital = overview.departments.find((d) => d.name === 'digital');
      expect(digital?.employeeCount).toBe(1); // e5 is inactive
      expect(digital?.activeJobCount).toBe(1);
    });
  });

  describe('isValidDepartment', () => {
    it('should return true for valid departments', () => {
      expect(DepartmentAssignmentService.isValidDepartment('screen_printing')).toBe(true);
      expect(DepartmentAssignmentService.isValidDepartment('embroidery')).toBe(true);
      expect(DepartmentAssignmentService.isValidDepartment('digital')).toBe(true);
    });

    it('should return false for invalid departments', () => {
      expect(DepartmentAssignmentService.isValidDepartment('invalid')).toBe(false);
      expect(DepartmentAssignmentService.isValidDepartment('')).toBe(false);
      expect(DepartmentAssignmentService.isValidDepartment(null)).toBe(false);
      expect(DepartmentAssignmentService.isValidDepartment(undefined)).toBe(false);
    });
  });

  describe('getAllDepartments', () => {
    it('should return all three departments', () => {
      const departments = DepartmentAssignmentService.getAllDepartments();
      expect(departments).toEqual(['screen_printing', 'embroidery', 'digital']);
      expect(departments).toHaveLength(3);
    });
  });

  describe('getDepartmentDisplayName', () => {
    it('should return correct display names', () => {
      expect(DepartmentAssignmentService.getDepartmentDisplayName('screen_printing')).toBe('Screen Printing');
      expect(DepartmentAssignmentService.getDepartmentDisplayName('embroidery')).toBe('Embroidery');
      expect(DepartmentAssignmentService.getDepartmentDisplayName('digital')).toBe('Digital');
    });
  });
});
