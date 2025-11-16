/**
 * Script để force regenerate Prisma client
 * Chạy: tsx src/scripts/force-regenerate-prisma.ts
 * 
 * LƯU Ý: Đóng backend server trước khi chạy script này
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');

console.log('🔄 Đang force regenerate Prisma client...\n');

try {
  // 1. Kiểm tra xem Prisma client có đang được sử dụng không
  console.log('1. Kiểm tra Prisma client...');
  if (fs.existsSync(prismaClientPath)) {
    console.log('   ⚠️  Prisma client đã tồn tại');
    console.log('   💡 Nếu backend đang chạy, hãy đóng nó trước');
  } else {
    console.log('   ✅ Prisma client chưa tồn tại, sẽ tạo mới');
  }

  // 2. Xóa cache Prisma (nếu có thể)
  console.log('\n2. Xóa cache Prisma...');
  try {
    if (fs.existsSync(prismaClientPath)) {
      // Thử xóa thư mục .prisma/client
      fs.rmSync(prismaClientPath, { recursive: true, force: true });
      console.log('   ✅ Đã xóa cache Prisma client');
    } else {
      console.log('   ℹ️  Không có cache để xóa');
    }
  } catch (error: any) {
    console.log('   ⚠️  Không thể xóa cache (có thể đang được sử dụng):', error.message);
    console.log('   💡 Hãy đóng backend server và thử lại');
  }

  // 3. Generate Prisma client
  console.log('\n3. Generate Prisma client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n   ✅ Đã generate Prisma client thành công!');
  } catch (error: any) {
    console.error('\n   ❌ Lỗi khi generate:', error.message);
    console.log('\n   💡 Giải pháp:');
    console.log('   1. Đóng tất cả terminal/IDE đang chạy backend');
    console.log('   2. Đóng tất cả process Node.js');
    console.log('   3. Chạy lại: npx prisma generate');
    process.exit(1);
  }

  // 4. Kiểm tra model admin có trong generated client không
  console.log('\n4. Kiểm tra model admin...');
  try {
    const generatedIndexPath = path.join(prismaClientPath, 'index.d.ts');
    if (fs.existsSync(generatedIndexPath)) {
      const content = fs.readFileSync(generatedIndexPath, 'utf-8');
      if (content.includes('admin') || content.includes('Admin')) {
        console.log('   ✅ Model admin đã được generate');
      } else {
        console.log('   ⚠️  Model admin không thấy trong generated client');
        console.log('   💡 Kiểm tra lại schema.prisma có model admin không');
      }
    } else {
      console.log('   ⚠️  Không tìm thấy generated client');
    }
  } catch (error: any) {
    console.log('   ⚠️  Không thể kiểm tra:', error.message);
  }

  console.log('\n✅ Hoàn tất! Bây giờ bạn có thể khởi động lại backend server.');
  console.log('   Chạy: npm run dev');
  
} catch (error: any) {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
}

