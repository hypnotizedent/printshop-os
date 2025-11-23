const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugNullSuppliers() {
  const brands = await prisma.product.findMany({
    where: { supplierId: null },
    select: { brand: true },
    distinct: ['brand'],
  });

  console.log('📋 Brands with null supplierId:', brands.map(b => b.brand));
}

debugNullSuppliers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());