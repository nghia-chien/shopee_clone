# 🚀 HƯỚNG PHÁT TRIỂN SELLER THEO SHOPEE - TÀI LIỆU CHI TIẾT

## 📋 TỔNG QUAN

Hệ thống Seller đã được phát triển theo mô hình của Shopee, cho phép seller:
- ✅ **Bán hàng**: Quản lý sản phẩm, đơn hàng đã bán
- ✅ **Mua hàng**: Seller có thể mua hàng từ các seller khác
- ✅ **Quản lý**: Dashboard, Analytics, Settings đầy đủ

---

## 🔄 1. SELLER CÓ THỂ MUA HÀNG (Theo Shopee)

### ✅ Database Schema Changes

**File:** `backend/prisma/schema.prisma`

#### Thay đổi trong `Seller` model:
```prisma
model Seller {
  // ... existing fields
  cart_items  cart_item[] @relation("seller_cart_items")
  orders    Orders[]   @relation("seller_orders")
}
```

#### Thay đổi trong `cart_item` model:
```prisma
model cart_item {
  id        String   @id
  user_id    String?  // Optional: cho User
  seller_id  String?  // Optional: cho Seller (mua hàng)
  product_id String
  quantity  Int
  user      User?    @relation(...)
  seller    Seller?  @relation(...)
  
  // Unique constraints cho cả User và Seller
  @@unique([user_id, product_id])
  @@unique([seller_id, product_id])
}
```

#### Thay đổi trong `Orders` model:
```prisma
model Orders {
  id        String
  user_id    String?  // Optional: cho User
  seller_id  String?  // Optional: cho Seller (mua hàng)
  total     Decimal
  status    String
  user      User?    @relation(...)
  seller    Seller?  @relation(...)
}
```

### 📍 API Endpoints Mới

#### Cart API cho Seller:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/seller/cart` | Lấy giỏ hàng của seller |
| POST | `/api/seller/cart` | Thêm sản phẩm vào giỏ (seller mua hàng) |
| PUT | `/api/seller/cart/:product_id` | Cập nhật số lượng |
| DELETE | `/api/seller/cart/:product_id` | Xóa sản phẩm khỏi giỏ |

#### Order API cho Seller:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/seller/order` | Tạo đơn hàng từ giỏ (seller mua hàng) |
| GET | `/api/seller/order/purchased` | Đơn hàng seller đã mua |
| GET | `/api/seller/order/sold` | Đơn hàng seller đã bán |
| GET | `/api/seller/order/:id` | Chi tiết đơn hàng |

#### Analytics API:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/seller/analytics/stats` | Thống kê tổng quan |
| GET | `/api/seller/analytics/analytics?days=30` | Analytics theo thời gian |

### 🛡️ Validation & Business Rules

1. **Seller không thể mua sản phẩm của chính mình:**
   ```typescript
   if (product.seller_id === seller_id) {
     return res.status(400).json({ 
       message: 'Cannot add your own product to cart' 
     });
   }
   ```

2. **Unique Constraint:**
   - Mỗi sản phẩm chỉ có 1 record trong giỏ cho mỗi seller
   - Seller và User có giỏ hàng riêng biệt

---

## 📊 2. SELLER DASHBOARD & ANALYTICS

### ✅ SellerHome (Trang chủ Seller)
**File:** `src/screens/seller/SellerHome.tsx`

**Tính năng:**
- Profile Card với avatar, rating, status
- Statistics Cards (4 cards):
  - Tổng sản phẩm
  - Tổng tồn kho
  - Giá trị kho hàng
  - Sản phẩm đang hoạt động
- Quick Actions:
  - Dashboard (quản lý sản phẩm)
  - Thêm sản phẩm
  - Đơn hàng
  - Phân tích
- Recent Products preview

### ✅ SellerDashboard (Quản lý sản phẩm)
**File:** `src/screens/seller/SellerDashboard.tsx`

**Tính năng:**
- Statistics overview
- Search & Filter sản phẩm
- Grid view với product cards
- Edit/Delete products với modal
- Loading states & error handling

### ✅ SellerOrders (Quản lý đơn hàng)
**File:** `src/screens/seller/SellerOrders.tsx`

**Tính năng:**
- Xem đơn hàng đã bán (sản phẩm của seller được mua)
- Filter theo trạng thái (all, pending, completed, cancelled)
- Statistics: Tổng đơn, Đang xử lý, Hoàn thành, Doanh thu
- Order details modal với thông tin chi tiết
- Hiển thị thông tin khách hàng

### ✅ SellerAnalytics (Phân tích & Thống kê)
**File:** `src/screens/seller/SellerAnalytics.tsx`

**Tính năng:**
- Overview stats (6 cards):
  - Tổng đơn hàng
  - Sản phẩm đã bán
  - Doanh thu
  - Đơn đang xử lý
  - Đơn hoàn thành
  - Đơn đã hủy
