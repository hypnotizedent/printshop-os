/**
 * Audit Service Tests
 */

import { createAuditLog, getAuditLogs } from '../audit';

const mockStrapi = {
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
  documents: jest.fn(),
};

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      const mockAuditLog = {
        id: 1,
        entityType: 'quote',
        entityId: 1,
        event: 'quote.approved',
        oldStatus: 'Sent',
        newStatus: 'OrderCreated',
        timestamp: expect.any(String),
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockAuditLog),
      });

      const result = await createAuditLog(mockStrapi as any, {
        entityType: 'quote',
        entityId: 1,
        event: 'quote.approved',
        oldStatus: 'Sent',
        newStatus: 'OrderCreated',
      });

      expect(result).toBeDefined();
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::audit-log.audit-log');
      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Audit log created')
      );
    });

    it('should include metadata in audit log', async () => {
      const mockAuditLog = {
        id: 1,
        entityType: 'order',
        entityId: 1,
        event: 'order.created',
        metadata: { orderId: 1, quoteId: 1 },
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockAuditLog),
      });

      await createAuditLog(mockStrapi as any, {
        entityType: 'order',
        entityId: 1,
        event: 'order.created',
        metadata: { orderId: 1, quoteId: 1 },
      });

      const createCall = mockStrapi.documents().create;
      expect(createCall).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { orderId: 1, quoteId: 1 },
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        createAuditLog(mockStrapi as any, {
          entityType: 'quote',
          entityId: 1,
          event: 'test.event',
        })
      ).rejects.toThrow('Database error');

      expect(mockStrapi.log.error).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs for an entity', async () => {
      const mockLogs = [
        {
          id: 1,
          entityType: 'quote',
          entityId: 1,
          event: 'quote.approved',
          timestamp: '2023-11-23T10:00:00Z',
        },
        {
          id: 2,
          entityType: 'quote',
          entityId: 1,
          event: 'quote.sent',
          timestamp: '2023-11-22T10:00:00Z',
        },
      ];

      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockResolvedValue(mockLogs),
      });

      const logs = await getAuditLogs(mockStrapi as any, 'quote', 1);

      expect(logs).toHaveLength(2);
      expect(logs[0].event).toBe('quote.approved');
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::audit-log.audit-log');
    });

    it('should return empty array on error', async () => {
      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const logs = await getAuditLogs(mockStrapi as any, 'quote', 1);

      expect(logs).toEqual([]);
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should sort logs by timestamp descending', async () => {
      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockResolvedValue([]),
      });

      await getAuditLogs(mockStrapi as any, 'order', 1);

      const findManyCall = mockStrapi.documents().findMany;
      expect(findManyCall).toHaveBeenCalledWith({
        filters: {
          entityType: 'order',
          entityId: 1,
        },
        sort: { timestamp: 'desc' },
      });
    });
  });
});
