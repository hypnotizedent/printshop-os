const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}/products`);
});