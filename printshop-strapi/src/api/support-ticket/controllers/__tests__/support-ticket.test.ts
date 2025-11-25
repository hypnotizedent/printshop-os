/**
 * Support Ticket Controller Tests
 */

// Mock uuid before importing controller
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock multer
jest.mock('multer', () => {
  const multer: any = jest.fn(() => ({
    array: jest.fn(),
  }));
  multer.diskStorage = jest.fn();
  return multer;
});

import supportTicketController from '../support-ticket';

// Mock Strapi
const mockDocuments = {
  count: jest.fn(),
  findMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockService = jest.fn(() => ({
  sendTicketCreatedEmail: jest.fn().mockResolvedValue(true),
  sendTicketResponseEmail: jest.fn().mockResolvedValue(true),
  sendTicketStatusEmail: jest.fn().mockResolvedValue(true),
}));

const mockStrapi = {
  documents: jest.fn(() => mockDocuments),
  service: mockService,
  contentType: jest.fn(() => ({
    attributes: {},
    kind: 'collectionType',
  })),
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

const controller = supportTicketController({ strapi: mockStrapi as any });

describe('Support Ticket Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });



  describe('findCustomerTickets', () => {
    const mockCtx: any = {
      query: {},
      body: {},
      throw: jest.fn(),
    };

    const mockNext = jest.fn();

    beforeEach(() => {
      mockCtx.query = {};
      mockCtx.body = null;
    });

    it('should find tickets with filters', async () => {
      const mockTickets = [
        { id: '1', ticketNumber: 'TKT-2025-001', subject: 'Test' },
        { id: '2', ticketNumber: 'TKT-2025-002', subject: 'Test 2' },
      ];

      mockDocuments.findMany.mockResolvedValue(mockTickets);
      mockDocuments.count.mockResolvedValue(2);

      mockCtx.query = {
        customerId: 'customer-123',
        status: 'Open',
        page: 1,
        pageSize: 20,
      };

      await controller.findCustomerTickets(mockCtx, mockNext);

      expect(mockCtx.body).toEqual({
        data: mockTickets,
        meta: {
          pagination: {
            page: 1,
            pageSize: 20,
            pageCount: 1,
            total: 2,
          },
        },
      });

      expect(mockDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            customer: { documentId: 'customer-123' },
            status: 'Open',
          }),
        })
      );
    });

    it('should support search functionality', async () => {
      mockDocuments.findMany.mockResolvedValue([]);
      mockDocuments.count.mockResolvedValue(0);

      mockCtx.query = { search: 'test query' };

      await controller.findCustomerTickets(mockCtx, mockNext);

      expect(mockDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            $or: expect.arrayContaining([
              { subject: { $containsi: 'test query' } },
              { description: { $containsi: 'test query' } },
              { ticketNumber: { $containsi: 'test query' } },
            ]),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      mockDocuments.findMany.mockResolvedValue([]);
      mockDocuments.count.mockResolvedValue(50);

      mockCtx.query = { page: 2, pageSize: 10 };

      await controller.findCustomerTickets(mockCtx, mockNext);

      expect(mockDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          start: 10,
          limit: 10,
        })
      );

      expect(mockCtx.body.meta.pagination).toEqual({
        page: 2,
        pageSize: 10,
        pageCount: 5,
        total: 50,
      });
    });

    it('should handle errors gracefully', async () => {
      mockDocuments.findMany.mockRejectedValue(new Error('DB error'));

      await controller.findCustomerTickets(mockCtx, mockNext);

      expect(mockCtx.throw).toHaveBeenCalledWith(500, expect.any(Error));
    });
  });

  describe('createTicket', () => {
    const mockCtx: any = {
      request: { body: {} },
      body: {},
      badRequest: jest.fn(),
      throw: jest.fn(),
    };

    const mockNext = jest.fn();

    beforeEach(() => {
      mockCtx.request.body = {};
      mockCtx.body = null;
    });

    it('should create a ticket successfully', async () => {
      const ticketData = {
        customerId: 'customer-123',
        category: 'Order Issue',
        priority: 'High',
        subject: 'Wrong items received',
        description: 'I received the wrong items in my order',
        orderNumber: 'ORD-001',
      };

      mockCtx.request.body = ticketData;

      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-001',
        ...ticketData,
        customer: { email: 'customer@example.com' },
      };

      mockDocuments.count.mockResolvedValue(0);
      mockDocuments.create.mockResolvedValue(mockTicket);

      await controller.createTicket(mockCtx, mockNext);

      expect(mockDocuments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketNumber: 'TKT-2025-001',
            customer: 'customer-123',
            category: 'Order Issue',
            priority: 'High',
            status: 'Open',
            subject: 'Wrong items received',
            description: 'I received the wrong items in my order',
            orderNumber: 'ORD-001',
          }),
        })
      );

      expect(mockCtx.body).toEqual({ data: mockTicket });
    });

    it('should send email notification on ticket creation', async () => {
      mockCtx.request.body = {
        customerId: 'customer-123',
        category: 'General',
        subject: 'Test',
        description: 'Test description',
      };

      const mockTicket = {
        id: '1',
        ticketNumber: 'TKT-2025-001',
        customer: { email: 'customer@example.com' },
      };

      mockDocuments.count.mockResolvedValue(0);
      mockDocuments.create.mockResolvedValue(mockTicket);

      await controller.createTicket(mockCtx, mockNext);

      expect(mockService).toHaveBeenCalledWith('notification');
    });

    it('should validate required fields', async () => {
      mockCtx.request.body = {
        category: 'General',
        // missing required fields
      };

      await controller.createTicket(mockCtx, mockNext);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Missing required fields');
    });

    it('should handle errors during creation', async () => {
      mockCtx.request.body = {
        customerId: 'customer-123',
        category: 'General',
        subject: 'Test',
        description: 'Test description',
      };

      mockDocuments.count.mockResolvedValue(0);
      mockDocuments.create.mockRejectedValue(new Error('DB error'));

      await controller.createTicket(mockCtx, mockNext);

      expect(mockStrapi.log.error).toHaveBeenCalled();
      expect(mockCtx.throw).toHaveBeenCalledWith(500, expect.any(Error));
    });
  });

  describe('findOneCustomer', () => {
    const mockCtx: any = {
      params: {},
      query: {},
      body: {},
      notFound: jest.fn(),
      forbidden: jest.fn(),
      throw: jest.fn(),
    };

    const mockNext = jest.fn();

    beforeEach(() => {
      mockCtx.params = {};
      mockCtx.query = {};
      mockCtx.body = null;
    });

    it('should find ticket by ID', async () => {
      const mockTicket = {
        documentId: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        subject: 'Test',
        customer: { documentId: 'customer-123' },
        comments: [
          { message: 'Comment 1', isInternal: false },
          { message: 'Comment 2', isInternal: false },
        ],
      };

      mockCtx.params = { id: 'ticket-123' };
      mockCtx.query = { customerId: 'customer-123' };

      mockDocuments.findOne.mockResolvedValue(mockTicket);

      await controller.findOneCustomer(mockCtx, mockNext);

      expect(mockCtx.body).toEqual({ data: mockTicket });
    });

    it('should filter internal notes for customers', async () => {
      const mockTicket = {
        documentId: 'ticket-123',
        customer: { documentId: 'customer-123' },
        comments: [
          { message: 'Public comment', isInternal: false },
          { message: 'Internal note', isInternal: true },
          { message: 'Another public', isInternal: false },
        ],
      };

      mockCtx.params = { id: 'ticket-123' };
      mockCtx.query = { customerId: 'customer-123' };

      mockDocuments.findOne.mockResolvedValue(mockTicket);

      await controller.findOneCustomer(mockCtx, mockNext);

      expect(mockCtx.body.data.comments).toHaveLength(2);
      expect(mockCtx.body.data.comments.every((c: any) => !c.isInternal)).toBe(true);
    });

    it('should deny access if customer does not own ticket', async () => {
      const mockTicket = {
        documentId: 'ticket-123',
        customer: { documentId: 'customer-123' },
      };

      mockCtx.params = { id: 'ticket-123' };
      mockCtx.query = { customerId: 'different-customer' };

      mockDocuments.findOne.mockResolvedValue(mockTicket);

      await controller.findOneCustomer(mockCtx, mockNext);

      expect(mockCtx.forbidden).toHaveBeenCalledWith('Access denied');
    });

    it('should return 404 if ticket not found', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockDocuments.findOne.mockResolvedValue(null);

      await controller.findOneCustomer(mockCtx, mockNext);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Ticket not found');
    });
  });

  describe('addComment', () => {
    const mockCtx: any = {
      params: {},
      request: { body: {} },
      body: {},
      badRequest: jest.fn(),
      notFound: jest.fn(),
      throw: jest.fn(),
    };

    const mockNext = jest.fn();

    beforeEach(() => {
      mockCtx.params = {};
      mockCtx.request.body = {};
      mockCtx.body = null;
    });

    it('should add comment to ticket', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = {
        userId: 'user-123',
        userType: 'customer',
        message: 'This is my comment',
      };

      const mockTicket = {
        documentId: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        status: 'Open',
        customer: { email: 'customer@example.com' },
      };

      const mockComment = {
        id: 'comment-1',
        ticket: 'ticket-123',
        userId: 'user-123',
        userType: 'customer',
        message: 'This is my comment',
      };

      mockDocuments.findOne.mockResolvedValue(mockTicket);
      mockDocuments.create.mockResolvedValue(mockComment);

      await controller.addComment(mockCtx, mockNext);

      expect(mockDocuments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticket: 'ticket-123',
            userId: 'user-123',
            userType: 'customer',
            message: 'This is my comment',
            isInternal: false,
          }),
        })
      );

      expect(mockCtx.body).toEqual({ data: mockComment });
    });

    it('should reopen resolved tickets when new comment added', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = {
        userId: 'user-123',
        userType: 'customer',
        message: 'Following up',
      };

      const mockTicket = {
        documentId: 'ticket-123',
        status: 'Resolved',
        customer: { email: 'customer@example.com' },
      };

      mockDocuments.findOne.mockResolvedValue(mockTicket);
      mockDocuments.create.mockResolvedValue({});

      await controller.addComment(mockCtx, mockNext);

      expect(mockDocuments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'ticket-123',
          data: { status: 'In Progress' },
        })
      );
    });

    it('should send email when staff replies', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = {
        userId: 'staff-123',
        userType: 'staff',
        message: 'We are looking into this',
      };

      const mockTicket = {
        documentId: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        subject: 'Test ticket',
        status: 'Open',
        customer: { email: 'customer@example.com' },
      };

      mockDocuments.findOne.mockResolvedValue(mockTicket);
      mockDocuments.create.mockResolvedValue({});

      await controller.addComment(mockCtx, mockNext);

      expect(mockService).toHaveBeenCalledWith('notification');
    });

    it('should validate required fields', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = {
        userId: 'user-123',
        // missing userType and message
      };

      await controller.addComment(mockCtx, mockNext);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Missing required fields');
    });
  });

  describe('updateStatus', () => {
    const mockCtx: any = {
      params: {},
      request: { body: {} },
      body: {},
      badRequest: jest.fn(),
      throw: jest.fn(),
    };

    const mockNext = jest.fn();

    beforeEach(() => {
      mockCtx.params = {};
      mockCtx.request.body = {};
      mockCtx.body = null;
    });

    it('should update ticket status', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = { status: 'In Progress' };

      const mockTicket = {
        documentId: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        subject: 'Test',
        status: 'In Progress',
        customer: { email: 'customer@example.com' },
      };

      mockDocuments.update.mockResolvedValue(mockTicket);

      await controller.updateStatus(mockCtx, mockNext);

      expect(mockDocuments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'ticket-123',
          data: { status: 'In Progress' },
        })
      );

      expect(mockCtx.body).toEqual({ data: mockTicket });
    });

    it('should set closedAt when status is Closed', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = { status: 'Closed' };

      mockDocuments.update.mockResolvedValue({
        customer: { email: 'customer@example.com' },
      });

      await controller.updateStatus(mockCtx, mockNext);

      expect(mockDocuments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Closed',
            closedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should set closedAt when status is Resolved', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = { status: 'Resolved' };

      mockDocuments.update.mockResolvedValue({
        customer: { email: 'customer@example.com' },
      });

      await controller.updateStatus(mockCtx, mockNext);

      expect(mockDocuments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Resolved',
            closedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should validate status value', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = { status: 'Invalid Status' };

      await controller.updateStatus(mockCtx, mockNext);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Invalid status');
    });

    it('should require status field', async () => {
      mockCtx.params = { id: 'ticket-123' };
      mockCtx.request.body = {};

      await controller.updateStatus(mockCtx, mockNext);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Status is required');
    });
  });
});
