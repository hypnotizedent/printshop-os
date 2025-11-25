/**
 * Time Clock Service
 * Handles employee clock in/out, time tracking, and labor cost calculations
 */

import bcrypt from 'bcrypt';
import axios from 'axios';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const DEFAULT_HOURLY_RATE = parseFloat(process.env.DEFAULT_HOURLY_RATE || '20.0');

export interface TimeClockEntry {
  id?: number;
  employee: any;
  job: any;
  taskType: string;
  machineId?: string;
  clockIn: string;
  clockOut?: string;
  pausedAt?: string;
  totalTime: number;
  breakTime: number;
  productiveTime: number;
  laborCost: number;
  notes?: string;
  issues?: string;
  editedBy?: any;
  editApprovedBy?: any;
  editReason?: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Edited' | 'PendingApproval';
}

export interface ClockInRequest {
  employeeId: number;
  employeePin: string;
  jobId: number;
  taskType: string;
  machineId?: string;
}

export interface ClockOutRequest {
  entryId: number;
  notes?: string;
  issues?: string;
}

export interface PauseRequest {
  entryId: number;
}

export interface ResumeRequest {
  entryId: number;
}

export interface EditRequest {
  entryId: number;
  clockIn?: string;
  clockOut?: string;
  breakTime?: number;
  editedById: number;
  editReason: string;
}

export interface ApprovalRequest {
  entryId: number;
  approvedById: number;
  approved: boolean;
}

