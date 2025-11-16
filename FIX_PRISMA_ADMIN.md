# 🔧 Khắc Phục Lỗi "Model admin chưa được tạo"

## ⚠️ Vấn Đề

Lỗi "Model admin chưa được tạo" xảy ra khi Prisma client chưa được generate lại sau khi thêm model admin vào schema.

## 🚀 Giải Pháp

### Cách 1: Force Regenerate (KHUYẾN NGHỊ)

**BƯỚC QUAN TRỌNG: Đóng backend server trước!**

1. **Đóng backend server:**
   - Tìm terminal/process đang chạy `npm run dev` hoặc `tsx watch src/server.ts`
   - Nhấn `Ctrl+C` để dừng
   - Đảm bảo không còn process Node.js nào đang chạy

2. **Chạy script force regenerate:**
   ```bash
   cd backend
   npm run prisma:force-generate
   ```

3. **Nếu vẫn lỗi, thử cách thủ công:**
   ```bash
   cd backend
   
   # Xóa cache Prisma (nếu có thể)
   rm -rf node_modules/.prisma/client
   # Hoặc trên Windows PowerShell:
   Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue
   
   # Generate lại
   npx prisma generate
   ```

### Cách 2: Sử dụng Prisma DB Push (Nếu database chưa có bảng)

```bash
cd backend

# Đóng backend server trước!

# Push schema vào database (tạo bảng nếu chưa có)
npx prisma db push

# Generate client
npx prisma generate
```

### Cách 3: Kiểm Tra và Sửa Thủ Công

1. **Kiểm tra schema.prisma có model admin:**
   ```bash
   cd backend
   # Mở file prisma/schema.prisma và kiểm tra có model admin không
   ```

2. **Kiểm tra Prisma client đã generate:**
   ```bash
   cd backend
   # Kiểm tra file này có tồn tại không:
   # node_modules/.prisma/client/index.d.ts
   ```

3. **Nếu file không tồn tại hoặc không có model admin:**
   - Đóng tất cả process Node.js
   - Xóa thư mục `node_modules/.prisma`
   - Chạy lại: `npx prisma generate`

## 🔍 Kiểm Tra Sau Khi Generate

1. **Kiểm tra file generated:**
   ```bash
   cd backend
   # Mở file: node_modules/.prisma/client/index.d.ts
   # Tìm kiếm "admin" hoặc "Admin" trong file
   ```

2. **Test Prisma client:**
   ```bash
   cd backend
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('Admin model:', typeof p.admin);"
   ```

   Nếu in ra `object` hoặc `function` thì model đã có.

## ⚡ Quick Fix (Nếu vẫn không được)

1. **Đóng TẤT CẢ terminal/IDE**
2. **Xóa và cài lại Prisma:**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npm install
   npx prisma generate
   ```

3. **Khởi động lại backend:**
   ```bash
   npm run dev
   ```

## 📝 Checklist

- [ ] Đã đóng backend server
- [ ] Đã chạy `npx prisma generate`
- [ ] Đã kiểm tra model admin có trong generated client
- [ ] Đã tạo bảng admin trong database
- [ ] Đã tạo admin mặc định (`npm run setup:admin`)
- [ ] Đã khởi động lại backend server

## 🆘 Nếu Vẫn Không Được

1. Kiểm tra file `backend/prisma/schema.prisma` có model admin (dòng 197-204)
2. Kiểm tra không có lỗi syntax trong schema
3. Thử restart máy tính (để giải phóng file lock)
4. Kiểm tra quyền truy cập file trong `node_modules/.prisma`

