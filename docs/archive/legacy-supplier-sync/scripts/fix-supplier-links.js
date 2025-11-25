const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSupplierLinks() {
  const ssSupplier = await prisma.supplier.findUnique({
    where: { name: 'S&S' }
  });

  if (!ssSupplier) {
    console.error('❌ S&S supplier not found');
    return;
  }

  const updated = await prisma.product.updateMany({
    where: {
      supplierId: null,
    },
    data: {
      supplierId: ssSupplier.id
    }
  });

  console.log(`🔗 Linked ${updated.count} unlinked products to S&S supplier`);
}

fixSupplierLinks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());