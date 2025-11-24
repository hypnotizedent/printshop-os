const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

app.use(cors());
app.use(express.json());

// Import inventory sync components
let inventoryRouter = null;
let syncScheduler = null;

// Dynamically load TypeScript modules for inventory sync
(async () => {
  try {
    const { InventorySyncService } = require('./inventory/inventory-sync.service');
    const { InventoryController } = require('./inventory/inventory.controller');
    const { WebhookHandler } = require('./inventory/webhook-handler');
    const { createInventoryRoutes } = require('./routes/inventory-sync');
    const { SyncScheduler } = require('./inventory/sync-scheduler');

    // Initialize services
    const inventorySyncService = new InventorySyncService(prisma, redis);
    const inventoryController = new InventoryController(inventorySyncService);
    const webhookHandler = new WebhookHandler(inventorySyncService);

    // Create routes
    inventoryRouter = createInventoryRoutes(inventoryController, webhookHandler);
    app.use('/api/supplier/inventory', inventoryRouter);

    // Start scheduler
    syncScheduler = new SyncScheduler(inventorySyncService);
    if (process.env.ENABLE_SCHEDULER !== 'false') {
      syncScheduler.start();
    }

    console.log('✅ Inventory sync initialized');
  } catch (error) {
    console.error('⚠️ Could not load inventory sync (TypeScript files may not be compiled):', error.message);
  }
})();

// Existing products route
app.get('/products', async (req, res) => {
  const { brand, category, supplier, search, limit = 100 } = req.query;

  const filters = {
    brand: brand || undefined,
    category: category || undefined,
    supplier: supplier || undefined,
    OR: search
      ? [
          { name: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ]
      : undefined
  };

  try {
    const products = await prisma.product.findMany({
      where: filters,
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    redis: redis.status === 'ready' ? 'connected' : 'disconnected',
    scheduler: syncScheduler?.isRunning() ? 'running' : 'stopped',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/products`);
  console.log(`📊 Inventory Status: http://localhost:${PORT}/api/supplier/inventory/status`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (syncScheduler) {
    syncScheduler.stop();
  }
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});