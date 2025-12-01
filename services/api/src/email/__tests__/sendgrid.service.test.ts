/**
 * SendGrid Email Service Tests
 * Tests for transactional email operations
 */

// Create mock before importing
const mockSend = jest.fn();

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: mockSend,
}));

import * as emailService from '../sendgrid.service';

describe('SendGrid Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockResponse = [
        { headers: { 'x-message-id': 'msg_123' }, statusCode: 202 },
        {},
      ];

      mockSend.mockResolvedValue(mockResponse as any);

      const result = await emailService.sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'test@example.com', name: 'Test User' },
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        })
      );
    });

    it('should send email to multiple recipients', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_456' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendEmail({
        to: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
        subject: 'Group Email',
        text: 'Plain text content',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.arrayContaining([
            { email: 'user1@example.com', name: 'User 1' },
          ]),
        })
      );
    });

    it('should handle attachments', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_789' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'With Attachment',
        html: '<p>See attached</p>',
        attachments: [
          {
            content: 'base64content',
            filename: 'invoice.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            expect.objectContaining({
              content: 'base64content',
              filename: 'invoice.pdf',
            }),
          ],
        })
      );
    });

    it('should include categories for tracking', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_abc' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Categorized Email',
        html: '<p>Content</p>',
        categories: ['transactional', 'order-confirmation'],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['transactional', 'order-confirmation'],
        })
      );
    });

    it('should set reply-to address', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_def' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Reply To Test',
        html: '<p>Content</p>',
        replyTo: { email: 'support@example.com', name: 'Support Team' },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: { email: 'support@example.com', name: 'Support Team' },
        })
      );
    });

    it('should handle send errors', async () => {
      mockSend.mockRejectedValue(new Error('API Error'));

      const result = await emailService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should use dynamic template with template data', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_template' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Template Email',
        templateId: 'd-abc123',
        dynamicTemplateData: {
          firstName: 'John',
          orderNumber: 'ORD-001',
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'd-abc123',
          dynamicTemplateData: {
            firstName: 'John',
            orderNumber: 'ORD-001',
          },
        })
      );
    });
  });

  describe('sendQuoteEmail', () => {
    it('should send quote email with line items', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_quote' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendQuoteEmail({
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        quoteNumber: 'QT-2025-001',
        quoteTotal: 1500,
        depositAmount: 750,
        expiresAt: '2025-02-01',
        approvalUrl: 'https://example.com/approve/abc123',
        lineItems: [
          { name: 'T-Shirts (100)', quantity: 100, price: 10 },
          { name: 'Setup Fee', quantity: 1, price: 50 },
        ],
        notes: 'Rush order - 5 day turnaround',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'customer@example.com', name: 'John Doe' },
          subject: expect.stringContaining('QT-2025-001'),
          html: expect.stringContaining('T-Shirts'),
          categories: ['quote', 'transactional'],
        })
      );
    });

    it('should format currency correctly', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_quote2' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendQuoteEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Jane Doe',
        quoteNumber: 'QT-2025-002',
        quoteTotal: 2500.5,
        depositAmount: 1250.25,
        expiresAt: '2025-03-01',
        approvalUrl: 'https://example.com/approve/def456',
        lineItems: [],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('$2,500.50'),
        })
      );
    });

    it('should include approval URL in email', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_quote3' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendQuoteEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Bob Smith',
        quoteNumber: 'QT-2025-003',
        quoteTotal: 1000,
        depositAmount: 500,
        expiresAt: '2025-04-01',
        approvalUrl: 'https://example.com/approve/xyz789',
        lineItems: [],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://example.com/approve/xyz789'),
        })
      );
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_confirm' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendOrderConfirmationEmail({
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        orderNumber: 'ORD-2025-001',
        orderTotal: 2500,
        amountPaid: 1250,
        estimatedDelivery: 'January 15, 2025',
        trackingUrl: 'https://example.com/track/ord-001',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Order Confirmed'),
          html: expect.stringContaining('ORD-2025-001'),
          categories: ['order-confirmation', 'transactional'],
        })
      );
    });

    it('should include tracking URL', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_confirm2' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendOrderConfirmationEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Jane Doe',
        orderNumber: 'ORD-2025-002',
        orderTotal: 1500,
        amountPaid: 1500,
        trackingUrl: 'https://example.com/track/special-123',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://example.com/track/special-123'),
        })
      );
    });

    it('should handle order without estimated delivery', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_confirm3' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendOrderConfirmationEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Bob Smith',
        orderNumber: 'ORD-2025-003',
        orderTotal: 500,
        amountPaid: 250,
        trackingUrl: 'https://example.com/track/ord-003',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendOrderStatusEmail', () => {
    it('should send order status update email', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_status' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendOrderStatusEmail({
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        orderNumber: 'ORD-2025-001',
        status: 'IN_PRODUCTION',
        statusMessage: 'Your order is now in production!',
        trackingUrl: 'https://example.com/track/ord-001',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('IN PRODUCTION'),
          categories: ['order-status', 'transactional'],
        })
      );
    });

    it.each([
      'IN_PRODUCTION',
      'COMPLETE',
      'READY_FOR_PICKUP',
      'SHIPPED',
    ])('should apply correct color for %s status', async (status) => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_status_color' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendOrderStatusEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Jane Doe',
        orderNumber: 'ORD-2025-002',
        status,
        statusMessage: 'Status update',
        trackingUrl: 'https://example.com/track/ord-002',
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendPaymentReceiptEmail', () => {
    it('should send deposit payment receipt', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_receipt' }, statusCode: 202 },
        {},
      ] as any);

      const result = await emailService.sendPaymentReceiptEmail({
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        orderNumber: 'ORD-2025-001',
        amount: 750,
        paymentType: 'deposit',
        receiptUrl: 'https://example.com/receipts/r123',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Payment Receipt'),
          html: expect.stringContaining('Deposit Payment'),
          categories: ['payment-receipt', 'transactional'],
        })
      );
    });

    it('should send balance payment receipt', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_receipt2' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendPaymentReceiptEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Jane Doe',
        orderNumber: 'ORD-2025-002',
        amount: 1250,
        paymentType: 'balance',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Balance Payment'),
        })
      );
    });

    it('should send full payment receipt', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_receipt3' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendPaymentReceiptEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Bob Smith',
        orderNumber: 'ORD-2025-003',
        amount: 2000,
        paymentType: 'full',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Full Payment'),
        })
      );
    });

    it('should include receipt download link when provided', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_receipt4' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendPaymentReceiptEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Alice Johnson',
        orderNumber: 'ORD-2025-004',
        amount: 1500,
        paymentType: 'full',
        receiptUrl: 'https://example.com/receipts/pdf/r456',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Download Receipt'),
        })
      );
    });

    it('should format amount correctly', async () => {
      mockSend.mockResolvedValue([
        { headers: { 'x-message-id': 'msg_receipt5' }, statusCode: 202 },
        {},
      ] as any);

      await emailService.sendPaymentReceiptEmail({
        customerEmail: 'customer@example.com',
        customerName: 'Carol White',
        orderNumber: 'ORD-2025-005',
        amount: 1234.56,
        paymentType: 'deposit',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('$1,234.56'),
        })
      );
    });
  });

  describe('Default Export', () => {
    it('should export all email functions', () => {
      expect(emailService.default).toBeDefined();
      expect(emailService.default.sendEmail).toBeDefined();
      expect(emailService.default.sendQuoteEmail).toBeDefined();
      expect(emailService.default.sendOrderConfirmationEmail).toBeDefined();
      expect(emailService.default.sendOrderStatusEmail).toBeDefined();
      expect(emailService.default.sendPaymentReceiptEmail).toBeDefined();
    });
  });
});
