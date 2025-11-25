/**
 * Prisma seed script
 * Populates database with test suppliers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create suppliers
  const suppliers = [
    {
      name: 'S&S Activewear',
      code: 'ss-activewear',
      apiUrl: 'https://api.ssactivewear.com/v2',
      isActive: true,
    },
    {
      name: 'SanMar',
      code: 'sanmar',
      apiUrl: 'https://api.sanmar.com',
      isActive: true,
    },
    {
      name: 'AS Colour',
      code: 'as-colour',
      apiUrl: 'https://api.ascolour.com',
      isActive: true,
    },
  ];

  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findUnique({
      where: { code: supplier.code },
    });

    if (!existing) {
      await prisma.supplier.create({
        data: supplier,
      });
      console.log(`✅ Created supplier: ${supplier.name}`);
    } else {
      console.log(`⏭️  Supplier already exists: ${supplier.name}`);
    }
  }

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
