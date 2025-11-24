// Comprehensive tests for production dashboard analytics

import { MetricsService } from '../analytics/metrics.service';
import { ReportsService, Report } from '../analytics/reports.service';
import {
  JobEntry,
  TimeEntry,
  EmployeeMetrics,
  ReportConfig,
} from '../analytics/types';

describe('MetricsService', () => {
  // Test data
  const mockJobs: JobEntry[] = [
    {
      id: '1',
      employeeId: 'emp-1',
      jobType: 'Screen Printing',
      estimatedTime: 2.0,
      actualTime: 1.8,
      completed: true,
      requiresRework: false,
      completedDate: '2025-11-23T10:00:00Z',
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
      actualTime: 2.5,
      completed: true,
      requiresRework: false,
      completedDate: '2025-11-23T11:00:00Z',
    },
    {
      id: '4',
      employeeId: 'emp-2',
      jobType: 'Folding',
      estimatedTime: 1.0,
      actualTime: 1.2,
      completed: true,
      requiresRework: true,
      completedDate: '2025-11-23T15:00:00Z',
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
  ];

  describe('calculateEfficiencyRate', () => {
    test('should calculate efficiency correctly when actual < estimated', () => {
      const efficiency = MetricsService.calculateEfficiencyRate(2.0, 1.8);
      expect(efficiency).toBe(111); // Beat estimate
    });

    test('should calculate efficiency correctly when actual > estimated', () => {
      const efficiency = MetricsService.calculateEfficiencyRate(2.0, 2.5);
      expect(efficiency).toBe(80); // Below estimate
    });

    test('should return 0 when actual time is 0', () => {
      const efficiency = MetricsService.calculateEfficiencyRate(2.0, 0);
      expect(efficiency).toBe(0);
    });

    test('should calculate 100% efficiency when times match', () => {
      const efficiency = MetricsService.calculateEfficiencyRate(2.0, 2.0);
      expect(efficiency).toBe(100);
    });
  });

  describe('calculateVariance', () => {
    test('should calculate positive variance when over estimate', () => {
      const variance = MetricsService.calculateVariance(2.0, 2.5);
      expect(variance).toBe(0.5);
    });

    test('should calculate negative variance when under estimate', () => {
      const variance = MetricsService.calculateVariance(2.0, 1.5);
      expect(variance).toBe(-0.5);
    });

    test('should return 0 when times match', () => {
      const variance = MetricsService.calculateVariance(2.0, 2.0);
      expect(variance).toBe(0);
    });
  });

  describe('calculateVariancePercent', () => {
    test('should calculate variance percentage correctly', () => {
      const variancePercent = MetricsService.calculateVariancePercent(2.0, 2.5);
      expect(variancePercent).toBe(25); // 25% over estimate
    });

    test('should handle negative variance', () => {
      const variancePercent = MetricsService.calculateVariancePercent(2.0, 1.6);
      expect(variancePercent).toBe(-20); // 20% under estimate
    });

    test('should return 0 when estimated time is 0', () => {
      const variancePercent = MetricsService.calculateVariancePercent(0, 2.0);
      expect(variancePercent).toBe(0);
    });
  });

  describe('calculateReworkRate', () => {
    test('should calculate rework rate correctly', () => {
      const reworkRate = MetricsService.calculateReworkRate(2, 10);
      expect(reworkRate).toBe(20); // 20% rework rate
    });

    test('should return 0 when no rework', () => {
      const reworkRate = MetricsService.calculateReworkRate(0, 10);
      expect(reworkRate).toBe(0);
    });

    test('should return 0 when total jobs is 0', () => {
      const reworkRate = MetricsService.calculateReworkRate(2, 0);
      expect(reworkRate).toBe(0);
    });
  });

  describe('calculateProductivityScore', () => {
    test('should calculate productivity score correctly', () => {
      const score = MetricsService.calculateProductivityScore(10, 95, 5);
      expect(score).toBe(903); // 10 * 95 * 0.95
    });

    test('should return 0 when no jobs completed', () => {
      const score = MetricsService.calculateProductivityScore(0, 95, 5);
      expect(score).toBe(0);
    });
  });

  describe('calculateEmployeeMetrics', () => {
    test('should calculate comprehensive employee metrics', () => {
      const metrics = MetricsService.calculateEmployeeMetrics(
        'emp-1',
        'Sarah Johnson',
        'week',
        mockJobs,
        mockTimeEntries
      );

      expect(metrics.employeeId).toBe('emp-1');
      expect(metrics.employeeName).toBe('Sarah Johnson');
      expect(metrics.jobsCompleted).toBe(2);
      expect(metrics.hoursWorked).toBe(8.0);
      expect(metrics.productiveHours).toBe(7.5);
      expect(metrics.breakTime).toBe(0.5);
      expect(metrics.efficiencyRate).toBeGreaterThan(0);
      expect(metrics.topSkills).toContain('Screen Printing');
    });

    test('should calculate rework rate for employee', () => {
      const metrics = MetricsService.calculateEmployeeMetrics(
        'emp-2',
        'John Smith',
        'week',
        mockJobs,
        mockTimeEntries
      );

      expect(metrics.jobsCompleted).toBe(2);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.reworkRate).toBe(50); // 1 out of 2 jobs
    });

    test('should handle employee with no jobs', () => {
      const metrics = MetricsService.calculateEmployeeMetrics(
        'emp-3',
        'New Employee',
        'week',
        mockJobs,
        mockTimeEntries
      );

      expect(metrics.jobsCompleted).toBe(0);
      expect(metrics.averageJobTime).toBe(0);
      expect(metrics.efficiencyRate).toBe(0);
    });
  });

  describe('calculateTeamMetrics', () => {
    test('should calculate team metrics correctly', () => {
      const teamMetrics = MetricsService.calculateTeamMetrics(
        'week',
        mockJobs,
        mockTimeEntries,
        45230
      );

      expect(teamMetrics.jobsCompleted).toBe(4);
      expect(teamMetrics.totalEmployees).toBe(2);
      expect(teamMetrics.revenue).toBe(45230);
      expect(teamMetrics.teamEfficiencyRate).toBeGreaterThan(0);
      expect(teamMetrics.bestPerformer).toBeDefined();
      expect(teamMetrics.bestPerformer.employeeName).toBeTruthy();
    });

    test('should identify employees needing improvement', () => {
      const teamMetrics = MetricsService.calculateTeamMetrics(
        'week',
        mockJobs,
        mockTimeEntries,
        45230
      );

      expect(Array.isArray(teamMetrics.improvementNeeded)).toBe(true);
    });

    test('should calculate jobs per day correctly', () => {
      const teamMetrics = MetricsService.calculateTeamMetrics(
        'week',
        mockJobs,
        mockTimeEntries,
        45230
      );

      expect(teamMetrics.jobsPerDay).toBeCloseTo(0.6, 1); // 4 jobs / 7 days
    });
  });

  describe('generateDashboardOverview', () => {
    test('should generate complete dashboard overview', () => {
      const overview = MetricsService.generateDashboardOverview(
        'today',
        mockJobs,
        mockTimeEntries,
        8450,
        8
      );

      expect(overview.period).toBe('today');
      expect(overview.jobsToday).toBe(4);
      expect(overview.jobsInProgress).toBe(0);
      expect(overview.revenue).toBe(8450);
      expect(overview.clockedInEmployees).toBe(8);
      expect(overview.teamEfficiency).toBeGreaterThan(0);
    });
  });

  describe('generateLeaderboard', () => {
    test('should generate leaderboard with rankings', () => {
      const leaderboard = MetricsService.generateLeaderboard(
        mockJobs,
        mockTimeEntries
      );

      expect(leaderboard.length).toBe(2);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[0].efficiencyRate).toBeGreaterThanOrEqual(
        leaderboard[1].efficiencyRate
      );
    });

    test('should include all required leaderboard fields', () => {
      const leaderboard = MetricsService.generateLeaderboard(
        mockJobs,
        mockTimeEntries
      );

      const entry = leaderboard[0];
      expect(entry).toHaveProperty('employeeId');
      expect(entry).toHaveProperty('employeeName');
      expect(entry).toHaveProperty('efficiencyRate');
      expect(entry).toHaveProperty('jobsCompleted');
      expect(entry).toHaveProperty('averageJobTime');
      expect(entry).toHaveProperty('hoursWorked');
      expect(entry).toHaveProperty('rank');
    });
  });

  describe('generateEfficiencyData', () => {
    test('should generate efficiency data for completed jobs', () => {
      const efficiencyData = MetricsService.generateEfficiencyData(mockJobs);

      expect(efficiencyData.length).toBe(4);
      efficiencyData.forEach(data => {
        expect(data).toHaveProperty('date');
        expect(data).toHaveProperty('employeeId');
        expect(data).toHaveProperty('jobType');
        expect(data).toHaveProperty('estimatedTime');
        expect(data).toHaveProperty('actualTime');
        expect(data).toHaveProperty('variance');
        expect(data).toHaveProperty('variancePercent');
      });
    });

    test('should calculate variance correctly in efficiency data', () => {
      const efficiencyData = MetricsService.generateEfficiencyData(mockJobs);
      const firstJob = efficiencyData[0];

      expect(firstJob.variance).toBe(firstJob.actualTime - firstJob.estimatedTime);
    });
  });

  describe('generateTrendData', () => {
    test('should group efficiency data by day', () => {
      const efficiencyData = MetricsService.generateEfficiencyData(mockJobs);
      const trends = MetricsService.generateTrendData(efficiencyData, 'day');

      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('value');
        expect(trend).toHaveProperty('label');
      });
    });

    test('should calculate average efficiency for trend data', () => {
      const efficiencyData = MetricsService.generateEfficiencyData(mockJobs);
      const trends = MetricsService.generateTrendData(efficiencyData, 'day');

      trends.forEach(trend => {
        expect(trend.value).toBeGreaterThan(0);
        expect(typeof trend.value).toBe('number');
      });
    });
  });

  describe('generateAlerts', () => {
    test('should generate low efficiency alerts', () => {
      const employeeMetrics: EmployeeMetrics[] = [
        {
          employeeId: 'emp-1',
          employeeName: 'Low Performer',
          period: 'week',
          hoursWorked: 40,
          productiveHours: 38,
          breakTime: 2,
          jobsCompleted: 10,
          jobsInProgress: 0,
          averageJobTime: 120,
          estimatedHours: 20,
          actualHours: 26,
          efficiencyRate: 77, // Below 85% threshold
          reworkRate: 3,
          errorCount: 1,
          rank: 1,
          topSkills: ['Screen Printing'],
        },
      ];

      const alerts = MetricsService.generateAlerts(employeeMetrics, 85, 5);

      const lowEffAlert = alerts.find(a => a.type === 'low-efficiency');
      expect(lowEffAlert).toBeDefined();
      expect(lowEffAlert?.severity).toBe('warning');
      expect(lowEffAlert?.metric).toBe(77);
    });

    test('should generate high rework alerts', () => {
      const employeeMetrics: EmployeeMetrics[] = [
        {
          employeeId: 'emp-2',
          employeeName: 'Quality Issues',
          period: 'week',
          hoursWorked: 40,
          productiveHours: 38,
          breakTime: 2,
          jobsCompleted: 10,
          jobsInProgress: 0,
          averageJobTime: 120,
          estimatedHours: 20,
          actualHours: 22,
          efficiencyRate: 91,
          reworkRate: 10, // Above 5% threshold
          errorCount: 1,
          rank: 1,
          topSkills: ['DTG'],
        },
      ];

      const alerts = MetricsService.generateAlerts(employeeMetrics, 85, 5);

      const reworkAlert = alerts.find(a => a.type === 'high-rework');
      expect(reworkAlert).toBeDefined();
      expect(reworkAlert?.severity).toBe('error');
    });

    test('should generate achievement alerts', () => {
      const employeeMetrics: EmployeeMetrics[] = [
        {
          employeeId: 'emp-3',
          employeeName: 'Top Performer',
          period: 'week',
          hoursWorked: 40,
          productiveHours: 38,
          breakTime: 2,
          jobsCompleted: 25,
          jobsInProgress: 0,
          averageJobTime: 120,
          estimatedHours: 50,
          actualHours: 48,
          efficiencyRate: 104, // Above 95% and 20+ jobs
          reworkRate: 2,
          errorCount: 0,
          rank: 1,
          topSkills: ['Screen Printing'],
        },
      ];

      const alerts = MetricsService.generateAlerts(employeeMetrics, 85, 5);

      const achievementAlert = alerts.find(a => a.type === 'achievement');
      expect(achievementAlert).toBeDefined();
      expect(achievementAlert?.severity).toBe('success');
    });
  });
});

