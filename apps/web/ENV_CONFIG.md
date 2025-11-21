# 环境变量配置说明

## 📝 检查当前配置

运行以下命令检查 `.env.local` 文件：

```powershell
Get-Content .env.local
```

## ✅ 正确的配置格式

`.env.local` 文件应该包含：

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase 配置（必需，用于登录功能）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ 常见问题

### 1. 环境变量未生效
- **原因**：Next.js 需要在启动时读取环境变量
- **解决**：重启开发服务器（停止后重新运行 `pnpm dev`）

### 2. 变量名错误
- ❌ 错误：`SUPABASE_URL`（缺少 `NEXT_PUBLIC_` 前缀）
- ✅ 正确：`NEXT_PUBLIC_SUPABASE_URL`

### 3. 值包含空格或引号
- ❌ 错误：`NEXT_PUBLIC_SUPABASE_URL="https://..."`（不要加引号）
- ✅ 正确：`NEXT_PUBLIC_SUPABASE_URL=https://...`

### 4. 文件位置错误
- 文件必须在 `apps/web/.env.local`（不是项目根目录）

## 🔍 调试方法

打开浏览器控制台，查看是否有 "Supabase 配置检查" 的日志输出。

