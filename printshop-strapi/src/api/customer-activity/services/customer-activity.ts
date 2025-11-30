/**
 * customer-activity service
 */

import { factories } from '@strapi/strapi';

// @ts-expect-error - content type registered at runtime
export default factories.createCoreService('api::customer-activity.customer-activity');
