// Strapi API client service for fetching analytics data

import { JobEntry, TimeEntry } from './types';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

interface StrapiResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      total: number;
    };
  };
}

export class StrapiService {
  /**
   * Fetch job entries from Strapi
   * Maps jobs content type to JobEntry format
   */
  static async fetchJobEntries(): Promise<JobEntry[]> {
    try {
      const response = await fetch(
        `${STRAPI_URL}/api/jobs?pagination[limit]=1000&populate=employee`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch jobs from Strapi: ${response.status}`);
        return [];
      }
      
      const data = await response.json() as StrapiResponse<any>;
      
      return (data.data || []).map((job: any) => ({
        id: job.documentId || job.id?.toString() || '',
        employeeId: job.employee?.documentId || job.employeeId || '',
        jobType: job.jobType || job.type || 'Unknown',
        estimatedTime: job.estimatedTime || job.estimatedHours || 0,
        actualTime: job.actualTime || job.actualHours || 0,
        completed: job.completed || job.status === 'COMPLETED' || job.status === 'DELIVERED',
        requiresRework: job.requiresRework || false,
        completedDate: job.completedDate || job.completedAt || job.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching job entries from Strapi:', error);
      return [];
    }
  }

  /**
   * Fetch time entries from Strapi
   * Maps time-entries content type to TimeEntry format
   */
  static async fetchTimeEntries(): Promise<TimeEntry[]> {
    try {
      const response = await fetch(
        `${STRAPI_URL}/api/time-entries?pagination[limit]=1000&populate=employee`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch time entries from Strapi: ${response.status}`);
        return [];
      }
      
      const data = await response.json() as StrapiResponse<any>;
      
      return (data.data || []).map((entry: any) => ({
        id: entry.documentId || entry.id?.toString() || '',
        employeeId: entry.employee?.documentId || entry.employeeId || '',
        employeeName: entry.employee?.name || entry.employeeName || 'Unknown',
        date: entry.date || entry.createdAt?.split('T')[0] || '',
        hoursWorked: entry.hoursWorked || entry.totalHours || 0,
        productiveHours: entry.productiveHours || entry.hoursWorked || 0,
        breakTime: entry.breakTime || 0,
      }));
    } catch (error) {
      console.error('Error fetching time entries from Strapi:', error);
      return [];
    }
  }

  /**
   * Fetch employees from Strapi for time entry data
   */
  static async fetchEmployees(): Promise<TimeEntry[]> {
    try {
      const response = await fetch(
        `${STRAPI_URL}/api/employees?pagination[limit]=100`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch employees from Strapi: ${response.status}`);
        return [];
      }
      
      const data = await response.json() as StrapiResponse<any>;
      const today = new Date().toISOString().split('T')[0];
      
      // Create time entries for each employee with default values
      return (data.data || []).map((emp: any) => ({
        id: `time-${emp.documentId || emp.id}`,
        employeeId: emp.documentId || emp.id?.toString() || '',
        employeeName: emp.name || 'Unknown',
        date: today,
        hoursWorked: 8.0, // Default hours
        productiveHours: 7.5,
        breakTime: 0.5,
      }));
    } catch (error) {
      console.error('Error fetching employees from Strapi:', error);
      return [];
    }
  }

  /**
   * Fetch revenue from orders in Strapi
   */
  static async fetchRevenue(period: 'today' | 'week' | 'month'): Promise<number> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      const response = await fetch(
        `${STRAPI_URL}/api/orders?filters[createdAt][$gte]=${startDate.toISOString()}&pagination[limit]=1000`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch orders from Strapi: ${response.status}`);
        return 0;
      }
      
      const data = await response.json() as StrapiResponse<any>;
      
      return (data.data || []).reduce((sum: number, order: any) => {
        return sum + (order.totalAmount || order.total || 0);
      }, 0);
    } catch (error) {
      console.error('Error fetching revenue from Strapi:', error);
      return 0;
    }
  }

  /**
   * Fetch clocked in employees count
   */
  static async fetchClockedInCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${STRAPI_URL}/api/time-entries?filters[date][$eq]=${today}&filters[clockOut][$null]=true&pagination[limit]=100`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch clocked in count from Strapi: ${response.status}`);
        return 0;
      }
      
      const data = await response.json() as StrapiResponse<any>;
      return data.meta?.pagination?.total || data.data?.length || 0;
    } catch (error) {
      console.error('Error fetching clocked in count from Strapi:', error);
      return 0;
    }
  }
}
