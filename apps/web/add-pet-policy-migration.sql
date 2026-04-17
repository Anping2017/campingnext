-- 为 camps 表添加宠物政策字段
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

ALTER TABLE camps ADD COLUMN IF NOT EXISTS pet_policy TEXT CHECK (pet_policy IN ('allowed', 'not-allowed', 'seasonal', 'conditional'));

-- 添加注释
COMMENT ON COLUMN camps.pet_policy IS '宠物政策：allowed(可宠), not-allowed(不可宠), seasonal(淡季可宠), conditional(条件限制可宠)';




