/**
 * Script kiểm tra và verify bảng admin
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminTable() {
  try {
    console.log('🔍 Đang kiểm tra bảng admin...\n');

    // 1. Kiểm tra bảng có tồn tại không bằng raw query
    console.log('1. Kiểm tra bảng admin có tồn tại...');
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin'
      ` as any[];
      
      if (result.length > 0) {
        console.log('   ✅ Bảng admin đã tồn tại trong database');
      } else {
        console.log('   ❌ Bảng admin KHÔNG tồn tại trong database');
        console.log('   💡 Chạy: npm run create:admin-table');
        return;
      }
    } catch (error: any) {
      console.log('   ❌ Lỗi khi kiểm tra:', error.message);
      return;
    }

    // 2. Kiểm tra cấu trúc bảng
    console.log('\n2. Kiểm tra cấu trúc bảng...');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'admin'
        ORDER BY ordinal_position
      ` as any[];
      
      if (columns.length > 0) {
        console.log('   ✅ Cấu trúc bảng:');
        columns.forEach((col: any) => {
          console.log(`      - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    } catch (error: any) {
      console.log('   ⚠️  Không thể kiểm tra cấu trúc:', error.message);
    }

    // 3. Kiểm tra dữ liệu
    console.log('\n3. Kiểm tra dữ liệu...');
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM admin` as any[];
      const adminCount = count[0]?.count || 0;
      console.log(`   Số lượng admin: ${adminCount}`);
      
      if (adminCount === 0) {
        console.log('   ⚠️  Chưa có admin nào');
        console.log('   💡 Chạy: npm run setup:admin');
      } else {
        const admins = await prisma.$queryRaw`
          SELECT id, email, name, created_at 
          FROM admin 
          LIMIT 5
        ` as any[];
        console.log('   ✅ Danh sách admin:');
        admins.forEach((admin: any, idx: number) => {
          console.log(`      ${idx + 1}. ${admin.email} (${admin.name})`);
        });
      }
    } catch (error: any) {
      console.log('   ❌ Lỗi khi kiểm tra dữ liệu:', error.message);
    }

    // 4. Test Prisma client
    console.log('\n4. Test Prisma client...');
    try {
      if ('admin' in prisma) {
        console.log('   ✅ Prisma client có model admin');
        const testQuery = await prisma.admin.findMany({ take: 1 });
        console.log('   ✅ Có thể query qua Prisma client');
      } else {
        console.log('   ❌ Prisma client KHÔNG có model admin');
        console.log('   💡 Chạy: npx prisma generate');
      }
    } catch (error: any) {
      console.log('   ❌ Lỗi khi test Prisma client:', error.message);
      if (error.message?.includes('does not exist')) {
        console.log('   💡 Bảng có thể chưa được tạo đúng cách');
      }
    }

    console.log('\n✅ Kiểm tra hoàn tất!');
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminTable();

