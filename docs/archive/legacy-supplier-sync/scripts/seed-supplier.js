const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSupplier(name) {
  const supplier = await prisma.supplier.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  console.log(`🧾 Seeded supplier: ${supplier.name}`);
  return supplier.id;
}

module.exports = { seedSupplier };

// 👉 Add this block to call it when run directly
if (require.main === module) {
  seedSupplier('S&S')
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}