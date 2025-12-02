/**
 * NotificationService
 * Multi-channel notification system for PrintShop OS
 * Handles email (SendGrid) and SMS (Twilio) notifications with n8n workflow integration
 */

import axios from 'axios';

// Notification event types
export type NotificationEventType =
  | 'payment_received'
  | 'garments_arrived'
  | 'artwork_ready'
  | 'in_production'
  | 'quality_check'
  | 'ready_for_pickup'
  | 'shipped';

// Events that trigger SMS (pickup and shipping only)
const SMS_ENABLED_EVENTS: NotificationEventType[] = ['ready_for_pickup', 'shipped'];

// Default preferences for new customers
export const DEFAULT_PREFERENCES = {
  payment_received: { email: true, sms: false },
  garments_arrived: { email: true, sms: false },
  artwork_ready: { email: true, sms: false },
  in_production: { email: true, sms: false },
  quality_check: { email: true, sms: false },
  ready_for_pickup: { email: true, sms: true },
  shipped: { email: true, sms: true },
};

// Notification preference interface
export interface NotificationPreference {
  id?: string;
  documentId?: string;
  customer?: { id: string; documentId?: string };
  emailEnabled: boolean;
  smsEnabled: boolean;
  smsForPickupOnly: boolean;
  emailAddress?: string;
  smsPhone?: string;
  preferences: Record<NotificationEventType, { email: boolean; sms: boolean }>;
}

// Order data interface
export interface OrderData {
  id: string;
  documentId?: string;
  orderNumber: string;
  status: string;
  totalAmount?: number;
  customer?: {
    id: string;
    documentId?: string;
    name: string;
    email: string;
    phone?: string;
  };
  dueDate?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
}

// Notification result interface
export interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  smsSent: boolean;
  n8nTriggered: boolean;
  error?: string;
}

// n8n workflow payload
export interface N8NWorkflowPayload {
  eventType: NotificationEventType;
  order: OrderData;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  sendEmail: boolean;
  sendSMS: boolean;
  timestamp: string;
}

// Environment variable getters (evaluated at runtime for testability)
const getEnv = () => ({
  STRAPI_URL: process.env.STRAPI_URL || 'http://localhost:1337',
  STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN || '',
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET || '',
  NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED !== 'false',
});

/**
 * NotificationService class
 * Handles all notification-related operations
 */
export class NotificationService {
  /**
   * Check if email should be sent for a given event type
   */
  static shouldSendEmail(eventType: NotificationEventType, preferences: NotificationPreference): boolean {
    // If email is globally disabled, don't send
    if (!preferences.emailEnabled) {
      return false;
    }

    // Check event-specific preference
    const eventPref = preferences.preferences?.[eventType];
    if (eventPref) {
      return eventPref.email;
    }

    // Default to true for email (all events get email by default)
    return true;
  }

  /**
   * Check if SMS should be sent for a given event type
   * Respects smsForPickupOnly setting
   */
  static shouldSendSMS(eventType: NotificationEventType, preferences: NotificationPreference): boolean {
    // If SMS is globally disabled, don't send
    if (!preferences.smsEnabled) {
      return false;
    }

    // If no phone number, can't send SMS
    if (!preferences.smsPhone) {
      return false;
    }

    // If smsForPickupOnly is true, only send SMS for pickup/shipping events
    if (preferences.smsForPickupOnly) {
      if (!SMS_ENABLED_EVENTS.includes(eventType)) {
        return false;
      }
    }

    // Check event-specific preference
    const eventPref = preferences.preferences?.[eventType];
    if (eventPref) {
      return eventPref.sms;
    }

    // Default to SMS only for pickup/shipping events
    return SMS_ENABLED_EVENTS.includes(eventType);
  }

  /**
   * Get notification preferences for a customer
   * Creates default preferences if none exist
   */
  static async getPreferences(customerId: string): Promise<NotificationPreference> {
    const env = getEnv();
    try {
      // Fetch existing preferences
      const response = await axios.get(`${env.STRAPI_URL}/api/notification-preferences`, {
        params: {
          'filters[customer][documentId][$eq]': customerId,
          'populate': 'customer',
        },
        headers: {
          Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
        },
      });

      const data = response.data?.data;
      if (data && data.length > 0) {
        const pref = data[0];
        return {
          id: pref.id,
          documentId: pref.documentId,
          customer: pref.customer,
          emailEnabled: pref.emailEnabled ?? true,
          smsEnabled: pref.smsEnabled ?? false,
          smsForPickupOnly: pref.smsForPickupOnly ?? true,
          emailAddress: pref.emailAddress,
          smsPhone: pref.smsPhone,
          preferences: pref.preferences ?? DEFAULT_PREFERENCES,
        };
      }

      // Return default preferences for new customers
      return this.createDefaultPreferences(customerId);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return default preferences on error
      return {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: DEFAULT_PREFERENCES,
      };
    }
  }

