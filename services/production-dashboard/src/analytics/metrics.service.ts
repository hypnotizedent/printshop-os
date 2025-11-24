// Metrics calculation service for production dashboard analytics

import {
  EmployeeMetrics,
  EmployeeSummary,
  TeamMetrics,
  EfficiencyData,
  JobEntry,
  TimeEntry,
  DashboardOverview,
  LeaderboardEntry,
  TrendDataPoint,
  TimePeriod,
  Alert,
} from './types';

export class MetricsService {
  /**
   * Calculate efficiency rate: (estimated / actual) * 100
   * Higher is better - means employee beat the estimate
   */
  static calculateEfficiencyRate(estimatedTime: number, actualTime: number): number {
    if (actualTime === 0) return 0;
    return Math.round((estimatedTime / actualTime) * 100);
  }

  /**
   * Calculate variance between actual and estimated time
   */
  static calculateVariance(estimatedTime: number, actualTime: number): number {
    return actualTime - estimatedTime;
  }

  /**
   * Calculate variance percentage
   */
  static calculateVariancePercent(estimatedTime: number, actualTime: number): number {
    if (estimatedTime === 0) return 0;
    const variance = actualTime - estimatedTime;
    return Math.round((variance / estimatedTime) * 100);
  }

  /**
   * Calculate rework rate: (jobs with rework / total jobs) * 100
   */
  static calculateReworkRate(jobsWithRework: number, totalJobs: number): number {
    if (totalJobs === 0) return 0;
    return Math.round((jobsWithRework / totalJobs) * 100);
  }

  /**
   * Calculate productivity score
   */
  static calculateProductivityScore(
    jobsCompleted: number,
    avgEfficiency: number,
    reworkRate: number
  ): number {
    return Math.round(jobsCompleted * avgEfficiency * (1 - reworkRate / 100));
  }

