require('dotenv').config();
const fs = require('fs/promises');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function exportProducts() {
  try {
    const products = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });

    const grouped = {};

    for (const product of products) {
      const supplierName = product.supplier?.name || 'Unknown';

      const output = {
        id: product.id,
        styleId: product.styleId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        material: product.material,
        imageUrls: product.imageUrls,
        tags: product.tags,
        sizes: product.sizes,
        colors: product.colors,
        description: product.description,
        updatedAt: product.updatedAt,
      };

      if (!grouped[supplierName]) grouped[supplierName] = [];
      grouped[supplierName].push(output);
    }

    await fs.mkdir('public/catalog', { recursive: true });

    for (const [supplier, items] of Object.entries(grouped)) {
      const filename = `public/catalog/${supplier.toLowerCase().replace(/\s+/g, '-')}.json`;
      await fs.writeFile(filename, JSON.stringify(items, null, 2));
      console.log(`📦 Exported ${items.length} products to ${filename}`);
    }
  } catch (err) {
    console.error('❌ Export failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportProducts();