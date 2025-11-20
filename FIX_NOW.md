# 🚨 KHẮC PHỤC NGAY - Model admin chưa được tạo

## ⚠️ QUAN TRỌNG: Đóng backend server trước!

### Bước 1: Đóng Backend Server

1. Tìm terminal đang chạy backend (có dòng `npm run dev` hoặc `tsx watch`)
2. Nhấn `Ctrl + C` để dừng
3. Đảm bảo không còn process Node.js nào đang chạy

### Bước 2: Xóa Cache và Generate Lại

**Cách 1: Dùng script PowerShell (KHUYẾN NGHỊ - Tự động kill process):**
```powershell
cd backend
.\fix-prisma.ps1
```

**Cách 2: Script đơn giản:**
```powershell
cd backend
.\fix-prisma-simple.ps1
```

**Cách 3: Thủ công:**
```powershell
cd backend

# Kill tất cả process Node.js
Get-Process -Name "node","tsx" -ErrorAction SilentlyContinue | Stop-Process -Force

# Đợi 2 giây
Start-Sleep -Seconds 2

# Xóa cache Prisma
Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue

# Đợi thêm 2 giây
Start-Sleep -Seconds 2

# Generate lại
npx prisma generate
```

### Bước 3: Kiểm Tra

```bash
cd backend
npm run check:admin
```

Nếu vẫn báo lỗi, thử:

```bash
# Test xem model admin có trong Prisma client không
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('Has admin?', 'admin' in p);"
```

Nếu in ra `true` thì đã OK.

### Bước 4: Tạo Bảng và Admin

```bash
cd backend

# Tạo bảng admin (nếu chưa có)
# Chạy SQL trong: backend/prisma/migrations/create_admin_table.sql

# Tạo admin mặc định
npm run setup:admin
```

### Bước 5: Khởi Động Lại Backend

```bash
cd backend
npm run dev
```

## 🔍 Nếu Vẫn Lỗi

1. **Kiểm tra schema.prisma:**
   - Mở `backend/prisma/schema.prisma`
   - Tìm model `admin` (dòng 197-204)
   - Đảm bảo không có lỗi syntax

2. **Restart máy tính:**
   - Đôi khi file bị lock và cần restart

3. **Xóa và cài lại:**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npm install
   npx prisma generate
   ```

## ✅ Checklist

- [ ] Đã đóng backend server
- [ ] Đã xóa `node_modules/.prisma/client`
- [ ] Đã chạy `npx prisma generate` thành công
- [ ] Đã kiểm tra model admin có trong Prisma client
- [ ] Đã tạo bảng admin trong database
- [ ] Đã tạo admin mặc định
- [ ] Đã khởi động lại backend server

