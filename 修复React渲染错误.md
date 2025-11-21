# 修复 React 渲染错误

## 问题原因

这个错误 `Objects are not valid as a React child` 通常发生在：
1. React 19 与 Expo Router 6 的兼容性问题
2. Web 平台上的特殊处理需求
3. `_layout.tsx` 配置方式不正确

## 已完成的修复

### 1. ✅ 简化 _layout.tsx
- 从 `Stack` 改为使用 `Slot`
- `Slot` 是 Expo Router 6 推荐的更简单的布局方式
- 自动处理所有路由，不需要手动声明每个 Screen

### 2. ✅ 添加 metro.config.js
- 确保 Metro bundler 配置正确

## 新的 _layout.tsx 配置

```typescript
import { Slot } from 'expo-router';

export default function RootLayout() {
  return <Slot />;
}
```

这种方式：
- ✅ 更简单，自动处理所有路由
- ✅ 与 React 19 兼容性更好
- ✅ 支持 Web 平台

## 如果仍然有问题

### 方案 1: 暂时禁用 Web 支持

如果 Web 平台不是必需的，可以：

```bash
# 启动时只选择移动端
pnpm dev:mobile
# 然后按 a (Android) 或 i (iOS)
# 不要按 w (Web)
```

### 方案 2: 使用完整的 Stack 配置

如果需要更多控制，可以这样配置：

```typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: '首页',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
```

### 方案 3: 检查 React 版本兼容性

如果问题持续，可能需要降级 React：

```bash
cd apps/mobile
npx expo install react@18.3.1 react-native@0.76.5
```

但 Expo SDK 54 推荐使用 React 19，所以优先尝试其他方案。

## 验证修复

清理缓存并重新启动：

```bash
cd apps/mobile
npx expo start --clear
```

## 关于 Web 支持

如果 Web 支持不是必需的，可以：

1. **在 app.json 中移除 Web 配置**（可选）
2. **专注于移动端开发**
3. **使用 Next.js 的 Web 端**（已经在 `apps/web` 中配置好了）

## 项目结构

```
apps/
├── web/          # Next.js Web 应用（推荐用于 Web）
└── mobile/       # React Native 移动应用（专注于移动端）
```

**建议**: 
- Web 端使用 `apps/web` (Next.js)
- 移动端使用 `apps/mobile` (React Native)
- 这样可以避免跨平台的兼容性问题


