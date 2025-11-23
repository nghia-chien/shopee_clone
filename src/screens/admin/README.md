# Admin Panel Structure

## Tổng quan

Admin panel được chia thành 2 phần chính:

### 1. Data Management (Quản lý dữ liệu)
**Location**: `src/screens/admin/data/`
**Technology**: Refine (CRUD operations)
**Resources**:
- Products (Sản phẩm)
- Categories (Danh mục)
- Orders (Đơn hàng)
- Reviews (Đánh giá)
- Users (Người dùng)
- Sellers (Người bán)
- Vouchers (Mã giảm giá)

**API**: `src/api/adminapi/data/`
- Standard CRUD operations
- Managed through Refine dataProvider

### 2. Action Management (Quản lý hành động)
**Location**: `src/screens/admin/actions/`
**Technology**: Custom React components
**Pages**:
- Dashboard (Trang chủ admin)
- Complaints (Khiếu nại - có logic phức tạp: respond, notify, status update)
- Analytics (Thống kê - tương lai)
- Settings (Cài đặt - tương lai)

**API**: `src/api/adminapi/actions/`
- Custom API endpoints
- Complex business logic

## Cấu trúc thư mục

```
src/screens/admin/
├── data/              # Data Management (Refine CRUD)
│   ├── ProductList.tsx
│   ├── CategoryList.tsx
│   ├── OrderList.tsx
│   ├── ReviewList.tsx
│   ├── UserList.tsx
│   ├── SellerList.tsx
│   └── VoucherList.tsx
└── actions/           # Action Management (Custom pages)
    ├── AdminDashboard.tsx
    └── AdminComplaints.tsx

src/api/adminapi/
├── data/              # Data Management APIs
│   ├── adminUsers.ts
│   ├── adminSellers.ts
│   └── adminVouchers.ts
└── actions/           # Action Management APIs
    └── complaints.ts
```

## Routing

- **Login**: `/admin/login` (không qua Refine)
- **Data Management**: `/admin/products`, `/admin/categories`, etc. (qua Refine)
- **Action Management**: `/admin/dashboard`, `/admin/complaints` (custom routes)

