# Báo Cáo Kiểm Tra Admin Panel - Các Phần Còn Thiếu

## 📋 Tổng Quan

Dựa trên yêu cầu quản lý các bảng trong database, dưới đây là danh sách các phần đã có và còn thiếu:

## ✅ Các Phần Đã Có Đầy Đủ

1. **Product (Sản Phẩm)** ✅
   - Backend Controller: `backend/src/controllers/admin/product.controller.ts`
   - Frontend Screen: `src/screens/admin/data/ProductList.tsx`
   - Route: `/admin/products`
   - Menu: Có trong AdminLayout

2. **Vouchers** ✅
   - Backend Controller: `backend/src/controllers/admin/voucher.controller.ts`
   - Frontend Screen: `src/screens/admin/data/VoucherList.tsx`
   - Route: `/admin/vouchers`
   - Menu: Có trong AdminLayout

3. **Complaints (Khiếu Nại)** ✅
   - Backend Controller: `backend/src/controllers/complaint.controller.ts` (có admin endpoints)
   - Frontend Screen: `src/screens/admin/actions/AdminComplaints.tsx`
   - Route: `/admin/complaints`
   - Menu: Có trong AdminLayout

4. **Orders (Đơn Hàng)** ✅
   - Backend Controller: `backend/src/controllers/admin/order.controller.ts`
   - Frontend Screen: `src/screens/admin/data/OrderList.tsx`
   - Route: `/admin/orders`
   - Menu: Có trong AdminLayout

## ⚠️ Các Phần Còn Thiếu Hoặc Chưa Hoàn Chỉnh

### 1. **Category (Danh Mục)** ⚠️ THIẾU TRONG MENU
   - ✅ Backend Controller: `backend/src/controllers/admin/category.controller.ts` - CÓ
   - ✅ Frontend Screen: `src/screens/admin/data/CategoryList.tsx` - CÓ
   - ✅ Route: `/admin/categories` - CÓ
   - ❌ Menu: **KHÔNG CÓ** trong AdminLayout sidebar
   - **Hành động cần làm**: Thêm "Danh Mục" vào menu AdminLayout

### 2. **Product Reviews (Đánh Giá)** ⚠️ THIẾU TRONG MENU
   - ✅ Backend Controller: `backend/src/controllers/admin/review.controller.ts` - CÓ
   - ✅ Frontend Screen: `src/screens/admin/data/ReviewList.tsx` - CÓ
   - ✅ Route: `/admin/reviews` - CÓ
   - ❌ Menu: **KHÔNG CÓ** trong AdminLayout sidebar
   - **Hành động cần làm**: Thêm "Đánh Giá" vào menu AdminLayout

### 3. **Messages (Tin Nhắn/Chat)** ❌ HOÀN TOÀN THIẾU
   - ❌ Backend Controller: **KHÔNG CÓ** admin controller cho messages
   - ❌ Frontend Screen: **KHÔNG CÓ** admin screen cho messages
   - ❌ Route: **KHÔNG CÓ** route `/admin/messages`
   - ❌ Menu: **KHÔNG CÓ** trong AdminLayout sidebar
   - **Lưu ý**: Có bảng `messages` và `chat_threads` trong database, có controller cho user/seller nhưng chưa có cho admin
   - **Hành động cần làm**: 
     - Tạo `backend/src/controllers/admin/message.controller.ts`
     - Tạo `src/screens/admin/data/MessageList.tsx` hoặc `src/screens/admin/actions/AdminMessages.tsx`
     - Thêm route trong `src/admin/RefineApp.tsx`
     - Thêm vào menu AdminLayout
     - Thêm routes trong `backend/src/routes/modules/admin.routes.ts`

## 📊 Tóm Tắt

| Bảng | Backend | Frontend | Route | Menu | Trạng Thái |
|------|---------|----------|-------|------|------------|
| product | ✅ | ✅ | ✅ | ✅ | Hoàn chỉnh |
| vouchers | ✅ | ✅ | ✅ | ✅ | Hoàn chỉnh |
| complaints | ✅ | ✅ | ✅ | ✅ | Hoàn chỉnh |
| orders | ✅ | ✅ | ✅ | ✅ | Hoàn chỉnh |
| category | ✅ | ✅ | ✅ | ❌ | Thiếu menu |
| product_reviews | ✅ | ✅ | ✅ | ❌ | Thiếu menu |
| messages | ❌ | ❌ | ❌ | ❌ | Hoàn toàn thiếu |

## 🔧 Các File Cần Sửa/Thêm

### 1. Sửa AdminLayout để thêm Category và Reviews vào menu
**File**: `src/components/admin/AdminLayout.tsx`
- Thêm icon và menu item cho "Danh Mục" (Categories)
- Thêm icon và menu item cho "Đánh Giá" (Reviews)

### 2. Tạo Admin Messages Management
**Files cần tạo**:
- `backend/src/controllers/admin/message.controller.ts` - Controller để admin xem/quản lý messages
- `src/screens/admin/data/MessageList.tsx` hoặc `src/screens/admin/actions/AdminMessages.tsx` - UI để hiển thị messages
- `src/api/adminapi/data/adminMessages.ts` - API client cho admin messages

**Files cần sửa**:
- `backend/src/routes/modules/admin.routes.ts` - Thêm routes cho messages
- `src/admin/RefineApp.tsx` - Thêm route cho messages (nếu dùng Refine) hoặc custom route
- `src/components/admin/AdminLayout.tsx` - Thêm menu item cho Messages

## 💡 Gợi Ý Implementation

### Messages Admin Controller nên có:
- `getAllMessagesController` - Lấy tất cả messages (có filter theo thread, user, seller)
- `getMessageByIdController` - Xem chi tiết message
- `deleteMessageController` - Xóa message (nếu cần)
- `getAllThreadsController` - Xem tất cả chat threads
- `getThreadByIdController` - Xem chi tiết thread và messages trong đó

### Messages Admin Screen nên có:
- Danh sách threads với thông tin user/seller
- Xem messages trong từng thread
- Filter theo user, seller, date range
- Tìm kiếm messages
- Có thể xóa messages không phù hợp (nếu cần)

