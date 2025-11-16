# Script PowerShell để fix lỗi Prisma generate
# Chạy: .\fix-prisma.ps1

Write-Host "🔧 Đang fix lỗi Prisma generate..." -ForegroundColor Cyan
Write-Host ""

# Bước 1: Tìm và kill tất cả process Node.js
Write-Host "1. Đang tìm và dừng các process Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Tìm thấy $($nodeProcesses.Count) process Node.js" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   Đang dừng process: $($_.Id) - $($_.ProcessName)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Đã dừng tất cả process Node.js" -ForegroundColor Green
} else {
    Write-Host "   ✅ Không có process Node.js nào đang chạy" -ForegroundColor Green
}

# Bước 2: Tìm và kill process tsx (nếu có)
Write-Host ""
Write-Host "2. Đang tìm và dừng các process tsx..." -ForegroundColor Yellow
$tsxProcesses = Get-Process -Name "tsx" -ErrorAction SilentlyContinue
if ($tsxProcesses) {
    Write-Host "   Tìm thấy $($tsxProcesses.Count) process tsx" -ForegroundColor Yellow
    $tsxProcesses | ForEach-Object {
        Write-Host "   Đang dừng process: $($_.Id) - $($_.ProcessName)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Đã dừng tất cả process tsx" -ForegroundColor Green
} else {
    Write-Host "   ✅ Không có process tsx nào đang chạy" -ForegroundColor Green
}

# Bước 3: Xóa cache Prisma
Write-Host ""
Write-Host "3. Đang xóa cache Prisma..." -ForegroundColor Yellow
$prismaClientPath = "node_modules\.prisma\client"
if (Test-Path $prismaClientPath) {
    try {
        Remove-Item -Recurse -Force $prismaClientPath -ErrorAction Stop
        Write-Host "   ✅ Đã xóa cache Prisma client" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Không thể xóa cache (có thể đang được sử dụng): $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Thử đóng tất cả terminal/IDE và chạy lại script này" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Không có cache để xóa" -ForegroundColor Gray
}

# Bước 4: Đợi một chút để đảm bảo file được giải phóng
Write-Host ""
Write-Host "4. Đang đợi file được giải phóng..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Bước 5: Generate Prisma client
Write-Host ""
Write-Host "5. Đang generate Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Đã generate Prisma client thành công!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Bây giờ bạn có thể:" -ForegroundColor Cyan
        Write-Host "  1. Chạy: npm run setup:admin (để tạo admin mặc định)" -ForegroundColor White
        Write-Host "  2. Chạy: npm run dev (để khởi động backend)" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Lỗi khi generate Prisma client" -ForegroundColor Red
        Write-Host "💡 Thử restart máy tính và chạy lại script này" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Thử restart máy tính và chạy lại script này" -ForegroundColor Yellow
}

Write-Host ""

