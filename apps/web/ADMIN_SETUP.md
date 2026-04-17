# 后台管理系统设置指南

## 概述

后台管理系统提供了独立的管理入口，需要管理员账户才能访问。管理员可以管理用户、帖子和营地。

## 访问地址

- **管理后台入口**: `http://localhost:3000/admin`
- **用户管理**: `http://localhost:3000/admin/users`
- **帖子管理**: `http://localhost:3000/admin/posts`
- **营地管理**: `http://localhost:3000/admin/camps`

## 设置管理员账户

### 步骤 1: 创建 admins 表（必须先执行）

**重要**: 在创建管理员账户之前，必须先创建 `admins` 表。

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 执行 `admin-schema.sql` 文件中的 SQL 语句，或者执行以下 SQL：

```sql
-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 启用 RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 创建策略（首次创建管理员时需要临时处理）
-- 注意：由于 RLS 策略要求用户已经是管理员才能插入，首次创建需要特殊处理
```

### 步骤 2: 创建第一个管理员账户

由于 RLS 策略的限制，首次创建管理员需要使用以下方法之一：

#### 方法 A: 临时禁用 RLS（最简单）

```sql
-- 1. 临时禁用 RLS
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 2. 插入管理员账户（替换 YOUR_USER_ID 和 YOUR_EMAIL）
INSERT INTO admins (user_id, email, role)
VALUES (
  'YOUR_USER_ID',  -- 替换为实际的用户 UUID（在 Authentication > Users 中查找）
  'your-email@example.com',  -- 替换为实际的邮箱
  'admin'  -- 或 'super_admin' 表示超级管理员
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 3. 重新启用 RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 4. 重新创建策略（执行 admin-schema.sql 中的策略创建语句）
```

#### 方法 B: 使用 Supabase Dashboard Table Editor（推荐）

1. 在 Supabase Dashboard 中，进入 **Table Editor**
2. 选择 `admins` 表（如果看不到，先执行步骤 1 创建表）
3. 点击 **Insert row** 或 **Add row**
4. 填写字段：
   - `user_id`: 用户的 UUID（在 Authentication > Users 中查找）
   - `email`: 用户的邮箱
   - `role`: `admin` 或 `super_admin`
5. 点击 **Save**

#### 方法 C: 使用 service_role key（最安全，需要后端支持）

如果你有 service_role key，可以通过后端 API 创建管理员（需要额外开发）。

### 步骤 3: 验证管理员账户

创建完成后，可以通过以下 SQL 查询验证：

```sql
SELECT * FROM admins;
```

应该能看到你刚创建的管理员记录。

### 添加更多管理员

一旦有了第一个管理员（特别是 super_admin），后续可以通过以下方式添加：

1. **通过 Supabase Dashboard Table Editor**（最简单）
2. **通过 SQL**（如果当前用户是 super_admin）：
```sql
INSERT INTO admins (user_id, email, role)
VALUES (
  'NEW_USER_ID',
  'new-admin@example.com',
  'admin'
);
```

## 管理员角色

- **admin**: 普通管理员，可以管理用户、帖子和营地
- **super_admin**: 超级管理员，除了普通管理员权限外，还可以管理其他管理员账户

## 功能说明

### 用户管理 (`/admin/users`)

- 查看所有用户列表
- 搜索用户
- 删除用户（需要通过 Supabase Admin API 完成）

**注意**: 由于 Supabase 的 RLS 限制，直接删除 `auth.users` 表中的用户需要使用 Supabase Admin API 或 service_role key。当前实现仅提供删除请求，实际删除需要通过 Supabase Dashboard 或 Admin API 完成。

### 帖子管理 (`/admin/posts`)

- 查看所有帖子列表
- 搜索帖子（按标题和内容）
- 查看帖子详情（跳转到帖子页面）
- 删除帖子

### 营地管理 (`/admin/camps`)

- 查看所有营地列表
- 搜索营地（按名称、地区和描述）
- 添加新营地
- 编辑营地信息
- 删除营地

## 安全说明

1. **权限检查**: 所有管理 API 都会检查用户是否为管理员
2. **RLS 策略**: 数据库层面也有 RLS 策略保护，只有管理员可以执行管理操作
3. **独立入口**: 管理后台有独立的入口和布局，与普通用户界面分离

## 数据库 Schema

管理员相关的表结构：

```sql
CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚠️ 重要：修复 RLS 策略无限递归问题

**如果看到错误 "infinite recursion detected in policy for relation 'admins'"，必须执行以下修复：**

在 Supabase Dashboard 的 SQL Editor 中执行 `fix-admin-rls.sql` 或以下 SQL：

```sql
-- 删除所有有问题的策略
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Users can view own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON admins;

-- 只创建不会导致递归的策略
CREATE POLICY "Users can view own admin record"
  ON admins FOR SELECT
  USING (user_id = auth.uid());
```

**说明**：
- "Users can view own admin record" 策略不会导致递归，因为它只检查 `user_id = auth.uid()`
- 其他策略会导致递归，因为它们在检查时需要查询 `admins` 表
- 如果需要管理其他管理员，使用 Supabase Dashboard 的 Table Editor 或通过 API 使用 service_role key

## 常见问题

### Q: 如何创建第一个管理员账户？

**A**: 
1. 先注册一个普通用户账户
2. 在 Supabase Dashboard 的 SQL Editor 中执行 SQL，将该用户添加到 `admins` 表
3. 使用该账户登录后即可访问管理后台

### Q: 忘记管理员账户怎么办？

**A**: 可以在 Supabase Dashboard 的 SQL Editor 中查询 `admins` 表，找到管理员邮箱，然后重置密码。

### Q: 如何撤销管理员权限？

**A**: 在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
DELETE FROM admins WHERE user_id = 'USER_ID';
```

### Q: 管理后台无法访问？自动跳转到首页？

**A**: 检查以下几点：
1. **确保已登录**：使用管理员账户登录
2. **确保用户已添加到 `admins` 表**：在 Supabase Dashboard 的 SQL Editor 中执行：
   ```sql
   SELECT * FROM admins WHERE email = 'your-email@example.com';
   ```
3. **修复 RLS 策略**：执行 `fix-admin-rls.sql` 中的 SQL（见上方"重要：修复 RLS 策略"部分）
4. **检查浏览器控制台**：打开开发者工具（F12），查看 Console 标签页是否有错误
5. **确保 Supabase 环境变量已正确配置**：检查 `.env.local` 文件
6. **清除浏览器缓存**：尝试清除缓存或使用无痕模式

### Q: 提示"用户不是管理员，重定向到首页"？

**A**: 
1. 确认 `admins` 表中的 `user_id` 与当前登录用户的 UUID 完全一致
2. 执行 RLS 策略修复（见上方）
3. 检查浏览器控制台的错误信息
4. 尝试重新登录

## 下一步

1. ✅ 创建管理员账户
2. ✅ 访问管理后台测试功能
3. ✅ 根据需要完善编辑表单（营地管理）
4. ✅ 考虑添加更多管理功能（如数据统计、审核流程等）









