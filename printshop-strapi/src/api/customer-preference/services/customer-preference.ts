/**
 * customer-preference service
 */

import { factories } from '@strapi/strapi';

// @ts-expect-error - content type registered at runtime
export default factories.createCoreService('api::customer-preference.customer-preference');
