#!/usr/bin/env node
/**
 * Seed Authentication Accounts
 * Creates default owner, employee, and customer accounts for development/testing
 * 
 * Usage:
 *   npm run dev -- --run-script scripts/seed-auth.ts
 *   OR
 *   ts-node scripts/seed-auth.ts (requires Strapi to be running)
 */

import bcrypt from 'bcryptjs';

// Configuration
const DEFAULT_ACCOUNTS = {
  owner: {
    email: 'admin@mintprints.com',
    password: 'AdminPass123!',
    name: 'Admin User',
  },
  employee: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'employee@mintprints.com',
    pin: '1234',
    role: 'admin',
    department: 'screen_printing',
  },
  customer: {
    email: 'customer@test.com',
    password: 'CustomerPass123!',
    name: 'Test Customer',
    company: 'Test Company',
    phone: '555-0100',
  },
};

const BCRYPT_SALT_ROUNDS = 12;

async function seedAccounts() {
  console.log('🌱 Seeding authentication accounts...\n');

  try {
    // @ts-ignore - Strapi global is available when running via Strapi
    const strapi = global.strapi;

    if (!strapi) {
      console.error('❌ Error: Strapi instance not found.');
      console.error('This script must be run within Strapi context.');
      console.error('\nTry: npm run dev -- --run-script scripts/seed-auth.ts');
      process.exit(1);
    }

    // 1. Create Owner Account
    console.log('👤 Creating owner account...');
    const existingOwners = await strapi.documents('api::owner.owner').findMany({
      filters: { email: DEFAULT_ACCOUNTS.owner.email },
      limit: 1,
    });

    if (existingOwners.length > 0) {
      console.log(`   ⚠️  Owner account already exists: ${DEFAULT_ACCOUNTS.owner.email}`);
    } else {
      const hashedOwnerPassword = await bcrypt.hash(
        DEFAULT_ACCOUNTS.owner.password,
        BCRYPT_SALT_ROUNDS
      );

      await strapi.documents('api::owner.owner').create({
        data: {
          email: DEFAULT_ACCOUNTS.owner.email,
          name: DEFAULT_ACCOUNTS.owner.name,
          passwordHash: hashedOwnerPassword,
          twoFactorEnabled: false,
          isActive: true,
        },
      });

      console.log(`   ✅ Owner created: ${DEFAULT_ACCOUNTS.owner.email}`);
      console.log(`      Password: ${DEFAULT_ACCOUNTS.owner.password}`);
    }

    // 2. Create Employee Account
    console.log('\n👷 Creating employee account...');
    const existingEmployees = await strapi.documents('api::employee.employee').findMany({
      filters: { email: DEFAULT_ACCOUNTS.employee.email },
      limit: 1,
    });

    if (existingEmployees.length > 0) {
      console.log(`   ⚠️  Employee account already exists: ${DEFAULT_ACCOUNTS.employee.email}`);
    } else {
      const hashedPin = await bcrypt.hash(DEFAULT_ACCOUNTS.employee.pin, BCRYPT_SALT_ROUNDS);

      await strapi.documents('api::employee.employee').create({
        data: {
          firstName: DEFAULT_ACCOUNTS.employee.firstName,
          lastName: DEFAULT_ACCOUNTS.employee.lastName,
          email: DEFAULT_ACCOUNTS.employee.email,
          pin: hashedPin,
          role: DEFAULT_ACCOUNTS.employee.role,
          department: DEFAULT_ACCOUNTS.employee.department,
          isActive: true,
          hourlyRate: 20.0,
        },
      });

      console.log(`   ✅ Employee created: ${DEFAULT_ACCOUNTS.employee.email}`);
      console.log(`      PIN: ${DEFAULT_ACCOUNTS.employee.pin}`);
    }

    // 3. Create Customer Account
    console.log('\n👥 Creating customer account...');
    const existingCustomers = await strapi.documents('api::customer.customer').findMany({
      filters: { email: DEFAULT_ACCOUNTS.customer.email },
      limit: 1,
    });

    if (existingCustomers.length > 0) {
      console.log(`   ⚠️  Customer account already exists: ${DEFAULT_ACCOUNTS.customer.email}`);
    } else {
      const hashedCustomerPassword = await bcrypt.hash(
        DEFAULT_ACCOUNTS.customer.password,
        BCRYPT_SALT_ROUNDS
      );

      await strapi.documents('api::customer.customer').create({
        data: {
          email: DEFAULT_ACCOUNTS.customer.email,
          name: DEFAULT_ACCOUNTS.customer.name,
          company: DEFAULT_ACCOUNTS.customer.company,
          phone: DEFAULT_ACCOUNTS.customer.phone,
          passwordHash: hashedCustomerPassword,
          segment: 'b2c',
        },
      });

      console.log(`   ✅ Customer created: ${DEFAULT_ACCOUNTS.customer.email}`);
      console.log(`      Password: ${DEFAULT_ACCOUNTS.customer.password}`);
    }

    // Summary
    console.log('\n✨ Seed complete!\n');
    console.log('📋 Test Accounts Summary:');
    console.log('─────────────────────────────────────────────────');
    console.log('Owner (Admin Dashboard):');
    console.log(`  Email:    ${DEFAULT_ACCOUNTS.owner.email}`);
    console.log(`  Password: ${DEFAULT_ACCOUNTS.owner.password}`);
    console.log(`  URL:      /login/admin`);
    console.log('');
    console.log('Employee (Production Dashboard):');
    console.log(`  PIN:      ${DEFAULT_ACCOUNTS.employee.pin}`);
    console.log(`  URL:      /login/employee`);
    console.log('');
    console.log('Customer (Customer Portal):');
    console.log(`  Email:    ${DEFAULT_ACCOUNTS.customer.email}`);
    console.log(`  Password: ${DEFAULT_ACCOUNTS.customer.password}`);
    console.log(`  URL:      /login/customer`);
    console.log('─────────────────────────────────────────────────\n');
  } catch (error) {
    console.error('\n❌ Error seeding accounts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAccounts()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
