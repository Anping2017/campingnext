# 解决 SDK 版本问题

## 问题
Expo Go 显示项目使用 SDK 50，但实际应该是 SDK 54。

## 已完成的修复

1. ✅ **清理了所有 node_modules** - 移除旧版本依赖
2. ✅ **重新安装依赖** - 确保使用最新版本
3. ✅ **移除了 app.json 中的 sdkVersion** - Expo 会自动从 package.json 读取
4. ✅ **移除了 assets 引用** - 暂时避免文件缺失错误

## 验证 SDK 版本

运行以下命令检查：

```bash
cd apps/mobile
npx expo-doctor
```

应该看到 SDK 54 相关的信息。

## 启动项目

现在可以启动项目：

```bash
# 从根目录
pnpm dev:mobile

# 或从 mobile 目录
cd apps/mobile
pnpm start
```

## 如果仍然显示 SDK 50

1. **清理 Expo 缓存**：
```bash
cd apps/mobile
npx expo start --clear
```

2. **检查 package.json**：
确保 `expo` 版本是 `~54.0.25`

3. **重新安装 Expo CLI**：
```bash
npm install -g @expo/cli@latest
```

4. **完全清理并重新安装**：
```bash
# 删除所有 node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 删除锁文件
rm pnpm-lock.yaml

# 重新安装
pnpm install

# 修复 Expo 依赖
cd apps/mobile
npx expo install --fix
```

## 关于 Assets 文件

目前 app.json 中暂时移除了图片引用。如果需要添加：

1. 创建实际的图片文件（1024x1024 的 icon.png 等）
2. 或者使用在线工具生成：https://www.appicon.co/
3. 然后重新添加到 app.json

## 关于 React 版本重复

这是正常的：
- **移动端**: React 19.1.0（Expo SDK 54 要求）
- **Web 端**: React 18.3.1（Next.js 兼容）

两个平台可以有不同的 React 版本，不会影响功能。


