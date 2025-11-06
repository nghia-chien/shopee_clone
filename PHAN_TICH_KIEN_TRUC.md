# 📚 PHÂN TÍCH KIẾN TRÚC HỆ THỐNG SHOPEE CLONE - SELLER MODULE

## 🎯 TỔNG QUAN

Dự án này là một ứng dụng e-commerce clone của Shopee, được xây dựng với:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (qua Prisma)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary

---

## 🏗️ KIẾN TRÚC TỔNG THỂ

### Cấu trúc thư mục

```
shoppe_clone/
├── backend/              # Backend API Server
│   ├── src/
│   │   ├── app.ts        # Express app configuration
│   │   ├── server.ts     # Server entry point
│   │   ├── prismaClient.ts # Prisma client instance
│   │   ├── controllers/  # Business logic handlers
│   │   ├── services/     # Business logic layer
│   │   ├── routes/       # API route definitions
│   │   ├── middlewares/  # Auth, upload, error handlers
│   │   └── utils/        # Utilities (cloudinary, prisma)
│   └── prisma/
│       └── schema.prisma # Database schema
│
└── src/                  # Frontend React App
    ├── screens/          # Page components
    ├── components/       # Reusable components
    ├── store/            # Zustand state management
    ├── api/              # API client functions
    └── routes/           # React Router routes
```

---

## 🔐 XÁC THỰC VÀ BẢO MẬT

### Authentication Flow

#### 1. Seller Registration (`/api/seller/auth/register`)

**Luồng xử lý:**
```
Frontend (SellerRegister.tsx)
  ↓ Gửi POST request
Backend (seller/auth.controller.ts)
  ↓ Validate input (Zod schema)
  ↓ Hash password (bcrypt)
  ↓ Tạo Seller trong database
  ↓ Tạo JWT token
  ↓ Trả về token + seller info
Frontend lưu vào Zustand store
```

**Code liên quan:**
- `src/components/seller/SellerRegister.tsx` - UI form đăng ký
- `backend/src/controllers/seller/auth.controller.ts` - Xử lý logic đăng ký
- `backend/src/services/seller/auth.service.ts` - Service layer
- `src/store/SellerAuth.ts` - State management với Zustand

#### 2. Seller Login (`/api/seller/auth/login`)

**Luồng xử lý:**
```
Frontend (SellerLogin.tsx)
  ↓ Gửi email + password
Backend (seller/auth.controller.ts)
  ↓ Tìm seller theo email
  ↓ So sánh password (bcrypt.compare)
  ↓ Tạo JWT token
  ↓ Trả về token + seller info
Frontend lưu vào store
```

#### 3. Protected Routes - Middleware Authentication

**Middleware:** `backend/src/middlewares/authSeller.ts`

```typescript
export const requireAuthSeller = (req, res, next) => {
  // 1. Lấy token từ header Authorization: Bearer <token>
  // 2. Verify JWT token
  // 3. Gắn seller info vào req.seller
  // 4. Next() để tiếp tục
}
```

**Sử dụng trong routes:**
```typescript
router.use('/product', requireAuthSeller, sellerProductRoutes);
```

**Frontend Auth Guard:** `src/components/seller/AuthGuard.tsx`
- Kiểm tra token trước khi render component
- Redirect đến `/seller/login` nếu chưa đăng nhập

---

## 💾 KẾT NỐI DATABASE

### Prisma ORM Setup

