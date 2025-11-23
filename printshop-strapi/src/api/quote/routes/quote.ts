/**
 * quote router
 */

import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::quote.quote');

const customRoutes = [
  {
    method: 'POST',
    path: '/quotes/:id/approve',
    handler: 'quote.approve',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/quotes/:id/workflow-status',
    handler: 'quote.workflowStatus',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes,
  ],
};
