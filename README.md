# 露营个性化推荐应用

一个跨平台的露营推荐应用，支持 Web、iOS 和 Android。

## 📋 项目结构

```
camping-app/
├── apps/
│   ├── web/          # Next.js Web 应用
│   └── mobile/       # React Native + Expo 移动应用
├── packages/
│   └── common/       # 共享代码（类型、API、工具函数）
└── package.json      # Monorepo 根配置
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- (可选) Expo Go App（用于移动端测试）

### 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 开发 Web 端

```bash
# 启动 Next.js 开发服务器
pnpm dev:web

# 浏览器访问 http://localhost:3000
```

### 开发移动端

```bash
# 启动 Expo 开发服务器
pnpm dev:mobile

# 使用 Expo Go App 扫描二维码，或在模拟器中运行
# iOS: 按 i 键
# Android: 按 a 键
```

### 构建

```bash
# 构建 Web 端
pnpm build:web

# 构建移动端
pnpm build:mobile
```

## 📦 技术栈

### Web 端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架

### 移动端
- **React Native** - 跨平台移动开发
- **Expo** - 开发工具链
- **Expo Router** - 文件路由系统

### 共享代码
- **TypeScript** - 类型定义
- **Zod** - 数据验证（可选）

## 🏗️ 核心功能

- ✅ **营地查找** - 基于地理位置和需求查找理想营地
- ✅ **装备管理** - 个性化装备推荐和管理
- ✅ **社区分享** - 分享露营经验和心得
- ✅ **行程制定** - 智能规划露营行程

## 📁 代码组织

### 共享代码 (`packages/common`)

所有 Web 和移动端共用的代码都在这里：

- `types/` - TypeScript 类型定义
- `api/` - API 客户端函数
- `utils/` - 工具函数

### 使用共享代码

**在 Web 端：**
```typescript
import { getCamps, type Camp } from 'common';
```

**在移动端：**
```typescript
import { getCamps, type Camp } from 'common';
```

## 🔧 开发指南

### 添加新功能

1. **先在 Web 端开发**
   - 在 `apps/web/src/` 下创建页面和组件
   - 测试功能是否正常

2. **提取共享逻辑**
   - 将业务逻辑、API 调用移到 `packages/common/`
   - 保持 UI 层分离

3. **迁移到移动端**
   - 在 `apps/mobile/app/` 下创建对应页面
   - 复用 `common` 包中的逻辑
   - 使用 React Native 组件重写 UI

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码（可选）

```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

## 🌐 环境变量

创建 `.env.local` 文件（Web 端）或 `.env` 文件（移动端）：

```env
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 其他配置...
```

## 📱 移动端开发

### 使用 Expo Go

1. 在手机上下载 Expo Go App
2. 运行 `pnpm dev:mobile`
3. 扫描终端中显示的二维码

### 使用模拟器

**iOS (需要 macOS):**
```bash
pnpm dev:mobile
# 按 i 键打开 iOS 模拟器
```

**Android:**
```bash
pnpm dev:mobile
# 按 a 键打开 Android 模拟器
```

## 🐛 常见问题

### 依赖安装失败

```bash
# 清理并重新安装
pnpm clean
pnpm install
```

### 移动端无法连接

- 确保手机和电脑在同一网络
- 检查防火墙设置
- 尝试使用 `tunnel` 模式：`expo start --tunnel`

### TypeScript 错误

```bash
# 重新构建类型
pnpm type-check
```

## 📚 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [React Native 文档](https://reactnative.dev)
- [Expo 文档](https://docs.expo.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT






