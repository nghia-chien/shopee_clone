/**
 * Script tạo bảng admin trong database
 * Chạy: tsx src/scripts/create-admin-table.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminTable() {
  try {
    console.log('🔧 Đang tạo bảng admin trong database...\n');

    // SQL để tạo bảng admin
    const createTableSQL = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS admin (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
    `;

    // Chia SQL thành các câu lệnh riêng biệt
    const statements = createTableSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Đã chạy: ${statement.substring(0, 50)}...`);
      } catch (error: any) {
        // Bỏ qua lỗi nếu bảng/extension đã tồn tại
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('duplicate') ||
          error.code === '42P07' || // relation already exists
          error.code === '42710'     // duplicate object
        ) {
          console.log(`ℹ️  ${statement.substring(0, 50)}... (đã tồn tại)`);
        } else {
          console.error(`❌ Lỗi: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n✅ Đã tạo bảng admin thành công!');
    console.log('\n📝 Bây giờ bạn có thể:');
    console.log('   1. Chạy: npm run setup:admin (để tạo admin mặc định)');
    console.log('   2. Hoặc chạy: npm run seed:admin');
    
  } catch (error: any) {
    console.error('\n❌ Lỗi khi tạo bảng:', error.message);
    console.error('\n💡 Giải pháp thay thế:');
    console.error('   Chạy SQL trực tiếp trong database:');
    console.error('   Xem file: backend/prisma/migrations/create_admin_table.sql');
  } finally {
    await prisma.$disconnect();
  }
}

createAdminTable();

