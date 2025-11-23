/**
 * Quote Controller Tests
 */

// Mock the services before importing controller
jest.mock('../../../../services/queue', () => ({
  addWorkflowJob: jest.fn().mockResolvedValue({ id: 'test-job-123' }),
  WorkflowJobType: {
    QUOTE_APPROVED: 'quote.approved',
  },
}));

jest.mock('../../../../services/workflow', () => ({
  getWorkflowStatus: jest.fn().mockResolvedValue({
    quote: { id: 1, number: 'QT-001', status: 'OrderCreated' },
    order: { id: 1, number: 'ORD-001', status: 'Pending' },
    job: { id: 1, number: 'JOB-001', status: 'PendingArtwork' },
  }),
}));

import { addWorkflowJob } from '../../../../services/queue';
import { getWorkflowStatus } from '../../../../services/workflow';

describe('Quote Controller', () => {
  let mockStrapi: any;
  let mockCtx: any;
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStrapi = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
      documents: jest.fn(),
    };

    mockCtx = {
      params: {},
      request: { body: {} },
      body: null,
      notFound: jest.fn((msg) => msg),
      badRequest: jest.fn((msg) => msg),
      unauthorized: jest.fn((msg) => msg),
      internalServerError: jest.fn((msg) => msg),
    };

    // Dynamically import controller factory and create controller
    const { factories } = require('@strapi/strapi');
    const controllerFactory = require('../quote').default;
    controller = controllerFactory({ strapi: mockStrapi });
  });

  describe('approve', () => {
    it('should approve a quote and trigger workflow', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        quoteNumber: 'QT-2023-001',
        status: 'Sent',
        approvalToken: 'abc123',
      };

      mockCtx.params.id = 'quote-123';
      mockCtx.request.body = { approvalToken: 'abc123' };

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.message).toContain('being processed');
      expect(mockCtx.body.quoteId).toBe(1);
      expect(addWorkflowJob).toHaveBeenCalled();
    });

    it('should return 404 if quote not found', async () => {
      mockCtx.params.id = 'invalid-id';

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Quote not found');
    });

    it('should reject if quote already approved', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        status: 'OrderCreated',
      };

      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        expect.stringContaining('already approved')
      );
    });

    it('should reject if quote is rejected', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        status: 'Rejected',
      };

      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        expect.stringContaining('rejected')
      );
    });

    it('should reject if quote is expired', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        status: 'Expired',
      };

      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        expect.stringContaining('expired')
      );
    });

    it('should validate approval token if provided', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        status: 'Sent',
        approvalToken: 'correct-token',
      };

      mockCtx.params.id = 'quote-123';
      mockCtx.request.body = { approvalToken: 'wrong-token' };

      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith(
        'Invalid approval token'
      );
    });

    it('should check approval link expiration', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
        status: 'Sent',
        approval_link_expires_at: pastDate,
      };

      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
        update: jest.fn().mockResolvedValue({ ...mockQuote, status: 'Expired' }),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        expect.stringContaining('expired')
      );
      expect(mockStrapi.documents().update).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await controller.approve(mockCtx);

      expect(mockCtx.internalServerError).toHaveBeenCalledWith(
        'Failed to approve quote'
      );
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });
  });

  describe('workflowStatus', () => {
    it('should return workflow status', async () => {
      const mockQuote = {
        id: 1,
        documentId: 'quote-123',
      };

      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockQuote),
      });

      await controller.workflowStatus(mockCtx);

      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.quote).toBeDefined();
      expect(getWorkflowStatus).toHaveBeenCalledWith(mockStrapi, 1);
    });

    it('should return 404 if quote not found', async () => {
      mockCtx.params.id = 'invalid-id';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await controller.workflowStatus(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Quote not found');
    });

    it('should handle errors gracefully', async () => {
      mockCtx.params.id = 'quote-123';
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await controller.workflowStatus(mockCtx);

      expect(mockCtx.internalServerError).toHaveBeenCalledWith(
        'Failed to get workflow status'
      );
    });
  });
});
