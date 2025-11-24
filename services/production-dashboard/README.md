# Production Dashboard - Team Productivity Metrics & Analytics

Comprehensive analytics service for tracking team productivity, employee performance, and production efficiency.

## Features

### Metrics Tracking
- **Employee Metrics**: Hours worked, jobs completed, efficiency rates, rework rates
- **Team Analytics**: Throughput, labor costs, best performers, improvement areas
- **Efficiency Analysis**: Variance tracking, trend analysis, productivity scoring
- **Real-time Dashboard**: Live overview of production status and team performance

### Reporting
- **5 Report Types**:
  1. Productivity Summary
  2. Employee Performance
  3. Team Analytics
  4. Job Throughput
  5. Efficiency Trends
- **Export Formats**: PDF, CSV, Excel
- **Configurable Options**: Executive summary, charts, employee breakdown, cost analysis

### Alerts & Notifications
- Low efficiency warnings (below 85% threshold)
- High rework rate alerts (above 5% threshold)
- Achievement notifications (95%+ efficiency)

## API Endpoints

### Dashboard Overview
```
GET /api/production/metrics/overview?period=today|week|month
```
Returns real-time metrics: jobs completed, team efficiency, revenue, active employees.

### Employee Metrics
```
GET /api/production/metrics/employee/:id?period=week
```
Returns detailed metrics for a specific employee including efficiency, jobs, and rankings.

### Team Metrics
```
GET /api/production/metrics/team?period=week
```
Returns team-wide analytics: throughput, labor costs, best performers.

### Efficiency Data
```
GET /api/production/metrics/efficiency?employeeId=xxx&jobType=yyy
```
Returns efficiency data with variance analysis. Supports filtering by employee and job type.

### Throughput
```
GET /api/production/metrics/throughput?period=week
```
Returns job completion rates and trends.

### Trends
```
GET /api/production/metrics/trends?groupBy=day|week|month
```
Returns time-series efficiency trend data.

### Leaderboard
```
GET /api/production/metrics/leaderboard
```
Returns ranked list of top performers.

### Generate Report
```
POST /api/production/metrics/report
```
Generates and exports analytics reports.

**Request Body:**
```json
{
  "reportType": "productivity-summary",
  "dateRange": {
    "from": "2025-11-01",
    "to": "2025-11-23"
  },
  "includeExecutiveSummary": true,
  "includeCharts": true,
  "includeEmployeeBreakdown": true,
  "includeJobTypeAnalysis": false,
  "includeCostAnalysis": false,
  "format": "pdf"
}
```

### Alerts
```
GET /api/production/metrics/alerts
```
Returns active alerts for low efficiency and high rework rates.

## Calculations

### Efficiency Rate
```
efficiencyRate = (estimatedTime / actualTime) * 100
```
- > 100%: Beat estimate (efficient)
- = 100%: Met estimate
- < 100%: Over estimate

### Variance
```
variance = actualTime - estimatedTime
variancePercent = (variance / estimatedTime) * 100
```

### Rework Rate
```
reworkRate = (jobsWithRework / totalJobs) * 100
```

### Productivity Score
```
productivityScore = jobsCompleted * avgEfficiency * (1 - reworkRate/100)
```

## Installation

```bash
npm install
```

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Build
npm run build

# Lint
npm run lint
```

## Testing

The service includes 37 comprehensive test cases covering:
- Efficiency rate calculations
- Variance analysis
- Employee metrics aggregation
- Team metrics calculations
- Leaderboard generation
- Alert triggering
- Report generation
- CSV export

All tests are passing ✅

## Configuration

### TODO: Production Deployment
- Replace mock data with actual database queries
- Configure labor cost per hour via environment variables
- Implement trend calculations using historical data comparison
- Add authentication/authorization middleware
- Configure WebSocket for real-time updates
- Set up caching layer (Redis) for performance

## Security

- Input validation on all query parameters
- Alphanumeric validation to prevent injection attacks
- Query parameters sanitized before use in filters

## Dependencies

- **express**: Web framework
- **typescript**: Type safety
- **jest**: Testing framework
- **ts-jest**: TypeScript support for Jest

## Frontend Integration

The frontend components are located in `frontend/src/components/production/`:
- `MetricsDashboard.tsx`: Main dashboard
- `EmployeeMetrics.tsx`: Employee details
- `TeamMetrics.tsx`: Team analytics
- `EfficiencyChart.tsx`: Trend visualization
- `Leaderboard.tsx`: Rankings
- `ReportExport.tsx`: Report generation UI

## License

MIT
