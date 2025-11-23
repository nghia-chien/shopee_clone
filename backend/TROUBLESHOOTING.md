# Troubleshooting Guide

## Lỗi 500 khi đặt hàng

### Nguyên nhân phổ biến

#### 1. Prisma Schema chưa được migrate

**Triệu chứng:**
- Error 500 khi gọi `/api/orders`
- Error message có chứa "P" code (ví dụ: P2001, P2021)
- Console log: "Database error" hoặc "Unknown column 'status'"

**Giải pháp:**
```bash
cd backend
npx prisma migrate dev --name add_shipping_status_tracking
npx prisma generate
```

Sau đó restart server.

#### 2. Số điện thoại không hợp lệ

**Triệu chứng:**
- Error: "Shop phone number is invalid: Số điện thoại là bắt buộc"
- Error: "Shop phone number is invalid"
- Error: "Customer phone number is invalid"

**Giải pháp:**

1. **Tạo file `.env` trong thư mục `backend/`** (nếu chưa có):
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Kiểm tra `SHIP_FROM_PHONE` trong `.env`**:
   - Phải là 10 số, bắt đầu bằng 0
   - Ví dụ hợp lệ: `SHIP_FROM_PHONE=0123456789` hoặc `SHIP_FROM_PHONE=0987654321`
   - Ví dụ không hợp lệ: `SHIP_FROM_PHONE=+84123456789`, `SHIP_FROM_PHONE=84123456789`
   - ⚠️ **KHÔNG có dấu ngoặc kép** xung quanh số điện thoại: `SHIP_FROM_PHONE=0987654321` (đúng) ✅
   - ❌ **KHÔNG dùng**: `SHIP_FROM_PHONE="0987654321"` (sai)

3. **Restart server** sau khi thêm/sửa `.env`:
   ```bash
   # Dừng server (Ctrl+C)
   # Sau đó chạy lại:
   npm run dev
   # hoặc
   yarn dev
   ```

4. **Kiểm tra xem env variable có được load không**:
   - Xem console log của server khi đặt hàng
   - Sẽ có log: `📞 Environment variable check:` với thông tin `SHIP_FROM_PHONE`

5. **Kiểm tra số điện thoại trong address của customer**:
   - Phải đúng format Việt Nam (10 số, bắt đầu 0)
   - Cập nhật address nếu cần

#### 3. Thiếu environment variables

**Triệu chứng:**
- Error: "GHN token is not configured"
- Error: "Shop phone number is invalid" (khi SHIP_FROM_PHONE không được set)

**Giải pháp:**
Đảm bảo các biến sau được set trong `.env`:
```env
GHN_API=https://online-gateway.ghn.vn
GHN_TOKEN=your_token_here
SHIP_FROM_NAME=Shop Name
SHIP_FROM_PHONE=0123456789
SHIP_FROM_ADDRESS=Địa chỉ shop
SHIP_FROM_WARD_CODE=ward_code
SHIP_FROM_DISTRICT_ID=1450
```

#### 4. Address thiếu GHN IDs

**Triệu chứng:**
- Error: "Địa chỉ chưa có đầy đủ thông tin GHN (ward_code, district_id)"
- Error: "Cannot connect to GHN API"

**Giải pháp:**
1. Đảm bảo address có `ward_code` và `district_id`
2. Sử dụng AddressSelector component để chọn địa chỉ (tự động lưu GHN IDs)
3. Nếu address cũ không có GHN IDs, cần cập nhật lại

### Kiểm tra logs

Để debug lỗi 500, kiểm tra console log của server:

```bash
# Backend server logs sẽ hiển thị:
❌ createOrderController error: [error details]
Error stack: [stack trace]
Error details: { message, code, meta }
```

### Test endpoints

1. **Test GHN connectivity:**
```bash
curl http://localhost:4000/api/shipping/provinces
```

2. **Test order creation với đầy đủ data:**
- Đảm bảo có address với đầy đủ GHN IDs
- Đảm bảo có cart items
- Đảm bảo payment_method được set

### Common Error Codes

- **P2001**: Record not found (Prisma)
- **P2021**: Table does not exist (Prisma - cần migrate)
- **P2025**: Record not found for update (Prisma)
- **500**: Internal server error (check logs)

### Quick Fix Checklist

- [ ] Đã chạy `npx prisma migrate dev`
- [ ] Đã chạy `npx prisma generate`
- [ ] Đã restart server sau khi migrate
- [ ] `SHIP_FROM_PHONE` trong `.env` đúng format (10 số, bắt đầu 0)
- [ ] Address có `ward_code` và `district_id`
- [ ] `GHN_TOKEN` được set trong `.env`
- [ ] GHN API có thể connect được

