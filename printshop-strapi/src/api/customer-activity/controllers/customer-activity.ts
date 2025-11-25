/**
 * customer-activity controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::customer-activity.customer-activity', ({ strapi }) => ({
  /**
   * Get current user's activity log
   * GET /api/customer-activities/me
   */
  async getMyActivity(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { page = 1, pageSize = 20 } = ctx.query;

      // Get activity log for user
      const activities = await strapi.documents('api::customer-activity.customer-activity').findMany({
        filters: { user: user.id },
        sort: { createdAt: 'desc' },
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      });

      ctx.body = activities;
    } catch (error) {
      strapi.log.error('Get activity log failed:', error);
      ctx.internalServerError('Failed to get activity log');
    }
  },
}));
