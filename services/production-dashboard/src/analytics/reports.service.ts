// Reports generation service for production dashboard

import {
  ReportConfig,
  EmployeeMetrics,
  TeamMetrics,
  LeaderboardEntry,
  EfficiencyData,
} from './types';

export interface Report {
  id: string;
  type: string;
  dateRange: {
    from: string;
    to: string;
  };
  generatedAt: string;
  format: 'pdf' | 'csv' | 'excel';
  data: any;
}

export class ReportsService {
  /**
   * Generate a report based on configuration
   */
  static generateReport(
    config: ReportConfig,
    employeeMetrics: EmployeeMetrics[],
    teamMetrics: TeamMetrics,
    leaderboard: LeaderboardEntry[],
    efficiencyData: EfficiencyData[]
  ): Report {
    const reportId = `report-${Date.now()}`;
    const now = new Date().toISOString();

    let data: any;

    switch (config.reportType) {
      case 'productivity-summary':
        data = this.generateProductivitySummary(
          employeeMetrics,
          teamMetrics,
          leaderboard,
          config
        );
        break;
      
      case 'employee-performance':
        data = this.generateEmployeePerformance(employeeMetrics, config);
        break;
      
      case 'team-analytics':
        data = this.generateTeamAnalytics(teamMetrics, employeeMetrics, config);
        break;
      
      case 'job-throughput':
        data = this.generateJobThroughput(teamMetrics, efficiencyData, config);
        break;
      
      case 'efficiency-trends':
        data = this.generateEfficiencyTrends(efficiencyData, config);
        break;
      
      default:
        throw new Error(`Unknown report type: ${config.reportType}`);
    }

    return {
      id: reportId,
      type: config.reportType,
      dateRange: config.dateRange,
      generatedAt: now,
      format: config.format,
      data,
    };
  }

  /**
   * Generate productivity summary report
   */
  private static generateProductivitySummary(
    employeeMetrics: EmployeeMetrics[],
    teamMetrics: TeamMetrics,
    leaderboard: LeaderboardEntry[],
    config: ReportConfig
  ): any {
    const summary: any = {
      title: 'Productivity Summary Report',
      dateRange: config.dateRange,
    };

    if (config.includeExecutiveSummary) {
      summary.executiveSummary = {
        totalEmployees: teamMetrics.totalEmployees,
        totalJobsCompleted: teamMetrics.jobsCompleted,
        teamEfficiency: teamMetrics.teamEfficiencyRate,
        totalRevenue: teamMetrics.revenue,
        averageJobsPerDay: teamMetrics.jobsPerDay,
        topPerformer: teamMetrics.bestPerformer.employeeName,
      };
    }

    if (config.includeEmployeeBreakdown) {
      summary.employeeBreakdown = employeeMetrics.map(emp => ({
        name: emp.employeeName,
        jobsCompleted: emp.jobsCompleted,
        hoursWorked: emp.hoursWorked,
        efficiency: emp.efficiencyRate,
        rank: emp.rank,
      }));
    }

    if (config.includeCharts) {
      summary.charts = {
        leaderboard: leaderboard.slice(0, 5),
        efficiencyDistribution: this.calculateEfficiencyDistribution(employeeMetrics),
      };
    }

    return summary;
  }

  /**
   * Generate employee performance report
   */
  private static generateEmployeePerformance(
    employeeMetrics: EmployeeMetrics[],
    config: ReportConfig
  ): any {
    return {
      title: 'Employee Performance Report',
      dateRange: config.dateRange,
      employees: employeeMetrics.map(emp => ({
        id: emp.employeeId,
        name: emp.employeeName,
        hoursWorked: emp.hoursWorked,
        productiveHours: emp.productiveHours,
        jobsCompleted: emp.jobsCompleted,
        efficiency: emp.efficiencyRate,
        reworkRate: emp.reworkRate,
        topSkills: emp.topSkills,
        rank: emp.rank,
      })),
    };
  }

  /**
   * Generate team analytics report
   */
  private static generateTeamAnalytics(
    teamMetrics: TeamMetrics,
    employeeMetrics: EmployeeMetrics[],
    config: ReportConfig
  ): any {
    const report: any = {
      title: 'Team Analytics Report',
      dateRange: config.dateRange,
      teamSummary: {
        totalEmployees: teamMetrics.totalEmployees,
        jobsCompleted: teamMetrics.jobsCompleted,
        jobsPerDay: teamMetrics.jobsPerDay,
        teamEfficiency: teamMetrics.teamEfficiencyRate,
        totalHoursWorked: teamMetrics.totalHoursWorked,
      },
      bestPerformer: teamMetrics.bestPerformer,
      improvementNeeded: teamMetrics.improvementNeeded,
    };

    if (config.includeJobTypeAnalysis) {
      report.jobTypeAnalysis = this.analyzeJobTypes(employeeMetrics);
    }

    if (config.includeCostAnalysis) {
      report.costAnalysis = this.calculateCostMetrics(teamMetrics);
    }

    return report;
  }

  /**
   * Generate job throughput report
   */
  private static generateJobThroughput(
    teamMetrics: TeamMetrics,
    efficiencyData: EfficiencyData[],
    config: ReportConfig
  ): any {
    const jobsByType = this.groupJobsByType(efficiencyData);
    
    return {
      title: 'Job Throughput Report',
      dateRange: config.dateRange,
      totalJobsCompleted: teamMetrics.jobsCompleted,
      averageJobsPerDay: teamMetrics.jobsPerDay,
      revenue: teamMetrics.revenue,
      throughputTrend: teamMetrics.throughputTrend,
      jobTypeBreakdown: jobsByType,
    };
  }

