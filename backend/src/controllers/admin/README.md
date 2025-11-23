# Admin Controllers Structure

## Tổng quan

Backend admin controllers được chia thành 2 nhóm:

### 1. Data Management Controllers (CRUD)
**Location**: `backend/src/controllers/admin/`
**Purpose**: Standard CRUD operations cho data resources
**Controllers**:
- `user.controller.ts` - Quản lý users
- `seller.controller.ts` - Quản lý sellers
- `product.controller.ts` - Quản lý products
- `category.controller.ts` - Quản lý categories
- `order.controller.ts` - Quản lý orders
- `review.controller.ts` - Quản lý reviews
- `voucher.controller.ts` - Quản lý vouchers

**Routes**: `/admin/users`, `/admin/sellers`, `/admin/products`, etc.
**Methods**: GET (list, by id), POST (create), PUT (update), DELETE

### 2. Action Management Controllers (Custom Actions)
**Location**: `backend/src/controllers/` (không phải admin/)
**Purpose**: Custom business logic, không phải standard CRUD
**Controllers**:
- `complaint.controller.ts` - Quản lý complaints (respond, notify, status update)
- `auth.controller.ts` - Admin authentication

**Routes**: `/admin/login`, `/complaints/admin/*`
**Methods**: Custom endpoints với logic phức tạp

## API Endpoints

### Data Management (CRUD)
```
GET    /admin/users           - List users
GET    /admin/users/:id       - Get user by id
POST   /admin/users           - Create user
PUT    /admin/users/:id       - Update user
DELETE /admin/users/:id      - Delete user

(Same pattern for: sellers, products, categories, orders, reviews, vouchers)
```

### Action Management (Custom)
```
POST   /admin/login                    - Admin login
GET    /admin/me                       - Get current admin
GET    /complaints/admin               - List complaints (with filters)
POST   /complaints/admin/:id/respond   - Respond to complaint
```