  /**
   * Calculate employee metrics from job and time entries
   */
  static calculateEmployeeMetrics(
    employeeId: string,
    employeeName: string,
    period: TimePeriod,
    jobEntries: JobEntry[],
    timeEntries: TimeEntry[]
  ): EmployeeMetrics {
    const employeeJobs = jobEntries.filter(job => job.employeeId === employeeId);
    const employeeTime = timeEntries.filter(time => time.employeeId === employeeId);

    const completedJobs = employeeJobs.filter(job => job.completed);
    const jobsInProgress = employeeJobs.filter(job => !job.completed).length;
    const jobsWithRework = completedJobs.filter(job => job.requiresRework).length;

    const totalHoursWorked = employeeTime.reduce((sum, t) => sum + t.hoursWorked, 0);
    const totalProductiveHours = employeeTime.reduce((sum, t) => sum + t.productiveHours, 0);
    const totalBreakTime = employeeTime.reduce((sum, t) => sum + t.breakTime, 0);

    const totalEstimatedHours = completedJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
    const totalActualHours = completedJobs.reduce((sum, job) => sum + job.actualTime, 0);

    const averageJobTime = completedJobs.length > 0
      ? Math.round((totalActualHours / completedJobs.length) * 60) // Convert to minutes
      : 0;

    const efficiencyRate = this.calculateEfficiencyRate(totalEstimatedHours, totalActualHours);
    const reworkRate = this.calculateReworkRate(jobsWithRework, completedJobs.length);

    // Calculate top skills by job type
    const jobTypeMap = new Map<string, { count: number; efficiency: number }>();
    completedJobs.forEach(job => {
      const existing = jobTypeMap.get(job.jobType) || { count: 0, efficiency: 0 };
      const jobEfficiency = this.calculateEfficiencyRate(job.estimatedTime, job.actualTime);
      jobTypeMap.set(job.jobType, {
        count: existing.count + 1,
        efficiency: existing.efficiency + jobEfficiency,
      });
    });

    const topSkills = Array.from(jobTypeMap.entries())
      .map(([type, data]) => ({
        type,
        avgEfficiency: data.efficiency / data.count,
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
      .slice(0, 3)
      .map(item => item.type);

    return {
      employeeId,
      employeeName,
      period,
      hoursWorked: Math.round(totalHoursWorked * 10) / 10,
      productiveHours: Math.round(totalProductiveHours * 10) / 10,
      breakTime: Math.round(totalBreakTime * 10) / 10,
      jobsCompleted: completedJobs.length,
      jobsInProgress,
      averageJobTime,
      estimatedHours: Math.round(totalEstimatedHours * 10) / 10,
      actualHours: Math.round(totalActualHours * 10) / 10,
      efficiencyRate,
      reworkRate,
      errorCount: jobsWithRework,
      rank: 0, // Will be calculated when comparing all employees
      topSkills,
    };
  }

  /**
   * Calculate team metrics
   */
  static calculateTeamMetrics(
    period: TimePeriod,
    jobEntries: JobEntry[],
    timeEntries: TimeEntry[],
    revenue: number
  ): TeamMetrics {
    const completedJobs = jobEntries.filter(job => job.completed);
    const totalEstimatedHours = completedJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
    const totalActualHours = completedJobs.reduce((sum, job) => sum + job.actualTime, 0);

    const uniqueEmployees = new Set(timeEntries.map(t => t.employeeId));
    const totalHoursWorked = timeEntries.reduce((sum, t) => sum + t.hoursWorked, 0);
    const averageHoursPerEmployee = uniqueEmployees.size > 0
      ? Math.round((totalHoursWorked / uniqueEmployees.size) * 10) / 10
      : 0;

    const teamEfficiencyRate = this.calculateEfficiencyRate(totalEstimatedHours, totalActualHours);

    // Calculate days in period for jobs per day
    const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    const jobsPerDay = Math.round((completedJobs.length / daysInPeriod) * 10) / 10;

    // Calculate employee summaries for rankings
    const employeeSummaries = Array.from(uniqueEmployees).map(empId => {
      const empJobs = completedJobs.filter(job => job.employeeId === empId);
      const empTime = timeEntries.filter(time => time.employeeId === empId);
      const empName = empTime[0]?.employeeName || 'Unknown';
      
      const empEstimated = empJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
      const empActual = empJobs.reduce((sum, job) => sum + job.actualTime, 0);
      const empEfficiency = this.calculateEfficiencyRate(empEstimated, empActual);
      const empHours = empTime.reduce((sum, t) => sum + t.hoursWorked, 0);

      return {
        employeeId: empId,
        employeeName: empName,
        efficiencyRate: empEfficiency,
        jobsCompleted: empJobs.length,
        hoursWorked: Math.round(empHours * 10) / 10,
      };
    });

    employeeSummaries.sort((a, b) => b.efficiencyRate - a.efficiencyRate);

    const bestPerformer = employeeSummaries[0] || {
      employeeId: '',
      employeeName: '',
      efficiencyRate: 0,
      jobsCompleted: 0,
      hoursWorked: 0,
    };

    const improvementNeeded = employeeSummaries.filter(emp => emp.efficiencyRate < 85);

    return {
      period,
      jobsCompleted: completedJobs.length,
      jobsPerDay,
      revenue,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      totalEmployees: uniqueEmployees.size,
      averageHoursPerEmployee,
      teamEfficiencyRate,
      bestPerformer,
      improvementNeeded,
      // TODO: Implement trend calculations by comparing with previous period data
      throughputTrend: 0, // Would be calculated from historical data
      efficiencyTrend: 0, // Would be calculated from historical data
    };
  }

  /**
   * Generate dashboard overview
   */
  static generateDashboardOverview(
    period: TimePeriod,
    jobEntries: JobEntry[],
    timeEntries: TimeEntry[],
    revenue: number,
    clockedInEmployees: number
  ): DashboardOverview {
    const completedJobs = jobEntries.filter(job => job.completed);
    const inProgressJobs = jobEntries.filter(job => !job.completed);
    
    const totalEstimatedHours = completedJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
    const totalActualHours = completedJobs.reduce((sum, job) => sum + job.actualTime, 0);
    const teamEfficiency = this.calculateEfficiencyRate(totalEstimatedHours, totalActualHours);

    const averageJobTime = completedJobs.length > 0
      ? Math.round((totalActualHours / completedJobs.length) * 10) / 10
      : 0;

    return {
      period,
      currentDate: new Date().toISOString(),
      jobsToday: completedJobs.length,
      jobsInProgress: inProgressJobs.length,
      teamEfficiency,
      revenue,
      clockedInEmployees,
      averageJobTime,
    };
  }

  /**
   * Generate leaderboard
   */
  static generateLeaderboard(
    jobEntries: JobEntry[],
    timeEntries: TimeEntry[]
  ): LeaderboardEntry[] {
    const uniqueEmployees = new Set(timeEntries.map(t => t.employeeId));
    const completedJobs = jobEntries.filter(job => job.completed);

    const leaderboard: LeaderboardEntry[] = Array.from(uniqueEmployees).map(empId => {
      const empJobs = completedJobs.filter(job => job.employeeId === empId);
      const empTime = timeEntries.filter(time => time.employeeId === empId);
      const empName = empTime[0]?.employeeName || 'Unknown';
      
      const empEstimated = empJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
      const empActual = empJobs.reduce((sum, job) => sum + job.actualTime, 0);
      const empEfficiency = this.calculateEfficiencyRate(empEstimated, empActual);
      const empHours = empTime.reduce((sum, t) => sum + t.hoursWorked, 0);
      const avgJobTime = empJobs.length > 0 ? empActual / empJobs.length : 0;

      return {
        employeeId: empId,
        employeeName: empName,
        efficiencyRate: empEfficiency,
        jobsCompleted: empJobs.length,
        averageJobTime: Math.round(avgJobTime * 10) / 10,
        hoursWorked: Math.round(empHours * 10) / 10,
        rank: 0,
      };
    });

    // Sort by efficiency and assign ranks
    leaderboard.sort((a, b) => b.efficiencyRate - a.efficiencyRate);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }

  /**
   * Generate efficiency data points
   */
  static generateEfficiencyData(jobEntries: JobEntry[]): EfficiencyData[] {
    return jobEntries
      .filter(job => job.completed)
      .map(job => {
        const variance = this.calculateVariance(job.estimatedTime, job.actualTime);
        const variancePercent = this.calculateVariancePercent(job.estimatedTime, job.actualTime);
        
        return {
          date: job.completedDate || new Date().toISOString(),
          employeeId: job.employeeId,
          jobType: job.jobType,
          estimatedTime: job.estimatedTime,
          actualTime: job.actualTime,
          variance,
          variancePercent,
        };
      });
  }

  /**
   * Generate trend data
   */
  static generateTrendData(
    efficiencyData: EfficiencyData[],
    groupBy: 'day' | 'week' | 'month'
  ): TrendDataPoint[] {
    // Group efficiency data by date
    const dataByDate = new Map<string, { total: number; count: number }>();
    
    efficiencyData.forEach(data => {
      const date = new Date(data.date);
      let key: string;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const efficiency = this.calculateEfficiencyRate(data.estimatedTime, data.actualTime);
      const existing = dataByDate.get(key) || { total: 0, count: 0 };
      dataByDate.set(key, {
        total: existing.total + efficiency,
        count: existing.count + 1,
      });
    });

    // Calculate averages and create trend points
    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        value: Math.round(data.total / data.count),
        label: date,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate alerts for low efficiency or high rework
   */
  static generateAlerts(
    employeeMetrics: EmployeeMetrics[],
    efficiencyThreshold: number = 85,
    reworkThreshold: number = 5
  ): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    employeeMetrics.forEach(metrics => {
      // Low efficiency alert
      if (metrics.efficiencyRate < efficiencyThreshold && metrics.jobsCompleted > 0) {
        alerts.push({
          id: `low-eff-${metrics.employeeId}`,
          type: 'low-efficiency',
          severity: 'warning',
          employeeId: metrics.employeeId,
          employeeName: metrics.employeeName,
          message: `${metrics.employeeName} has been below ${efficiencyThreshold}% efficiency`,
          metric: metrics.efficiencyRate,
          threshold: efficiencyThreshold,
          createdAt: now,
        });
      }

      // High rework rate alert
      if (metrics.reworkRate > reworkThreshold && metrics.jobsCompleted > 0) {
        alerts.push({
          id: `high-rework-${metrics.employeeId}`,
          type: 'high-rework',
          severity: 'error',
          employeeId: metrics.employeeId,
          employeeName: metrics.employeeName,
          message: `${metrics.employeeName} has ${metrics.errorCount} jobs requiring rework`,
          metric: metrics.reworkRate,
          threshold: reworkThreshold,
          createdAt: now,
        });
      }

      // Achievement alert (high efficiency for 30+ days would be tracked separately)
      if (metrics.efficiencyRate >= 95 && metrics.jobsCompleted >= 20) {
        alerts.push({
          id: `achievement-${metrics.employeeId}`,
          type: 'achievement',
          severity: 'success',
          employeeId: metrics.employeeId,
          employeeName: metrics.employeeName,
          message: `${metrics.employeeName} maintained 95%+ efficiency!`,
          metric: metrics.efficiencyRate,
          createdAt: now,
        });
      }
    });

    return alerts;
  }
}
