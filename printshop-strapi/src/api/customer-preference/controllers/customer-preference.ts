/**
 * customer-preference controller
 */

import { factories } from '@strapi/strapi';

// @ts-expect-error - content type registered at runtime
export default factories.createCoreController('api::customer-preference.customer-preference');
