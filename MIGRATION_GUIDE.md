# 🔄 HƯỚNG DẪN MIGRATION - SELLER CÓ THỂ MUA HÀNG

## ⚠️ QUAN TRỌNG

Sau khi cập nhật schema Prisma, bạn **BẮT BUỘC** phải chạy migration để cập nhật database.

---

## 📝 CÁC BƯỚC MIGRATION

### 1. Kiểm tra schema đã được cập nhật

**File:** `backend/prisma/schema.prisma`

Đảm bảo các model đã có:
- ✅ `Seller` có quan hệ `cart_items` và `orders`
- ✅ `cart_item` có `seller_id` (optional) và quan hệ `seller`
- ✅ `Orders` có `seller_id` (optional) và quan hệ `seller`

### 2. Tạo Migration

```bash
cd backend
yarn prisma migrate dev --name add_seller_shopping_capability
```

**Migration này sẽ:**
- Thêm column `seller_id` (nullable) vào `cart_item` table
- Thêm column `seller_id` (nullable) vào `orders` table
- Thêm foreign key constraints
- Thêm unique constraints cho `seller_id + product_id`

### 3. Generate Prisma Client

```bash
yarn prisma generate
```

**Quan trọng:** Phải generate lại client sau migration!

### 4. Restart Backend Server

```bash
yarn dev
```

---

## ✅ KIỂM TRA MIGRATION

### Sau khi migration thành công:

1. **Kiểm tra database:**
   ```sql
   -- Xem cấu trúc cart_item table
   \d cart_item
   
   -- Xem cấu trúc orders table  
   \d orders
   ```

2. **Kiểm tra constraints:**
   - `cart_item_seller_product_key` unique constraint
   - Foreign keys từ `cart_item.seller_id` → `seller.id`
   - Foreign keys từ `orders.seller_id` → `seller.id`

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Column already exists"

**Nguyên nhân:** Có thể đã có column `seller_id` từ trước.

**Giải pháp:**
1. Kiểm tra database hiện tại
2. Nếu đã có, có thể skip migration hoặc rollback trước

### Lỗi: "Foreign key constraint failed"

**Nguyên nhân:** Dữ liệu trong `seller_id` không match với `seller.id`

**Giải pháp:**
1. Kiểm tra dữ liệu trong database
2. Clean up dữ liệu không hợp lệ
3. Chạy lại migration

### Lỗi: "Unique constraint violation"

**Nguyên nhân:** Có duplicate records trong `cart_item`

**Giải pháp:**
1. Xóa duplicate records trước
2. Chạy lại migration

---

## 📊 DATABASE CHANGES SUMMARY

### `cart_item` table:

**Before:**
```sql
user_id VARCHAR NOT NULL
```

**After:**
```sql
user_id VARCHAR NULLABLE
seller_id VARCHAR NULLABLE
UNIQUE(user_id, product_id)
UNIQUE(seller_id, product_id)
FOREIGN KEY (seller_id) REFERENCES seller(id)
```

### `orders` table:

**Before:**
```sql
user_id VARCHAR NOT NULL
```

**After:**
```sql
user_id VARCHAR NULLABLE
seller_id VARCHAR NULLABLE
updated_at TIMESTAMP
FOREIGN KEY (seller_id) REFERENCES seller(id)
```

---

## ✅ VERIFICATION

Sau khi migration xong, test:

1. **Seller đăng nhập**
2. **Seller add to cart** (sản phẩm của seller khác)
3. **Seller tạo order**
4. **Kiểm tra database:**
   - `cart_item` có `seller_id` được set
   - `orders` có `seller_id` được set

---

## 🚨 LƯU Ý

- ⚠️ Migration sẽ **KHÔNG** xóa dữ liệu cũ
- ⚠️ Dữ liệu cũ vẫn có `user_id`, giờ có thể có thêm `seller_id`
- ⚠️ Backend code cần handle cả User và Seller trong Orders/cart_item