**File:** `backend/src/prismaClient.ts`
```typescript
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

**Database Schema:** `backend/prisma/schema.prisma`

**Models liên quan đến Seller:**

1. **Seller Model**
   ```prisma
   model Seller {
     id          String    @id @default(cuid())
     name        String
     email       String    @unique
     phone_number String?   @unique
     password    String
     address     Json?
     rating      Float?    @default(0)
     status      String    @default("active")
     products    Product[] # One-to-Many relationship
   }
   ```

2. **Product Model**
   ```prisma
   model Product {
     id        String   @id @default(cuid())
     title     String
     price     Decimal
     stock     Int
     images    String[] # Array of image URLs
     seller_id  String
     seller    Seller   @relation(...) # Many-to-One
   }
   ```

**Kết nối dữ liệu:**
- Seller → Products: 1 seller có nhiều products
- Product → Seller: Mỗi product thuộc về 1 seller

---

## 🛣️ API ROUTING STRUCTURE

### Backend Routes

**Main router:** `backend/src/routes/index.ts`
```typescript
router.use('/seller', sellerRoutes); // /api/seller/*
```

**Seller router:** `backend/src/sellerRoutes/index.ts`
```typescript
router.use('/auth', sellerAuthRoutes);      // /api/seller/auth/*
router.use('/product', requireAuthSeller, sellerProductRoutes); // /api/seller/product/*
router.use('/upload', uploadSellerRoutes);  // /api/seller/upload/*
```

**API Endpoints:**

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| POST | `/api/seller/auth/register` | Đăng ký seller | ❌ |
| POST | `/api/seller/auth/login` | Đăng nhập | ❌ |
| GET | `/api/seller/auth/me` | Lấy thông tin seller hiện tại | ✅ |
| POST | `/api/seller/product` | Tạo sản phẩm mới | ✅ |
| GET | `/api/seller/product` | Lấy danh sách sản phẩm của seller | ✅ |
| GET | `/api/seller/product/:id` | Lấy chi tiết sản phẩm | ✅ |
| PUT | `/api/seller/product/:id` | Cập nhật sản phẩm | ✅ |
| DELETE | `/api/seller/product/:id` | Xóa sản phẩm | ✅ |
| POST | `/api/seller/upload` | Upload ảnh lên Cloudinary | ✅ |

### Frontend Routes

**Main router:** `src/routes/AppRoutes.tsx`
```typescript
<Route path="/seller/*" element={<SellerRoutes />} />
```

**Seller routes:** `src/routes/SellerRoutes.tsx`
```typescript
/seller/login      → SellerLogin component
/seller/register   → SellerRegister component
/seller/home        → SellerHome component
/seller/dashboard   → SellerDashboard component
/seller/upload      → SellerUploadPage component
```

---

## 📦 BUSINESS LOGIC LAYER

### Controller → Service Pattern

**Ví dụ: Product Management**

1. **Controller Layer** (`backend/src/controllers/seller/productSeller.controller.ts`)
   - Nhận HTTP request
   - Validate authentication (qua middleware)
   - Gọi service layer
   - Trả về HTTP response

```typescript
export const createSellerProduct = async (req, res) => {
  const seller_id = req.seller?.id; // Từ middleware authSeller
  const product = await SellerProductService.create(seller_id, req.body);
  res.status(201).json({ product });
};
```

2. **Service Layer** (`backend/src/services/seller/product.service.ts`)
   - Chứa business logic
   - Tương tác với database qua Prisma
   - Xử lý validation và error handling

```typescript
export const SellerProductService = {
  async create(seller_id, data) {
    return prisma.product.create({
      data: { ...data, seller_id }
    });
  }
};
```

---

## 📤 FILE UPLOAD - CLOUDINARY

### Upload Flow

**1. Frontend Upload (`src/screens/seller/SellerUploadPage.tsx`)**
```typescript
// Chọn file → Upload từng file lên Cloudinary
const imageUrls = await Promise.all(
  images.map(file => uploadSellerImage(file))
);
```

**2. Backend Upload (`backend/src/controllers/seller/upload.controller.ts`)**
```typescript
// Nhận file từ multer (memory storage)
// Upload stream lên Cloudinary
// Trả về URL
```

**3. Cloudinary Config (`backend/src/utils/cloudinary.ts`)**
- Sử dụng environment variables:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

**Middleware:** `backend/src/middlewares/upload.ts`
- Sử dụng multer với memoryStorage
- Single file upload: `upload.single('image')`

---

## 🎨 FRONTEND STATE MANAGEMENT

### Zustand Store

**Seller Auth Store:** `src/store/SellerAuth.ts`

```typescript
interface SellerAuthState {
  token: string | null;
  seller: Seller | null;
  setAuth: (token, seller) => void;
  logout: () => void;
}
```

**Cách sử dụng:**
- Persist vào localStorage tự động (qua `persist` middleware)
- Access: `useSellerAuthStore(state => state.token)`
- Update: `useSellerAuthStore.getState().setAuth(token, seller)`

### API Client Functions

**File:** `src/api/seller.ts` và `src/api/sellerProducts.ts`

- Tập trung tất cả API calls
- Tự động thêm Authorization header từ store
- Consistent error handling

---

## 🔄 DATA FLOW - TẠO SẢN PHẨM MỚI

### Complete Flow Example

```
1. User điền form (SellerUploadPage.tsx)
   ↓
2. Chọn ảnh → Upload lên Cloudinary
   - POST /api/seller/upload (multiple requests)
   - Nhận về mảng URLs
   ↓
