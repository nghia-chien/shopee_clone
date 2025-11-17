import { PrismaClient } from '@prisma/client';

// ✅ Dùng biến global để tránh tạo nhiều kết nối Prisma khi hot reload (ở môi trường dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// ✅ Kiểm tra xem Prisma client có model admin không
let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['query', 'error', 'warn'],
    });

  // Test xem model admin có tồn tại không
  if (!('admin' in prismaInstance)) {
    console.error('❌ Prisma client chưa có model admin!');
    console.error('💡 Hãy chạy: npx prisma generate');
    console.error('💡 Đảm bảo đã đóng backend server trước khi generate');
  }
} catch (error: any) {
  if (error.message?.includes('admin') || error.code === 'P2021') {
    console.error('❌ Prisma client chưa có model admin!');
    console.error('💡 Hãy chạy: npx prisma generate');
    console.error('💡 Đảm bảo đã đóng backend server trước khi generate');
  }
  throw error;
}

export const prisma = prismaInstance;

// ✅ Chỉ gắn global ở môi trường dev (tránh memory leak trong production)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