export class TimeClockService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: STRAPI_URL,
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });
  }

  /**
   * Verify employee PIN
   */
  async verifyEmployeePin(employeeId: number, pin: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(`/api/employees/${employeeId}`);
      const employee = response.data.data;

      if (!employee.attributes.pin) {
        return false;
      }

      return await bcrypt.compare(pin, employee.attributes.pin);
    } catch (error) {
      console.error('Error verifying employee PIN:', error);
      return false;
    }
  }

  /**
   * Hash employee PIN
   */
  async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, 10);
  }

  /**
   * Check if employee has an active time entry
   */
  async getActiveEntry(employeeId: number): Promise<TimeClockEntry | null> {
    try {
      const response = await this.axiosInstance.get('/api/time-clock-entries', {
        params: {
          filters: {
            employee: { id: { $eq: employeeId } },
            status: { $in: ['Active', 'Paused'] },
          },
          populate: ['employee', 'job', 'editedBy', 'editApprovedBy'],
        },
      });

      if (response.data.data.length > 0) {
        return this.mapStrapiEntry(response.data.data[0]);
      }

      return null;
    } catch (error) {
      console.error('Error getting active entry:', error);
      return null;
    }
  }

  /**
   * Clock in an employee
   */
  async clockIn(request: ClockInRequest): Promise<TimeClockEntry> {
    // Verify PIN
    const isValidPin = await this.verifyEmployeePin(request.employeeId, request.employeePin);
    if (!isValidPin) {
      throw new Error('Invalid employee PIN');
    }

    // Check for existing active entry
    const activeEntry = await this.getActiveEntry(request.employeeId);
    if (activeEntry) {
      throw new Error('Employee already has an active time entry');
    }

    // Get employee hourly rate
    const employeeResponse = await this.axiosInstance.get(`/api/employees/${request.employeeId}`);
    const hourlyRate = employeeResponse.data.data.attributes.hourlyRate || DEFAULT_HOURLY_RATE;

    // Create new time entry
    const response = await this.axiosInstance.post('/api/time-clock-entries', {
      data: {
        employee: request.employeeId,
        job: request.jobId,
        taskType: request.taskType,
        machineId: request.machineId,
        clockIn: new Date().toISOString(),
        totalTime: 0,
        breakTime: 0,
        productiveTime: 0,
        laborCost: 0,
        status: 'Active',
      },
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Clock out an employee
   */
  async clockOut(request: ClockOutRequest): Promise<TimeClockEntry> {
    const entry = await this.getEntry(request.entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    if (entry.status !== 'Active' && entry.status !== 'Paused') {
      throw new Error('Time entry is not active or paused');
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(entry.clockIn);
    const totalTime = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 60000); // minutes
    const productiveTime = totalTime - entry.breakTime;

    // Get employee hourly rate
    const employeeId = entry.employee?.id || entry.employee;
    const employeeResponse = await this.axiosInstance.get(`/api/employees/${employeeId}`);
    const hourlyRate = employeeResponse.data.data.attributes.hourlyRate || DEFAULT_HOURLY_RATE;

    const laborCost = (productiveTime / 60) * hourlyRate;

    const response = await this.axiosInstance.put(`/api/time-clock-entries/${request.entryId}`, {
      data: {
        clockOut: clockOutTime.toISOString(),
        totalTime,
        productiveTime,
        laborCost: laborCost.toFixed(2),
        notes: request.notes,
        issues: request.issues,
        status: 'Completed',
      },
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Pause time entry (for breaks)
   */
  async pauseEntry(request: PauseRequest): Promise<TimeClockEntry> {
    const entry = await this.getEntry(request.entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    if (entry.status !== 'Active') {
      throw new Error('Time entry is not active');
    }

    const response = await this.axiosInstance.put(`/api/time-clock-entries/${request.entryId}`, {
      data: {
        pausedAt: new Date().toISOString(),
        status: 'Paused',
      },
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Resume time entry (after break)
   */
  async resumeEntry(request: ResumeRequest): Promise<TimeClockEntry> {
    const entry = await this.getEntry(request.entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    if (entry.status !== 'Paused') {
      throw new Error('Time entry is not paused');
    }

    if (!entry.pausedAt) {
      throw new Error('No pause time recorded');
    }

    const pausedTime = new Date(entry.pausedAt);
    const resumeTime = new Date();
    const breakDuration = Math.floor((resumeTime.getTime() - pausedTime.getTime()) / 60000); // minutes
    const totalBreakTime = entry.breakTime + breakDuration;

    const response = await this.axiosInstance.put(`/api/time-clock-entries/${request.entryId}`, {
      data: {
        pausedAt: null,
        breakTime: totalBreakTime,
        status: 'Active',
      },
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Edit time entry (requires approval)
   */
  async editEntry(request: EditRequest): Promise<TimeClockEntry> {
    const entry = await this.getEntry(request.entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    const updateData: any = {
      editedBy: request.editedById,
      editReason: request.editReason,
      status: 'PendingApproval',
    };

    if (request.clockIn) {
      updateData.clockIn = request.clockIn;
    }

    if (request.clockOut) {
      updateData.clockOut = request.clockOut;
    }

    if (request.breakTime !== undefined) {
      updateData.breakTime = request.breakTime;
    }

    // Recalculate times if clock in/out changed
    if (request.clockIn || request.clockOut) {
      const clockInTime = new Date(request.clockIn || entry.clockIn);
      const clockOutTime = new Date(request.clockOut || entry.clockOut || new Date());
      const totalTime = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 60000);
      const breakTime = request.breakTime !== undefined ? request.breakTime : entry.breakTime;
      const productiveTime = totalTime - breakTime;

      const employeeId = entry.employee?.id || entry.employee;
      const employeeResponse = await this.axiosInstance.get(`/api/employees/${employeeId}`);
      const hourlyRate = employeeResponse.data.data.attributes.hourlyRate || DEFAULT_HOURLY_RATE;
      const laborCost = (productiveTime / 60) * hourlyRate;

      updateData.totalTime = totalTime;
      updateData.productiveTime = productiveTime;
      updateData.laborCost = laborCost.toFixed(2);
    }

    const response = await this.axiosInstance.put(`/api/time-clock-entries/${request.entryId}`, {
      data: updateData,
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Approve or reject time entry edit
   */
  async approveEdit(request: ApprovalRequest): Promise<TimeClockEntry> {
    const entry = await this.getEntry(request.entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }

    if (entry.status !== 'PendingApproval') {
      throw new Error('Time entry is not pending approval');
    }

    const updateData: any = {
      editApprovedBy: request.approvedById,
    };

    if (request.approved) {
      updateData.status = 'Edited';
    } else {
      // Reject - restore to previous status
      updateData.status = entry.clockOut ? 'Completed' : 'Active';
      updateData.editedBy = null;
      updateData.editReason = null;
    }

    const response = await this.axiosInstance.put(`/api/time-clock-entries/${request.entryId}`, {
      data: updateData,
    });

    return this.mapStrapiEntry(response.data.data);
  }

  /**
   * Get active time entries
   */
  async getActiveEntries(): Promise<TimeClockEntry[]> {
    try {
      const response = await this.axiosInstance.get('/api/time-clock-entries', {
        params: {
          filters: {
            status: { $in: ['Active', 'Paused'] },
          },
          populate: ['employee', 'job', 'editedBy', 'editApprovedBy'],
        },
      });

      return response.data.data.map((entry: any) => this.mapStrapiEntry(entry));
    } catch (error) {
      console.error('Error getting active entries:', error);
      return [];
    }
  }

  /**
   * Get time entries for an employee
   */
  async getEmployeeEntries(employeeId: number, startDate?: string, endDate?: string): Promise<TimeClockEntry[]> {
    try {
      const filters: any = {
        employee: { id: { $eq: employeeId } },
      };

      if (startDate) {
        filters.clockIn = { $gte: startDate };
      }

      if (endDate) {
        filters.clockIn = { $lte: endDate };
      }

      const response = await this.axiosInstance.get('/api/time-clock-entries', {
        params: {
          filters,
          populate: ['employee', 'job', 'editedBy', 'editApprovedBy'],
          sort: ['clockIn:desc'],
        },
      });

      return response.data.data.map((entry: any) => this.mapStrapiEntry(entry));
    } catch (error) {
      console.error('Error getting employee entries:', error);
      return [];
    }
  }

  /**
   * Get a single time entry
   */
  async getEntry(entryId: number): Promise<TimeClockEntry | null> {
    try {
      const response = await this.axiosInstance.get(`/api/time-clock-entries/${entryId}`, {
        params: {
          populate: ['employee', 'job', 'editedBy', 'editApprovedBy'],
        },
      });

      return this.mapStrapiEntry(response.data.data);
    } catch (error) {
      console.error('Error getting entry:', error);
      return null;
    }
  }

  /**
   * Calculate employee time summary
   */
  async getEmployeeSummary(employeeId: number, startDate: string, endDate: string): Promise<any> {
    const entries = await this.getEmployeeEntries(employeeId, startDate, endDate);

    const completedEntries = entries.filter(e => e.status === 'Completed' || e.status === 'Edited');

    const totalHours = completedEntries.reduce((sum, e) => sum + (e.productiveTime / 60), 0);
    const totalLaborCost = completedEntries.reduce((sum, e) => sum + e.laborCost, 0);

    return {
      employeeId,
      startDate,
      endDate,
      totalEntries: completedEntries.length,
      totalHours: totalHours.toFixed(2),
      totalLaborCost: totalLaborCost.toFixed(2),
      entries: completedEntries,
    };
  }

  /**
   * Map Strapi entry to TimeClockEntry
   */
  private mapStrapiEntry(strapiEntry: any): TimeClockEntry {
    const attrs = strapiEntry.attributes;

    return {
      id: strapiEntry.id,
      employee: attrs.employee?.data,
      job: attrs.job?.data,
      taskType: attrs.taskType,
      machineId: attrs.machineId,
      clockIn: attrs.clockIn,
      clockOut: attrs.clockOut,
      pausedAt: attrs.pausedAt,
      totalTime: attrs.totalTime || 0,
      breakTime: attrs.breakTime || 0,
      productiveTime: attrs.productiveTime || 0,
      laborCost: parseFloat(attrs.laborCost || '0'),
      notes: attrs.notes,
      issues: attrs.issues,
      editedBy: attrs.editedBy?.data,
      editApprovedBy: attrs.editApprovedBy?.data,
      editReason: attrs.editReason,
      status: attrs.status,
    };
  }
}