- Daily revenue chart
- Analytics theo thời gian (7/30/90/365 ngày)
- Recent orders list

### ✅ SellerSettings (Cài đặt)
**File:** `src/screens/seller/SellerSettings.tsx`

**Tính năng:**
- Tab navigation:
  - Thông tin cửa hàng
  - Cài đặt thanh toán
  - Cài đặt vận chuyển
  - Thông báo
  - Bảo mật

---

## 🎯 3. BUSINESS LOGIC & SERVICES

### Order Service (`backend/src/services/seller/order.service.ts`)

**Functions:**
1. `getSellerOrderStats(seller_id)`:
   - Tính tổng đơn hàng
   - Tính sản phẩm đã bán
   - Tính doanh thu
   - Phân loại theo trạng thái

2. `getSellerAnalytics(seller_id, days)`:
   - Thống kê theo ngày
   - Daily revenue chart data
   - Trends analysis

### Cart Controller (`backend/src/controllers/seller/cart.controller.ts`)

**Validation:**
- Seller không thể mua sản phẩm của chính mình
- Quantity validation
- Product existence check

### Order Controller (`backend/src/controllers/seller/order.controller.ts`)

**Features:**
- `createSellerOrder`: Seller mua hàng
- `listSellerOrders`: Đơn hàng seller đã mua
- `listSellerSoldOrders`: Đơn hàng seller đã bán (quan trọng!)
- `getSellerOrder`: Chi tiết đơn hàng

---

## 📱 4. FRONTEND COMPONENTS

### API Clients

**`src/api/sellerCart.ts`**: Cart operations cho seller
- `getSellerCart(token)`
- `addToSellerCart(token, product_id, quantity)`
- `updateSellercart_item(token, product_id, quantity)`
- `removeFromSellerCart(token, product_id)`

**`src/api/sellerOrders.ts`**: Order operations cho seller
- `getSellerOrders(token)` - Đơn seller đã mua
- `getSellerSoldOrders(token)` - Đơn seller đã bán
- `getSellerOrderDetails(token, order_id)`
- `createSellerOrder(token)`
- `getSellerStats(token)` - Thống kê
- `getSellerAnalytics(token, days)` - Analytics

### Routes

**`src/routes/SellerRoutes.tsx`**:
```
/seller/home        → SellerHome (Dashboard overview)
/seller/dashboard   → SellerDashboard (Quản lý sản phẩm)
/seller/upload      → SellerUploadPage (Thêm sản phẩm)
/seller/orders      → SellerOrders (Quản lý đơn hàng)
/seller/analytics   → SellerAnalytics (Phân tích)
/seller/settings    → SellerSettings (Cài đặt)
```

---

## 🔐 5. AUTHENTICATION & AUTHORIZATION

### Seller Authentication Flow

```
1. Seller Login
   ↓
2. JWT Token (chứa seller.id, email)
   ↓
3. Middleware: requireAuthSeller
   ↓
4. req.seller = { id, email, phone_number }
   ↓
5. Access protected routes
```

### Protected Routes

**Tất cả routes seller (trừ `/auth/*`):**
```typescript
router.use('/product', requireAuthSeller, ...);
router.use('/cart', requireAuthSeller, ...);
router.use('/order', requireAuthSeller, ...);
router.use('/analytics', requireAuthSeller, ...);
```

---

## 📈 6. DATA FLOW EXAMPLES

### Flow 1: Seller Mua Hàng

```
1. Seller browse products (như User bình thường)
   ↓
2. Seller add to cart: POST /api/seller/cart
   - Validation: Không được mua sản phẩm của chính mình
   ↓
3. Seller checkout: POST /api/seller/order
   - Lấy cart_items từ seller_id
   - Tạo Orders với seller_id
   - Xóa cart_items
   ↓
4. Order created với seller_id (seller mua hàng)
```

### Flow 2: Seller Xem Đơn Hàng Đã Bán

```
1. Seller truy cập /seller/orders
   ↓
2. Frontend: GET /api/seller/order/sold
   ↓
3. Backend:
   - Lấy tất cả products của seller
   - Tìm order_items có products của seller
   - Nhóm theo Orders
   ↓
4. Hiển thị danh sách đơn hàng đã bán
```

### Flow 3: Analytics & Stats

```
1. Seller truy cập /seller/analytics
   ↓
2. Frontend: 
   - GET /api/seller/analytics/stats (tổng quan)
   - GET /api/seller/analytics/analytics?days=30 (chi tiết)
   ↓
3. Backend:
   - Tính toán từ order_items của seller
   - Nhóm theo ngày
   - Tính revenue, orders, items
   ↓
4. Hiển thị charts & statistics
```

---

## 🔄 7. DATABASE MIGRATION

### Cần chạy migration sau khi sửa schema:

```bash
cd backend
yarn prisma migrate dev --name add_seller_shopping
```

