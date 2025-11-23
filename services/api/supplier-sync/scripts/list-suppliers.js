// scripts/list-suppliers.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listSuppliers() {
  const suppliers = await prisma.supplier.findMany();
  console.log('📦 Suppliers:', suppliers.map(s => s.name));
}

listSuppliers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());