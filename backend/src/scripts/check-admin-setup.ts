/**
 * Script kiểm tra setup admin
 * Chạy: tsx src/scripts/check-admin-setup.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminSetup() {
  try {
    console.log('🔍 Đang kiểm tra setup admin...\n');

    // 1. Kiểm tra Prisma client có model admin không
    console.log('1. Kiểm tra Prisma client...');
    try {
      // Thử truy cập model admin
      const adminCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM admin` as any[];
      console.log('   ✅ Prisma client có model admin');
      console.log(`   ✅ Số lượng admin trong database: ${adminCount[0]?.count || 0}`);
    } catch (error: any) {
      if (error.message?.includes('admin') || error.code === 'P2021') {
        console.log('   ❌ Prisma client chưa có model admin');
        console.log('   💡 Giải pháp: Chạy "npx prisma generate"');
        return;
      }
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.log('   ❌ Bảng admin chưa tồn tại trong database');
        console.log('   💡 Giải pháp: Chạy SQL tạo bảng (xem file create_admin_table.sql)');
        return;
      }
      throw error;
    }

    // 2. Kiểm tra bảng admin có dữ liệu không
    console.log('\n2. Kiểm tra dữ liệu admin...');
    try {
      const admins = await prisma.$queryRaw`
        SELECT id, email, name, created_at 
        FROM admin 
        LIMIT 5
      ` as any[];
      
      if (admins.length === 0) {
        console.log('   ⚠️  Chưa có admin nào trong database');
        console.log('   💡 Giải pháp: Chạy "npm run setup:admin" để tạo admin mặc định');
      } else {
        console.log(`   ✅ Tìm thấy ${admins.length} admin:`);
        admins.forEach((admin, idx) => {
          console.log(`      ${idx + 1}. ${admin.email} (${admin.name})`);
        });
      }
    } catch (error: any) {
      console.log('   ❌ Lỗi khi kiểm tra dữ liệu:', error.message);
    }

    // 3. Kiểm tra cấu trúc bảng
    console.log('\n3. Kiểm tra cấu trúc bảng...');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'admin'
        ORDER BY ordinal_position
      ` as any[];
      
      if (columns.length === 0) {
        console.log('   ❌ Bảng admin không tồn tại');
      } else {
        console.log('   ✅ Cấu trúc bảng admin:');
        columns.forEach((col: any) => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
      }
    } catch (error: any) {
      console.log('   ❌ Lỗi khi kiểm tra cấu trúc:', error.message);
    }

    console.log('\n✅ Kiểm tra hoàn tất!');
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSetup();

