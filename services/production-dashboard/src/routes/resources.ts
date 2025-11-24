/**
 * Resource Management Routes (Machines & Employees)
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Machine, Employee, RESTResponse } from '../types';

const router = Router();

// Mock resource data (in production, this would query a database)
let machines: Machine[] = [
  {
    id: 'machine-001',
    name: 'Screen Press #1',
    type: 'screen_press',
    status: 'running',
    currentJobId: 'order-001',
    utilizationPercent: 85,
    lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    uptime: 95.5
  },
  {
    id: 'machine-002',
    name: 'DTG Printer #1',
    type: 'dtg_printer',
    status: 'idle',
    utilizationPercent: 60,
    lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    uptime: 98.2
  },
  {
    id: 'machine-003',
    name: 'Embroidery Machine #1',
    type: 'embroidery_machine',
    status: 'running',
    currentJobId: 'order-003',
    utilizationPercent: 75,
    lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    uptime: 92.0
  },
  {
    id: 'machine-004',
    name: 'Curing Station #1',
    type: 'curing_station',
    status: 'idle',
    utilizationPercent: 45,
    lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uptime: 99.1
  }
];

let employees: Employee[] = [
  {
    id: 'emp-001',
    name: 'John Smith',
    status: 'clocked_in',
    currentJobId: 'order-002',
    clockedInAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    productivity: 92,
    skillSet: ['screen_printing', 'dtg']
  },
  {
    id: 'emp-002',
    name: 'Jane Doe',
    status: 'clocked_in',
    currentJobId: 'order-001',
    clockedInAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    productivity: 88,
    skillSet: ['screen_printing', 'embroidery']
  },
  {
    id: 'emp-003',
    name: 'Mike Johnson',
    status: 'break',
    clockedInAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    productivity: 85,
    skillSet: ['embroidery', 'quality_check']
  },
  {
    id: 'emp-004',
    name: 'Sarah Williams',
    status: 'clocked_out',
    productivity: 90,
    skillSet: ['dtg', 'quality_check']
  }
];

/**
 * GET /api/production/resources
 * Get all resources (machines and employees)
 */
router.get('/', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const response: RESTResponse<{ machines: Machine[]; employees: Employee[] }> = {
      success: true,
      data: {
        machines,
        employees
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch resources',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/resources/machines
 * Get all machines
 */
router.get('/machines', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const response: RESTResponse<Machine[]> = {
      success: true,
      data: machines,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch machines',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/resources/machines/:machineId
 * Get specific machine
 */
router.get('/machines/:machineId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { machineId } = req.params;
    const machine = machines.find(m => m.id === machineId);

    if (!machine) {
      const response: RESTResponse = {
        success: false,
        error: 'Machine not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    const response: RESTResponse<Machine> = {
      success: true,
      data: machine,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch machine',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/production/resources/machines/:machineId/allocate
 * Allocate machine to an order
 */
router.post('/machines/:machineId/allocate', authenticateToken, requireRole('supervisor', 'admin'), (req: Request, res: Response): void => {
  try {
    const { machineId } = req.params;
    const { orderId } = req.body;

    if (!orderId) {
      const response: RESTResponse = {
        success: false,
        error: 'orderId is required',
        timestamp: new Date()
      };
      res.status(400).json(response);
      return;
    }

    const machine = machines.find(m => m.id === machineId);
    if (!machine) {
      const response: RESTResponse = {
        success: false,
        error: 'Machine not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    machine.currentJobId = orderId;
    machine.status = 'running';

    const response: RESTResponse<Machine> = {
      success: true,
      data: machine,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to allocate machine',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/resources/employees
 * Get all employees
 */
router.get('/employees', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const response: RESTResponse<Employee[]> = {
      success: true,
      data: employees,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch employees',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/resources/employees/:employeeId
 * Get specific employee
 */
router.get('/employees/:employeeId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { employeeId } = req.params;
    const employee = employees.find(e => e.id === employeeId);

    if (!employee) {
      const response: RESTResponse = {
        success: false,
        error: 'Employee not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    const response: RESTResponse<Employee> = {
      success: true,
      data: employee,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch employee',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/production/resources/employees/:employeeId/assign
 * Assign employee to an order
 */
router.post('/employees/:employeeId/assign', authenticateToken, requireRole('supervisor', 'admin'), (req: Request, res: Response): void => {
  try {
    const { employeeId } = req.params;
    const { orderId } = req.body;

    if (!orderId) {
      const response: RESTResponse = {
        success: false,
        error: 'orderId is required',
        timestamp: new Date()
      };
      res.status(400).json(response);
      return;
    }

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      const response: RESTResponse = {
        success: false,
        error: 'Employee not found',
        timestamp: new Date()
      };
      res.status(404).json(response);
      return;
    }

    employee.currentJobId = orderId;

    const response: RESTResponse<Employee> = {
      success: true,
      data: employee,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to assign employee',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

export default router;
export { machines, employees };
