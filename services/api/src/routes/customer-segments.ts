/**
 * Customer Segments API Routes
 * 
 * Provides endpoints for customer segment management:
 * - GET /api/customers/:id/segment - Get current segment
 * - POST /api/customers/:id/segment/detect - Auto-detect and update segment
 * - PATCH /api/customers/:id/segment - Manual override
 * - GET /api/customers/segments/distribution - Segment analytics
 */

import { Router, Request, Response } from 'express';
import {
  CustomerSegmentationService,
  CustomerSegment,
} from '../services/customer-segmentation.service';

const router = Router();

// Initialize service
const segmentationService = new CustomerSegmentationService();

/**
 * GET /api/customers/segments/distribution
 * Get segment distribution analytics
 */
router.get('/segments/distribution', async (_req: Request, res: Response) => {
  try {
    const distribution = await segmentationService.getSegmentDistribution();

    res.json({
      success: true,
      data: {
        ...distribution,
        percentages: {
          vip: distribution.total > 0 ? ((distribution.vip / distribution.total) * 100).toFixed(1) : '0',
          b2b: distribution.total > 0 ? ((distribution.b2b / distribution.total) * 100).toFixed(1) : '0',
          middleman: distribution.total > 0 ? ((distribution.middleman / distribution.total) * 100).toFixed(1) : '0',
          b2c: distribution.total > 0 ? ((distribution.b2c / distribution.total) * 100).toFixed(1) : '0',
        },
      },
    });
  } catch (error) {
    console.error('Error getting segment distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get segment distribution',
    });
  }
});

/**
 * GET /api/customers/:id/segment
 * Get current segment for a customer
 */
router.get('/:id/segment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    const segmentDetails = await segmentationService.getSegment(id);

    if (!segmentDetails) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found for customer',
        data: {
          segment: CustomerSegment.B2C,
          autoDetected: false,
          reason: 'No segment detected yet',
        },
      });
    }

    return res.json({
      success: true,
      data: segmentDetails,
    });
  } catch (error) {
    console.error('Error getting customer segment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get customer segment',
    });
  }
});

/**
 * POST /api/customers/:id/segment/detect
 * Auto-detect and update customer segment based on order history
 */
router.post('/:id/segment/detect', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { autoUpdate = true } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    const result = await segmentationService.detectAndUpdateSegment(id, autoUpdate);

    return res.json({
      success: true,
      data: result,
      message: autoUpdate
        ? `Segment updated from ${result.previousSegment || 'none'} to ${result.newSegment}`
        : `Detected segment: ${result.newSegment}`,
    });
  } catch (error) {
    console.error('Error detecting customer segment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to detect customer segment',
    });
  }
});

/**
 * PATCH /api/customers/:id/segment
 * Manually override customer segment
 */
router.patch('/:id/segment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { segment } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    if (!segment) {
      return res.status(400).json({
        success: false,
        error: 'Segment is required',
      });
    }

    // Validate segment value
    const validSegments = Object.values(CustomerSegment);
    if (!validSegments.includes(segment as CustomerSegment)) {
      return res.status(400).json({
        success: false,
        error: `Invalid segment. Must be one of: ${validSegments.join(', ')}`,
      });
    }

    const result = await segmentationService.overrideSegment(id, segment as CustomerSegment);

    return res.json({
      success: true,
      data: result,
      message: `Segment manually updated to ${result.newSegment}`,
    });
  } catch (error) {
    console.error('Error overriding customer segment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to override customer segment',
    });
  }
});

export default router;
