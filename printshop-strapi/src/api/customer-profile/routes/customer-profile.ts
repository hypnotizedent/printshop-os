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
      middlewares: [],
    },
  },
  {
    method: 'PATCH',
    path: '/customer/profile',
    handler: 'customer-profile.updateProfile',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/customer/profile/password',
    handler: 'customer-profile.changePassword',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
};
