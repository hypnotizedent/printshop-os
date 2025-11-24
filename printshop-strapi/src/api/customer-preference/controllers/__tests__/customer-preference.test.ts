/**
 * Customer Preference Controller Tests
 */

describe('Customer Preference Controller', () => {
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
      request: {
        body: {
          marketingEmails: true,
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
    const controllerFactory = require('../customer-preference').default;
    controller = controllerFactory({ strapi: mockStrapi });
  });

  describe('getMyPreferences', () => {
    it('should return user preferences', async () => {
      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue({
          documentId: 'pref-123',
          user: mockUser.id,
          orderConfirmation: true,
          artApproval: true,
          productionUpdates: true,
          shipmentNotifications: true,
          quoteReminders: true,
          marketingEmails: false,
          smsNotifications: false,
        }),
      });

      await controller.getMyPreferences(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-preference.customer-preference');
      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.orderConfirmation).toBe(true);
    });

    it('should create default preferences if none exist', async () => {
      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          documentId: 'pref-new',
          user: mockUser.id,
          orderConfirmation: true,
          artApproval: true,
          productionUpdates: true,
          shipmentNotifications: true,
          quoteReminders: true,
          marketingEmails: false,
          smsNotifications: false,
        }),
      });

      await controller.getMyPreferences(mockCtx);

      const documentsInstance = mockStrapi.documents('api::customer-preference.customer-preference');
      expect(documentsInstance.create).toHaveBeenCalled();
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.getMyPreferences(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('updateMyPreferences', () => {
    it('should update existing preferences', async () => {
      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue({
          documentId: 'pref-123',
          user: mockUser.id,
        }),
        update: jest.fn().mockResolvedValue({
          documentId: 'pref-123',
          marketingEmails: true,
        }),
      });

      await controller.updateMyPreferences(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('api::customer-preference.customer-preference');
      expect(mockCtx.body).toBeDefined();
    });

    it('should create preferences if they do not exist', async () => {
      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          documentId: 'pref-new',
          marketingEmails: true,
        }),
      });

      await controller.updateMyPreferences(mockCtx);

      const documentsInstance = mockStrapi.documents('api::customer-preference.customer-preference');
      expect(documentsInstance.create).toHaveBeenCalled();
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.updateMyPreferences(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });
});
