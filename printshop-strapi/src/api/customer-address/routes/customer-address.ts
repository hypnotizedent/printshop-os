/**
 * customer-address router
 */

import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::customer-address.customer-address');

const customRoutes = [
  {
    method: 'PATCH',
    path: '/customer-addresses/:id/default',
    handler: 'customer-address.setDefault',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
];

export default {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes,
  ],
};
