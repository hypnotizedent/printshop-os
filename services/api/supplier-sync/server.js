const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Legacy products endpoint
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

// Mount variant routes (TypeScript compiled)
try {
  const variantRoutes = require('./dist/routes/variants');
  app.use('/api/supplier', variantRoutes.default || variantRoutes);
  console.log('✅ Variant routes loaded');
} catch (err) {
  console.warn('⚠️  Variant routes not available (run npm run build):', err.message);
}

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/products`);
  console.log(`🔀 Variants: http://localhost:${PORT}/api/supplier/variants`);
});