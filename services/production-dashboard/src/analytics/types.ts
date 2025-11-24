// Core types for production dashboard analytics

export type TimePeriod = 'today' | 'week' | 'month';

export interface EmployeeMetrics {
  employeeId: string;
  employeeName: string;
  period: TimePeriod;
  
  // Time metrics
  hoursWorked: number;
  productiveHours: number;
  breakTime: number;
  
  // Job metrics
  jobsCompleted: number;
  jobsInProgress: number;
  averageJobTime: number;      // minutes
  
  // Efficiency
  estimatedHours: number;
  actualHours: number;
  efficiencyRate: number;       // (estimated / actual) * 100
  
  // Quality
  reworkRate: number;           // % jobs requiring rework
  errorCount: number;
  
  // Rankings
  rank: number;                 // Team ranking
  topSkills: string[];          // Best job types
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  efficiencyRate: number;
  jobsCompleted: number;
  hoursWorked: number;
}

export interface TeamMetrics {
  period: TimePeriod;
  
  // Throughput
  jobsCompleted: number;
  jobsPerDay: number;
  revenue: number;
  
  // Labor
  totalHoursWorked: number;
  totalEmployees: number;
  averageHoursPerEmployee: number;
  
  // Efficiency
  teamEfficiencyRate: number;
  bestPerformer: EmployeeSummary;
  improvementNeeded: EmployeeSummary[];
  
  // Trends
  throughputTrend: number;      // % change from previous period
  efficiencyTrend: number;
}

export interface EfficiencyData {
  date: string;
  employeeId?: string;
  jobType?: string;
  estimatedTime: number;
  actualTime: number;
  variance: number;             // actual - estimated
  variancePercent: number;
}

export interface JobEntry {
  id: string;
  employeeId: string;
  jobType: string;
  estimatedTime: number;        // hours
  actualTime: number;           // hours
  completed: boolean;
  requiresRework: boolean;
  completedDate?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  productiveHours: number;
  breakTime: number;
}

export interface DashboardOverview {
  period: TimePeriod;
  currentDate: string;
  
  // Real-time stats
  jobsToday: number;
  jobsInProgress: number;
  teamEfficiency: number;
  revenue: number;
  clockedInEmployees: number;
  averageJobTime: number;       // hours
}

export interface LeaderboardEntry {
  employeeId: string;
  employeeName: string;
  efficiencyRate: number;
  jobsCompleted: number;
  averageJobTime: number;
  hoursWorked: number;
  rank: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ReportConfig {
  reportType: 'productivity-summary' | 'employee-performance' | 'team-analytics' | 'job-throughput' | 'efficiency-trends';
  dateRange: {
    from: string;
    to: string;
  };
  includeExecutiveSummary: boolean;
  includeCharts: boolean;
  includeEmployeeBreakdown: boolean;
  includeJobTypeAnalysis: boolean;
  includeCostAnalysis: boolean;
  format: 'pdf' | 'csv' | 'excel';
}

export interface Alert {
  id: string;
  type: 'low-efficiency' | 'high-rework' | 'achievement';
  severity: 'warning' | 'error' | 'success';
  employeeId: string;
  employeeName: string;
  message: string;
  metric?: number;
  threshold?: number;
  createdAt: string;
}
