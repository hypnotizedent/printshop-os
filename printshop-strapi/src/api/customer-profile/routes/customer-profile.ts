/**
 * customer-profile router
 */

const customRoutes = [
  {
    method: 'GET',
    path: '/customer/profile',
    handler: 'customer-profile.getProfile',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
  {
    method: 'PATCH',
    path: '/customer/profile',
    handler: 'customer-profile.updateProfile',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
  {
    method: 'POST',
    path: '/customer/profile/password',
    handler: 'customer-profile.changePassword',
    config: {
      policies: [],
      middlewares: ['plugin::users-permissions.rateLimit'],
    },
  },
];

export default {
  routes: customRoutes,
};
