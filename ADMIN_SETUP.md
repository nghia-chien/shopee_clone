# Hướng Dẫn Thiết Lập Admin Panel

## 1. Tạo Bảng Admin trong Database

### ⚠️ QUAN TRỌNG: Phải làm bước này trước!

### Cách 1: Chạy SQL trực tiếp (KHUYẾN NGHỊ)

Kết nối với database PostgreSQL và chạy SQL sau:

```sql
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
```

Hoặc copy nội dung từ file: `backend/prisma/migrations/create_admin_table.sql`

### Cách 2: Sử dụng Prisma (nếu database đã sync)
```bash
cd backend
npx prisma db push
npx prisma generate
```

## 2. Generate Prisma Client

**QUAN TRỌNG:** Sau khi tạo bảng, phải generate lại Prisma client:

```bash
cd backend
npx prisma generate
```

Nếu gặp lỗi "operation not permitted", hãy:
1. Đóng tất cả terminal/IDE đang chạy backend
2. Chạy lại: `npx prisma generate`

## 3. Tạo Admin Mặc Định

### Cách 1: Sử dụng script setup (KHUYẾN NGHỊ)
```bash
cd backend
npm run setup:admin
```

Script này sẽ:
- Kiểm tra bảng admin có tồn tại không
- Tạo admin nếu chưa có
- Hiển thị thông tin đăng nhập

### Cách 2: Sử dụng seed script
```bash
cd backend
npm run seed:admin
```

### Cách 3: Với biến môi trường tùy chỉnh
```bash
cd backend
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin123 ADMIN_NAME="Admin" npm run setup:admin
```

**Thông tin đăng nhập mặc định:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Lưu ý:** Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!

## 4. Kiểm Tra Setup

Sau khi setup, kiểm tra:
```bash
cd backend
npx prisma studio
```

Mở tab "admin" và xem có dữ liệu chưa.

## 3. Truy Cập Admin Panel

1. Khởi động backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Khởi động frontend:
   ```bash
   npm run dev
   ```

3. Truy cập: `http://localhost:5173/admin/login`

## 4. Các Tính Năng Admin

- ✅ Đăng nhập/Đăng xuất
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý Sản phẩm (đang phát triển)
- ✅ Quản lý Sellers (đang phát triển)
- ✅ Quản lý Người dùng (đang phát triển)
- ✅ Quản lý Đơn hàng (đang phát triển)
- ✅ Thống kê và Báo cáo (đang phát triển)
- ✅ Cài đặt hệ thống (đang phát triển)

## 5. API Endpoints

- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/admin/me` - Lấy thông tin admin hiện tại (yêu cầu token)

## 6. Cấu Trúc Files

### Backend
- `backend/src/controllers/admin/auth.controller.ts` - Controller xử lý authentication
- `backend/src/middlewares/authAdmin.ts` - Middleware xác thực admin
- `backend/src/routes/modules/admin.routes.ts` - Routes cho admin
- `backend/src/seeds/admin.ts` - Script tạo admin mặc định

### Frontend
- `src/components/admin/AdminLogin.tsx` - Trang đăng nhập
- `src/components/admin/AdminLayout.tsx` - Layout cho admin panel
- `src/components/admin/AdminGuard.tsx` - Guard bảo vệ routes
- `src/screens/admin/AdminDashboard.tsx` - Dashboard chính
- `src/store/AdminAuth.ts` - Store quản lý auth state
- `src/api/admin.ts` - API client cho admin

## 7. Seller Interface

Seller interface đã được thiết kế sẵn với các tính năng:
- ✅ Đăng nhập/Đăng ký seller
- ✅ Dashboard quản lý sản phẩm
- ✅ Upload và chỉnh sửa sản phẩm
- ✅ Quản lý đơn hàng
- ✅ Thống kê và phân tích
- ✅ Cài đặt shop

Truy cập: `http://localhost:5173/seller/login`

