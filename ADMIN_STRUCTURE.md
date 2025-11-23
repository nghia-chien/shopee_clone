# Admin Panel Structure - Tổng quan

## Mục tiêu

Cấu trúc lại admin panel thành 2 phần rõ ràng:
1. **Data Management** - Quản lý dữ liệu (CRUD operations) sử dụng Refine
2. **Action Management** - Quản lý hành động (custom business logic) không dùng Refine

## Cấu trúc Frontend

### 1. Data Management (Refine CRUD)
**Location**: `src/screens/admin/data/`
**Technology**: Refine hooks (`useList`, `useShow`, `useCreate`, `useUpdate`, `useDelete`)
**Resources**:
- Products (`ProductList.tsx`, `ProductShow.tsx`, `ProductEdit.tsx`)
- Categories (`CategoryList.tsx`, `CategoryShow.tsx`, `CategoryCreate.tsx`, `CategoryEdit.tsx`)
- Orders (`OrderList.tsx`, `OrderShow.tsx`, `OrderEdit.tsx`)
- Reviews (`ReviewList.tsx`, `ReviewShow.tsx`)
- Users (`UserList.tsx`, `UserShow.tsx`, `UserCreate.tsx`, `UserEdit.tsx`)
- Sellers (`SellerList.tsx`, `SellerShow.tsx`, `SellerCreate.tsx`, `SellerEdit.tsx`)
- Vouchers (`VoucherList.tsx`, `VoucherCreate.tsx`)

**API Clients**: `src/api/adminapi/data/`
- `adminUsers.ts`
- `adminSellers.ts`
- `adminVouchers.ts`

**Data Provider**: `src/providers/refine/dataProvider.ts`
- Chỉ xử lý data management resources
- Sử dụng `useAdminAuthStore` để lấy token

### 2. Action Management (Custom Pages)
**Location**: `src/screens/admin/actions/`
**Technology**: Custom React components với React Query
**Pages**:
- Dashboard (`AdminDashboard.tsx`) - Trang chủ admin với thống kê
- Complaints (`AdminComplaints.tsx`) - Quản lý khiếu nại với logic phức tạp (respond, notify, status update)

**API Clients**: `src/api/adminapi/actions/`
- `complaints.ts` - Custom API cho complaints management

## Cấu trúc Backend

### Data Management Controllers
**Location**: `backend/src/controllers/admin/`
- `user.controller.ts`
- `seller.controller.ts`
- `product.controller.ts`
- `category.controller.ts`
- `order.controller.ts`
- `review.controller.ts`
- `voucher.controller.ts`

**Routes**: `backend/src/routes/modules/admin.routes.ts`
- Standard CRUD endpoints: GET, POST, PUT, DELETE

### Action Management Controllers
**Location**: `backend/src/controllers/`
- `complaint.controller.ts` - Custom logic cho complaints
- `auth.controller.ts` - Admin authentication

**Routes**: 
- `backend/src/routes/modules/admin.routes.ts` - Auth routes
- `backend/src/routes/modules/complaint.routes.ts` - Complaint routes

## Routing

### Frontend Routes (`src/admin/RefineApp.tsx`)
```
/admin/login              - Login page (không qua Refine)
/admin/dashboard          - Dashboard (Action Management)
/admin/complaints         - Complaints (Action Management)
/admin/products           - Products list (Data Management - Refine)
/admin/products/show/:id  - Product detail (Data Management - Refine)
/admin/products/edit/:id  - Product edit (Data Management - Refine)
... (tương tự cho các resources khác)
```

### Backend Routes
```
POST   /admin/login                    - Admin login
GET    /admin/me                       - Get current admin
GET    /admin/users                    - List users (Data Management)
POST   /admin/users                    - Create user (Data Management)
PUT    /admin/users/:id                - Update user (Data Management)
DELETE /admin/users/:id               - Delete user (Data Management)
... (tương tự cho các resources khác)
GET    /complaints/admin               - List complaints (Action Management)
POST   /complaints/admin/:id/respond   - Respond to complaint (Action Management)
```

## Files đã được tổ chức lại

### Đã di chuyển:
- `src/screens/admin/refine/*` → `src/screens/admin/data/*`
- `src/screens/admin/AdminComplaints.tsx` → `src/screens/admin/actions/AdminComplaints.tsx`
- `src/screens/admin/AdminDashboard.tsx` → `src/screens/admin/actions/AdminDashboard.tsx`
- `src/api/adminapi/adminUsers.ts` → `src/api/adminapi/data/adminUsers.ts`
- `src/api/adminapi/adminSellers.ts` → `src/api/adminapi/data/adminSellers.ts`
- `src/api/adminapi/adminVouchers.ts` → `src/api/adminapi/data/adminVouchers.ts`
- `src/api/adminapi/complaints.ts` → `src/api/adminapi/actions/complaints.ts`

### Đã xóa:
- `src/screens/admin/AdminUsers.tsx` (thay bằng Refine UserList)
- `src/screens/admin/AdminSellers.tsx` (thay bằng Refine SellerList)
- `src/screens/admin/AdminVoucher.tsx` (thay bằng Refine VoucherList)
- `src/screens/admin/CategoryPage.tsx` (thay bằng Refine CategoryList)
- `src/screens/admin/data/ComplaintList.tsx` (Complaints là action, không phải data)
- `src/admin/AdminApp.tsx` (không được sử dụng)

## Lợi ích

1. **Tách biệt rõ ràng**: Data management và action management được tách biệt
2. **Dễ bảo trì**: Mỗi phần có cấu trúc riêng, dễ tìm và sửa
3. **Mở rộng dễ dàng**: Thêm data resource mới → thêm vào `data/`, thêm action mới → thêm vào `actions/`
4. **Tận dụng Refine**: Data management sử dụng Refine để giảm boilerplate code
5. **Linh hoạt**: Action management có thể có logic phức tạp mà không bị ràng buộc bởi Refine

