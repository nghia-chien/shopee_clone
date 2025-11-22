# Shipping Retry System Setup Guide

## Tổng quan

Hệ thống retry tự động cho GHN shipping orders với các tính năng:
- ✅ Retry mechanism với exponential backoff
- ✅ Status tracking (pending, created, failed, retrying)
- ✅ Background job để tự động retry failed orders
- ✅ Validation trước khi tạo order
- ✅ Notification/Alert system
- ✅ Admin endpoints để retry manually

## Setup

### 1. Chạy Migration

```bash
cd backend
npx prisma migrate dev --name add_shipping_status_tracking
npx prisma generate
```

### 2. Cấu hình Environment Variables

Đảm bảo các biến sau được set trong `.env`:

```env
# GHN API
GHN_API=https://online-gateway.ghn.vn
GHN_TOKEN=your_ghn_token_here

# Shop pickup address
SHIP_FROM_NAME=Shop Name
SHIP_FROM_PHONE=0123456789
SHIP_FROM_ADDRESS=Địa chỉ shop
SHIP_FROM_WARD_CODE=ward_code_here
SHIP_FROM_DISTRICT_ID=1450
```

**⚠️ Lưu ý về số điện thoại:**
- GHN API yêu cầu số điện thoại Việt Nam: **10 số, bắt đầu bằng 0**
- Format hợp lệ: `0123456789`, `0987654321`
- Format không hợp lệ: `+84123456789`, `84123456789`, `1234567890`
- Hệ thống sẽ tự động convert:
  - `+84123456789` → `0123456789`
  - `84123456789` → `0123456789`
  - Loại bỏ khoảng trắng, dấu gạch ngang: `0123-456-789` → `0123456789`

### 3. Setup Background Job (Optional)

Để tự động retry failed orders, thêm vào `server.ts`:

```typescript
import { setupShippingRetryCron } from './jobs/shippingRetry.job';

// Chạy mỗi 30 phút
setupShippingRetryCron();
```

Hoặc dùng cron job system khác (PM2, node-cron, etc.)

## API Endpoints

### 1. Retry một shipping order cụ thể

```http
POST /api/shipping/retry/:shippingOrderId
Content-Type: application/json

{
  "maxRetries": 3
}
```

### 2. Retry tất cả failed orders

```http
POST /api/shipping/retry-all
Content-Type: application/json

{
  "maxRetries": 3
}
```

### 3. Lấy danh sách shipping orders

```http
GET /api/shipping/orders?status=failed&limit=50&offset=0
```

Query params:
- `status`: `pending` | `created` | `failed` | `retrying`
- `limit`: số lượng records (default: 50)
- `offset`: offset (default: 0)

## Status Flow

```
pending → created (success)
       → failed (after retries)
       → retrying (when background job retries)
       → created (success after retry)
```

## Notification System

Hiện tại notification được log ra console. Có thể mở rộng trong `backend/src/services/notification.service.ts` để:
- Gửi email
- Gửi Slack webhook
- Gửi Discord webhook
- SMS notification
- Push notification cho admin app

## Monitoring

### Kiểm tra failed orders

```sql
SELECT COUNT(*) 
FROM shipping_order 
WHERE status = 'failed';
```

### Kiểm tra orders đang retry

```sql
SELECT * 
FROM shipping_order 
WHERE status = 'retrying' 
ORDER BY last_retry_at DESC;
```

### Kiểm tra retry count

```sql
SELECT 
  status,
  AVG(retry_count) as avg_retries,
  MAX(retry_count) as max_retries
FROM shipping_order
GROUP BY status;
```

## Troubleshooting

### Lỗi: "GHN token is not configured"
- Kiểm tra `GHN_TOKEN` trong `.env`

### Lỗi: "Cannot connect to GHN API"
- Kiểm tra network connectivity
- Kiểm tra `GHN_API` URL
- Kiểm tra GHN API status

### Orders vẫn fail sau nhiều retries
- Kiểm tra address có đủ `ward_code` và `district_id`
- Kiểm tra shop config (from_address, from_ward_code, etc.)
- Kiểm tra GHN API response để xem lỗi cụ thể

### Lỗi: "master_data_validate_phone - số điện thoại không đúng"
- **Nguyên nhân**: Số điện thoại không đúng format mà GHN yêu cầu
- **Giải pháp**:
  1. Kiểm tra `SHIP_FROM_PHONE` trong `.env` - phải là 10 số, bắt đầu bằng 0
  2. Kiểm tra số điện thoại trong address của customer - phải đúng format
  3. Hệ thống sẽ tự động convert các format sau:
     - `+84123456789` → `0123456789`
     - `84123456789` → `0123456789`
     - `0123-456-789` → `0123456789`
  4. Nếu vẫn lỗi, kiểm tra log để xem số điện thoại nào đang bị reject

## Best Practices

1. **Monitor failed orders thường xuyên**: Setup alert khi có > 10 failed orders
2. **Review error messages**: Logs chứa thông tin chi tiết về lỗi
3. **Validate addresses**: Đảm bảo addresses có đủ GHN IDs trước khi tạo order
4. **Retry strategy**: Không retry quá nhiều lần (max 10 retries) để tránh spam GHN API
5. **Manual intervention**: Có thể retry manually qua API endpoints

