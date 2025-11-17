/**
 * Script để setup admin - chạy trực tiếp SQL nếu Prisma migration gặp vấn đề
 * Chạy: tsx src/scripts/setup-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔍 Đang kiểm tra bảng admin...');
    
    // Kiểm tra xem bảng admin có tồn tại không
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM admin`;
      console.log('✅ Bảng admin đã tồn tại');
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'P2021') {
        console.log('❌ Bảng admin chưa tồn tại. Vui lòng chạy SQL sau:');
        console.log(`
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
        `);
        return;
      }
      throw error;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    console.log('🔍 Đang kiểm tra admin có tồn tại...');
    
    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await prisma.$queryRaw`
      SELECT id, email FROM admin WHERE email = ${adminEmail}
    ` as any[];

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('✅ Admin đã tồn tại:', adminEmail);
      console.log('   ID:', existingAdmin[0].id);
      return;
    }

    console.log('📝 Đang tạo admin mới...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Tạo admin mới bằng raw SQL để tránh lỗi Prisma client
    await prisma.$executeRaw`
      INSERT INTO admin (name, email, password, created_at, updated_at)
      VALUES (${adminName}, ${adminEmail}, ${hashedPassword}, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `;

    console.log('✅ Đã tạo admin thành công!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   Name:', adminName);
    console.log('\n⚠️  Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!');
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('\n💡 Giải pháp:');
      console.log('1. Chạy SQL trong file: backend/prisma/migrations/create_admin_table.sql');
      console.log('2. Hoặc chạy: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();

