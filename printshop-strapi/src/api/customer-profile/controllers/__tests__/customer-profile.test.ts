/**
 * Customer Profile Controller Tests
 */

describe('Customer Profile Controller', () => {
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
      password: 'hashed_password',
    };

    mockStrapi = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
      documents: jest.fn(),
      plugins: {
        'users-permissions': {
          services: {
            user: {
              validatePassword: jest.fn().mockResolvedValue(true),
              hashPassword: jest.fn().mockResolvedValue({ password: 'new_hashed_password' }),
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

    // Dynamically import controller factory and create controller
    const controllerFactory = require('../customer-profile').default;
    controller = controllerFactory({ strapi: mockStrapi });
  });

  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      const profileData = { ...mockUser, password: 'hashed' };
      
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(profileData),
      });

      await controller.getProfile(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('plugin::users-permissions.user');
      expect(mockCtx.body).toBeDefined();
      expect(mockCtx.body.password).toBeUndefined();
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.getProfile(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockCtx.request.body = {
        email: 'new@example.com',
        username: 'newusername',
      };

      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ ...mockUser, email: 'new@example.com' }),
      });

      await controller.updateProfile(mockCtx);

      expect(mockStrapi.documents).toHaveBeenCalledWith('plugin::users-permissions.user');
      expect(mockCtx.body).toBeDefined();
    });

    it('should reject if email already exists', async () => {
      mockCtx.request.body = {
        email: 'existing@example.com',
      };

      mockStrapi.documents.mockReturnValue({
        findFirst: jest.fn().mockResolvedValue({ documentId: 'other-user' }),
        update: jest.fn(),
      });

      await controller.updateProfile(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Email already in use');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.updateProfile(mockCtx);

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

      mockStrapi.documents.mockReturnValue({
        update: jest.fn().mockResolvedValue({}),
      });

      await controller.changePassword(mockCtx);

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

      await controller.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('New passwords do not match');
    });

    it('should reject if password is too short', async () => {
      mockCtx.request.body = {
        currentPassword: 'oldpassword',
        newPassword: 'short',
        confirmPassword: 'short',
      };

      await controller.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Password must be at least 8 characters');
    });

    it('should reject if current password is incorrect', async () => {
      mockCtx.request.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      mockStrapi.plugins['users-permissions'].services.user.validatePassword = jest.fn().mockResolvedValue(false);

      await controller.changePassword(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('Current password is incorrect');
    });

    it('should return 401 if not logged in', async () => {
      mockCtx.state.user = null;

      await controller.changePassword(mockCtx);

      expect(mockCtx.unauthorized).toHaveBeenCalledWith('You must be logged in');
    });
  });
});
