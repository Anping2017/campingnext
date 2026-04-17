# 禁用移动端 Web 支持

## 问题原因

React 19 和 Expo Router 6 在 Web 平台上存在兼容性问题，导致渲染错误。

## 解决方案

由于你已经有了独立的 Next.js Web 应用（`apps/web`），建议：

1. ✅ **禁用移动端项目的 Web 支持**
2. ✅ **Web 端使用 Next.js** (`apps/web`)
3. ✅ **移动端专注于 iOS/Android** (`apps/mobile`)

## 已完成的修改

### 1. 从 app.json 中移除了 Web 配置
- 移除了 `"web": {}` 配置
- 移动端项目现在只支持 iOS 和 Android

### 2. 更新了 _layout.tsx
- 添加了平台检测
- Web 平台返回 null（因为不使用）
- 移动端使用 Stack 布局

## 项目架构

```
apps/
├── web/          # Next.js Web 应用
│   └── 用于浏览器访问
└── mobile/       # React Native 移动应用
    └── 用于 iOS/Android 设备
```

## 开发流程

### Web 端开发
```bash
pnpm dev:web
# 访问 http://localhost:3000
```

### 移动端开发
```bash
pnpm dev:mobile
# 然后按 a (Android) 或 i (iOS)
# 不要按 w (Web)
```

## 优势

1. ✅ **避免兼容性问题** - 每个平台使用最适合的技术栈
2. ✅ **更好的性能** - Next.js 对 Web 优化更好
3. ✅ **更清晰的架构** - 职责分离
4. ✅ **更容易维护** - 减少跨平台问题

## 如果将来需要 Web 支持

如果将来需要在移动端项目中启用 Web 支持：

1. 等待 Expo Router 6 和 React 19 的兼容性更新
2. 或者降级到 React 18（不推荐）
3. 或者继续使用 Next.js 作为 Web 端

## 现在可以正常开发了

```bash
# 启动移动端（只支持 iOS/Android）
pnpm dev:mobile

# 启动 Web 端（Next.js）
pnpm dev:web
```

两个应用可以同时运行，互不干扰！





