/**
 * Custom Auth Routes for PrintShop OS
 */

export default {
  routes: [
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
  ],
};
