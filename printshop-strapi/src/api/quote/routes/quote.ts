/**
 * quote router
 */

import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::quote.quote');

const customRouter = (innerRouter, extraRoutes = []) => {
  let routes;

  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      if (!routes) routes = innerRouter.routes.concat(extraRoutes);
      return routes;
    },
  };
};

const myExtraRoutes = [
  {
    method: 'POST',
    path: '/quotes/:id/send',
    handler: 'quote.send',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/quotes/verify/:token',
    handler: 'quote.verify',
    config: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/quotes/approve/:token',
    handler: 'quote.approve',
    config: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/quotes/reject/:token',
    handler: 'quote.reject',
    config: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/quotes/webhook',
    handler: 'quote.webhook',
    config: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
];

export default customRouter(defaultRouter, myExtraRoutes);
