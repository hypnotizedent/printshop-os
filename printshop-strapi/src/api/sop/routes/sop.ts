export default {
  routes: [
    {
      method: 'GET',
      path: '/sops',
      handler: 'sop.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/sops/:id',
      handler: 'sop.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/sops',
      handler: 'sop.create',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/sops/:id',
      handler: 'sop.update',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/sops/:id',
      handler: 'sop.delete',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/sops/search',
      handler: 'sop.search',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/sops/:id/favorite',
      handler: 'sop.toggleFavorite',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/sops/analytics',
      handler: 'sop.analytics',
      config: {
        policies: [],
      },
    },
  ],
};