**Migration sẽ:**
- Thêm `seller_id` (optional) vào `cart_item` table
- Thêm `seller_id` (optional) vào `Orders` table
- Thêm unique constraints
- Thêm foreign keys

**Lưu ý:** 
- Dữ liệu cũ sẽ vẫn giữ nguyên (user_id vẫn có giá trị)
- Có thể có cả `user_id` và `seller_id` null (cần validation trong code)

---

## 🎨 8. UI/UX FEATURES

### Design Pattern

**1. Card-based Layout:**
- Statistics cards với gradient backgrounds
- Product cards với hover effects
- Order cards với status badges

**2. Color Coding:**
- Blue: Dashboard, Products
- Green: Add, Success
- Orange: Orders
- Purple: Analytics
- Yellow: Pending
- Red: Delete, Cancel

**3. Responsive:**
- Mobile-first design
- Grid layout tự động adjust
- Sidebar collapse trên mobile

**4. Loading States:**
- Spinner khi loading
- Skeleton screens (có thể thêm)
- Error messages rõ ràng

**5. Interactive Elements:**
- Hover effects
- Transition animations
- Modal dialogs
- Toast notifications (có thể thêm)

---

## 📦 9. FILES STRUCTURE

### Backend
```
backend/src/
├── controllers/seller/
│   ├── auth.controller.ts
│   ├── productSeller.controller.ts
│   ├── upload.controller.ts
│   ├── cart.controller.ts         ← NEW
│   ├── order.controller.ts        ← NEW
│   └── analytics.controller.ts     ← NEW
├── services/seller/
│   ├── auth.service.ts
│   ├── product.service.ts
│   └── order.service.ts           ← NEW
├── sellerRoutes/
│   ├── modulesSeller/
│   │   ├── sellerAuth.ts
│   │   ├── sellerProduct.ts
│   │   ├── uploadSeller.routes.ts
│   │   ├── sellerCart.routes.ts   ← NEW
│   │   ├── sellerOrder.routes.ts   ← NEW
│   │   └── sellerAnalytics.routes.ts ← NEW
│   └── index.ts
└── middlewares/
    └── authSeller.ts
```

### Frontend
```
src/
├── screens/seller/
│   ├── SellerHome.tsx              ← ENHANCED
│   ├── SellerDashboard.tsx         ← ENHANCED
│   ├── SellerUploadPage.tsx
│   ├── SellerOrders.tsx            ← NEW
│   ├── SellerAnalytics.tsx         ← NEW
│   └── SellerSettings.tsx          ← NEW
├── api/
│   ├── seller.ts
│   ├── sellerProducts.ts
│   ├── sellerCart.ts               ← NEW
│   └── sellerOrders.ts             ← NEW
├── routes/
│   └── SellerRoutes.tsx            ← UPDATED
└── store/
    └── SellerAuth.ts
```

---

## ⚠️ 10. IMPORTANT NOTES

### Validation Rules

1. **cart_item:**
   - Phải có `user_id` HOẶC `seller_id` (không thể cả 2 null)
   - Validation trong code, không phải database constraint

2. **Orders:**
   - Phải có `user_id` HOẶC `seller_id`
   - Validation trong code

3. **Seller mua hàng:**
   - Không thể mua sản phẩm của chính mình
   - Check trong `addToSellerCartController`

### Migration Considerations

- **Existing Data:** Orders và cart_items cũ chỉ có `user_id`, không có `seller_id` → OK
- **New Data:** Có thể có `user_id` null nếu seller mua hàng
- **Unique Constraints:** Cần migration để tạo unique index cho `seller_id + product_id`

---

## 🚀 11. NEXT STEPS & ENHANCEMENTS

### Có thể phát triển thêm:

1. **Order Management:**
   - ✅ Update order status (pending → processing → shipped → delivered)
   - ⏳ Cancel order
   - ⏳ Refund management

2. **Advanced Analytics:**
   - ⏳ Product performance (sản phẩm bán chạy)
   - ⏳ Customer insights
   - ⏳ Revenue charts (line chart, bar chart)
   - ⏳ Export reports (PDF, Excel)

3. **Inventory Management:**
   - ✅ Stock tracking (đã có)
   - ⏳ Low stock alerts
   - ⏳ Bulk import/export

4. **Marketing Tools:**
   - ⏳ Promotions & Discounts
   - ⏳ Vouchers management
   - ⏳ Flash sales

5. **Customer Service:**
   - ⏳ Chat support
   - ⏳ Reviews management
   - ⏳ Refund requests

6. **Financial:**
   - ⏳ Payout history
   - ⏳ Commission tracking
   - ⏳ Tax reports

---

## 🎉 KẾT LUẬN

Hệ thống Seller đã được phát triển đầy đủ với:

✅ **Seller có thể mua hàng** (như Shopee)
✅ **Quản lý đơn hàng đã bán** 
✅ **Dashboard với analytics**
✅ **Settings & Configuration**
✅ **Modern UI/UX**

**Ready for production demo!** 🚀

