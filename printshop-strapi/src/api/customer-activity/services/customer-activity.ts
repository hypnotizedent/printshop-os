/**
 * customer-activity service
 */

import { factories } from '@strapi/strapi';

interface LogActivityParams {
  user: any;
  activityType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export default factories.createCoreService('api::customer-activity.customer-activity', ({ strapi }) => ({
  /**
   * Log an activity for a user
   */
  async logActivity(params: LogActivityParams) {
    try {
      const { user, activityType, description, ipAddress, userAgent, metadata } = params;

      await strapi.documents('api::customer-activity.customer-activity').create({
        data: {
          user,
          activityType,
          description,
          ipAddress,
          userAgent,
          metadata,
        },
      });
    } catch (error) {
      strapi.log.error('Failed to log activity:', error);
      // Don't throw - logging should not break the main operation
    }
  },
}));
