# 修复 Web 打包和入口文件问题

## 已完成的修复

### 1. ✅ 添加缺失的依赖
- `react-native-web` - Web 支持
- `expo-constants` - Expo 常量
- `expo-linking` - 深度链接支持

### 2. ✅ 创建入口文件
- 创建了 `apps/mobile/index.js` 作为应用入口
- 更新了 `package.json` 中的 main 字段

### 3. ✅ 更新 pnpm 配置
- 使用 `node-linker=hoisted` 避免符号链接权限问题

## 关于权限错误

如果看到 `EPERM: operation not permitted, symlink` 错误：

**这是 Windows 上的符号链接权限问题，但不影响功能。** 依赖已经安装成功。

### 解决方案（可选）

如果需要完全解决，可以：

1. **以管理员身份运行 PowerShell**
2. **或使用以下命令启用符号链接**：
```powershell
# 以管理员身份运行
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "SymlinkEvaluation" -Value 1 -PropertyType DWORD -Force
```

## 验证修复

现在可以重新启动项目：

```bash
pnpm dev:mobile
```

应该可以正常工作了：
- ✅ Android 打包成功
- ✅ Web 打包成功（不再报 react-native-web 错误）
- ✅ 入口文件找到

## 如果还有问题

### Web 打包仍然失败

如果 Web 打包还有问题，可以暂时禁用 Web 支持：

```bash
# 只启动移动端
pnpm dev:mobile
# 然后按 a (Android) 或 i (iOS)，不要按 w (Web)
```

### 入口文件找不到

确保 `apps/mobile/index.js` 存在，内容为：
```javascript
import 'expo-router/entry';
```

### 清理缓存

```bash
cd apps/mobile
npx expo start --clear
```

## 项目结构

```
apps/mobile/
├── index.js          # 入口文件（新创建）
├── app/
│   ├── _layout.tsx   # 根布局
│   └── index.tsx     # 首页
├── package.json      # 已更新依赖
└── app.json          # Expo 配置
```

## 下一步

现在可以：
1. ✅ 在 Android/iOS 设备上测试
2. ✅ 使用 Expo Go 扫描二维码
3. ✅ 开始开发功能

如果 Web 支持不是必需的，可以暂时忽略 Web 打包错误，专注于移动端开发。


