/**
 * customer-address controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::customer-address.customer-address', ({ strapi }) => ({
  /**
   * Set an address as default
   * PATCH /api/customer-addresses/:id/default
   */
  async setDefault(ctx) {
    try {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Find the address
      const address = await strapi.documents('api::customer-address.customer-address').findOne({
        documentId: id,
        filters: { user: user.id },
      });

      if (!address) {
        return ctx.notFound('Address not found');
      }

      // Unset all other addresses as default for this user using a more efficient approach
      // Note: In production, consider using a database transaction for atomicity
      const userAddresses = await strapi.documents('api::customer-address.customer-address').findMany({
        filters: { 
          user: user.id,
          isDefault: true,
        },
      });

      // Update only addresses that are currently default and not the target address
      const updatePromises = userAddresses
        .filter(addr => addr.documentId !== id)
        .map(addr => 
          strapi.documents('api::customer-address.customer-address').update({
            documentId: addr.documentId,
            data: { isDefault: false },
          })
        );

      await Promise.all(updatePromises);

      // Set the selected address as default
      const updatedAddress = await strapi.documents('api::customer-address.customer-address').update({
        documentId: id,
        data: { isDefault: true },
      });

      // Log activity
      await strapi.service('api::customer-activity.customer-activity').logActivity({
        user: user.id,
        activityType: 'address_updated',
        description: `Set "${address.label}" as default address`,
        ipAddress: ctx.request.ip,
        userAgent: ctx.request.header('user-agent'),
      });

      ctx.body = updatedAddress;
    } catch (error) {
      strapi.log.error('Set default address failed:', error);
      ctx.internalServerError('Failed to set default address');
    }
  },

  /**
   * Create a new address (override to ensure user is set)
   */
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Set user on the data
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: user.id,
    };

    // Call parent create
    const response = await super.create(ctx);

    // Log activity
    await strapi.service('api::customer-activity.customer-activity').logActivity({
      user: user.id,
      activityType: 'address_added',
      description: `Added new address "${ctx.request.body.data.label}"`,
      ipAddress: ctx.request.ip,
      userAgent: ctx.request.header('user-agent'),
    });

    return response;
  },

  /**
   * Update an address (override to ensure user ownership)
   */
  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Verify ownership
    const address = await strapi.documents('api::customer-address.customer-address').findOne({
      documentId: id,
      filters: { user: user.id },
    });

    if (!address) {
      return ctx.notFound('Address not found');
    }

    // Call parent update
    const response = await super.update(ctx);

    // Log activity
    await strapi.service('api::customer-activity.customer-activity').logActivity({
      user: user.id,
      activityType: 'address_updated',
      description: `Updated address "${address.label}"`,
      ipAddress: ctx.request.ip,
      userAgent: ctx.request.header('user-agent'),
    });

    return response;
  },

  /**
   * Delete an address (override to ensure user ownership)
   */
  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Verify ownership
    const address = await strapi.documents('api::customer-address.customer-address').findOne({
      documentId: id,
      filters: { user: user.id },
    });

    if (!address) {
      return ctx.notFound('Address not found');
    }

    const label = address.label;

    // Call parent delete
    const response = await super.delete(ctx);

    // Log activity
    await strapi.service('api::customer-activity.customer-activity').logActivity({
      user: user.id,
      activityType: 'address_deleted',
      description: `Deleted address "${label}"`,
      ipAddress: ctx.request.ip,
      userAgent: ctx.request.header('user-agent'),
    });

    return response;
  },

  /**
   * Find addresses (override to filter by current user)
   */
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Add user filter
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        user: user.id,
      },
    };

    return super.find(ctx);
  },
}));
