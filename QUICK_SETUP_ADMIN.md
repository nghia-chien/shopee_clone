# 🚀 Hướng Dẫn Nhanh Setup Admin

## ⚠️ Nếu không thể đăng nhập, làm theo các bước sau:

### Bước 1: Tạo bảng admin trong database

**Chạy SQL này trong PostgreSQL:**

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

### Bước 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

**Nếu gặp lỗi "operation not permitted":**
- Đóng tất cả terminal/IDE đang chạy backend
- Chạy lại lệnh trên

### Bước 3: Tạo admin mặc định

```bash
cd backend
npm run setup:admin
```

Hoặc nếu script không chạy được, chạy SQL trực tiếp:

```sql
-- Hash password cho "admin123" (bcrypt với salt rounds = 10)
-- Bạn có thể tạo hash bằng cách chạy: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(console.log)"

INSERT INTO admin (name, email, password, created_at, updated_at)
VALUES (
    'Admin',
    'admin@example.com',
    '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Thay bằng hash thật
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
```

**Hoặc tạo hash password bằng Node.js:**

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log('Hash:', h))"
```

Sau đó copy hash và dùng trong SQL INSERT.

### Bước 4: Khởi động lại backend

```bash
cd backend
npm run dev
```

### Bước 5: Đăng nhập

Truy cập: `http://localhost:5173/admin/login`

- Email: `admin@example.com`
- Password: `admin123`

---

## 🔍 Kiểm Tra Setup

Trước khi đăng nhập, chạy script kiểm tra:

```bash
cd backend
npm run check:admin
```

Script này sẽ kiểm tra:
- ✅ Prisma client có model admin không
- ✅ Bảng admin có tồn tại trong database không
- ✅ Có admin nào trong database không
- ✅ Cấu trúc bảng đúng không

## 🔍 Kiểm Tra Lỗi

### Lỗi "Seller not found" khi đăng nhập admin
- ✅ Đảm bảo đang đăng nhập tại `/admin/login` (không phải `/seller/login`)
- ✅ Kiểm tra backend đang chạy và route `/api/admin/login` hoạt động

### Lỗi "Invalid email or password"
- ✅ Kiểm tra admin đã được tạo trong database
- ✅ Kiểm tra password hash đúng format bcrypt
- ✅ Kiểm tra email chính xác (case-sensitive)

### Lỗi Prisma "model admin does not exist"
- ✅ Chạy `npx prisma generate` lại
- ✅ Kiểm tra schema.prisma có model admin
- ✅ Restart backend server

### Lỗi "Table admin does not exist"
- ✅ Chạy SQL tạo bảng (Bước 1)
- ✅ Kiểm tra kết nối database đúng

---

## 📞 Test API trực tiếp

```bash
# Test login
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Nếu thành công, sẽ nhận được token và thông tin admin.

