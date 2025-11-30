/**
 * customer-preference router
 */

import { factories } from '@strapi/strapi';

// @ts-expect-error - content type registered at runtime
export default factories.createCoreRouter('api::customer-preference.customer-preference');
