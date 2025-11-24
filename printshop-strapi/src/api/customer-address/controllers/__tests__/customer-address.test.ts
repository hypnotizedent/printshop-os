/**
 * Customer Address Controller Tests
 */

describe('Customer Address Controller', () => {
  let mockStrapi: any;
  let mockCtx: any;
  let mockUser: any;
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      documentId: 'user-doc-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    mockStrapi = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
      documents: jest.fn(),
      service: jest.fn().mockReturnValue({
        logActivity: jest.fn().mockResolvedValue({}),
      }),
    };

    mockCtx = {
      state: {
        user: mockUser,
      },
      params: {
        id: 'addr-123',
      },
      query: {},
      request: {
        body: {
          data: {
            label: 'Home',
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'City',
            state: 'State',
            zipCode: '12345',
            country: 'US',
            phone: '555-1234',
          },
        },
        ip: '192.168.1.1',
        header: jest.fn().mockReturnValue('test-user-agent'),
      },
      body: null,
      notFound: jest.fn((msg) => msg),
      badRequest: jest.fn((msg) => msg),
      unauthorized: jest.fn((msg) => msg),
      internalServerError: jest.fn((msg) => msg),
    };

    // Dynamically import controller factory and create controller
    const controllerFactory = require('../customer-address').default;
    controller = controllerFactory({ strapi: mockStrapi });
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          documentId: 'addr-123',
          label: 'Home',
          isDefault: false,
          user: mockUser.id,
        }),
        findMany: jest.fn().mockResolvedValue([
          { documentId: 'addr-123', label: 'Home', isDefault: true },
          { documentId: 'addr-456', label: 'Office', isDefault: false },
        ]),
        update: jest.fn().mockResolvedValue({
          documentId: 'addr-123',
          label: 'Home',
          isDefault: true,
        }),
      });

      await controller.setDefault(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-address.customer-address');
      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.isDefault).toBe(true);
    });

    it('should return 404 if address not found', async () => {
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      });

      await controller.setDefault(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.setDefault(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('create', () => {
    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.create(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('update', () => {
    it('should return 404 if address not found', async () => {
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await controller.update(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.update(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('delete', () => {
    it('should return 404 if address not found', async () => {
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await controller.delete(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.delete(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('find', () => {
    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.find(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });
});
