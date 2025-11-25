// Express routes for production dashboard analytics API

import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();

// Dashboard overview
router.get('/overview', AnalyticsController.getOverview);

// Employee metrics
router.get('/employee/:id', AnalyticsController.getEmployeeMetrics);

// Team metrics
router.get('/team', AnalyticsController.getTeamMetrics);

// Efficiency data
router.get('/efficiency', AnalyticsController.getEfficiencyData);

// Throughput metrics
router.get('/throughput', AnalyticsController.getThroughput);

// Trend data
router.get('/trends', AnalyticsController.getTrends);

// Leaderboard
router.get('/leaderboard', AnalyticsController.getLeaderboard);

// Generate report
router.post('/report', AnalyticsController.generateReport);

// Alerts
router.get('/alerts', AnalyticsController.getAlerts);

export default router;
