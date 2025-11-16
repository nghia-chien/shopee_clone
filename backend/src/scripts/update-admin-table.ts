/**
 * Script cập nhật bảng admin theo schema mới
 * Chạy: tsx src/scripts/update-admin-table.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminTable() {
  try {
    console.log('🔧 Đang cập nhật bảng admin...\n');

    // Kiểm tra xem bảng có cột created_at và updated_at không
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'admin'
      ORDER BY ordinal_position
    ` as any[];

    const columnNames = columns.map((c: any) => c.column_name);
    console.log('Các cột hiện tại:', columnNames.join(', '));

    // Nếu có created_at và updated_at, xóa chúng
    if (columnNames.includes('created_at') || columnNames.includes('updated_at')) {
      console.log('\nĐang xóa các cột created_at và updated_at...');
      
      if (columnNames.includes('updated_at')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE admin DROP COLUMN IF EXISTS updated_at`);
        console.log('✅ Đã xóa cột updated_at');
      }
      
      if (columnNames.includes('created_at')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE admin DROP COLUMN IF EXISTS created_at`);
        console.log('✅ Đã xóa cột created_at');
      }
    } else {
      console.log('✅ Bảng admin đã đúng cấu trúc (không có created_at, updated_at)');
    }

    console.log('\n✅ Hoàn tất cập nhật bảng admin!');
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    console.error('\n💡 Nếu lỗi, có thể bỏ qua nếu bảng đã đúng cấu trúc');
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminTable();

