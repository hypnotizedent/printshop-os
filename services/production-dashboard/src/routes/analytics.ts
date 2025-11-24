/**
 * Analytics and KPI Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Analytics, RESTResponse } from '../types';

const router = Router();

/**
 * GET /api/production/analytics
 * Get production analytics and KPIs
 */
router.get('/', authenticateToken, (_req: Request, res: Response): void => {
  try {
    // Mock analytics data (in production, this would be calculated from database)
    const analytics: Analytics = {
      throughput: {
        jobsPerHour: 4.2,
        jobsPerDay: 35,
        jobsThisWeek: 180
      },
      cycleTime: {
        averagePerStage: {
          screen_setup: 45, // minutes
          printing: 120,
          curing: 30,
          quality_check: 15,
          packaging: 20
        },
        averageTotal: 230 // minutes (3.8 hours)
      },
      utilization: {
        machines: {
          'machine-001': 85,
          'machine-002': 60,
          'machine-003': 75,
          'machine-004': 45
        },
        averageUptime: 95.2
      },
      bottlenecks: [
        {
          stage: 'printing',
          averageWaitTime: 180, // minutes
          jobsWaiting: 5
        },
        {
          stage: 'quality_check',
          averageWaitTime: 45,
          jobsWaiting: 3
        }
      ],
      quality: {
        defectRate: 2.5, // percentage
        defectsByStage: {
          screen_setup: 0.5,
          printing: 1.2,
          curing: 0.3,
          quality_check: 0.5,
          packaging: 0.0
        }
      }
    };

    const response: RESTResponse<Analytics> = {
      success: true,
      data: analytics,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch analytics',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/analytics/throughput
 * Get throughput metrics
 */
router.get('/throughput', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const throughput = {
      jobsPerHour: 4.2,
      jobsPerDay: 35,
      jobsThisWeek: 180,
      trend: 'up',
      percentChange: 12.5
    };

    const response: RESTResponse = {
      success: true,
      data: throughput,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch throughput metrics',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/analytics/cycle-time
 * Get cycle time metrics
 */
router.get('/cycle-time', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const cycleTime = {
      averagePerStage: {
        screen_setup: 45,
        printing: 120,
        curing: 30,
        quality_check: 15,
        packaging: 20
      },
      averageTotal: 230,
      medianTotal: 215,
      percentile90: 280
    };

    const response: RESTResponse = {
      success: true,
      data: cycleTime,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch cycle time metrics',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/analytics/utilization
 * Get resource utilization metrics
 */
router.get('/utilization', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const utilization = {
      machines: {
        'machine-001': 85,
        'machine-002': 60,
        'machine-003': 75,
        'machine-004': 45
      },
      averageUptime: 95.2,
      peakHours: ['10:00-12:00', '14:00-16:00'],
      lowUtilization: ['machine-004']
    };

    const response: RESTResponse = {
      success: true,
      data: utilization,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch utilization metrics',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/analytics/bottlenecks
 * Get bottleneck analysis
 */
router.get('/bottlenecks', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const bottlenecks = [
      {
        stage: 'printing',
        averageWaitTime: 180,
        jobsWaiting: 5,
        severity: 'high',
        recommendation: 'Consider adding additional printing capacity'
      },
      {
        stage: 'quality_check',
        averageWaitTime: 45,
        jobsWaiting: 3,
        severity: 'medium',
        recommendation: 'Assign additional QC personnel during peak hours'
      }
    ];

    const response: RESTResponse = {
      success: true,
      data: bottlenecks,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch bottleneck analysis',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/production/analytics/quality
 * Get quality metrics
 */
router.get('/quality', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const quality = {
      defectRate: 2.5,
      defectsByStage: {
        screen_setup: 0.5,
        printing: 1.2,
        curing: 0.3,
        quality_check: 0.5,
        packaging: 0.0
      },
      trend: 'down',
      percentChange: -8.3,
      topIssues: [
        { issue: 'Ink bleeding', count: 12 },
        { issue: 'Misalignment', count: 8 },
        { issue: 'Color mismatch', count: 5 }
      ]
    };

    const response: RESTResponse = {
      success: true,
      data: quality,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: RESTResponse = {
      success: false,
      error: 'Failed to fetch quality metrics',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

export default router;