  /**
   * Create default preferences for a customer
   */
  static async createDefaultPreferences(customerId: string): Promise<NotificationPreference> {
    const env = getEnv();
    try {
      // Fetch customer email
      const customerResponse = await axios.get(`${env.STRAPI_URL}/api/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
        },
      });

      const customer = customerResponse.data?.data;
      const emailAddress = customer?.email || '';
      const smsPhone = customer?.phone || '';

      // Create default preferences
      const response = await axios.post(
        `${env.STRAPI_URL}/api/notification-preferences`,
        {
          data: {
            customer: { connect: [customerId] },
            emailEnabled: true,
            smsEnabled: false,
            smsForPickupOnly: true,
            emailAddress,
            smsPhone,
            preferences: DEFAULT_PREFERENCES,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const created = response.data?.data;
      return {
        id: created?.id,
        documentId: created?.documentId,
        customer: { id: customerId },
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        emailAddress,
        smsPhone,
        preferences: DEFAULT_PREFERENCES,
      };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: DEFAULT_PREFERENCES,
      };
    }
  }

  /**
   * Save notification preferences
   */
  static async savePreferences(
    preferenceId: string | undefined,
    customerId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const env = getEnv();
    try {
      if (preferenceId) {
        // Update existing preferences
        const response = await axios.put(
          `${env.STRAPI_URL}/api/notification-preferences/${preferenceId}`,
          {
            data: {
              emailEnabled: preferences.emailEnabled,
              smsEnabled: preferences.smsEnabled,
              smsForPickupOnly: preferences.smsForPickupOnly,
              emailAddress: preferences.emailAddress,
              smsPhone: preferences.smsPhone,
              preferences: preferences.preferences,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const updated = response.data?.data;
        return {
          id: updated?.id,
          documentId: updated?.documentId,
          customer: { id: customerId },
          emailEnabled: updated?.emailEnabled ?? true,
          smsEnabled: updated?.smsEnabled ?? false,
          smsForPickupOnly: updated?.smsForPickupOnly ?? true,
          emailAddress: updated?.emailAddress,
          smsPhone: updated?.smsPhone,
          preferences: updated?.preferences ?? DEFAULT_PREFERENCES,
        };
      } else {
        // Create new preferences
        const response = await axios.post(
          `${env.STRAPI_URL}/api/notification-preferences`,
          {
            data: {
              customer: { connect: [customerId] },
              emailEnabled: preferences.emailEnabled ?? true,
              smsEnabled: preferences.smsEnabled ?? false,
              smsForPickupOnly: preferences.smsForPickupOnly ?? true,
              emailAddress: preferences.emailAddress,
              smsPhone: preferences.smsPhone,
              preferences: preferences.preferences ?? DEFAULT_PREFERENCES,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const created = response.data?.data;
        return {
          id: created?.id,
          documentId: created?.documentId,
          customer: { id: customerId },
          emailEnabled: created?.emailEnabled ?? true,
          smsEnabled: created?.smsEnabled ?? false,
          smsForPickupOnly: created?.smsForPickupOnly ?? true,
          emailAddress: created?.emailAddress,
          smsPhone: created?.smsPhone,
          preferences: created?.preferences ?? DEFAULT_PREFERENCES,
        };
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  }

  /**
   * Trigger n8n workflow for notification processing
   */
  static async triggerN8NWorkflow(
    eventType: NotificationEventType,
    data: {
      order: OrderData;
      customer?: OrderData['customer'];
      sendEmail: boolean;
      sendSMS: boolean;
    }
  ): Promise<boolean> {
    const env = getEnv();
    if (!env.N8N_WEBHOOK_URL) {
      console.warn('N8N_WEBHOOK_URL not configured, skipping workflow trigger');
      return false;
    }

    try {
      const payload: N8NWorkflowPayload = {
        eventType,
        order: data.order,
        customer: data.customer,
        sendEmail: data.sendEmail,
        sendSMS: data.sendSMS,
        timestamp: new Date().toISOString(),
      };

      const webhookUrl = `${env.N8N_WEBHOOK_URL}/${eventType}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (env.N8N_WEBHOOK_SECRET) {
        headers['Authorization'] = `Bearer ${env.N8N_WEBHOOK_SECRET}`;
      }

      await axios.post(webhookUrl, payload, { headers });
      return true;
    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
      return false;
    }
  }

  /**
   * Map order status to notification event type
   */
  static mapStatusToEventType(status: string): NotificationEventType | null {
    const statusMap: Record<string, NotificationEventType> = {
      PAYMENT_RECEIVED: 'payment_received',
      GARMENTS_ARRIVED: 'garments_arrived',
      ARTWORK_READY: 'artwork_ready',
      IN_PRODUCTION: 'in_production',
      QUALITY_CHECK: 'quality_check',
      READY_FOR_PICKUP: 'ready_for_pickup',
      SHIPPED: 'shipped',
    };

    return statusMap[status.toUpperCase()] || null;
  }

  /**
   * Send order notification for a specific event
   * Main method that orchestrates email, SMS, and n8n
   */
  static async sendOrderNotification(
    eventType: NotificationEventType,
    orderId: string
  ): Promise<NotificationResult> {
    const env = getEnv();
    if (!env.NOTIFICATIONS_ENABLED) {
      return {
        success: true,
        emailSent: false,
        smsSent: false,
        n8nTriggered: false,
        error: 'Notifications are disabled',
      };
    }

    try {
      // Fetch order details
      const orderResponse = await axios.get(`${env.STRAPI_URL}/api/orders/${orderId}`, {
        params: {
          populate: 'customer',
        },
        headers: {
          Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
        },
      });

      const order = orderResponse.data?.data;
      if (!order) {
        return {
          success: false,
          emailSent: false,
          smsSent: false,
          n8nTriggered: false,
          error: 'Order not found',
        };
      }

      const orderData: OrderData = {
        id: order.id?.toString(),
        documentId: order.documentId,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        dueDate: order.dueDate,
        customer: order.customer ? {
          id: order.customer.id?.toString(),
          documentId: order.customer.documentId,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        } : undefined,
      };

      // Get customer preferences
      const customerId = orderData.customer?.documentId || orderData.customer?.id;
      if (!customerId) {
        return {
          success: false,
          emailSent: false,
          smsSent: false,
          n8nTriggered: false,
          error: 'Customer not found on order',
        };
      }

      const preferences = await this.getPreferences(customerId);

      // Determine what to send
      const sendEmail = this.shouldSendEmail(eventType, preferences);
      const sendSMS = this.shouldSendSMS(eventType, preferences);

      // Trigger n8n workflow (handles actual email/SMS sending)
      const n8nTriggered = await this.triggerN8NWorkflow(eventType, {
        order: orderData,
        customer: orderData.customer,
        sendEmail,
        sendSMS,
      });

      return {
        success: true,
        emailSent: sendEmail,
        smsSent: sendSMS,
        n8nTriggered,
      };
    } catch (error) {
      console.error('Error sending order notification:', error);
      return {
        success: false,
        emailSent: false,
        smsSent: false,
        n8nTriggered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send test notification
   */
  static async sendTestNotification(
    customerId: string,
    channel: 'email' | 'sms' | 'both'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const preferences = await this.getPreferences(customerId);

      if (channel === 'email' || channel === 'both') {
        if (!preferences.emailAddress) {
          return { success: false, message: 'No email address configured' };
        }
      }

      if (channel === 'sms' || channel === 'both') {
        if (!preferences.smsPhone) {
          return { success: false, message: 'No phone number configured' };
        }
      }

      // Trigger test workflow
      const triggered = await this.triggerN8NWorkflow('ready_for_pickup', {
        order: {
          id: 'test',
          orderNumber: 'TEST-001',
          status: 'READY_FOR_PICKUP',
        },
        customer: {
          id: customerId,
          name: 'Test Customer',
          email: preferences.emailAddress || '',
          phone: preferences.smsPhone,
        },
        sendEmail: channel === 'email' || channel === 'both',
        sendSMS: channel === 'sms' || channel === 'both',
      });

      if (triggered) {
        return { success: true, message: 'Test notification sent successfully' };
      }

      return { success: false, message: 'Failed to trigger notification workflow' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default NotificationService;
