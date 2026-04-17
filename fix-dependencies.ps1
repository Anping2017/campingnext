# 修复依赖脚本
Write-Host "开始修复依赖..." -ForegroundColor Green

# 清理缓存
Write-Host "清理缓存..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "apps/mobile/node_modules") {
    Remove-Item -Recurse -Force apps/mobile/node_modules
}
if (Test-Path "apps/web/node_modules") {
    Remove-Item -Recurse -Force apps/web/node_modules
}
if (Test-Path "apps/mobile/.expo") {
    Remove-Item -Recurse -Force apps/mobile/.expo
}

# 重新安装依赖
Write-Host "重新安装依赖..." -ForegroundColor Yellow
pnpm install

# 修复 Expo 依赖
Write-Host "修复 Expo 依赖..." -ForegroundColor Yellow
Set-Location apps/mobile
npx expo install --fix
Set-Location ../..

Write-Host "完成！现在可以运行 pnpm dev:mobile" -ForegroundColor Green






