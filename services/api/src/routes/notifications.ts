/**
 * Notifications API Routes
 * 
 * REST API endpoints for notification preferences and manual notification triggers
 */

import express, { Request, Response } from 'express';
import { NotificationService, NotificationEventType } from '../services/notification.service';

const router = express.Router();

/**
 * GET /api/notifications/preferences/:customerId
 * 
 * Get notification preferences for a customer
 */
router.get('/preferences/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      res.status(400).json({
        error: 'Customer ID is required',
      });
      return;
    }

    const preferences = await NotificationService.getPreferences(customerId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/notifications/preferences
 * 
 * Create or update notification preferences
 * 
 * Body:
 * - customerId: string (required)
 * - preferenceId?: string (optional, for updates)
 * - emailEnabled?: boolean
 * - smsEnabled?: boolean
 * - smsForPickupOnly?: boolean
 * - emailAddress?: string
 * - smsPhone?: string
 * - preferences?: object (per-event toggles)
 */
router.post('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      preferenceId,
      emailEnabled,
      smsEnabled,
      smsForPickupOnly,
      emailAddress,
      smsPhone,
      preferences,
    } = req.body;

    if (!customerId) {
      res.status(400).json({
        error: 'Customer ID is required',
      });
      return;
    }

    // Validate phone number format if provided
    if (smsPhone && !/^\+?[1-9]\d{1,14}$/.test(smsPhone.replace(/[\s-()]/g, ''))) {
      res.status(400).json({
        error: 'Invalid phone number format. Please use E.164 format (e.g., +15551234567)',
      });
      return;
    }

    // Validate email format if provided
    if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      res.status(400).json({
        error: 'Invalid email address format',
      });
      return;
    }

    const updatedPreferences = await NotificationService.savePreferences(
      preferenceId,
      customerId,
      {
        emailEnabled,
        smsEnabled,
        smsForPickupOnly,
        emailAddress,
        smsPhone,
        preferences,
      }
    );

    res.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    res.status(500).json({
      error: 'Failed to save notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/notifications/send
 * 
 * Manually trigger a notification for an order
 * 
 * Body:
 * - orderId: string (required)
 * - eventType: NotificationEventType (required)
 */
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, eventType } = req.body;

    if (!orderId) {
      res.status(400).json({
        error: 'Order ID is required',
      });
      return;
    }

    if (!eventType) {
      res.status(400).json({
        error: 'Event type is required',
      });
      return;
    }

    const validEventTypes: NotificationEventType[] = [
      'payment_received',
      'garments_arrived',
      'artwork_ready',
      'in_production',
      'quality_check',
      'ready_for_pickup',
      'shipped',
    ];

    if (!validEventTypes.includes(eventType)) {
      res.status(400).json({
        error: 'Invalid event type',
        validTypes: validEventTypes,
      });
      return;
    }

    const result = await NotificationService.sendOrderNotification(eventType, orderId);

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: result,
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/notifications/test
 * 
 * Send a test notification to verify configuration
 * 
 * Body:
 * - customerId: string (required)
 * - channel: 'email' | 'sms' | 'both' (required)
 */
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, channel } = req.body;

    if (!customerId) {
      res.status(400).json({
        error: 'Customer ID is required',
      });
      return;
    }

    if (!channel || !['email', 'sms', 'both'].includes(channel)) {
      res.status(400).json({
        error: 'Channel is required and must be one of: email, sms, both',
      });
      return;
    }

    const result = await NotificationService.sendTestNotification(customerId, channel);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/notifications/event-types
 * 
 * Get list of valid notification event types
 */
router.get('/event-types', (_req: Request, res: Response): void => {
  const eventTypes = [
    { type: 'payment_received', label: 'Payment Received', defaultEmail: true, defaultSMS: false },
    { type: 'garments_arrived', label: 'Garments Arrived', defaultEmail: true, defaultSMS: false },
    { type: 'artwork_ready', label: 'Artwork Ready', defaultEmail: true, defaultSMS: false },
    { type: 'in_production', label: 'In Production', defaultEmail: true, defaultSMS: false },
    { type: 'quality_check', label: 'Quality Check', defaultEmail: true, defaultSMS: false },
    { type: 'ready_for_pickup', label: 'Ready for Pickup', defaultEmail: true, defaultSMS: true },
    { type: 'shipped', label: 'Shipped', defaultEmail: true, defaultSMS: true },
  ];

  res.json({
    success: true,
    data: eventTypes,
  });
});

export default router;
