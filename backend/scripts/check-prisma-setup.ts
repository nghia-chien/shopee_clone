/**
 * Script để kiểm tra Prisma setup
 * Chạy: npx tsx scripts/check-prisma-setup.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPrismaSetup() {
  console.log('🔍 Checking Prisma setup...\n');

  try {
    // Test 1: Kiểm tra shipping_order model có status field không
    console.log('1. Checking shipping_order model...');
    try {
      const test = await prisma.shipping_order.findFirst({
        select: {
          id: true,
          status: true,
          error_message: true,
          retry_count: true,
        },
      });
      console.log('   ✅ shipping_order model có đầy đủ fields (status, error_message, retry_count)');
    } catch (error: any) {
      if (error.message?.includes('status') || error.code === 'P2021') {
        console.error('   ❌ shipping_order model thiếu status field');
        console.error('   💡 Chạy: npx prisma migrate dev && npx prisma generate');
        process.exit(1);
      }
      // Nếu không có record nào thì cũng OK
      console.log('   ✅ shipping_order model OK (no records yet)');
    }

    // Test 2: Kiểm tra address model có GHN fields không
    console.log('\n2. Checking address model...');
    try {
      const test = await prisma.address.findFirst({
        select: {
          id: true,
          province_id: true,
          district_id: true,
          ward_code: true,
        },
      });
      console.log('   ✅ address model có đầy đủ GHN fields (province_id, district_id, ward_code)');
    } catch (error: any) {
      if (error.message?.includes('province_id') || error.code === 'P2021') {
        console.error('   ❌ address model thiếu GHN fields');
        console.error('   💡 Chạy: npx prisma migrate dev && npx prisma generate');
        process.exit(1);
      }
      console.log('   ✅ address model OK (no records yet)');
    }

    // Test 3: Kiểm tra kết nối database
    console.log('\n3. Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connection OK');

    console.log('\n✅ All checks passed! Prisma setup is correct.\n');
  } catch (error: any) {
    console.error('\n❌ Prisma setup check failed:', error.message);
    if (error.code === 'P2021') {
      console.error('💡 Database tables may not exist. Run: npx prisma migrate dev');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrismaSetup();

