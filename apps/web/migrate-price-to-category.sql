-- 将价格字段从 NUMERIC 改为 TEXT 分类
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 添加新的价格分类字段（临时）
ALTER TABLE camps ADD COLUMN IF NOT EXISTS price_category TEXT;

-- 2. 根据旧价格值转换为分类
UPDATE camps SET price_category = CASE
  WHEN price = 0 THEN 'free'
  WHEN price > 0 AND price <= 15 THEN 'cheap'
  WHEN price > 15 AND price <= 30 THEN 'medium'
  WHEN price > 30 THEN 'expensive'
  ELSE 'medium'
END;

-- 3. 删除旧的价格字段
ALTER TABLE camps DROP COLUMN IF EXISTS price;

-- 4. 重命名新字段为 price
ALTER TABLE camps RENAME COLUMN price_category TO price;

-- 5. 添加 CHECK 约束
ALTER TABLE camps ADD CONSTRAINT camps_price_check 
  CHECK (price IN ('free', 'cheap', 'medium', 'expensive'));

-- 6. 设置默认值
ALTER TABLE camps ALTER COLUMN price SET DEFAULT 'medium';




