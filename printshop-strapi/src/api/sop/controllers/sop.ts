/**
 * sop controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::sop.sop', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    // Add pagination and filters
    const entities = await strapi.entityService.findMany('api::sop.sop', {
      ...query,
      populate: ['relatedSOPs'],
    });

    return entities;
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.entityService.findOne('api::sop.sop', id, {
      populate: ['relatedSOPs'],
    });

    // Increment view count
    if (entity) {
      await strapi.entityService.update('api::sop.sop', id, {
        data: {
          viewCount: (entity.viewCount || 0) + 1,
          lastViewed: new Date(),
        },
      });
    }

    return entity;
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    const entity = await strapi.entityService.create('api::sop.sop', {
      data: {
        ...data,
        version: 1.0,
        viewCount: 0,
      },
    });

    return entity;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    const currentEntity = await strapi.entityService.findOne('api::sop.sop', id);
    
    const entity = await strapi.entityService.update('api::sop.sop', id, {
      data: {
        ...data,
        version: (currentEntity?.version || 1) + 0.1,
      },
    });

    return entity;
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.entityService.delete('api::sop.sop', id);

    return entity;
  },

  async search(ctx) {
    const { q, category, difficulty } = ctx.query;

    let filters: any = {};

    if (category) {
      filters.category = { $eq: category };
    }

    if (difficulty) {
      filters.difficulty = { $eq: difficulty };
    }

    if (q) {
      filters.$or = [
        { title: { $containsi: q } },
        { summary: { $containsi: q } },
        { content: { $containsi: q } },
      ];
    }

    const entities = await strapi.entityService.findMany('api::sop.sop', {
      filters,
      populate: ['relatedSOPs'],
    });

    return entities;
  },

  async toggleFavorite(ctx) {
    const { id } = ctx.params;
    const { userId } = ctx.request.body;

    const entity = await strapi.entityService.findOne('api::sop.sop', id);

    if (!entity) {
      return ctx.notFound('SOP not found');
    }

    let favorites = entity.favorites || [];
    
    if (favorites.includes(userId)) {
      favorites = favorites.filter((fav: string) => fav !== userId);
    } else {
      favorites.push(userId);
    }

    const updated = await strapi.entityService.update('api::sop.sop', id, {
      data: { favorites },
    });

    return updated;
  },

  async analytics(ctx) {
    const entities = await strapi.entityService.findMany('api::sop.sop', {
      sort: { viewCount: 'desc' },
      limit: 100,
    });

    const mostViewed = entities.slice(0, 10);
    const leastViewed = entities.slice(-10).reverse();

    return {
      mostViewed,
      leastViewed,
      totalSOPs: entities.length,
    };
  },
}));
