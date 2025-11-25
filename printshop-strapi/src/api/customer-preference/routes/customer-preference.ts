/**
 * customer-preference router
 */

const customRoutes = [
  {
    method: 'GET',
    path: '/customer-preferences/me',
    handler: 'customer-preference.getMyPreferences',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
  {
    method: 'PATCH',
    path: '/customer-preferences/me',
    handler: 'customer-preference.updateMyPreferences',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
];

export default {
  routes: customRoutes,
};
