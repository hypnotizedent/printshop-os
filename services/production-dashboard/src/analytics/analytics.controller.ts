// Analytics API controller for production dashboard

import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { ReportsService } from './reports.service';
import {
  JobEntry,
  TimeEntry,
  TimePeriod,
  ReportConfig,
} from './types';

// Mock data for development
const mockJobEntries: JobEntry[] = [
  {
    id: '1',
    employeeId: 'emp-1',
    jobType: 'Screen Printing',
    estimatedTime: 2.0,
    actualTime: 1.8,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T10:30:00Z',
  },
  {
    id: '2',
    employeeId: 'emp-1',
    jobType: 'Screen Printing',
    estimatedTime: 1.5,
    actualTime: 1.6,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T14:00:00Z',
  },
  {
    id: '3',
    employeeId: 'emp-2',
    jobType: 'DTG',
    estimatedTime: 3.0,
    actualTime: 3.2,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T11:00:00Z',
  },
  {
    id: '4',
    employeeId: 'emp-2',
    jobType: 'Folding',
    estimatedTime: 1.0,
    actualTime: 0.9,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T15:00:00Z',
  },
  {
    id: '5',
    employeeId: 'emp-3',
    jobType: 'Screen Printing',
    estimatedTime: 2.5,
    actualTime: 2.7,
    completed: true,
    requiresRework: true,
    completedDate: '2025-11-23T12:00:00Z',
  },
  {
    id: '6',
    employeeId: 'emp-3',
    jobType: 'Heat Press',
    estimatedTime: 1.0,
    actualTime: 1.1,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T16:00:00Z',
  },
  {
    id: '7',
    employeeId: 'emp-1',
    jobType: 'Quality Check',
    estimatedTime: 0.5,
    actualTime: 0.5,
    completed: true,
    requiresRework: false,
    completedDate: '2025-11-23T17:00:00Z',
  },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: 't1',
    employeeId: 'emp-1',
    employeeName: 'Sarah Johnson',
    date: '2025-11-23',
    hoursWorked: 8.0,
    productiveHours: 7.5,
    breakTime: 0.5,
  },
  {
    id: 't2',
    employeeId: 'emp-2',
    employeeName: 'John Smith',
    date: '2025-11-23',
    hoursWorked: 8.0,
    productiveHours: 7.2,
    breakTime: 0.8,
  },
  {
    id: 't3',
    employeeId: 'emp-3',
    employeeName: 'Mike Thompson',
    date: '2025-11-23',
    hoursWorked: 7.5,
    productiveHours: 7.0,
    breakTime: 0.5,
  },
];

export class AnalyticsController {
  /**
   * GET /api/production/metrics/overview
   * Dashboard summary with real-time overview
   */
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'today';
      const overview = MetricsService.generateDashboardOverview(
        period,
        mockJobEntries,
        mockTimeEntries,
        45230,
        8
      );
      
      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/employee/:id
   * Individual employee stats
   */
  static async getEmployeeMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const period = (req.query.period as TimePeriod) || 'week';
      
      const employee = mockTimeEntries.find(t => t.employeeId === id);
      if (!employee) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
        return;
      }

      const metrics = MetricsService.calculateEmployeeMetrics(
        id,
        employee.employeeName,
        period,
        mockJobEntries,
        mockTimeEntries
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/team
   * Team stats and analytics
   */
  static async getTeamMetrics(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'week';
      
      const teamMetrics = MetricsService.calculateTeamMetrics(
        period,
        mockJobEntries,
        mockTimeEntries,
        45230
      );

      res.json({
        success: true,
        data: teamMetrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/efficiency
   * Efficiency data with variance analysis
   */
  static async getEfficiencyData(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const jobType = req.query.jobType as string | undefined;
      
      let efficiencyData = MetricsService.generateEfficiencyData(mockJobEntries);
      
      // Apply filters
      if (employeeId) {
        efficiencyData = efficiencyData.filter(d => d.employeeId === employeeId);
      }
      if (jobType) {
        efficiencyData = efficiencyData.filter(d => d.jobType === jobType);
      }

      res.json({
        success: true,
        data: efficiencyData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/throughput
   * Jobs per period metrics
   */
  static async getThroughput(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'week';
      
      const teamMetrics = MetricsService.calculateTeamMetrics(
        period,
        mockJobEntries,
        mockTimeEntries,
        45230
      );

      res.json({
        success: true,
        data: {
          jobsCompleted: teamMetrics.jobsCompleted,
          jobsPerDay: teamMetrics.jobsPerDay,
          revenue: teamMetrics.revenue,
          throughputTrend: teamMetrics.throughputTrend,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/trends
   * Time-series trend data
   */
  static async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';
      
      const efficiencyData = MetricsService.generateEfficiencyData(mockJobEntries);
      const trends = MetricsService.generateTrendData(efficiencyData, groupBy);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/leaderboard
   * Top performers leaderboard
   */
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const leaderboard = MetricsService.generateLeaderboard(
        mockJobEntries,
        mockTimeEntries
      );

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/production/metrics/report
   * Generate and export report
   */
  static async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const config: ReportConfig = req.body;
      
      // Validate config
      if (!config.reportType || !config.dateRange || !config.format) {
        res.status(400).json({
          success: false,
          error: 'Invalid report configuration',
        });
        return;
      }

      // Calculate all metrics needed for report
      const employeeMetrics = mockTimeEntries.map(emp =>
        MetricsService.calculateEmployeeMetrics(
          emp.employeeId,
          emp.employeeName,
          'week',
          mockJobEntries,
          mockTimeEntries
        )
      );

      // Assign ranks
      employeeMetrics.sort((a, b) => b.efficiencyRate - a.efficiencyRate);
      employeeMetrics.forEach((emp, index) => {
        emp.rank = index + 1;
      });

      const teamMetrics = MetricsService.calculateTeamMetrics(
        'week',
        mockJobEntries,
        mockTimeEntries,
        45230
      );

      const leaderboard = MetricsService.generateLeaderboard(
        mockJobEntries,
        mockTimeEntries
      );

      const efficiencyData = MetricsService.generateEfficiencyData(mockJobEntries);

      const report = ReportsService.generateReport(
        config,
        employeeMetrics,
        teamMetrics,
        leaderboard,
        efficiencyData
      );

      // Convert to CSV if requested
      if (config.format === 'csv') {
        const csv = ReportsService.convertToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.id}.csv"`);
        res.send(csv);
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/production/metrics/alerts
   * Manager alerts for low efficiency
   */
  static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const employeeMetrics = mockTimeEntries.map(emp =>
        MetricsService.calculateEmployeeMetrics(
          emp.employeeId,
          emp.employeeName,
          'week',
          mockJobEntries,
          mockTimeEntries
        )
      );

      const alerts = MetricsService.generateAlerts(employeeMetrics);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
