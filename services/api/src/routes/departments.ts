/**
 * Department Management API Routes
 * Provides endpoints for department overview and employee assignment
 */

import { Router, Request, Response } from 'express';
import {
  DepartmentAssignmentService,
  Department,
  Employee,
  Job,
} from '../services/department-assignment.service';

const router = Router();

// In-memory storage for demo purposes
// In production, this would query Strapi or a database
let employees: Employee[] = [];
let jobs: Job[] = [];

/**
 * GET /api/departments
 * Returns API information
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Department Management API',
    endpoints: {
      overview: 'GET /api/departments/overview',
      assignEmployee: 'POST /api/departments/assign-employee',
      assignJobDepartment: 'POST /api/departments/assign-job',
      allDepartments: 'GET /api/departments/list',
    },
  });
});

/**
 * GET /api/departments/list
 * Returns all available departments
 */
router.get('/list', (_req: Request, res: Response) => {
  const departments = DepartmentAssignmentService.getAllDepartments();
  res.json({
    departments: departments.map((dept) => ({
      value: dept,
      displayName: DepartmentAssignmentService.getDepartmentDisplayName(dept),
    })),
  });
});

/**
 * GET /api/departments/overview
 * Returns an overview of all departments with employee and job counts
 */
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    // In a real implementation, fetch from database
    // For now, use in-memory data or fetch from Strapi
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';

    // Try to fetch employees from Strapi
    try {
      const employeesResponse = await fetch(`${strapiUrl}/api/employees?pagination[limit]=1000`);
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json() as { data?: any[] };
        employees = (employeesData.data || []).map((e: any) => ({
          id: e.documentId || e.id?.toString(),
          firstName: e.firstName || '',
          lastName: e.lastName || '',
          department: e.department as Department,
          isActive: e.isActive ?? true,
        }));
      }
    } catch {
      // Use in-memory employees if Strapi is unavailable
    }

    // Try to fetch jobs from Strapi
    try {
      const jobsResponse = await fetch(
        `${strapiUrl}/api/jobs?pagination[limit]=1000&filters[status][$ne]=COMPLETED`
      );
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json() as { data?: any[] };
        jobs = (jobsData.data || []).map((j: any) => ({
          id: j.documentId || j.id?.toString(),
          jobNumber: j.jobNumber || '',
          printMethod: j.printMethod,
          productDescription: j.productDescription,
          productionNotes: j.productionNotes,
          department: j.department as Department | null,
        }));
      }
    } catch {
      // Use in-memory jobs if Strapi is unavailable
    }

    const overview = DepartmentAssignmentService.getDepartmentOverview(employees, jobs);
    res.json(overview);
  } catch (error) {
    console.error('Error fetching department overview:', error);
    res.status(500).json({ error: 'Failed to fetch department overview' });
  }
});

/**
 * POST /api/departments/assign-employee
 * Assigns an employee to a department
 * Body: { employeeId: string, department: Department }
 */
router.post('/assign-employee', async (req: Request, res: Response) => {
  try {
    const { employeeId, department } = req.body;

    if (!employeeId) {
      res.status(400).json({ error: 'Employee ID is required' });
      return;
    }

    if (!DepartmentAssignmentService.isValidDepartment(department)) {
      res.status(400).json({
        error: 'Invalid department',
        validDepartments: DepartmentAssignmentService.getAllDepartments(),
      });
      return;
    }

    // In a real implementation, update the employee in Strapi
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';

    try {
      const response = await fetch(`${strapiUrl}/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            department,
          },
        }),
      });

      if (response.ok) {
        const updatedEmployee = await response.json() as { data?: any };
        res.json({
          success: true,
          message: `Employee assigned to ${DepartmentAssignmentService.getDepartmentDisplayName(department)}`,
          employee: updatedEmployee.data,
        });
        return;
      }
    } catch {
      // Fall back to in-memory update
    }

    // In-memory fallback
    const employeeIndex = employees.findIndex((e) => e.id === employeeId);
    if (employeeIndex === -1) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    employees[employeeIndex] = {
      ...employees[employeeIndex],
      department,
    };

    res.json({
      success: true,
      message: `Employee assigned to ${DepartmentAssignmentService.getDepartmentDisplayName(department)}`,
      employee: employees[employeeIndex],
    });
  } catch (error) {
    console.error('Error assigning employee:', error);
    res.status(500).json({ error: 'Failed to assign employee to department' });
  }
});

/**
 * POST /api/departments/assign-job
 * Auto-assigns a job to a department based on print method
 * Body: { jobId: string, printMethod?: string, productDescription?: string }
 */
router.post('/assign-job', async (req: Request, res: Response) => {
  try {
    const { jobId, printMethod, productDescription, productionNotes } = req.body;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    // Create a job object for assignment
    const job: Job = {
      id: jobId,
      jobNumber: req.body.jobNumber || '',
      printMethod,
      productDescription,
      productionNotes,
    };

    // Assign department based on print method
    const assignedJob = DepartmentAssignmentService.assignJobByPrintMethod(job);

    if (!assignedJob.department) {
      res.status(400).json({
        error: 'Could not determine department from print method',
        suggestion: 'Please specify a recognized print method or manually assign a department',
      });
      return;
    }

    // In a real implementation, update the job in Strapi
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';

    try {
      const response = await fetch(`${strapiUrl}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            department: assignedJob.department,
            printMethod,
          },
        }),
      });

      if (response.ok) {
        const updatedJob = await response.json() as { data?: any };
        res.json({
          success: true,
          message: `Job assigned to ${DepartmentAssignmentService.getDepartmentDisplayName(assignedJob.department)}`,
          job: updatedJob.data,
          department: assignedJob.department,
        });
        return;
      }
    } catch {
      // Fall back to returning the assignment result
    }

    res.json({
      success: true,
      message: `Job would be assigned to ${DepartmentAssignmentService.getDepartmentDisplayName(assignedJob.department)}`,
      job: assignedJob,
      department: assignedJob.department,
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ error: 'Failed to assign job to department' });
  }
});

/**
 * POST /api/departments/detect
 * Detects the department for a given print method without assigning
 * Body: { printMethod: string }
 */
router.post('/detect', (req: Request, res: Response) => {
  const { printMethod } = req.body;

  if (!printMethod) {
    res.status(400).json({ error: 'Print method is required' });
    return;
  }

  const result = DepartmentAssignmentService.getDepartmentForPrintMethod(printMethod);

  res.json({
    printMethod,
    result,
    displayName: result.department
      ? DepartmentAssignmentService.getDepartmentDisplayName(result.department)
      : null,
  });
});

// For testing purposes, allow setting mock data
export function setMockData(mockEmployees: Employee[], mockJobs: Job[]) {
  employees = mockEmployees;
  jobs = mockJobs;
}

export function clearMockData() {
  employees = [];
  jobs = [];
}

export default router;
