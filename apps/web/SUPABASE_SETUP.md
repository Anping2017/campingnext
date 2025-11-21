# Supabase 认证系统设置指南

## 📋 概述

Nomad NZ 使用 Supabase 进行用户认证和数据存储。注册和登录是可选的，登录后会自动保存用户数据到云端。

## 🚀 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目 URL 和 Anon Key

### 2. 配置环境变量

在 `apps/web/` 目录下创建 `.env.local` 文件（如果不存在），添加以下内容：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI API Key（如果使用 AI 功能）
OPENAI_API_KEY=your_openai_api_key_here
```

**获取 Supabase 配置：**
1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 Settings > API
4. 复制 Project URL 和 anon/public key

**重要提示：**
- ✅ 如果 Supabase 未配置，应用仍可正常使用（仅本地存储）
- ✅ 认证功能在 Supabase 未配置时会被禁用，但不会影响其他功能
- ✅ `.env.local` 文件不会被提交到 Git（已在 .gitignore 中）
- ⚠️ 配置后需要重启开发服务器才能生效

### 3. 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase-schema.sql` 文件中的 SQL 脚本。

这将创建以下表：
- `user_preferences` - 用户偏好设置
- `user_onboarding` - 用户引导数据
- `user_trips` - 用户行程
- `user_favorites` - 用户收藏

### 4. 启用邮箱认证

在 Supabase Dashboard 中：
1. 进入 Authentication > Providers
2. 确保 Email 认证已启用
3. 配置邮箱模板（可选）

## ✨ 功能特性

### 可选注册
- 用户可以不注册直接使用应用
- 数据保存在本地 localStorage
- 注册后数据自动同步到云端

### 自动同步
登录后，以下数据会自动同步：
- 用户偏好设置
- 首次使用引导数据
- 收藏的营地
- 行程记录

### 数据安全
- 使用 Row Level Security (RLS) 保护数据
- 用户只能访问自己的数据
- 密码使用 Supabase 加密存储

## 🔧 使用方式

### 用户注册/登录
1. 点击个人页面的"登录/注册"按钮
2. 或访问 `/auth` 页面
3. 输入邮箱和密码即可

### 数据同步
登录后，数据会自动同步。也可以手动触发同步（在个人页面）。

## 📝 注意事项

1. **首次使用**：如果 Supabase 未配置，应用仍可正常使用（仅本地存储）
2. **数据迁移**：登录后，本地数据会自动上传到云端
3. **多设备同步**：登录后可在不同设备间同步数据

