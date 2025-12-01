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
        documentId: 'doc-123',
        action: 'CREATE',
        entity_type: 'quote',
        entity_id: '1',
        user_id: 'user-1',
        user_name: 'John Doe',
        timestamp: expect.any(String),
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockAuditLog),
      });

      const result = await createAuditLog(mockStrapi as any, {
        action: 'CREATE',
        entity_type: 'quote',
        entity_id: '1',
        user_id: 'user-1',
        user_name: 'John Doe',
      });

      expect(result).toBeDefined();
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::audit-log.audit-log');
      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Audit log created')
      );
    });

    it('should include changes in audit log', async () => {
      const mockAuditLog = {
        id: 1,
        action: 'UPDATE',
        entity_type: 'order',
        entity_id: '1',
        changes: { status: 'Completed' },
      };

      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockAuditLog),
      });

      await createAuditLog(mockStrapi as any, {
        action: 'UPDATE',
        entity_type: 'order',
        entity_id: '1',
        changes: { status: 'Completed' },
      });

      const createCall = mockStrapi.documents().create;
      expect(createCall).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: { status: 'Completed' },
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      mockStrapi.documents.mockReturnValue({
        create: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        createAuditLog(mockStrapi as any, {
          action: 'CREATE',
          entity_type: 'quote',
          entity_id: '1',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'CREATE',
          entity_type: 'quote',
          entity_id: '1',
          timestamp: '2023-11-23T10:00:00Z',
        },
        {
          id: 2,
          action: 'UPDATE',
          entity_type: 'quote',
          entity_id: '1',
          timestamp: '2023-11-22T10:00:00Z',
        },
      ];

      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockResolvedValue(mockLogs),
      });

      const result = await getAuditLogs(mockStrapi as any, { entity_type: 'quote' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].action).toBe('CREATE');
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::audit-log.audit-log');
    });

    it('should handle errors gracefully', async () => {
      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        getAuditLogs(mockStrapi as any, { entity_type: 'quote' })
      ).rejects.toThrow('Database error');
    });

    it('should support pagination', async () => {
      mockStrapi.documents.mockReturnValue({
        findMany: jest.fn().mockResolvedValue([]),
      });

      const result = await getAuditLogs(
        mockStrapi as any,
        { entity_type: 'order' },
        { page: 2, pageSize: 10 }
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(10);
    });
  });
});
