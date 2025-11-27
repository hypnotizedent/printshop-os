/**
 * Custom quote routes for public approval workflow
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/quotes/approve/:token',
      handler: 'quote.getByToken',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/quotes/approve/:token',
      handler: 'quote.approve',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/quotes/reject/:token',
      handler: 'quote.reject',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
