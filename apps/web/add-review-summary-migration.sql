-- 为 camps 表添加评价总结字段（优点和缺点）
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 添加评价优点字段
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_pros TEXT[];

-- 添加评价缺点字段
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_cons TEXT[];

-- 验证字段已添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'camps' 
  AND column_name IN ('review_pros', 'review_cons');




