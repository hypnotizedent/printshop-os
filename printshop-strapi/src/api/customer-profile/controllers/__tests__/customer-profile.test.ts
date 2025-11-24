/**
 * Customer Profile Controller Tests
 */

// Mock services before importing
jest.mock('../../../../services/queue', () => ({
  addWorkflowJob: jest.fn().mockResolvedValue({ id: 'test-job-123' }),
}));

describe('Customer Profile Controller', () => {
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
      password: 'hashed_password',
    };

    mockStrapi = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
      documents: jest.fn((type) => {
        if (type === 'plugin::users-permissions.user') {
          return {
            findOne: jest.fn().mockResolvedValue({ ...mockUser, password: 'hashed' }),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({ ...mockUser, email: 'new@example.com' }),
          };
        }
        return {
          create: jest.fn().mockResolvedValue({}),
        };
      }),
      plugins: {
        'users-permissions': {
          services: {
            user: {
              validatePassword: jest.fn().mockResolvedValue(true),
              hashPassword: jest.fn().mockResolvedValue('new_hashed_password'),
            },
          },
        },
      },
      service: jest.fn().mockReturnValue({
        logActivity: jest.fn().mockResolvedValue({}),
      }),
    };

    mockCtx = {
      state: {
        user: mockUser,
      },
      params: {},
      query: {},
      request: {
        body: {},
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

  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.getProfile(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('plugin::users-permissions.user');
      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.password).toBeUndefined();
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.getProfile(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockCtx.request.body = {
        email: 'new@example.com',
        username: 'newusername',
      };

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.updateProfile(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('plugin::users-permissions.user');
      expect(mockCtx.body).toBeDefined();
    });

    it('should reject if email already exists', async () => {
      mockCtx.request.body = {
        email: 'existing@example.com',
      };

      mockStrapi.documents = jest.fn((type) => {
        if (type === 'plugin::users-permissions.user') {
          return {
            findFirst: jest.fn().mockResolvedValue({ documentId: 'other-user' }),
            update: jest.fn(),
          };
        }
        return { create: jest.fn() };
      });

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.updateProfile(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Email already in use');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.updateProfile(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockCtx.request.body = {
        currentPassword: 'oldpassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.changePassword(mockCtx);

      expect(mockStrapi.plugins['users-permissions'].services.user.validatePassword).toHaveBeenCalled();
      expect(mockStrapi.plugins['users-permissions'].services.user.hashPassword).toHaveBeenCalled();
      expect(mockCtx.body).toEqual({ message: 'Password changed successfully' });
    });

    it('should reject if passwords do not match', async () => {
      mockCtx.request.body = {
        currentPassword: 'oldpassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('New passwords do not match');
    });

    it('should reject if password is too short', async () => {
      mockCtx.request.body = {
        currentPassword: 'oldpassword',
        newPassword: 'short',
        confirmPassword: 'short',
      };

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Password must be at least 8 characters');
    });

    it('should reject if current password is incorrect', async () => {
      mockCtx.request.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      mockStrapi.plugins['users-permissions'].services.user.validatePassword = jest.fn().mockResolvedValue(false);

      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Current password is incorrect');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;
      const controller = require('../customer-profile').default;
      const instance = controller({ strapi: mockStrapi });

      await instance.changePassword(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });
});
