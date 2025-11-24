/**
 * Custom routes for support tickets
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/customer/tickets',
      handler: 'support-ticket.findCustomerTickets',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/customer/tickets',
      handler: 'support-ticket.createTicket',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/customer/tickets/:id',
      handler: 'support-ticket.findOneCustomer',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/customer/tickets/:id/comments',
      handler: 'support-ticket.addComment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PATCH',
      path: '/customer/tickets/:id/status',
      handler: 'support-ticket.updateStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/customer/tickets/:id/files',
      handler: 'support-ticket.uploadFile',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/customer/tickets/:id/files/:fileId',
      handler: 'support-ticket.downloadFile',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
