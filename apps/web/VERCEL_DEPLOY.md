# Vercel 部署指南

## 前置要求

1. 确保已安装 [Vercel CLI](https://vercel.com/docs/cli)：
   ```bash
   npm i -g vercel
   ```

2. 确保已登录 Vercel：
   ```bash
   vercel login
   ```

## 部署步骤

### 方法一：使用 Vercel CLI（推荐）

1. **在项目根目录执行部署**：
   ```bash
   vercel
   ```

2. **首次部署会提示配置**：
   - 是否链接到现有项目？选择 `N`（新建项目）
   - 项目名称：输入 `nomad-nz` 或你喜欢的名称
   - 根目录：输入 `apps/web`
   - 构建命令：`cd apps/web && pnpm install && pnpm build`
   - 输出目录：`.next`

3. **生产环境部署**：
   ```bash
   vercel --prod
   ```

### 方法二：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 Git 仓库（GitHub/GitLab/Bitbucket）
4. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd apps/web && pnpm install && pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

## 环境变量配置

在 Vercel Dashboard 的项目设置中添加以下环境变量：

### 必需的环境变量

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 配置步骤

1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加上述三个环境变量
4. 选择环境（Production, Preview, Development）
5. 点击 "Save"

## 构建配置

项目已配置 `vercel.json`，Vercel 会自动识别：
- Framework: Next.js
- Root Directory: `apps/web`
- Build Command: 自动检测或使用配置的命令

## 常见问题

### 1. 构建失败：找不到依赖

**解决方案**：
- 确保 `package.json` 中所有依赖都已正确安装
- 检查 `pnpm-lock.yaml` 是否存在
- 在 Vercel 设置中使用 `pnpm install` 作为安装命令

### 2. 环境变量未生效

**解决方案**：
- 确保环境变量名称以 `NEXT_PUBLIC_` 开头（客户端变量）
- 重新部署项目以应用新的环境变量
- 检查 Vercel 环境变量设置中的环境选择（Production/Preview/Development）

### 3. Supabase 连接失败

**解决方案**：
- 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
- 确保 Supabase 项目的 RLS 策略已正确配置
- 检查 Supabase 项目的网络访问设置

### 4. OpenAI API 调用失败

**解决方案**：
- 检查 `OPENAI_API_KEY` 是否正确设置
- 确保 API Key 有足够的额度
- 检查 API Key 的权限设置

## 部署后检查清单

- [ ] 环境变量已正确配置
- [ ] 构建成功无错误
- [ ] 首页可以正常访问
- [ ] 登录/注册功能正常
- [ ] 营地数据可以正常加载
- [ ] 社区帖子可以正常显示
- [ ] 行程生成功能正常

## 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## 持续集成

Vercel 会自动：
- 监听 Git 仓库的 push 事件
- 自动构建和部署新版本
- 为每个 Pull Request 创建预览环境

## 性能优化建议

1. **启用 Vercel Analytics**（可选）
2. **配置 Edge Functions**（如果需要）
3. **使用 Vercel Image Optimization**
4. **启用 Automatic HTTPS**

## 支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

