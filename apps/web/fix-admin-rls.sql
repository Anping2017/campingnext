-- 修复管理员 RLS 策略，避免无限递归
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 删除所有有问题的策略（包括会导致递归的策略）
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Users can view own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON admins;

-- 只创建不会导致递归的策略
-- 用户可以查看自己的记录（用于权限检查，不会导致递归）
CREATE POLICY "Users can view own admin record"
  ON admins FOR SELECT
  USING (user_id = auth.uid());

-- 注意：
-- 1. "Users can view own admin record" 策略不会导致递归，因为它只检查 user_id = auth.uid()
-- 2. 其他策略（查看所有管理员、插入、更新、删除）会导致递归，因为它们在检查时需要查询 admins 表
-- 3. 如果需要管理其他管理员，应该通过 API 使用 service_role key，或使用 Supabase Dashboard 的 Table Editor









