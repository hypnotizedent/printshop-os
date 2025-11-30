/**
 * Shipping API Routes
 * Custom routes for EasyPost integration
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/shipping/rates',
      handler: 'shipping.getRates',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/shipping/buy',
      handler: 'shipping.buyLabel',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/shipping/track/:trackingCode',
      handler: 'shipping.track',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/shipping/validate-address',
      handler: 'shipping.validateAddress',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
