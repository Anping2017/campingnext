# Vercel 构建问题修复

## 问题

构建时出现 "Module not found" 错误，无法解析 `@/` 路径别名。

## 原因

当 Root Directory 设置为 `apps/web` 时，Vercel 的工作目录已经是 `apps/web`，但路径解析可能有问题。

## 解决方案

### 方案 1：确保 Root Directory 正确设置（推荐）

在 Vercel Dashboard 中：
1. 进入项目设置 → General
2. 确认 **Root Directory** 设置为：`apps/web`
3. 确认 **Build Command** 为：`pnpm install && pnpm build`
4. 确认 **Output Directory** 为：`.next`

### 方案 2：如果方案 1 不行，使用项目根目录

如果路径解析仍有问题，可以：
1. 将 **Root Directory** 设置为：`/`（项目根目录）
2. 修改 `vercel.json`：

```json
{
  "buildCommand": "cd apps/web && pnpm install && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### 方案 3：检查文件是否存在

确保以下文件存在：
- `apps/web/src/components/AuthModal.tsx`
- `apps/web/src/components/NavBar.tsx`
- `apps/web/src/data/camps.json`

## 当前配置

- `tsconfig.json` 已配置 `baseUrl: "."` 和 `paths: { "@/*": ["./src/*"] }`
- `next.config.js` 已配置 `transpilePackages: ['common']`

## 验证

重新部署后，检查构建日志是否还有 "Module not found" 错误。

