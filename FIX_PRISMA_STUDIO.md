# 🔧 Khắc Phục Lỗi Prisma Studio - Bảng admin không tồn tại

## ✅ Đã Hoàn Thành

- ✅ Bảng admin đã được tạo trong database
- ✅ Admin mặc định đã được tạo
- ✅ Prisma client đã có model admin

## 🚨 Vấn Đề với Prisma Studio

Prisma Studio báo lỗi "The table `public.admin` does not exist" mặc dù bảng đã tồn tại.

## 🔧 Giải Pháp

### Cách 1: Restart Prisma Studio (KHUYẾN NGHỊ)

1. **Đóng Prisma Studio:**
   - Tìm terminal đang chạy `npx prisma studio`
   - Nhấn `Ctrl + C` để dừng

2. **Xóa cache Prisma Studio:**
   ```bash
   cd backend
   # Xóa cache (nếu có)
   Remove-Item -Recurse -Force node_modules\.prisma\studio -ErrorAction SilentlyContinue
   ```

3. **Khởi động lại Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```

### Cách 2: Chỉ định Schema Path

Nếu vẫn lỗi, thử chỉ định schema path:

```bash
cd backend
npx prisma studio --schema=./prisma/schema.prisma
```

### Cách 3: Reset và Generate Lại

```bash
cd backend

# Đóng Prisma Studio trước!

# Generate lại Prisma client
npx prisma generate

# Khởi động lại Prisma Studio
npx prisma studio
```

### Cách 4: Kiểm Tra Database Connection

Đảm bảo Prisma Studio đang kết nối đúng database:

1. Kiểm tra file `.env` trong thư mục `backend`
2. Đảm bảo `DATABASE_URL` đúng
3. Test kết nối:
   ```bash
   cd backend
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.admin.findMany().then(console.log).catch(console.error).finally(() => p.\$disconnect());"
   ```

## ✅ Kiểm Tra Sau Khi Fix

1. **Mở Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```

2. **Kiểm tra:**
   - Mở tab "admin" trong Prisma Studio
   - Xem có admin với email `admin@example.com` không

## 📝 Thông Tin Đăng Nhập Admin

- **Email:** `admin@example.com`
- **Password:** `admin123`
- **URL đăng nhập:** `http://localhost:5173/admin/login`

## 🆘 Nếu Vẫn Không Được

1. **Kiểm tra database trực tiếp:**
   ```bash
   cd backend
   tsx verify-admin-table.ts
   ```

2. **Kiểm tra Prisma schema:**
   - Mở `backend/prisma/schema.prisma`
   - Đảm bảo model `admin` có trong file (dòng 197-204)

3. **Restart máy tính:**
   - Đôi khi cache cần restart để clear

