# 更新 pnpm-lock.yaml

## 问题

`pnpm-lock.yaml` 与 `package.json` 不同步，因为我们将 `tailwindcss`、`postcss`、`autoprefixer` 移到了 `dependencies`。

## 解决方案

在项目根目录运行：

```bash
pnpm install
```

这会更新 `pnpm-lock.yaml` 文件，使其与 `package.json` 同步。

然后提交更改：

```bash
git add pnpm-lock.yaml apps/web/package.json
git commit -m "fix: update lockfile after moving tailwindcss to dependencies"
git push
```

## 为什么需要这样做？

- `pnpm-lock.yaml` 记录了所有依赖的确切版本
- 当我们修改 `package.json` 时，需要更新 lockfile
- Vercel 使用 `--frozen-lockfile` 标志，要求 lockfile 与 package.json 完全匹配

