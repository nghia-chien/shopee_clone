# 🎯 Hướng Dẫn Setup Quản Lý User & Seller cho Admin

## ✅ Đã Hoàn Thành

### 1. Backend
- ✅ Cập nhật schema admin (bỏ created_at, updated_at)
- ✅ Tạo controllers quản lý users:
  - `getAllUsersController` - Lấy danh sách users (có pagination, search)
  - `getUserByIdController` - Lấy thông tin user theo ID
  - `createUserController` - Tạo user mới
  - `updateUserController` - Cập nhật user
  - `deleteUserController` - Xóa user
- ✅ Tạo controllers quản lý sellers:
  - `getAllSellersController` - Lấy danh sách sellers (có pagination, search, filter status)
  - `getSellerByIdController` - Lấy thông tin seller theo ID
  - `createSellerController` - Tạo seller mới
  - `updateSellerController` - Cập nhật seller
  - `deleteSellerController` - Xóa seller
- ✅ Routes đã được thêm vào `/api/admin/users` và `/api/admin/sellers`

### 2. Frontend
- ✅ Tạo API clients: `src/api/adminUsers.ts` và `src/api/adminSellers.ts`
- ✅ Tạo components:
  - `src/screens/admin/AdminUsers.tsx` - Quản lý users
  - `src/screens/admin/AdminSellers.tsx` - Quản lý sellers
- ✅ Đã tích hợp vào AdminApp routing

## 🚀 Các Bước Setup

### Bước 1: Cập Nhật Database

Cập nhật bảng admin theo schema mới (xóa created_at, updated_at nếu có):

```bash
cd backend
npm run update:admin-table
```

Hoặc chạy SQL trực tiếp:
```sql
ALTER TABLE admin DROP COLUMN IF EXISTS created_at;
ALTER TABLE admin DROP COLUMN IF EXISTS updated_at;
```

### Bước 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Bước 3: Khởi Động Backend

```bash
cd backend
npm run dev
```

### Bước 4: Khởi Động Frontend

```bash
npm run dev
```

## 📋 Tính Năng Quản Lý Users

### API Endpoints
- `GET /api/admin/users` - Lấy danh sách users
  - Query params: `page`, `limit`, `search`
- `GET /api/admin/users/:id` - Lấy thông tin user
- `POST /api/admin/users` - Tạo user mới
- `PUT /api/admin/users/:id` - Cập nhật user
- `DELETE /api/admin/users/:id` - Xóa user

### Giao Diện
- Danh sách users với pagination
- Tìm kiếm theo email, name, phone_number
- Tạo/Sửa/Xóa user
- Modal form để tạo/sửa

## 📋 Tính Năng Quản Lý Sellers

### API Endpoints
- `GET /api/admin/sellers` - Lấy danh sách sellers
  - Query params: `page`, `limit`, `search`, `status`
- `GET /api/admin/sellers/:id` - Lấy thông tin seller
- `POST /api/admin/sellers` - Tạo seller mới
- `PUT /api/admin/sellers/:id` - Cập nhật seller
- `DELETE /api/admin/sellers/:id` - Xóa seller

### Giao Diện
- Danh sách sellers với pagination
- Tìm kiếm theo email, name, phone_number
- Lọc theo trạng thái (active, inactive, suspended)
- Hiển thị rating và số lượng sản phẩm
- Tạo/Sửa/Xóa seller
- Modal form để tạo/sửa

## 🎨 Truy Cập

1. Đăng nhập admin: `http://localhost:5173/admin/login`
   - Email: `admin@example.com`
   - Password: `admin123`

2. Quản lý Users: `http://localhost:5173/admin/users`

3. Quản lý Sellers: `http://localhost:5173/admin/sellers`

## 🔒 Bảo Mật

- Tất cả routes đều yêu cầu authentication (middleware `requireAuthAdmin`)
- Chỉ admin mới có thể truy cập các chức năng quản lý
- Validation dữ liệu đầu vào bằng Zod
- Kiểm tra trùng email/phone_number trước khi tạo/cập nhật

## 📝 Lưu Ý

- Khi xóa user/seller, các bản ghi liên quan sẽ bị xóa theo cascade
- Password được hash bằng bcrypt trước khi lưu
- Khi cập nhật user/seller, không cần nhập password (chỉ cần khi tạo mới)

