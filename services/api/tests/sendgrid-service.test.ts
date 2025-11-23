/**
 * Tests for SendGrid Email Service
 */

import SendGridService, { QuoteEmailData } from '../services/email/sendgrid-service';
import sgMail from '@sendgrid/mail';

// Mock SendGrid
jest.mock('@sendgrid/mail');

describe('SendGridService', () => {
  let service: typeof SendGridService;
  const mockApiKey = 'test-api-key-123';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.SENDGRID_API_KEY = mockApiKey;
    process.env.APP_BASE_URL = 'http://localhost:3000';
    process.env.SENDGRID_FROM_EMAIL = 'test@printshop.com';
    process.env.SENDGRID_FROM_NAME = 'PrintShop Test';
    
    service = SendGridService;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should initialize with API key from environment', () => {
      service.initialize();
      expect(sgMail.setApiKey).toHaveBeenCalledWith(mockApiKey);
    });

    it('should initialize with provided API key', () => {
      const customKey = 'custom-key-456';
      service.initialize(customKey);
      expect(sgMail.setApiKey).toHaveBeenCalledWith(customKey);
    });

    it('should throw error if no API key provided', () => {
      delete process.env.SENDGRID_API_KEY;
      expect(() => service.initialize()).toThrow('SendGrid API key is required');
    });
  });

  describe('sendQuoteEmail', () => {
    const mockQuoteData: QuoteEmailData = {
      quoteId: 'quote-123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [
        {
          description: 'Custom T-Shirts',
          quantity: 100,
          unitPrice: 5.50,
          total: 550.00,
        },
        {
          description: 'Screen Printing Setup',
          quantity: 1,
          unitPrice: 50.00,
          total: 50.00,
        },
      ],
      subtotal: 600.00,
      tax: 48.00,
      total: 648.00,
      validUntil: new Date('2024-12-31'),
      companyName: 'PrintShop Pro',
      contactInfo: {
        email: 'info@printshop.com',
        phone: '555-1234',
        website: 'https://printshop.com',
      },
    };

    beforeEach(() => {
      service.initialize(mockApiKey);
      (sgMail.send as jest.Mock).mockResolvedValue([
        {
          statusCode: 202,
          headers: {
            'x-message-id': 'message-id-123',
          },
        },
      ]);
    });

    it('should send quote email successfully', async () => {
      const messageId = await service.sendQuoteEmail(mockQuoteData);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(messageId).toBe('message-id-123');

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.to.email).toBe('john@example.com');
      expect(sendCall.to.name).toBe('John Doe');
      expect(sendCall.from.email).toBe('test@printshop.com');
      expect(sendCall.subject).toContain('John Doe');
    });

    it('should include approval and rejection URLs in email', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('/quote/approve/');
      expect(sendCall.html).toContain('/quote/reject/');
      expect(sendCall.text).toContain('/quote/approve/');
      expect(sendCall.text).toContain('/quote/reject/');
    });

    it('should include all quote items in email', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('Custom T-Shirts');
      expect(sendCall.html).toContain('Screen Printing Setup');
      expect(sendCall.html).toContain('$600.00');
      expect(sendCall.html).toContain('$648.00');
    });

    it('should include tracking settings', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.trackingSettings.clickTracking.enable).toBe(true);
      expect(sendCall.trackingSettings.openTracking.enable).toBe(true);
    });

    it('should include custom args for quote tracking', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.customArgs.quoteId).toBe('quote-123');
      expect(sendCall.customArgs.type).toBe('quote_delivery');
    });

    it('should handle email without tax', async () => {
      const dataWithoutTax = { ...mockQuoteData, tax: undefined };
      await service.sendQuoteEmail(dataWithoutTax);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).not.toContain('Tax:');
    });

    it('should include contact information in footer', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('info@printshop.com');
      expect(sendCall.html).toContain('555-1234');
      expect(sendCall.html).toContain('https://printshop.com');
    });

    it('should include unsubscribe link', async () => {
      await service.sendQuoteEmail(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('/unsubscribe');
    });

    it('should handle SendGrid errors', async () => {
      (sgMail.send as jest.Mock).mockRejectedValue(new Error('SendGrid API error'));

      await expect(service.sendQuoteEmail(mockQuoteData)).rejects.toThrow('Failed to send quote email');
    });
  });

  describe('sendQuoteReminder', () => {
    const mockQuoteData: QuoteEmailData = {
      quoteId: 'quote-456',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      items: [
        {
          description: 'Business Cards',
          quantity: 500,
          unitPrice: 0.20,
          total: 100.00,
        },
      ],
      subtotal: 100.00,
      total: 100.00,
    };

    beforeEach(() => {
      service.initialize(mockApiKey);
      (sgMail.send as jest.Mock).mockResolvedValue([
        {
          statusCode: 202,
          headers: {
            'x-message-id': 'reminder-message-id-456',
          },
        },
      ]);
    });

    it('should send reminder email successfully', async () => {
      const messageId = await service.sendQuoteReminder(mockQuoteData);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(messageId).toBe('reminder-message-id-456');

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.subject).toContain('Reminder');
      expect(sendCall.customArgs.type).toBe('quote_reminder');
    });

    it('should include quote total in reminder', async () => {
      await service.sendQuoteReminder(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('$100.00');
    });

    it('should include approval and rejection buttons in reminder', async () => {
      await service.sendQuoteReminder(mockQuoteData);

      const sendCall = (sgMail.send as jest.Mock).mock.calls[0][0];
      expect(sendCall.html).toContain('Approve Quote');
      expect(sendCall.html).toContain('Decline Quote');
    });
  });

  describe('verifyApprovalToken', () => {
    beforeEach(() => {
      service.initialize(mockApiKey);
    });

    it('should have verifyApprovalToken method', () => {
      // Token verification is tested in jwt-utils.test.ts
      // This just ensures the service exposes the utility correctly
      expect(typeof service.verifyApprovalToken).toBe('function');
    });
  });
});
