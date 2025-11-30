// Analytics API controller for production dashboard

import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { ReportsService } from './reports.service';
import { StrapiService } from './strapi.service';
import {
  TimePeriod,
  ReportConfig,
} from './types';

export class AnalyticsController {
  /**
   * GET /api/production/metrics/overview
   * Dashboard summary with real-time overview
   */
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'today';
      
      // Fetch data from Strapi
      const [jobEntries, timeEntries, revenue, clockedInEmployees] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
        StrapiService.fetchRevenue(period),
        StrapiService.fetchClockedInCount(),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();
      
      const overview = MetricsService.generateDashboardOverview(
        period,
        jobEntries,
        effectiveTimeEntries,
        revenue,
        clockedInEmployees || effectiveTimeEntries.length
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

      // Fetch data from Strapi
      const [jobEntries, timeEntries] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      const employee = effectiveTimeEntries.find(t => t.employeeId === id);
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
        jobEntries,
        effectiveTimeEntries
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

      // Fetch data from Strapi
      const [jobEntries, timeEntries, revenue] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
        StrapiService.fetchRevenue(period),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      const teamMetrics = MetricsService.calculateTeamMetrics(
        period,
        jobEntries,
        effectiveTimeEntries,
        revenue
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
   * Note: Query parameters are used for filtering, not as sensitive data
   */
  static async getEfficiencyData(req: Request, res: Response): Promise<void> {
    try {
      // Validate and sanitize query parameters to prevent injection
      const employeeId = req.query.employeeId as string | undefined;
      const jobType = req.query.jobType as string | undefined;

      // Basic validation to prevent injection
      if (employeeId && !/^[a-zA-Z0-9-]+$/.test(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employeeId format',
        });
        return;
      }

      if (jobType && !/^[a-zA-Z0-9\s-]+$/.test(jobType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid jobType format',
        });
        return;
      }

      // Fetch job entries from Strapi
      const jobEntries = await StrapiService.fetchJobEntries();
      let efficiencyData = MetricsService.generateEfficiencyData(jobEntries);

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

      // Fetch data from Strapi
      const [jobEntries, timeEntries, revenue] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
        StrapiService.fetchRevenue(period),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      const teamMetrics = MetricsService.calculateTeamMetrics(
        period,
        jobEntries,
        effectiveTimeEntries,
        revenue
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

      // Fetch job entries from Strapi
      const jobEntries = await StrapiService.fetchJobEntries();
      const efficiencyData = MetricsService.generateEfficiencyData(jobEntries);
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
  static async getLeaderboard(_req: Request, res: Response): Promise<void> {
    try {
      // Fetch data from Strapi
      const [jobEntries, timeEntries] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      const leaderboard = MetricsService.generateLeaderboard(
        jobEntries,
        effectiveTimeEntries
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

      // Fetch data from Strapi
      const [jobEntries, timeEntries, revenue] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
        StrapiService.fetchRevenue('week'),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      // Calculate all metrics needed for report
      const employeeMetrics = effectiveTimeEntries.map(emp =>
        MetricsService.calculateEmployeeMetrics(
          emp.employeeId,
          emp.employeeName,
          'week',
          jobEntries,
          effectiveTimeEntries
        )
      );

      // Assign ranks
      employeeMetrics.sort((a, b) => b.efficiencyRate - a.efficiencyRate);
      employeeMetrics.forEach((emp, index) => {
        emp.rank = index + 1;
      });

      const teamMetrics = MetricsService.calculateTeamMetrics(
        'week',
        jobEntries,
        effectiveTimeEntries,
        revenue
      );

      const leaderboard = MetricsService.generateLeaderboard(
        jobEntries,
        effectiveTimeEntries
      );

      const efficiencyData = MetricsService.generateEfficiencyData(jobEntries);

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
  static async getAlerts(_req: Request, res: Response): Promise<void> {
    try {
      // Fetch data from Strapi
      const [jobEntries, timeEntries] = await Promise.all([
        StrapiService.fetchJobEntries(),
        StrapiService.fetchTimeEntries(),
      ]);
      
      // Fallback to employees list if no time entries
      const effectiveTimeEntries = timeEntries.length > 0 
        ? timeEntries 
        : await StrapiService.fetchEmployees();

      const employeeMetrics = effectiveTimeEntries.map(emp =>
        MetricsService.calculateEmployeeMetrics(
          emp.employeeId,
          emp.employeeName,
          'week',
          jobEntries,
          effectiveTimeEntries
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
