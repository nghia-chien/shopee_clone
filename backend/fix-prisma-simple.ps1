# Script đơn giản để fix Prisma - Chạy: .\fix-prisma-simple.ps1

Write-Host "Killing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node","tsx" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removing Prisma cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\.prisma\client" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

