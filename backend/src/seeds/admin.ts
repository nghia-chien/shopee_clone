import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

/**
 * Seed script để tạo admin mặc định
 * Chạy: tsx src/seeds/admin.ts
 */
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Admin đã tồn tại:', adminEmail);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Tạo admin mới
    const admin = await prisma.admin.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
      },
    });

    console.log('✅ Đã tạo admin thành công:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   ID:', admin.id);
    console.log('\n⚠️  Thông tin đăng nhập:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

