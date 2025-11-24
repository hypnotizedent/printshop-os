/**
 * Customer Address Controller Tests
 */

describe('Customer Address Controller', () => {
  let mockStrapi: any;
  let mockCtx: any;
  let mockUser: any;

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
      documents: jest.fn((type) => {
        if (type === 'api::customer-address.customer-address') {
          return {
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
            create: jest.fn().mockResolvedValue({
              documentId: 'addr-new',
              label: 'New Address',
            }),
            delete: jest.fn().mockResolvedValue({}),
          };
        }
        return { create: jest.fn() };
      }),
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
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.setDefault(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-address.customer-address');
      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.isDefault).toBe(true);
    });

    it('should return 404 if address not found', async () => {
      mockStrapi.documents = jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      }));

      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.setDefault(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.setDefault(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('create', () => {
    it('should create a new address', async () => {
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      // Mock super.create
      const mockSuperCreate = jest.fn().mockResolvedValue({ documentId: 'new-addr' });
      Object.setPrototypeOf(instance, { create: mockSuperCreate });

      await instance.create(mockCtx);

      expect(mockCtx.request.body.data.user).toBe(mockUser.id);
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.create(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('update', () => {
    it('should update address', async () => {
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      // Mock super.update
      const mockSuperUpdate = jest.fn().mockResolvedValue({ documentId: 'addr-123' });
      Object.setPrototypeOf(instance, { update: mockSuperUpdate });

      await instance.update(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-address.customer-address');
    });

    it('should return 404 if address not found', async () => {
      mockStrapi.documents = jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(null),
      }));

      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.update(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });
  });

  describe('delete', () => {
    it('should delete address', async () => {
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      // Mock super.delete
      const mockSuperDelete = jest.fn().mockResolvedValue({});
      Object.setPrototypeOf(instance, { delete: mockSuperDelete });

      await instance.delete(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-address.customer-address');
    });

    it('should return 404 if address not found', async () => {
      mockStrapi.documents = jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(null),
      }));

      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.delete(mockCtx);

      expect(mockCtx.notFound).toHaveBeenCalledWith('Address not found');
    });
  });

  describe('find', () => {
    it('should filter addresses by current user', async () => {
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      // Mock super.find
      const mockSuperFind = jest.fn().mockResolvedValue([]);
      Object.setPrototypeOf(instance, { find: mockSuperFind });

      await instance.find(mockCtx);

      expect(mockCtx.query.filters.user).toBe(mockUser.id);
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-address').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.find(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });
});
