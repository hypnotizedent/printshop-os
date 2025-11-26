import type { Core } from '@strapi/strapi';
import { Server } from 'socket.io';
import { setWebSocketInstance } from './services/notification';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
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

      for (const perm of [...colorPermissions, ...sopPermissions]) {
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
