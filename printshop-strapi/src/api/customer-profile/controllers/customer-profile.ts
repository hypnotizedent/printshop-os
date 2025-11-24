/**
 * customer-profile controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  /**
   * Get current user's profile
   * GET /api/customer/profile
   */
  async getProfile(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Get full user data
      const profile = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId,
      });

      // Remove sensitive data
      delete profile.password;
      delete profile.resetPasswordToken;
      delete profile.confirmationToken;

      ctx.body = profile;
    } catch (error) {
      strapi.log.error('Get profile failed:', error);
      ctx.internalServerError('Failed to get profile');
    }
  },

  /**
   * Update current user's profile
   * PATCH /api/customer/profile
   */
  async updateProfile(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { email, username, ...otherFields } = ctx.request.body;

      // Check if email is being changed and if it's unique
      if (email && email !== user.email) {
        const existingUser = await strapi.documents('plugin::users-permissions.user').findFirst({
          filters: { email },
        });

        if (existingUser && existingUser.documentId !== user.documentId) {
          return ctx.badRequest('Email already in use');
        }

        // TODO: Send verification email for email change
        // For now, we'll update directly
      }

      // Check if username is being changed and if it's unique
      if (username && username !== user.username) {
        const existingUser = await strapi.documents('plugin::users-permissions.user').findFirst({
          filters: { username },
        });

        if (existingUser && existingUser.documentId !== user.documentId) {
          return ctx.badRequest('Username already in use');
        }
      }

      // Update user profile
      const updatedProfile = await strapi.documents('plugin::users-permissions.user').update({
        documentId: user.documentId,
        data: {
          email,
          username,
          ...otherFields,
        },
      });

      // Remove sensitive data
      delete updatedProfile.password;
      delete updatedProfile.resetPasswordToken;
      delete updatedProfile.confirmationToken;

      // Log activity
      await strapi.service('api::customer-activity.customer-activity').logActivity({
        user: user.id,
        activityType: email !== user.email ? 'email_updated' : 'profile_updated',
        description: email !== user.email ? `Email updated to ${email}` : 'Profile updated',
        ipAddress: ctx.request.ip,
        userAgent: ctx.request.header('user-agent'),
      });

      ctx.body = updatedProfile;
    } catch (error) {
      strapi.log.error('Update profile failed:', error);
      ctx.internalServerError('Failed to update profile');
    }
  },

  /**
   * Change password
   * POST /api/customer/profile/password
   */
  async changePassword(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { currentPassword, newPassword, confirmPassword } = ctx.request.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return ctx.badRequest('All password fields are required');
      }

      if (newPassword !== confirmPassword) {
        return ctx.badRequest('New passwords do not match');
      }

      if (newPassword.length < 8) {
        return ctx.badRequest('Password must be at least 8 characters');
      }

      // Verify current password
      const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return ctx.badRequest('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await strapi.plugins['users-permissions'].services.user.hashPassword({
        password: newPassword,
      });

      // Update password
      await strapi.documents('plugin::users-permissions.user').update({
        documentId: user.documentId,
        data: {
          password: hashedPassword,
        },
      });

      // Log activity
      await strapi.service('api::customer-activity.customer-activity').logActivity({
        user: user.id,
        activityType: 'password_changed',
        description: 'Password changed',
        ipAddress: ctx.request.ip,
        userAgent: ctx.request.header('user-agent'),
      });

      // TODO: Send email notification

      ctx.body = { message: 'Password changed successfully' };
    } catch (error) {
      strapi.log.error('Change password failed:', error);
      ctx.internalServerError('Failed to change password');
    }
  },
}));