describe('ReportsService', () => {
  const mockEmployeeMetrics: EmployeeMetrics[] = [
    {
      employeeId: 'emp-1',
      employeeName: 'Sarah Johnson',
      period: 'week',
      hoursWorked: 40,
      productiveHours: 38,
      breakTime: 2,
      jobsCompleted: 24,
      jobsInProgress: 1,
      averageJobTime: 90,
      estimatedHours: 36,
      actualHours: 37,
      efficiencyRate: 97,
      reworkRate: 2,
      errorCount: 0,
      rank: 1,
      topSkills: ['Screen Printing', 'Folding'],
    },
  ];

  const mockTeamMetrics = {
    period: 'week' as const,
    jobsCompleted: 84,
    jobsPerDay: 12,
    revenue: 45230,
    totalHoursWorked: 456,
    totalEmployees: 12,
    averageHoursPerEmployee: 38,
    teamEfficiencyRate: 94,
    bestPerformer: {
      employeeId: 'emp-1',
      employeeName: 'Sarah Johnson',
      efficiencyRate: 97,
      jobsCompleted: 24,
      hoursWorked: 40,
    },
    improvementNeeded: [],
    throughputTrend: 12,
    efficiencyTrend: 2,
  };

  const mockLeaderboard = [
    {
      employeeId: 'emp-1',
      employeeName: 'Sarah Johnson',
      efficiencyRate: 97,
      jobsCompleted: 24,
      averageJobTime: 1.5,
      hoursWorked: 40,
      rank: 1,
    },
  ];

  const mockEfficiencyData = MetricsService.generateEfficiencyData([
    {
      id: '1',
      employeeId: 'emp-1',
      jobType: 'Screen Printing',
      estimatedTime: 2.0,
      actualTime: 1.8,
      completed: true,
      requiresRework: false,
      completedDate: '2025-11-23T10:00:00Z',
    },
  ]);

  describe('generateReport', () => {
    test('should generate productivity summary report', () => {
      const config: ReportConfig = {
        reportType: 'productivity-summary',
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: true,
        includeCharts: true,
        includeEmployeeBreakdown: true,
        includeJobTypeAnalysis: false,
        includeCostAnalysis: false,
        format: 'pdf',
      };

      const report = ReportsService.generateReport(
        config,
        mockEmployeeMetrics,
        mockTeamMetrics,
        mockLeaderboard,
        mockEfficiencyData
      );

      expect(report).toBeDefined();
      expect(report.type).toBe('productivity-summary');
      expect(report.format).toBe('pdf');
      expect(report.data.title).toContain('Productivity Summary');
      expect(report.data.executiveSummary).toBeDefined();
    });

    test('should generate employee performance report', () => {
      const config: ReportConfig = {
        reportType: 'employee-performance',
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: false,
        includeCharts: false,
        includeEmployeeBreakdown: false,
        includeJobTypeAnalysis: false,
        includeCostAnalysis: false,
        format: 'csv',
      };

      const report = ReportsService.generateReport(
        config,
        mockEmployeeMetrics,
        mockTeamMetrics,
        mockLeaderboard,
        mockEfficiencyData
      );

      expect(report.type).toBe('employee-performance');
      expect(report.data.employees).toBeDefined();
      expect(report.data.employees.length).toBeGreaterThan(0);
    });

    test('should generate team analytics report', () => {
      const config: ReportConfig = {
        reportType: 'team-analytics',
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: false,
        includeCharts: false,
        includeEmployeeBreakdown: false,
        includeJobTypeAnalysis: true,
        includeCostAnalysis: true,
        format: 'excel',
      };

      const report = ReportsService.generateReport(
        config,
        mockEmployeeMetrics,
        mockTeamMetrics,
        mockLeaderboard,
        mockEfficiencyData
      );

      expect(report.type).toBe('team-analytics');
      expect(report.data.teamSummary).toBeDefined();
      expect(report.data.costAnalysis).toBeDefined();
    });

    test('should throw error for invalid report type', () => {
      const config: ReportConfig = {
        reportType: 'invalid-type' as any,
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: false,
        includeCharts: false,
        includeEmployeeBreakdown: false,
        includeJobTypeAnalysis: false,
        includeCostAnalysis: false,
        format: 'pdf',
      };

      expect(() =>
        ReportsService.generateReport(
          config,
          mockEmployeeMetrics,
          mockTeamMetrics,
          mockLeaderboard,
          mockEfficiencyData
        )
      ).toThrow();
    });
  });

  describe('convertToCSV', () => {
    test('should convert report to CSV format', () => {
      const config: ReportConfig = {
        reportType: 'productivity-summary',
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: true,
        includeCharts: false,
        includeEmployeeBreakdown: true,
        includeJobTypeAnalysis: false,
        includeCostAnalysis: false,
        format: 'csv',
      };

      const report = ReportsService.generateReport(
        config,
        mockEmployeeMetrics,
        mockTeamMetrics,
        mockLeaderboard,
        mockEfficiencyData
      );

      const csv = ReportsService.convertToCSV(report);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Report:');
      expect(csv).toContain('Generated:');
      expect(csv).toContain('Date Range:');
    });

    test('should include employee data in CSV', () => {
      const config: ReportConfig = {
        reportType: 'employee-performance',
        dateRange: { from: '2025-11-18', to: '2025-11-23' },
        includeExecutiveSummary: false,
        includeCharts: false,
        includeEmployeeBreakdown: false,
        includeJobTypeAnalysis: false,
        includeCostAnalysis: false,
        format: 'csv',
      };

      const report = ReportsService.generateReport(
        config,
        mockEmployeeMetrics,
        mockTeamMetrics,
        mockLeaderboard,
        mockEfficiencyData
      );

      const csv = ReportsService.convertToCSV(report);

      expect(csv).toContain('Sarah Johnson');
    });
  });
});