3. Submit form với product data + image URLs
   ↓
4. POST /api/seller/product
   - Middleware: requireAuthSeller → Verify JWT
   - Controller: createSellerProduct
   - Service: SellerProductService.create()
   ↓
5. Prisma tạo record trong database
   ↓
6. Trả về product object
   ↓
7. Frontend reload danh sách sản phẩm
```

---

## 🐛 BUG FIXES ĐÃ THỰC HIỆN

### 1. Seller ID Bug

**Vấn đề:** Trong `productSeller.controller.ts`, code sử dụng `req.seller?.Id` (chữ I hoa) thay vì `req.seller?.id` (chữ i thường).

**Đã sửa:** Tất cả `.Id` → `.id` trong các functions:
- `getSellerProducts`
- `getSellerProductById`
- `updateSellerProduct`
- `deleteSellerProduct`

**Lý do:** JWT token decode trả về `{ id: string }` (lowercase), không phải `Id`.

---

## ✨ CẢI THIỆN DEMO SELLER

### SellerDashboard Enhancements

**Trước đây:**
- UI đơn giản, chỉ hiển thị danh sách
- Không có thống kê
- Không có edit/delete

**Sau khi cải thiện:**
- ✅ **Statistics Cards**: Hiển thị tổng sản phẩm, tổng tồn kho, giá trị kho, sản phẩm đang hoạt động
- ✅ **Search Functionality**: Tìm kiếm sản phẩm theo tên/mô tả
- ✅ **Edit Product**: Modal để chỉnh sửa thông tin sản phẩm
- ✅ **Delete Product**: Xóa sản phẩm với confirmation
- ✅ **Beautiful UI**: Modern card-based design với Tailwind CSS
- ✅ **Loading States**: Loading spinner khi fetch data
- ✅ **Error Handling**: Hiển thị lỗi rõ ràng

**New API Functions:**
- `updateSellerProduct(token, product_id, data)`
- `deleteSellerProduct(token, product_id)`

---

## 📋 BEST PRACTICES ĐÃ ÁP DỤNG

1. **Separation of Concerns**
   - Controller chỉ xử lý HTTP
   - Service chứa business logic
   - Routes chỉ định nghĩa endpoints

2. **Error Handling**
   - Try-catch trong controllers
   - Error middleware (`errorHandler.ts`)
   - Frontend hiển thị error messages

3. **Type Safety**
   - TypeScript cho cả frontend và backend
   - Type definitions cho API responses

4. **Security**
   - Password hashing với bcrypt
   - JWT authentication
   - Protected routes với middleware

5. **Code Organization**
   - Modular structure
   - Reusable components
   - Centralized API clients

---

## 🚀 CÁCH CHẠY DỰ ÁN

### Backend
```bash
cd backend
yarn install
yarn prisma:generate
yarn prisma:migrate
# Tạo file .env với DATABASE_URL, JWT_SECRET, CLOUDINARY_*
yarn dev
```

### Frontend
```bash
yarn install
# Tạo file .env với VITE_API_URL=http://localhost:4000/api
yarn dev
```

---

## 📝 KẾT LUẬN

Hệ thống được xây dựng với kiến trúc rõ ràng, dễ mở rộng:
- ✅ Authentication và Authorization hoàn chỉnh
- ✅ CRUD operations cho Seller và Products
- ✅ File upload với Cloudinary
- ✅ Modern UI/UX
- ✅ Type-safe với TypeScript
- ✅ Scalable architecture
- ✅ **Seller có thể mua hàng (như Shopee)**
- ✅ **Quản lý đơn hàng đã bán**
- ✅ **Analytics & Statistics dashboard**
- ✅ **Settings & Configuration**

**Các điểm mạnh:**
- Code organization tốt
- Separation of concerns rõ ràng
- Error handling đầy đủ
- Security best practices
- **Theo mô hình Shopee - Seller vừa bán vừa mua được**

**Tính năng mới đã thêm:**
- ✅ Seller shopping capability (Cart & Orders)
- ✅ Seller Orders Management (đơn đã bán)
- ✅ Analytics Dashboard với charts
- ✅ Settings page với tabs
- ✅ Enhanced SellerHome với statistics

**Có thể cải thiện thêm:**
- Thêm pagination cho danh sách sản phẩm
- Thêm filtering và sorting
- Order status updates (pending → processing → shipped)
- Reviews & Ratings management
- Real-time notifications
- Export reports (PDF, Excel)

