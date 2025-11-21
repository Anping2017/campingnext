# 环境变量配置指南

## 🔑 OpenAI API Key 配置

### 方法 1：手动创建文件（推荐）

1. 在 `apps/web/` 目录下创建 `.env.local` 文件
2. 添加以下内容：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 方法 2：使用 PowerShell 命令

在项目根目录运行：

```powershell
$apiKey = "your_openai_api_key_here"
$content = "OPENAI_API_KEY=$apiKey"
[System.IO.File]::WriteAllText("$PWD\apps\web\.env.local", $content)
```

### 方法 3：使用文本编辑器

1. 打开 `apps/web/` 目录
2. 创建新文件 `.env.local`
3. 复制粘贴上面的内容

## ✅ 验证配置

配置完成后，重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
cd apps/web
pnpm dev
```

## 🧪 测试 AI 功能

配置成功后，可以测试：
1. 首页：输入地点、天数等信息，点击"获取推荐"
2. 行程页：生成行程，查看 AI 推荐
3. 营地详情：查看 AI 摘要

## 🔒 安全提示

- ✅ `.env.local` 已在 `.gitignore` 中
- ⚠️ 不要将 API Key 提交到 Git
- ⚠️ 不要分享 API Key 给他人


