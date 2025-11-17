// Test script để kiểm tra model admin
import { PrismaClient } from '@prisma/client';

async function testAdminModel() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Kiểm tra model admin trong Prisma client...\n');
    
    // Kiểm tra xem có property admin không
    if ('admin' in prisma) {
      console.log('✅ Model admin đã có trong Prisma client');
      console.log('   Type:', typeof prisma.admin);
      
      // Thử query để xem có lỗi không
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM admin`;
        console.log('✅ Có thể query bảng admin');
        console.log('   Số lượng admin:', count[0]?.count || 0);
      } catch (error) {
        if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
          console.log('❌ Bảng admin chưa tồn tại trong database');
          console.log('💡 Chạy SQL tạo bảng (xem file create_admin_table.sql)');
        } else {
          console.log('⚠️  Lỗi khi query:', error.message);
        }
      }
    } else {
      console.log('❌ Model admin KHÔNG có trong Prisma client');
      console.log('\nAvailable models:');
      const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
      models.forEach(m => console.log('  -', m));
      console.log('\n💡 Có thể cần:');
      console.log('   1. Kiểm tra schema.prisma có model admin');
      console.log('   2. Chạy lại: npx prisma generate');
      console.log('   3. Restart backend server');
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminModel();

