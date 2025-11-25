/**
 * Time Clock Controller
 * Handles HTTP requests for time clock operations
 */

import { Request, Response } from 'express';
import { TimeClockService } from './time-clock.service';

export class TimeClockController {
  private service: TimeClockService;

  constructor() {
    this.service = new TimeClockService();
  }

  /**
   * Clock in
   * POST /api/production/time-clock/in
   */
  clockIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, employeePin, jobId, taskType, machineId } = req.body;

      if (!employeeId || !employeePin || !jobId || !taskType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const entry = await this.service.clockIn({
        employeeId,
        employeePin,
        jobId,
        taskType,
        machineId,
      });

      res.status(201).json({ data: entry });
    } catch (error: any) {
      console.error('Clock in error:', error);
      res.status(400).json({ error: error.message || 'Failed to clock in' });
    }
  };

  /**
   * Clock out
   * POST /api/production/time-clock/out
   */
  clockOut = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entryId, notes, issues } = req.body;

      if (!entryId) {
        res.status(400).json({ error: 'Missing entryId' });
        return;
      }

      const entry = await this.service.clockOut({
        entryId,
        notes,
        issues,
      });

      res.status(200).json({ data: entry });
    } catch (error: any) {
      console.error('Clock out error:', error);
      res.status(400).json({ error: error.message || 'Failed to clock out' });
    }
  };

  /**
   * Pause timer
   * POST /api/production/time-clock/pause
   */
  pause = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entryId } = req.body;

      if (!entryId) {
        res.status(400).json({ error: 'Missing entryId' });
        return;
      }

      const entry = await this.service.pauseEntry({ entryId });

      res.status(200).json({ data: entry });
    } catch (error: any) {
      console.error('Pause error:', error);
      res.status(400).json({ error: error.message || 'Failed to pause' });
    }
  };

  /**
   * Resume timer
   * POST /api/production/time-clock/resume
   */
  resume = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entryId } = req.body;

      if (!entryId) {
        res.status(400).json({ error: 'Missing entryId' });
        return;
      }

      const entry = await this.service.resumeEntry({ entryId });

      res.status(200).json({ data: entry });
    } catch (error: any) {
      console.error('Resume error:', error);
      res.status(400).json({ error: error.message || 'Failed to resume' });
    }
  };

  /**
   * Get active timers
   * GET /api/production/time-clock/active
   */
  getActive = async (_req: Request, res: Response): Promise<void> => {
    try {
      const entries = await this.service.getActiveEntries();
      res.status(200).json({ data: entries });
    } catch (error: any) {
      console.error('Get active error:', error);
      res.status(500).json({ error: error.message || 'Failed to get active entries' });
    }
  };

  /**
   * Create time entry
   * POST /api/production/time-entries
   */
  createEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, employeePin, jobId, taskType, machineId } = req.body;

      if (!employeeId || !employeePin || !jobId || !taskType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const entry = await this.service.clockIn({
        employeeId,
        employeePin,
        jobId,
        taskType,
        machineId,
      });

      res.status(201).json({ data: entry });
    } catch (error: any) {
      console.error('Create entry error:', error);
      res.status(400).json({ error: error.message || 'Failed to create entry' });
    }
  };

  /**
   * Edit time entry
   * PATCH /api/production/time-entries/:id
   */
  editEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const entryId = parseInt(req.params.id);
      const { clockIn, clockOut, breakTime, editedById, editReason } = req.body;

      if (!editedById || !editReason) {
        res.status(400).json({ error: 'Missing editedById or editReason' });
        return;
      }

      const entry = await this.service.editEntry({
        entryId,
        clockIn,
        clockOut,
        breakTime,
        editedById,
        editReason,
      });

      res.status(200).json({ data: entry });
    } catch (error: any) {
      console.error('Edit entry error:', error);
      res.status(400).json({ error: error.message || 'Failed to edit entry' });
    }
  };

  /**
   * Get time entries
   * GET /api/production/time-entries
   */
  getEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, startDate, endDate } = req.query;

      if (!employeeId) {
        res.status(400).json({ error: 'Missing employeeId' });
        return;
      }

      const entries = await this.service.getEmployeeEntries(
        parseInt(employeeId as string),
        startDate as string,
        endDate as string
      );

      res.status(200).json({ data: entries });
    } catch (error: any) {
      console.error('Get entries error:', error);
      res.status(500).json({ error: error.message || 'Failed to get entries' });
    }
  };

  /**
   * Approve time entry edit
   * POST /api/production/time-entries/:id/approve
   */
  approveEdit = async (req: Request, res: Response): Promise<void> => {
    try {
      const entryId = parseInt(req.params.id);
      const { approvedById, approved } = req.body;

      if (!approvedById || approved === undefined) {
        res.status(400).json({ error: 'Missing approvedById or approved' });
        return;
      }

      const entry = await this.service.approveEdit({
        entryId,
        approvedById,
        approved,
      });

      res.status(200).json({ data: entry });
    } catch (error: any) {
      console.error('Approve edit error:', error);
      res.status(400).json({ error: error.message || 'Failed to approve edit' });
    }
  };

  /**
   * Get employee time summary
   * GET /api/production/employees/:id/time
   */
  getEmployeeSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Missing startDate or endDate' });
        return;
      }

      const summary = await this.service.getEmployeeSummary(
        employeeId,
        startDate as string,
        endDate as string
      );

      res.status(200).json({ data: summary });
    } catch (error: any) {
      console.error('Get employee summary error:', error);
      res.status(500).json({ error: error.message || 'Failed to get employee summary' });
    }
  };
}
