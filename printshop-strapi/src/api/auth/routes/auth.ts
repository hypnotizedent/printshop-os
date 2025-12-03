/**
 * Custom Auth Routes for PrintShop OS
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/owner/login',
      handler: 'auth.ownerLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/customer/login',
      handler: 'auth.customerLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/customer/signup',
      handler: 'auth.customerSignup',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/customer/change-password',
      handler: 'auth.changePassword',
      config: {
        // Auth is handled manually in the controller via JWT Bearer token validation
        // This allows for custom error messages and matches other auth endpoints pattern
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/employee/validate-pin',
      handler: 'auth.validateEmployeePIN',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/verify',
      handler: 'auth.verifyToken',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/logout',
      handler: 'auth.logout',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/customer/orders',
      handler: 'auth.getCustomerOrders',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/customer/orders/:orderNumber',
      handler: 'auth.getCustomerOrder',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/customer/quotes',
      handler: 'auth.getCustomerQuotes',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
