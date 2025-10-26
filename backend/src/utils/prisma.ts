import { PrismaClient } from '@prisma/client';

// ✅ Dùng biến global để tránh tạo nhiều kết nối Prisma khi hot reload (ở môi trường dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

// ✅ Chỉ gắn global ở môi trường dev (tránh memory leak trong production)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
