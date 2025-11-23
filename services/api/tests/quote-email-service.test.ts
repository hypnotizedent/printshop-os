/**
 * Tests for Quote Email Service Integration
 */

import { QuoteEmailService } from '../services/quote-email-service';
import SendGridService from '../services/email/sendgrid-service';

// Mock SendGrid service
jest.mock('../services/email/sendgrid-service', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    sendQuoteEmail: jest.fn(),
    sendQuoteReminder: jest.fn(),
    verifyApprovalToken: jest.fn(),
  },
}));

describe('QuoteEmailService', () => {
  let service: QuoteEmailService;

  const mockQuote = {
    id: 1,
    quoteNumber: 'Q-2024-001',
    status: 'Draft',
    items: [
      {
        description: 'Custom T-Shirts',
        quantity: 100,
        unitPrice: 5.50,
        total: 550.00,
      },
    ],
    subtotal: 550.00,
    tax: 44.00,
    total: 594.00,
    validUntil: '2024-12-31',
    customer: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuoteEmailService();
  });

  describe('initialization', () => {
    it('should initialize SendGrid service', () => {
      const apiKey = 'test-api-key';
      service.initialize(apiKey);
      
      expect(SendGridService.initialize).toHaveBeenCalledWith(apiKey);
    });

    it('should initialize without API key', () => {
      service.initialize();
      
      expect(SendGridService.initialize).toHaveBeenCalledWith(undefined);
    });
  });

  describe('sendQuote', () => {
    beforeEach(() => {
      (SendGridService.sendQuoteEmail as jest.Mock).mockResolvedValue('message-id-123');
    });

    it('should send quote email successfully', async () => {
      const result = await service.sendQuote(mockQuote);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(SendGridService.sendQuoteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          quoteId: '1',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          subtotal: 550.00,
          tax: 44.00,
          total: 594.00,
        })
      );
    });

    it('should format quote items correctly', async () => {
      await service.sendQuote(mockQuote);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.items).toHaveLength(1);
      expect(sendCall.items[0]).toEqual({
        description: 'Custom T-Shirts',
        quantity: 100,
        unitPrice: 5.50,
        total: 550.00,
      });
    });

    it('should handle quote without tax', async () => {
      const quoteWithoutTax = { ...mockQuote, tax: undefined };
      await service.sendQuote(quoteWithoutTax);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.tax).toBeUndefined();
    });

    it('should return error if customer email is missing', async () => {
      const quoteWithoutEmail = {
        ...mockQuote,
        customer: { id: 1, name: 'John Doe', email: '' },
      };

      const result = await service.sendQuote(quoteWithoutEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer email is required');
      expect(SendGridService.sendQuoteEmail).not.toHaveBeenCalled();
    });

    it('should return error if customer is null', async () => {
      const quoteWithoutCustomer = {
        ...mockQuote,
        customer: null as any,
      };

      const result = await service.sendQuote(quoteWithoutCustomer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer email is required');
    });

    it('should handle SendGrid errors', async () => {
      (SendGridService.sendQuoteEmail as jest.Mock).mockRejectedValue(
        new Error('SendGrid API error')
      );

      const result = await service.sendQuote(mockQuote);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SendGrid API error');
    });

    it('should convert numeric fields to proper types', async () => {
      const quoteWithStrings = {
        ...mockQuote,
        subtotal: '550.00' as any,
        tax: '44.00' as any,
        total: '594.00' as any,
      };

      await service.sendQuote(quoteWithStrings);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(typeof sendCall.subtotal).toBe('number');
      expect(typeof sendCall.tax).toBe('number');
      expect(typeof sendCall.total).toBe('number');
    });
  });

  describe('sendReminder', () => {
    beforeEach(() => {
      (SendGridService.sendQuoteReminder as jest.Mock).mockResolvedValue('reminder-id-456');
    });

    it('should send reminder email successfully', async () => {
      const result = await service.sendReminder(mockQuote);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reminder-id-456');
      expect(SendGridService.sendQuoteReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          quoteId: '1',
          customerEmail: 'john@example.com',
        })
      );
    });

    it('should return error if customer email is missing', async () => {
      const quoteWithoutEmail = {
        ...mockQuote,
        customer: { id: 1, name: 'John Doe', email: '' },
      };

      const result = await service.sendReminder(quoteWithoutEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer email is required');
    });

    it('should handle SendGrid errors', async () => {
      (SendGridService.sendQuoteReminder as jest.Mock).mockRejectedValue(
        new Error('SendGrid API error')
      );

      const result = await service.sendReminder(mockQuote);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SendGrid API error');
    });
  });

  describe('formatQuoteItems', () => {
    it('should handle empty items array', async () => {
      const quoteWithoutItems = { ...mockQuote, items: [] };
      await service.sendQuote(quoteWithoutItems);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.items).toEqual([]);
    });

    it('should handle non-array items', async () => {
      const quoteWithInvalidItems = { ...mockQuote, items: null as any };
      await service.sendQuote(quoteWithInvalidItems);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.items).toEqual([]);
    });

    it('should handle items with alternative field names', async () => {
      const quoteWithAltFields = {
        ...mockQuote,
        items: [
          {
            name: 'Product Name',
            quantity: '50',
            price: '10.00',
            total: '500.00',
          },
        ],
      };

      await service.sendQuote(quoteWithAltFields);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.items[0]).toEqual({
        description: 'Product Name',
        quantity: 50,
        unitPrice: 10.00,
        total: 500.00,
      });
    });

    it('should provide defaults for missing item fields', async () => {
      const quoteWithIncompleteItems = {
        ...mockQuote,
        items: [{}],
      };

      await service.sendQuote(quoteWithIncompleteItems);

      const sendCall = (SendGridService.sendQuoteEmail as jest.Mock).mock.calls[0][0];
      expect(sendCall.items[0]).toEqual({
        description: 'Item',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      });
    });
  });

  describe('verifyApprovalToken', () => {
    it('should call SendGrid service verify method', () => {
      const mockToken = 'valid.jwt.token';
      const mockResult = { quoteId: '1', exp: 1234567890 };
      
      (SendGridService.verifyApprovalToken as jest.Mock).mockReturnValue(mockResult);

      const result = service.verifyApprovalToken(mockToken);

      expect(SendGridService.verifyApprovalToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockResult);
    });

    it('should return null for invalid token', () => {
      (SendGridService.verifyApprovalToken as jest.Mock).mockReturnValue(null);

      const result = service.verifyApprovalToken('invalid.token');

      expect(result).toBeNull();
    });
  });
});
