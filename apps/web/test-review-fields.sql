-- 测试查询：检查评价字段是否存在于数据库中
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 检查字段是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'camps' 
  AND column_name IN ('review_pros', 'review_cons');

-- 2. 如果字段不存在，添加它们
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'camps' AND column_name = 'review_pros'
  ) THEN
    ALTER TABLE camps ADD COLUMN review_pros TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'camps' AND column_name = 'review_cons'
  ) THEN
    ALTER TABLE camps ADD COLUMN review_cons TEXT[];
  END IF;
END $$;

-- 3. 查看最近创建的营地，检查评价字段
SELECT 
  id, 
  name, 
  review_pros, 
  review_cons,
  created_at
FROM camps 
ORDER BY created_at DESC 
LIMIT 5;




