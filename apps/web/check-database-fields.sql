-- 检查 camps 表是否包含评价总结字段
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'camps' 
  AND column_name IN ('review_pros', 'review_cons')
ORDER BY column_name;

-- 如果字段不存在，执行以下命令添加：
-- ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_pros TEXT[];
-- ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_cons TEXT[];




