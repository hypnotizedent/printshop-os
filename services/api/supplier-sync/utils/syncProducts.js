const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncProducts(products) {
  console.log(`🔁 Syncing ${products.length} products to DB...`);

  for (const product of products) {
    try {
      console.log(`⏩ Syncing: ${product.name} (${product.style_id}) from ${product.supplier}`);

      await prisma.product.upsert({
        where: { styleId: `${product.style_id}_${product.supplier}` },
        update: {
          name: product.name,
          brand: product.brand,
          category: product.category,
          material: product.material || '',
          imageUrls: product.image_urls || [],
          tags: product.tags || []
        },
        create: {
          supplier: product.supplier,
          styleId: `${product.style_id}_${product.supplier}`,
          name: product.name,
          brand: product.brand,
          category: product.category,
          material: product.material || '',
          imageUrls: product.image_urls || [],
          tags: product.tags || []
        }
      });
    } catch (err) {
      console.error(`❌ Failed to sync ${product.name}:`, err.message);
    }
  }

  console.log(`✅ Finished syncing all products`);
}

module.exports = { syncProducts };