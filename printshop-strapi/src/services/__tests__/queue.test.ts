/**
 * Queue Service Tests
 */

import { addWorkflowJob, WorkflowJobType, getQueueStats } from '../queue';

// Mock Bull
const mockAdd = jest.fn();
const mockGetWaitingCount = jest.fn();
const mockGetActiveCount = jest.fn();
const mockGetCompletedCount = jest.fn();
const mockGetFailedCount = jest.fn();
const mockGetDelayedCount = jest.fn();

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: mockAdd,
    getWaitingCount: mockGetWaitingCount,
    getActiveCount: mockGetActiveCount,
    getCompletedCount: mockGetCompletedCount,
    getFailedCount: mockGetFailedCount,
    getDelayedCount: mockGetDelayedCount,
    process: jest.fn(),
    on: jest.fn(),
  }));
});

describe('Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue({ id: 'test-job-123' });
  });

  describe('addWorkflowJob', () => {
    it('should add quote approved job to queue', async () => {
      const jobData = {
        quoteId: 1,
        approvalToken: 'abc123',
      };

      const job = await addWorkflowJob(WorkflowJobType.QUOTE_APPROVED, jobData);

      expect(job).toBeDefined();
      expect(mockAdd).toHaveBeenCalledWith(
        WorkflowJobType.QUOTE_APPROVED,
        jobData,
        expect.objectContaining({
          priority: 1,
        })
      );
    });

    it('should add notification job with higher priority', async () => {
      const jobData = {
        type: 'email' as const,
        template: 'order-confirmation',
        recipient: 'test@example.com',
        data: {},
      };

      await addWorkflowJob(WorkflowJobType.SEND_NOTIFICATION, jobData);

      expect(mockAdd).toHaveBeenCalledWith(
        WorkflowJobType.SEND_NOTIFICATION,
        jobData,
        expect.objectContaining({
          priority: 5,
        })
      );
    });

    it('should add create order job', async () => {
      const jobData = {
        quoteId: 1,
      };

      await addWorkflowJob(WorkflowJobType.CREATE_ORDER, jobData);

      expect(mockAdd).toHaveBeenCalledWith(
        WorkflowJobType.CREATE_ORDER,
        jobData,
        expect.any(Object)
      );
    });

    it('should add create job job', async () => {
      const jobData = {
        orderId: 1,
        quoteId: 1,
      };

      await addWorkflowJob(WorkflowJobType.CREATE_JOB, jobData);

      expect(mockAdd).toHaveBeenCalledWith(
        WorkflowJobType.CREATE_JOB,
        jobData,
        expect.any(Object)
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockGetWaitingCount.mockResolvedValue(5);
      mockGetActiveCount.mockResolvedValue(2);
      mockGetCompletedCount.mockResolvedValue(100);
      mockGetFailedCount.mockResolvedValue(3);
      mockGetDelayedCount.mockResolvedValue(1);

      const stats = await getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });

    it('should handle errors in getting stats', async () => {
      mockGetWaitingCount.mockRejectedValue(new Error('Redis error'));

      await expect(getQueueStats()).rejects.toThrow('Redis error');
    });
  });

  describe('WorkflowJobType', () => {
    it('should have correct job type values', () => {
      expect(WorkflowJobType.QUOTE_APPROVED).toBe('quote.approved');
      expect(WorkflowJobType.CREATE_ORDER).toBe('create.order');
      expect(WorkflowJobType.CREATE_JOB).toBe('create.job');
      expect(WorkflowJobType.SEND_NOTIFICATION).toBe('send.notification');
    });
  });
});
