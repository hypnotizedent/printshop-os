/**
 * customer-preference controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::customer-preference.customer-preference', ({ strapi }) => ({
  /**
   * Get current user's preferences
   * GET /api/customer-preferences/me
   */
  async getMyPreferences(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Find or create preferences for user
      let preferences = await strapi.documents('api::customer-preference.customer-preference').findFirst({
        filters: { user: user.id },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await strapi.documents('api::customer-preference.customer-preference').create({
          data: {
            user: user.id,
            orderConfirmation: true,
            artApproval: true,
            productionUpdates: true,
            shipmentNotifications: true,
            quoteReminders: true,
            marketingEmails: false,
            smsNotifications: false,
          },
        });
      }

      ctx.body = preferences;
    } catch (error) {
      strapi.log.error('Get preferences failed:', error);
      ctx.internalServerError('Failed to get preferences');
    }
  },

  /**
   * Update current user's preferences
   * PATCH /api/customer-preferences/me
   */
  async updateMyPreferences(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Find user's preferences
      let preferences = await strapi.documents('api::customer-preference.customer-preference').findFirst({
        filters: { user: user.id },
      });

      if (!preferences) {
        // Create if doesn't exist
        preferences = await strapi.documents('api::customer-preference.customer-preference').create({
          data: {
            user: user.id,
            ...ctx.request.body,
          },
        });
      } else {
        // Update existing
        preferences = await strapi.documents('api::customer-preference.customer-preference').update({
          documentId: preferences.documentId,
          data: ctx.request.body,
        });
      }

      // Log activity
      await strapi.service('api::customer-activity.customer-activity').logActivity({
        user: user.id,
        activityType: 'preferences_updated',
        description: 'Updated notification preferences',
        ipAddress: ctx.request.ip,
        userAgent: ctx.request.header('user-agent'),
      });

      ctx.body = preferences;
    } catch (error) {
      strapi.log.error('Update preferences failed:', error);
      ctx.internalServerError('Failed to update preferences');
    }
  },
}));
