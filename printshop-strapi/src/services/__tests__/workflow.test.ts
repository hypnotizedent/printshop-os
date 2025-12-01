/**
 * Workflow Service Tests
 */

import {
  processQuoteApproval,
  createOrderFromQuote,
  createJobFromOrder,
  getWorkflowStatus,
} from '../workflow';

// Mock Strapi
const mockStrapi = {
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  documents: jest.fn(),
};

// Mock audit service
jest.mock('../audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue({ id: 1 }),
}));

// Mock notification service
jest.mock('../notification', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
  notifyProductionTeam: jest.fn().mockResolvedValue(undefined),
}));

describe('Workflow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrderFromQuote', () => {
    it('should create an order from a quote', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Approved',
        items: [
          { description: 'T-Shirt', quantity: 100, price: 10 },
        ],
        totalAmount: 1000,
        notes: 'Rush order',
        customer: {
          documentId: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const mockOrder = {
        id: 1,
        documentId: 'order-123',
        orderNumber: 'ORD-2311-0001',
        status: 'Pending',
        items: mockQuote.items,
        totalAmount: mockQuote.totalAmount,
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockOrder),
      });

      const order = await createOrderFromQuote(mockStrapi as any, mockQuote);

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{4}$/);
      expect(order.status).toBe('Pending');
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::order.order');
    });

    it('should handle errors when creating order', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Approved',
        items: [],
        totalAmount: 0,
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        createOrderFromQuote(mockStrapi as any, mockQuote)
      ).rejects.toThrow('Database error');
    });
  });

  describe('createJobFromOrder', () => {
    it('should create a job from an order', async () => {
      const mockOrder = {
        id: 1,
        documentId: 'order-123',
        orderNumber: 'ORD-2311-0001',
        status: 'Pending',
        items: [{ description: 'T-Shirt', quantity: 100 }],
        totalAmount: 1000,
        customer: 'customer-1',
      };

      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Approved',
      };

      const mockJob = {
        id: 1,
        documentId: 'job-123',
        jobNumber: 'JOB-2311-0001',
        status: 'PendingArtwork',
        title: `Job for Order ${mockOrder.orderNumber}`,
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockJob),
      });

      const job = await createJobFromOrder(mockStrapi as any, mockOrder, mockQuote);

      expect(job).toBeDefined();
      expect(job.jobNumber).toMatch(/^JOB-\d{4}-\d{4}$/);
      expect(job.status).toBe('PendingArtwork');
      expect(job.title).toContain(mockOrder.orderNumber);
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::job.job');
    });

    it('should set due date 7 days in the future', async () => {
      const mockOrder = {
        id: 1,
        documentId: 'order-123',
        orderNumber: 'ORD-2311-0001',
        status: 'Pending',
        items: [],
        totalAmount: 1000,
        customer: 'customer-1',
      };

      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Approved',
      };

      const mockJob = {
        id: 1,
        documentId: 'job-123',
        jobNumber: 'JOB-2311-0001',
        status: 'PendingArtwork',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockJob),
      });

      const job = await createJobFromOrder(mockStrapi as any, mockOrder, mockQuote);

      expect(job.dueDate).toBeDefined();
      // Due date should be in YYYY-MM-DD format
      expect(job.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('processQuoteApproval', () => {
    it('should process full workflow: quote → order → job', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Approved',
        items: [{ description: 'T-Shirt', quantity: 100, price: 10 }],
        totalAmount: 1000,
        customer: {
          documentId: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const mockOrder = {
        id: 1,
        documentId: 'order-123',
        orderNumber: 'ORD-2311-0001',
        status: 'Pending',
        items: mockQuote.items,
        totalAmount: mockQuote.totalAmount,
        customer: mockQuote.customer.documentId,
      };

      const mockJob = {
        id: 1,
        documentId: 'job-123',
        jobNumber: 'JOB-2311-0001',
        status: 'PendingArtwork',
      };

      // Mock findOne for getting quote
      const findOneMock = jest.fn().mockResolvedValue(mockQuote);
      
      // Mock create for order and job
      const createMock = jest.fn()
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockJob);
      
      // Mock update for quote status
      const updateMock = jest.fn().mockResolvedValue({
        ...mockQuote,
        status: 'OrderCreated',
      });

      mockStrapi.documents.mockImplementation((type) => {
        if (type === 'api::quote.quote') {
          return { findOne: findOneMock, update: updateMock };
        }
        if (type === 'api::order.order') {
          return { create: createMock };
        }
        if (type === 'api::job.job') {
          return { create: createMock };
        }
        return {};
      });

      const result = await processQuoteApproval(mockStrapi as any, 1);

      expect(result).toBeDefined();
      expect(result.order).toBeDefined();
      expect(result.job).toBeDefined();
      expect(findOneMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should throw error if quote not found', async () => {
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        processQuoteApproval(mockStrapi as any, 999)
      ).rejects.toThrow('Quote 999 not found');
    });

    it('should throw error if quote already has order', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'OrderCreated',
      };

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await expect(
        processQuoteApproval(mockStrapi as any, 1)
      ).rejects.toThrow('Quote 1 already has an order created');
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return complete workflow status', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'OrderCreated',
        approved_at: '2023-11-23T10:00:00Z',
        order_id: {
          id: 1,
          documentId: 'order-123',
          orderNumber: 'ORD-2311-0001',
          status: 'Pending',
          created_at_timestamp: '2023-11-23T10:01:00Z',
          job: {
            id: 1,
            documentId: 'job-123',
            jobNumber: 'JOB-2311-0001',
            status: 'PendingArtwork',
            created_at_timestamp: '2023-11-23T10:02:00Z',
          },
        },
      };

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      const status = await getWorkflowStatus(mockStrapi as any, 1);

      expect(status).toBeDefined();
      expect(status.quote).toBeDefined();
      expect(status.quote.number).toBe('QT-2023-001');
      expect(status.order).toBeDefined();
      expect(status.order.number).toBe('ORD-2311-0001');
      expect(status.job).toBeDefined();
      expect(status.job.number).toBe('JOB-2311-0001');
    });

    it('should handle quote without order', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Sent',
        order_id: null,
      };

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      const status = await getWorkflowStatus(mockStrapi as any, 1);

      expect(status.quote).toBeDefined();
      expect(status.order).toBeNull();
      expect(status.job).toBeNull();
    });
  });
});