  /**
   * Generate efficiency trends report
   */
  private static generateEfficiencyTrends(
    efficiencyData: EfficiencyData[],
    config: ReportConfig
  ): any {
    const averageEfficiency = efficiencyData.length > 0
      ? efficiencyData.reduce((sum, d) => {
          const eff = (d.estimatedTime / d.actualTime) * 100;
          return sum + eff;
        }, 0) / efficiencyData.length
      : 0;

    return {
      title: 'Efficiency Trends Report',
      dateRange: config.dateRange,
      averageEfficiency: Math.round(averageEfficiency),
      totalDataPoints: efficiencyData.length,
      trends: efficiencyData.slice(0, 30), // Last 30 data points
      varianceAnalysis: this.analyzeVariance(efficiencyData),
    };
  }

  /**
   * Convert report to CSV format
   */
  static convertToCSV(report: Report): string {
    const lines: string[] = [];
    
    lines.push(`Report: ${report.type}`);
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Date Range: ${report.dateRange.from} to ${report.dateRange.to}`);
    lines.push('');

    if (report.data.executiveSummary) {
      lines.push('Executive Summary');
      Object.entries(report.data.executiveSummary).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
      lines.push('');
    }

    if (report.data.employees) {
      lines.push('Employee,Hours Worked,Jobs Completed,Efficiency,Rank');
      report.data.employees.forEach((emp: any) => {
        lines.push(`${emp.name},${emp.hoursWorked},${emp.jobsCompleted},${emp.efficiency},${emp.rank}`);
      });
    }

    if (report.data.employeeBreakdown) {
      lines.push('Employee,Hours Worked,Jobs Completed,Efficiency,Rank');
      report.data.employeeBreakdown.forEach((emp: any) => {
        lines.push(`${emp.name},${emp.hoursWorked},${emp.jobsCompleted},${emp.efficiency},${emp.rank}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Helper: Calculate efficiency distribution
   */
  private static calculateEfficiencyDistribution(employeeMetrics: EmployeeMetrics[]): any {
    const ranges = [
      { label: '0-70%', count: 0 },
      { label: '70-85%', count: 0 },
      { label: '85-95%', count: 0 },
      { label: '95-100%', count: 0 },
      { label: '100%+', count: 0 },
    ];

    employeeMetrics.forEach(emp => {
      const eff = emp.efficiencyRate;
      if (eff < 70) ranges[0].count++;
      else if (eff < 85) ranges[1].count++;
      else if (eff < 95) ranges[2].count++;
      else if (eff <= 100) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }

  /**
   * Helper: Analyze job types
   */
  private static analyzeJobTypes(employeeMetrics: EmployeeMetrics[]): any {
    const skillsMap = new Map<string, number>();
    
    employeeMetrics.forEach(emp => {
      emp.topSkills.forEach(skill => {
        skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
      });
    });

    return Array.from(skillsMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper: Calculate cost metrics
   */
  private static calculateCostMetrics(teamMetrics: TeamMetrics): any {
    // TODO: Make laborCostPerHour configurable via environment variables or config
    const laborCostPerHour = 20; // Default rate - should be configurable
    const totalLaborCost = teamMetrics.totalHoursWorked * laborCostPerHour;
    const costPerJob = teamMetrics.jobsCompleted > 0
      ? totalLaborCost / teamMetrics.jobsCompleted
      : 0;
    const revenuePerHour = teamMetrics.totalHoursWorked > 0
      ? teamMetrics.revenue / teamMetrics.totalHoursWorked
      : 0;

    return {
      totalLaborCost: Math.round(totalLaborCost),
      costPerJob: Math.round(costPerJob),
      revenuePerHour: Math.round(revenuePerHour),
    };
  }

  /**
   * Helper: Group jobs by type
   */
  private static groupJobsByType(efficiencyData: EfficiencyData[]): any {
    const jobTypeMap = new Map<string, { count: number; avgEfficiency: number }>();
    
    efficiencyData.forEach(data => {
      if (!data.jobType) return;
      
      const efficiency = (data.estimatedTime / data.actualTime) * 100;
      const existing = jobTypeMap.get(data.jobType) || { count: 0, avgEfficiency: 0 };
      
      jobTypeMap.set(data.jobType, {
        count: existing.count + 1,
        avgEfficiency: existing.avgEfficiency + efficiency,
      });
    });

    return Array.from(jobTypeMap.entries()).map(([type, data]) => ({
      jobType: type,
      count: data.count,
      averageEfficiency: Math.round(data.avgEfficiency / data.count),
    }));
  }

  /**
   * Helper: Analyze variance
   */
  private static analyzeVariance(efficiencyData: EfficiencyData[]): any {
    const variances = efficiencyData.map(d => d.variance);
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    
    const underEstimate = efficiencyData.filter(d => d.variance > 0).length;
    const overEstimate = efficiencyData.filter(d => d.variance < 0).length;
    const onTime = efficiencyData.filter(d => d.variance === 0).length;

    return {
      averageVariance: Math.round(avgVariance * 10) / 10,
      underEstimateCount: underEstimate,
      overEstimateCount: overEstimate,
      onTimeCount: onTime,
    };
  }
}
