# ✅ GIẢI PHÁP CUỐI CÙNG - Tạo Bảng Admin

## 🎯 Vấn Đề Đã Xác Định

✅ **Prisma client đã có model admin** (đã generate thành công)  
❌ **Bảng admin chưa tồn tại trong database**

## 🚀 Giải Pháp

### Cách 1: Dùng Script Tự Động (KHUYẾN NGHỊ)

```bash
cd backend
npm run create:admin-table
```

Script này sẽ tự động tạo bảng admin trong database.

### Cách 2: Chạy SQL Trực Tiếp

Kết nối với PostgreSQL database và chạy SQL sau:

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

### Cách 3: Dùng Prisma DB Push

```bash
cd backend
npx prisma db push
```

Lưu ý: Cách này có thể tạo thêm các bảng khác nếu schema chưa sync.

## 📝 Sau Khi Tạo Bảng

1. **Tạo admin mặc định:**
   ```bash
   cd backend
   npm run setup:admin
   ```

2. **Kiểm tra:**
   ```bash
   npm run check:admin
   ```

3. **Khởi động backend:**
   ```bash
   npm run dev
   ```

4. **Đăng nhập:**
   - Truy cập: `http://localhost:5173/admin/login`
   - Email: `admin@example.com`
   - Password: `admin123`

## ✅ Checklist

- [x] Prisma client đã có model admin
- [ ] Bảng admin đã được tạo trong database
- [ ] Admin mặc định đã được tạo
- [ ] Backend server đã được khởi động lại
- [ ] Có thể đăng nhập thành công

