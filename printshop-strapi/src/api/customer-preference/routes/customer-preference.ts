/**
 * customer-preference router
 */

import { factories } from '@strapi/strapi';

const customRoutes = [
  {
    method: 'GET',
    path: '/customer-preferences/me',
    handler: 'customer-preference.getMyPreferences',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'PATCH',
    path: '/customer-preferences/me',
    handler: 'customer-preference.updateMyPreferences',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
};
