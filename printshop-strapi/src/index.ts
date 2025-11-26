import type { Core } from '@strapi/strapi';
import { Server } from 'socket.io';
import { setWebSocketInstance } from './services/notification';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Enable public permissions for all content types
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });

    if (publicRole) {
      const allPermissions = [
        // Customer permissions
        'api::customer.customer.find',
        'api::customer.customer.findOne',
        'api::customer.customer.create',
        'api::customer.customer.update',
        'api::customer.customer.delete',
        // Order permissions
        'api::order.order.find',
        'api::order.order.findOne',
        'api::order.order.create',
        'api::order.order.update',
        'api::order.order.delete',
        // Job permissions
        'api::job.job.find',
        'api::job.job.findOne',
        'api::job.job.create',
        'api::job.job.update',
        'api::job.job.delete',
        // Color permissions
        'api::color.color.find',
        'api::color.color.findOne',
        'api::color.color.create',
        'api::color.color.update',
        'api::color.color.delete',
        // SOP permissions
        'api::sop.sop.find',
        'api::sop.sop.findOne',
        'api::sop.sop.create',
        'api::sop.sop.update',
        'api::sop.sop.delete',
        // Price Calculation permissions
        'api::price-calculation.price-calculation.find',
        'api::price-calculation.price-calculation.findOne',
        'api::price-calculation.price-calculation.create',
        'api::price-calculation.price-calculation.update',
        'api::price-calculation.price-calculation.delete',
        // Pricing Rule permissions
        'api::pricing-rule.pricing-rule.find',
        'api::pricing-rule.pricing-rule.findOne',
        'api::pricing-rule.pricing-rule.create',
        'api::pricing-rule.pricing-rule.update',
        'api::pricing-rule.pricing-rule.delete',
        // Product permissions
        'api::product.product.find',
        'api::product.product.findOne',
        'api::product.product.create',
        'api::product.product.update',
        'api::product.product.delete',
      ];

      for (const action of allPermissions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
          where: { action, role: publicRole.id }
        });

        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action, role: publicRole.id }
          });
          strapi.log.info(`✅ Enabled public permission: ${action}`);
        }
      }
    }

    // Set up API Token permissions for color and sop content types
    const fullAccessTokens = await strapi.db.query('admin::api-token').findMany({
      where: { type: 'full-access' }
    });

    for (const token of fullAccessTokens) {
      // Enable all permissions for color content type
      const colorPermissions = [
        { action: 'api::color.color.find' },
        { action: 'api::color.color.findOne' },
        { action: 'api::color.color.create' },
        { action: 'api::color.color.update' },
        { action: 'api::color.color.delete' }
      ];

      // Enable all permissions for sop content type
      const sopPermissions = [
        { action: 'api::sop.sop.find' },
        { action: 'api::sop.sop.findOne' },
        { action: 'api::sop.sop.create' },
        { action: 'api::sop.sop.update' },
        { action: 'api::sop.sop.delete' }
      ];

      // Enable all permissions for customer content type
      const customerPermissions = [
        { action: 'api::customer.customer.find' },
        { action: 'api::customer.customer.findOne' },
        { action: 'api::customer.customer.create' },
        { action: 'api::customer.customer.update' },
        { action: 'api::customer.customer.delete' }
      ];

      // Enable all permissions for order content type
      const orderPermissions = [
        { action: 'api::order.order.find' },
        { action: 'api::order.order.findOne' },
        { action: 'api::order.order.create' },
        { action: 'api::order.order.update' },
        { action: 'api::order.order.delete' }
      ];

      // Enable all permissions for job content type
      const jobPermissions = [
        { action: 'api::job.job.find' },
        { action: 'api::job.job.findOne' },
        { action: 'api::job.job.create' },
        { action: 'api::job.job.update' },
        { action: 'api::job.job.delete' }
      ];

      // Enable all permissions for product content type
      const productPermissions = [
        { action: 'api::product.product.find' },
        { action: 'api::product.product.findOne' },
        { action: 'api::product.product.create' },
        { action: 'api::product.product.update' },
        { action: 'api::product.product.delete' }
      ];

      for (const perm of [...colorPermissions, ...sopPermissions, ...customerPermissions, ...orderPermissions, ...jobPermissions, ...productPermissions]) {
        const existing = await strapi.db.query('admin::api-token-permission').findOne({
          where: { action: perm.action, token: token.id }
        });

        if (!existing) {
          await strapi.db.query('admin::api-token-permission').create({
            data: { ...perm, token: token.id }
          });
          strapi.log.info(`✅ Enabled ${perm.action} for token ${token.name}`);
        }
      }
    }

    // Initialize WebSocket server
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    // Set up WebSocket event handlers
    io.on('connection', (socket) => {
      strapi.log.info(`WebSocket client connected: ${socket.id}`);

      socket.on('join:production-team', () => {
        socket.join('production-team');
        strapi.log.info(`Socket ${socket.id} joined production-team room`);
      });

      socket.on('join:customer', (customerId: string) => {
        socket.join(`customer:${customerId}`);
        strapi.log.info(`Socket ${socket.id} joined customer:${customerId} room`);
      });

      socket.on('disconnect', () => {
        strapi.log.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    setWebSocketInstance(io);
    (strapi as any).io = io;

    strapi.log.info('✅ WebSocket server started');
    strapi.log.info('✅ API Token permissions configured');

    const shutdownHandler = async (signal: string) => {
      strapi.log.info(`${signal} received, shutting down gracefully...`);
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  },
};
