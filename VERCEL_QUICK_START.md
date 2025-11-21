# Vercel 快速部署指南

## 🚀 快速开始（3 步）

### 1. 安装 Vercel CLI（如果还没有）

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

在项目根目录执行：

```bash
vercel
```

首次部署会提示配置，按以下设置：
- **项目名称**: `nomad-nz`（或你喜欢的名称）
- **根目录**: `apps/web` ✅
- **构建命令**: 使用默认（会自动检测）✅
- **输出目录**: `.next` ✅

## 📋 环境变量配置

部署后，在 Vercel Dashboard 中添加环境变量：

1. 进入项目设置 → Environment Variables
2. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
OPENAI_API_KEY=你的 OpenAI API Key
```

3. 选择环境：Production, Preview, Development（全选）
4. 保存后重新部署

## 🌐 通过 GitHub 部署（推荐）

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. 配置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd apps/web && pnpm install && pnpm build`
   - **Install Command**: `pnpm install`
6. 添加环境变量（同上）
7. 点击 Deploy

## ✅ 部署后检查

访问你的 Vercel URL，检查：
- [ ] 首页正常加载
- [ ] 登录功能正常
- [ ] 营地数据可以加载
- [ ] 社区帖子可以显示

## 🔧 常见问题

### 构建失败：找不到 pnpm

在 Vercel 项目设置中：
- **Install Command**: `npm install -g pnpm && pnpm install`

### 环境变量未生效

- 确保变量名正确（`NEXT_PUBLIC_` 前缀）
- 重新部署项目
- 检查环境选择（Production/Preview/Development）

### Monorepo 依赖问题

如果遇到 `common` 包找不到：
1. 确保 `packages/common` 已正确配置
2. 检查 `pnpm-workspace.yaml` 配置
3. 在 Vercel 设置中使用 `pnpm install` 作为安装命令

## 📚 更多信息

详细部署文档请查看：`apps/web/VERCEL_DEPLOY.md`

