# Hướng dẫn Setup Backend và Frontend

## 🗄️ Backend Setup

### 1. Tạo Migration cho phoneNumber
```bash
cd backend
npx prisma migrate dev --name add_phone_number
```

### 2. Chạy Backend
```bash
cd backend
npm run dev
# hoặc
yarn dev
```

Backend sẽ chạy trên: http://localhost:4000

## 🎨 Frontend Setup

### 1. Chạy Frontend
```bash
npm run dev
# hoặc
yarn dev
```

Frontend sẽ chạy trên: http://localhost:5173

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Register Request Body
```json
{
  "email": "user@example.com",
  "phoneNumber": "0123456789",
  "password": "password123",
  "name": "Tên người dùng" // optional
}
```

### Login Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🚀 Luồng hoạt động

1. **Truy cập http://localhost:5173** → Tự động redirect đến `/login`
2. **Đăng ký tài khoản mới** → `/register` → Nhập thông tin → Lưu vào SQL
3. **Đăng nhập** → `/login` → Xác thực với SQL → Redirect đến `/`
4. **Trang chủ** → Hiển thị thông tin user (name, email, phoneNumber)
5. **Đăng xuất** → Xóa token → Redirect về `/login`

## 📝 Lưu ý

- Tất cả mật khẩu được hash bằng bcrypt
- JWT token có thời hạn 7 ngày
- Auth state được persist trong localStorage
- PhoneNumber phải unique trong database
- Email phải unique trong database
