/**
 * Notification Service Tests
 * Tests for multi-channel notification system
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import {
  NotificationService,
  NotificationPreference,
  DEFAULT_PREFERENCES,
  NotificationEventType,
} from '../notification.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variables for testing
    process.env.STRAPI_URL = 'http://localhost:1337';
    process.env.STRAPI_API_TOKEN = 'test-token';
    process.env.N8N_WEBHOOK_URL = 'http://localhost:5678/webhook';
    process.env.N8N_WEBHOOK_SECRET = 'test-secret';
    process.env.NOTIFICATIONS_ENABLED = 'true';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('shouldSendEmail', () => {
    it('should return true when email is globally enabled and event preference is true', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: {
          ...DEFAULT_PREFERENCES,
          payment_received: { email: true, sms: false },
        },
      };

      expect(NotificationService.shouldSendEmail('payment_received', preferences)).toBe(true);
    });

    it('should return false when email is globally disabled', () => {
      const preferences: NotificationPreference = {
        emailEnabled: false,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: {
          ...DEFAULT_PREFERENCES,
          payment_received: { email: true, sms: false },
        },
      };

      expect(NotificationService.shouldSendEmail('payment_received', preferences)).toBe(false);
    });

    it('should return false when event-specific email preference is false', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: {
          ...DEFAULT_PREFERENCES,
          in_production: { email: false, sms: false },
        },
      };

      expect(NotificationService.shouldSendEmail('in_production', preferences)).toBe(false);
    });

    it('should default to true when event preference is missing', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        preferences: {} as any,
      };

      expect(NotificationService.shouldSendEmail('payment_received', preferences)).toBe(true);
    });
  });

  describe('shouldSendSMS', () => {
    it('should return true for pickup event when SMS is enabled', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: true,
        smsPhone: '+15551234567',
        preferences: {
          ...DEFAULT_PREFERENCES,
          ready_for_pickup: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('ready_for_pickup', preferences)).toBe(true);
    });

    it('should return true for shipped event when SMS is enabled', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: true,
        smsPhone: '+15551234567',
        preferences: {
          ...DEFAULT_PREFERENCES,
          shipped: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('shipped', preferences)).toBe(true);
    });

    it('should return false for non-pickup events when smsForPickupOnly is true', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: true,
        smsPhone: '+15551234567',
        preferences: {
          ...DEFAULT_PREFERENCES,
          payment_received: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('payment_received', preferences)).toBe(false);
    });

    it('should return true for non-pickup events when smsForPickupOnly is false', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: false,
        smsPhone: '+15551234567',
        preferences: {
          ...DEFAULT_PREFERENCES,
          payment_received: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('payment_received', preferences)).toBe(true);
    });

    it('should return false when SMS is globally disabled', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: false,
        smsForPickupOnly: true,
        smsPhone: '+15551234567',
        preferences: {
          ...DEFAULT_PREFERENCES,
          ready_for_pickup: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('ready_for_pickup', preferences)).toBe(false);
    });

    it('should return false when no phone number is configured', () => {
      const preferences: NotificationPreference = {
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: true,
        smsPhone: '',
        preferences: {
          ...DEFAULT_PREFERENCES,
          ready_for_pickup: { email: true, sms: true },
        },
      };

      expect(NotificationService.shouldSendSMS('ready_for_pickup', preferences)).toBe(false);
    });
  });

  describe('getPreferences', () => {
    it('should return existing preferences from Strapi', async () => {
      const mockPreference = {
        id: '1',
        documentId: 'pref-123',
        emailEnabled: true,
        smsEnabled: true,
        smsForPickupOnly: true,
        emailAddress: 'test@example.com',
        smsPhone: '+15551234567',
        preferences: DEFAULT_PREFERENCES,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [mockPreference],
        },
      });

      const result = await NotificationService.getPreferences('customer-123');

      expect(result.emailEnabled).toBe(true);
      expect(result.smsEnabled).toBe(true);
      expect(result.emailAddress).toBe('test@example.com');
      expect(result.smsPhone).toBe('+15551234567');
    });

    it('should create default preferences for new customers', async () => {
      // First call returns empty (no preferences)
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      // Second call fetches customer info
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            email: 'customer@example.com',
            phone: '+15559876543',
          },
        },
      });

      // Third call creates preferences
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: '2',
            documentId: 'pref-456',
            emailEnabled: true,
            smsEnabled: false,
            smsForPickupOnly: true,
          },
        },
      });

      const result = await NotificationService.getPreferences('new-customer');

      expect(result.emailEnabled).toBe(true);
      expect(result.smsEnabled).toBe(false);
      expect(result.smsForPickupOnly).toBe(true);
    });

    it('should return default preferences on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await NotificationService.getPreferences('customer-123');

      expect(result.emailEnabled).toBe(true);
      expect(result.smsEnabled).toBe(false);
      expect(result.smsForPickupOnly).toBe(true);
      expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('triggerN8NWorkflow', () => {
    it('should POST to n8n webhook with correct payload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await NotificationService.triggerN8NWorkflow('ready_for_pickup', {
        order: {
          id: 'order-123',
          orderNumber: 'ORD-001',
          status: 'READY_FOR_PICKUP',
        },
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+15551234567',
        },
        sendEmail: true,
        sendSMS: true,
      });

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/ready_for_pickup',
        expect.objectContaining({
          eventType: 'ready_for_pickup',
          sendEmail: true,
          sendSMS: true,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-secret',
          }),
        })
      );
    });

    it('should return false when N8N_WEBHOOK_URL is not configured', async () => {
      delete process.env.N8N_WEBHOOK_URL;

      const result = await NotificationService.triggerN8NWorkflow('shipped', {
        order: { id: '123', orderNumber: 'ORD-001', status: 'SHIPPED' },
        sendEmail: true,
        sendSMS: true,
      });

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await NotificationService.triggerN8NWorkflow('payment_received', {
        order: { id: '123', orderNumber: 'ORD-001', status: 'PAYMENT_RECEIVED' },
        sendEmail: true,
        sendSMS: false,
      });

      expect(result).toBe(false);
    });
  });

  describe('mapStatusToEventType', () => {
    it('should map order statuses to event types correctly', () => {
      expect(NotificationService.mapStatusToEventType('READY_FOR_PICKUP')).toBe('ready_for_pickup');
      expect(NotificationService.mapStatusToEventType('SHIPPED')).toBe('shipped');
      expect(NotificationService.mapStatusToEventType('IN_PRODUCTION')).toBe('in_production');
      expect(NotificationService.mapStatusToEventType('PAYMENT_RECEIVED')).toBe('payment_received');
    });

    it('should return null for unknown statuses', () => {
      expect(NotificationService.mapStatusToEventType('UNKNOWN_STATUS')).toBeNull();
      expect(NotificationService.mapStatusToEventType('QUOTE')).toBeNull();
      expect(NotificationService.mapStatusToEventType('CANCELLED')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(NotificationService.mapStatusToEventType('ready_for_pickup')).toBe('ready_for_pickup');
      expect(NotificationService.mapStatusToEventType('Ready_For_Pickup')).toBe('ready_for_pickup');
    });
  });

  describe('sendOrderNotification', () => {
    it('should fetch order, get preferences, and trigger n8n', async () => {
      // Mock order fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            documentId: 'order-123',
            orderNumber: 'ORD-001',
            status: 'READY_FOR_PICKUP',
            customer: {
              id: 2,
              documentId: 'cust-456',
              name: 'Test Customer',
              email: 'test@example.com',
              phone: '+15551234567',
            },
          },
        },
      });

      // Mock preferences fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [{
            id: '1',
            documentId: 'pref-789',
            emailEnabled: true,
            smsEnabled: true,
            smsForPickupOnly: true,
            emailAddress: 'test@example.com',
            smsPhone: '+15551234567',
            preferences: DEFAULT_PREFERENCES,
          }],
        },
      });

      // Mock n8n webhook
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await NotificationService.sendOrderNotification('ready_for_pickup', 'order-123');

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.n8nTriggered).toBe(true);
    });

    it('should return error when notifications are disabled', async () => {
      process.env.NOTIFICATIONS_ENABLED = 'false';

      const result = await NotificationService.sendOrderNotification('shipped', 'order-123');

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.error).toBe('Notifications are disabled');
    });

    it('should return error when order is not found', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: null },
      });

      const result = await NotificationService.sendOrderNotification('shipped', 'nonexistent-order');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('DEFAULT_PREFERENCES', () => {
    it('should have email enabled for all events by default', () => {
      const eventTypes: NotificationEventType[] = [
        'payment_received',
        'garments_arrived',
        'artwork_ready',
        'in_production',
        'quality_check',
        'ready_for_pickup',
        'shipped',
      ];

      for (const eventType of eventTypes) {
        expect(DEFAULT_PREFERENCES[eventType].email).toBe(true);
      }
    });

    it('should have SMS enabled only for pickup and shipped by default', () => {
      expect(DEFAULT_PREFERENCES.ready_for_pickup.sms).toBe(true);
      expect(DEFAULT_PREFERENCES.shipped.sms).toBe(true);
      expect(DEFAULT_PREFERENCES.payment_received.sms).toBe(false);
      expect(DEFAULT_PREFERENCES.in_production.sms).toBe(false);
    });
  });
});
