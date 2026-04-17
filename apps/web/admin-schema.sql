-- 管理员系统表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 管理员表（存储管理员信息）
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

-- 删除已存在的策略
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;

-- 管理员策略：避免递归的策略设计
-- 策略 1: 用户可以查看自己的记录（用于权限检查，不会导致递归）
CREATE POLICY "Users can view own admin record"
  ON admins FOR SELECT
  USING (user_id = auth.uid());

-- 注意：以下策略会导致递归，因为它们在检查时也需要查询 admins 表
-- 如果需要管理员查看所有管理员，应该通过 API 使用 service_role key
-- 或者使用 PostgreSQL 函数来避免递归
-- 
-- 暂时不创建 "Admins can view all admins" 策略，避免递归
-- 如果需要，可以通过 API 使用 service_role key 来查询所有管理员

CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can update admins"
  ON admins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can delete admins"
  ON admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 注意：以下策略会导致递归，因为它们在检查时需要查询 admins 表
-- 管理功能通过 API 的权限检查来实现，而不是通过 RLS 策略
-- 
-- 管理员可以管理所有帖子（通过 API 权限检查实现，不使用 RLS）
-- 管理员可以管理所有营地（通过 API 权限检查实现，不使用 RLS）

-- 注意：首次创建管理员时，需要临时禁用 RLS 或使用 service_role key
-- 方法 1: 临时禁用 RLS（仅用于首次创建管理员）
-- ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
-- 然后执行 INSERT 语句
-- 最后重新启用: ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 方法 2: 使用 Supabase Dashboard 的 Table Editor 直接插入（推荐）
-- 在 Supabase Dashboard > Table Editor > admins 表中手动添加第一条记录

-- 方法 3: 使用 service_role key（最安全，但需要后端支持）









