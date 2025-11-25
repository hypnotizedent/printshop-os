/**
 * support-ticket router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::support-ticket.support-ticket', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
    create: {
      middlewares: [],
    },
    update: {
      middlewares: [],
    },
    delete: {
      middlewares: [],
    },
  },
});
