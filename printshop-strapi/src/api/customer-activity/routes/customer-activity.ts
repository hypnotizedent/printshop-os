/**
 * customer-activity router
 */

import { factories } from '@strapi/strapi';

const customRoutes = [
  {
    method: 'GET',
    path: '/customer-activities/me',
    handler: 'customer-activity.getMyActivity',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
};
