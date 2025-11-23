# Schema Improvements Summary

## Các cải thiện đã thực hiện

### 1. ✅ shipping_order Model

**Thay đổi:**
- `status` field: Từ `shipping_status?` (nullable) → `shipping_status` (required với default)
  - Lý do: Có default value nên không cần nullable, đảm bảo mọi record đều có status

**Indexes đã thêm:**
- `@@index([status])` - Để query failed/retrying orders nhanh hơn
- `@@index([ghn_order_code])` - Để lookup theo GHN order code
- `@@index([retry_count])` - Để filter orders theo retry count
- `@@index([seller_order_id])` - Để join với seller_order nhanh hơn (mặc dù đã có unique)

**Lợi ích:**
- Query performance tốt hơn khi filter theo status
- Tìm kiếm theo ghn_order_code nhanh hơn
- Background job retry có thể query failed orders hiệu quả hơn

### 2. ✅ address Model

**Indexes đã thêm:**
- `@@index([user_id])` - Để query addresses của user nhanh hơn
- `@@index([province_id])` - Để query theo province (nếu cần analytics)
- `@@index([district_id])` - Để query theo district
- `@@index([ward_code])` - Để query theo ward code
- `@@index([is_default])` - Để query default address nhanh hơn

**Lợi ích:**
- Query addresses của user nhanh hơn
- Tìm default address hiệu quả hơn
- Có thể query theo location (province/district/ward) nếu cần

### 3. ✅ Data Integrity

**Cải thiện:**
- `shipping_order.status` là required (không nullable) với default value
- Đảm bảo mọi shipping_order đều có status rõ ràng

## Migration Required

Sau khi cập nhật schema, cần chạy migration:

```bash
cd backend
npx prisma migrate dev --name add_shipping_indexes_and_fix_status
npx prisma generate
```

## Performance Impact

### Queries được cải thiện:

1. **Query failed shipping orders:**
   ```typescript
   // Trước: Full table scan
   // Sau: Index scan trên status field
   prisma.shipping_order.findMany({
     where: { status: 'failed' }
   })
   ```

2. **Query shipping order by GHN code:**
   ```typescript
   // Trước: Full table scan
   // Sau: Index scan trên ghn_order_code
   prisma.shipping_order.findFirst({
     where: { ghn_order_code: '...' }
   })
   ```

3. **Query user addresses:**
   ```typescript
   // Trước: Full table scan
   // Sau: Index scan trên user_id
   prisma.address.findMany({
     where: { user_id: '...' }
   })
   ```

4. **Query default address:**
   ```typescript
   // Trước: Full table scan
   // Sau: Index scan trên is_default
   prisma.address.findFirst({
     where: { user_id: '...', is_default: true }
   })
   ```

## Schema Validation

Schema đã được validate và format:
- ✅ Prisma schema is valid
- ✅ All relations are correct
- ✅ All indexes are properly defined
- ✅ Data types are consistent

## Next Steps

1. Chạy migration để apply indexes vào database
2. Monitor query performance sau khi migration
3. Có thể thêm composite indexes nếu cần query theo nhiều fields cùng lúc

