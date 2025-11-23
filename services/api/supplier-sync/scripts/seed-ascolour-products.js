require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { fetchProducts } = require('../services/ascolour');
const { normalizeAS } = require('../utils/normalize');
const { seedSupplier } = require('./seed-supplier');

const prisma = new PrismaClient();

async function seedASColourProducts() {
  const supplierId = await seedSupplier('AS Colour');
  const rawProducts = await fetchProducts();
  const normalizedProducts = rawProducts.map(normalizeAS);

  for (const product of normalizedProducts) {
    await prisma.product.upsert({
      where: {
        supplierId_styleId: {
          supplierId,
          styleId: product.styleId,
        },
      },
      update: {
        supplierId,
        styleId: product.styleId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        material: product.material,
        imageUrls: product.imageUrls,
        tags: product.tags,
        sizes: product.sizes,
        colors: product.colors,
        description: product.description || null,
      },
      create: {
        supplierId,
        styleId: product.styleId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        material: product.material,
        imageUrls: product.imageUrls,
        tags: product.tags,
        sizes: product.sizes,
        colors: product.colors,
        description: product.description || null,
      },
    });
  } // 🧠 ← this line was missing

  console.log(`✅ Seeded ${normalizedProducts.length} AS Colour products.`);
}

seedASColourProducts()
  .catch((err) => {
    console.error('❌ Error seeding AS Colour products:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });