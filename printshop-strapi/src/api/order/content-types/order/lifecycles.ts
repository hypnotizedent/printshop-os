/**
 * Order lifecycle hooks
 * Triggers notifications on order status changes
 */

import type { Core } from '@strapi/types';
import axios from 'axios';

// Notification event type mapping
const STATUS_TO_EVENT: Record<string, string> = {
  PAYMENT_RECEIVED: 'payment_received',
  GARMENTS_ARRIVED: 'garments_arrived',
  ARTWORK_READY: 'artwork_ready',
  IN_PRODUCTION: 'in_production',
  QUALITY_CHECK: 'quality_check',
  READY_FOR_PICKUP: 'ready_for_pickup',
  SHIPPED: 'shipped',
};

// Statuses that should trigger notifications
const NOTIFICATION_STATUSES = Object.keys(STATUS_TO_EVENT);

// API service URL (for triggering notifications)
const API_SERVICE_URL = process.env.API_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATIONS_ENABLED = process.env.NOTIFICATIONS_ENABLED !== 'false';

export default {
  async afterUpdate(event: { 
    result: { 
      id: number;
      documentId?: string;
      status?: string;
      customer?: { id: number; documentId?: string };
    };
    params: {
      data?: { status?: string };
    };
    state?: { previousStatus?: string };
  }) {
    // Skip if notifications are disabled
    if (!NOTIFICATIONS_ENABLED) {
      return;
    }

    const { result, params, state } = event;
    const newStatus = result.status || params.data?.status;
    const previousStatus = state?.previousStatus;

    // Only trigger if status changed and is a notification-worthy status
    if (!newStatus || newStatus === previousStatus) {
      return;
    }

    const eventType = STATUS_TO_EVENT[newStatus.toUpperCase()];
    if (!eventType) {
      return;
    }

    // Get order ID
    const orderId = result.documentId || result.id?.toString();
    if (!orderId) {
      console.error('[Order Lifecycle] No order ID found');
      return;
    }

    try {
      // Trigger notification via API service
      const response = await axios.post(
        `${API_SERVICE_URL}/api/notifications/send`,
        {
          orderId,
          eventType,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.success) {
        console.log(`[Order Lifecycle] Notification triggered for order ${orderId}: ${eventType}`);
        console.log(`  - Email sent: ${response.data.data?.emailSent}`);
        console.log(`  - SMS sent: ${response.data.data?.smsSent}`);
      } else {
        console.warn(`[Order Lifecycle] Notification failed for order ${orderId}: ${response.data.error}`);
      }
    } catch (error) {
      // Log error but don't fail the order update
      console.error(`[Order Lifecycle] Failed to send notification for order ${orderId}:`, error);
    }
  },

  async beforeUpdate(event: {
    params: {
      where?: { id?: number; documentId?: string };
      data?: { status?: string };
    };
    state?: { previousStatus?: string };
  }) {
    // Store previous status for comparison in afterUpdate
    const { params, state } = event;

    if (!params.where) {
      return;
    }

    try {
      // Fetch current order to get previous status
      const orderId = params.where.documentId || params.where.id;
      if (!orderId) {
        return;
      }

      // Use strapi global to access entity service
      // documentId is a string, id is a number - handle both cases
      const currentOrder = await strapi.documents('api::order.order').findOne({
        documentId: typeof orderId === 'string' ? orderId : orderId.toString(),
        fields: ['status'],
      });

      if (currentOrder && state) {
        state.previousStatus = currentOrder.status;
      }
    } catch (error) {
      console.error('[Order Lifecycle] Error in beforeUpdate:', error);
    }
  },
};
