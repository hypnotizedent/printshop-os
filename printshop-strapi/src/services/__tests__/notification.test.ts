/**
 * Notification Service Tests
 */

import {
  sendEmail,
  sendWebSocketNotification,
  sendOrderConfirmationEmail,
  sendProductionNotificationEmail,
  notifyProductionTeam,
  setWebSocketInstance,
} from '../notification';

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

const mockStrapi = {
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-123' });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        mockStrapi as any
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        })
      );
      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Email sent')
      );
    });

    it('should handle email errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        mockStrapi as any
      );

      expect(result).toBe(false);
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should work without strapi instance', async () => {
      const result = await sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('sendWebSocketNotification', () => {
    it('should send WebSocket notification', async () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      setWebSocketInstance(mockIo);

      const result = await sendWebSocketNotification(
        'production-team',
        'job:new',
        { jobNumber: 'JOB-001' },
        mockStrapi as any
      );

      expect(result).toBe(true);
      expect(mockIo.to).toHaveBeenCalledWith('production-team');
      expect(mockIo.emit).toHaveBeenCalledWith('job:new', { jobNumber: 'JOB-001' });
      expect(mockStrapi.log.info).toHaveBeenCalled();
    });

    it('should handle missing WebSocket instance', async () => {
      setWebSocketInstance(null);

      const result = await sendWebSocketNotification(
        'production-team',
        'job:new',
        {},
        mockStrapi as any
      );

      expect(result).toBe(false);
      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket not initialized')
      );
    });

    it('should handle WebSocket errors gracefully', async () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn().mockImplementation(() => {
          throw new Error('Socket error');
        }),
      };

      setWebSocketInstance(mockIo);

      const result = await sendWebSocketNotification(
        'production-team',
        'job:new',
        {},
        mockStrapi as any
      );

      expect(result).toBe(false);
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email', async () => {
      const orderDetails = {
        totalAmount: 1000,
        items: [
          { description: 'T-Shirt', quantity: 100, price: 10 },
        ],
      };

      const result = await sendOrderConfirmationEmail(
        'customer@example.com',
        'ORD-2311-0001',
        orderDetails,
        mockStrapi as any
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('ORD-2311-0001'),
          html: expect.stringContaining('Order Confirmation'),
        })
      );
    });

    it('should include order items in email', async () => {
      const orderDetails = {
        totalAmount: 500,
        items: [
          { description: 'T-Shirt', quantity: 50, price: 10 },
        ],
      };

      await sendOrderConfirmationEmail(
        'customer@example.com',
        'ORD-001',
        orderDetails
      );

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('T-Shirt');
      expect(emailCall.html).toContain('50');
    });
  });

  describe('sendProductionNotificationEmail', () => {
    it('should send production notification email', async () => {
      const jobDetails = {
        customerName: 'John Doe',
        dueDate: '2023-12-01',
        status: 'PendingArtwork',
        items: [
          { description: 'T-Shirt', quantity: 100 },
        ],
        productionNotes: 'Rush order',
      };

      const result = await sendProductionNotificationEmail(
        'JOB-2311-0001',
        jobDetails,
        mockStrapi as any
      );

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('JOB-2311-0001'),
          html: expect.stringContaining('New Production Job'),
        })
      );
    });

    it('should include production notes if provided', async () => {
      const jobDetails = {
        customerName: 'John Doe',
        dueDate: '2023-12-01',
        status: 'PendingArtwork',
        items: [],
        productionNotes: 'Handle with care',
      };

      await sendProductionNotificationEmail('JOB-001', jobDetails);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('Handle with care');
    });
  });

  describe('notifyProductionTeam', () => {
    it('should send both WebSocket and email notifications', async () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      setWebSocketInstance(mockIo);

      const jobDetails = {
        customerName: 'John Doe',
        dueDate: '2023-12-01',
        status: 'PendingArtwork',
        items: [],
      };

      await notifyProductionTeam('JOB-001', jobDetails, mockStrapi as any);

      expect(mockIo.to).toHaveBeenCalledWith('production-team');
      expect(mockIo.emit).toHaveBeenCalledWith('job:new', expect.any(Object));
      expect(mockSendMail).toHaveBeenCalled();
    });
  });
});
