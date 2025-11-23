import type { Core } from '@strapi/strapi';
import { Server } from 'socket.io';
import { initializeQueueProcessor, shutdownQueueProcessor } from './services/queue-processor';
import { setWebSocketInstance } from './services/notification';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
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

      // Join production team room
      socket.on('join:production-team', () => {
        socket.join('production-team');
        strapi.log.info(`Socket ${socket.id} joined production-team room`);
      });

      // Join customer room
      socket.on('join:customer', (customerId: string) => {
        socket.join(`customer:${customerId}`);
        strapi.log.info(`Socket ${socket.id} joined customer:${customerId} room`);
      });

      socket.on('disconnect', () => {
        strapi.log.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Set WebSocket instance for notification service
    setWebSocketInstance(io);

    // Store io instance on strapi for global access
    (strapi as any).io = io;

    // Initialize Bull queue processor
    initializeQueueProcessor(strapi);

    strapi.log.info('✅ Workflow automation system initialized');
    strapi.log.info('✅ WebSocket server started');
    strapi.log.info('✅ Queue processor started');

    // Graceful shutdown handlers
    const shutdownHandler = async (signal: string) => {
      strapi.log.info(`${signal} received, shutting down gracefully...`);
      await shutdownQueueProcessor(strapi);
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  },
};
