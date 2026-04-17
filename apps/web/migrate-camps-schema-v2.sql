-- =============================================================================
-- Migration: camps schema v2 — 营地数据库扩建大版本升级
-- Date: 2026-04-16
-- =============================================================================
-- 目的:
-- 1. 扩展 camps 表,增加 50+ 字段覆盖营地决策所需的全部维度
-- 2. 改造 review_pros / review_cons 为 JSONB 结构(带 aspect + sentiment)
-- 3. 新增多源追踪字段(source / source_id / status / google_place_id)
-- 4. 新增 import_jobs 表,跟踪批量导入历史
-- 5. 调整 RLS:公开端点只返回 status='published'
--
-- 执行方式:
--   在 Supabase Dashboard → SQL Editor 中执行此脚本
--   或:psql $DATABASE_URL < migrate-camps-schema-v2.sql
--
-- 注意:
--   - ⚠️  TRUNCATE 会清空所有现有 camps 数据(用户已确认)
--   - 如需保留旧数据,请在执行前备份:
--     CREATE TABLE camps_backup_v1 AS SELECT * FROM camps;
-- =============================================================================

-- Supabase SQL Editor 会自动包裹事务,这里不需要 BEGIN/COMMIT
-- 并且 BEGIN/COMMIT 与 $$ 一起会触发 Editor 的解析 bug

-- =============================================================================
-- STEP 1: 确保 camps 表存在(如果项目是全新的)
-- =============================================================================
-- 用全量 v2 schema 直接创建。如果表已存在(旧项目),这一步是 no-op,
-- 后续 ALTER TABLE ADD COLUMN IF NOT EXISTS 会把缺的列补上。

CREATE TABLE IF NOT EXISTS camps (
  id                          TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  slug                        TEXT,

  -- 多源追踪
  source                      TEXT NOT NULL DEFAULT 'manual',
  source_id                   TEXT,
  google_place_id             TEXT,
  status                      TEXT NOT NULL DEFAULT 'pending',
  raw_data                    JSONB,

  -- 地理
  lat                         NUMERIC NOT NULL,
  lng                         NUMERIC NOT NULL,
  elevation_m                 INTEGER,
  region                      TEXT NOT NULL,
  sub_region                  TEXT,
  nearest_town                TEXT,
  distance_to_town_km         NUMERIC,
  address                     TEXT,
  country_code                TEXT DEFAULT 'NZ',

  -- 分类
  camp_type                   TEXT,
  difficulty                  TEXT NOT NULL DEFAULT 'medium',

  -- 描述
  short_description           TEXT,
  description                 TEXT NOT NULL,
  highlights                  TEXT[] DEFAULT '{}',

  -- 价格
  price                       TEXT NOT NULL DEFAULT 'medium',
  price_per_night_nzd         NUMERIC,
  price_unit                  TEXT,
  price_notes                 TEXT,

  -- 容量
  total_sites                 INTEGER,
  tent_friendly               BOOLEAN,
  campervan_friendly          BOOLEAN,
  powered_sites_available     BOOLEAN,
  cabin_available             BOOLEAN,
  max_stay_nights             INTEGER,

  -- 设施/标签
  facilities                  TEXT[] DEFAULT '{}',
  tags                        TEXT[] DEFAULT '{}',

  -- 季节
  year_round                  BOOLEAN DEFAULT TRUE,
  season_open_month           INTEGER,
  season_close_month          INTEGER,

  -- 政策
  booking_required            BOOLEAN,
  booking_url                 TEXT,
  pet_policy                  TEXT,
  campfire_policy             TEXT,
  alcohol_allowed             BOOLEAN,

  -- 联系
  phone                       TEXT,
  email                       TEXT,
  website                     TEXT,

  -- 评价
  rating                      NUMERIC DEFAULT 0,
  rating_count                INTEGER DEFAULT 0,
  review_pros                 JSONB DEFAULT '[]'::jsonb,
  review_cons                 JSONB DEFAULT '[]'::jsonb,
  review_summary              TEXT,
  review_aspects              JSONB DEFAULT '{}'::jsonb,

  -- 资源
  photos                      TEXT[] DEFAULT '{}',
  photo_attribution           JSONB DEFAULT '{}'::jsonb,

  -- 元数据
  data_quality_score          NUMERIC DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  imported_at                 TIMESTAMPTZ DEFAULT NOW(),
  last_enriched_at            TIMESTAMPTZ,
  last_verified_at            TIMESTAMPTZ
);

-- =============================================================================
-- STEP 2: 清空 camps 表(用户已确认全量重新导入)
-- =============================================================================

TRUNCATE TABLE camps RESTART IDENTITY CASCADE;

-- =============================================================================
-- STEP 3: 补齐缺失字段(针对已有旧 schema 的项目是保护网)
-- =============================================================================

-- ----- 标识 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS slug TEXT;

-- ----- 多源追踪 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE camps ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE camps ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- ----- 地理位置增强 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS elevation_m INTEGER;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS sub_region TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS nearest_town TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS distance_to_town_km NUMERIC;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'NZ';

-- ----- 描述分层 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- ----- 价格精细化 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS price_per_night_nzd NUMERIC;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS price_unit TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS price_notes TEXT;

-- ----- 容量与营位类型 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS total_sites INTEGER;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS tent_friendly BOOLEAN;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS campervan_friendly BOOLEAN;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS powered_sites_available BOOLEAN;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS cabin_available BOOLEAN;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS max_stay_nights INTEGER;

-- ----- 季节性 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS year_round BOOLEAN DEFAULT TRUE;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS season_open_month INTEGER;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS season_close_month INTEGER;

-- ----- 政策 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS booking_required BOOLEAN;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS campfire_policy TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS alcohol_allowed BOOLEAN;

-- ----- 评价新字段 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_summary TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_aspects JSONB DEFAULT '{}'::jsonb;

-- ----- 资源 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE camps ADD COLUMN IF NOT EXISTS photo_attribution JSONB DEFAULT '{}'::jsonb;

-- ----- 元数据 -----
ALTER TABLE camps ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC DEFAULT 0;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE camps ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- =============================================================================
-- STEP 4: 改造 review_pros / review_cons 类型 TEXT[] → JSONB
-- =============================================================================
-- 表已 TRUNCATE,可以安全改类型

ALTER TABLE camps DROP COLUMN IF EXISTS review_pros;
ALTER TABLE camps DROP COLUMN IF EXISTS review_cons;
ALTER TABLE camps ADD COLUMN review_pros JSONB DEFAULT '[]'::jsonb;
ALTER TABLE camps ADD COLUMN review_cons JSONB DEFAULT '[]'::jsonb;

-- =============================================================================
-- STEP 5: 添加 CHECK 约束
-- =============================================================================
-- 注意:旧的 camp_type 约束需要先 drop,因为枚举值变了

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_camp_type_check;
ALTER TABLE camps ADD CONSTRAINT camps_camp_type_check
  CHECK (camp_type IN (
    'doc_serviced', 'doc_basic', 'doc_standard',
    'holiday_park', 'freedom_camping', 'local_camp',
    'private_campground', 'glamping', 'farm_stay',
    -- 兼容旧值,允许导入 legacy 数据
    'DOC', 'Holiday Park', 'Freedom Camping', 'Local Camp', 'Private Campground'
  ));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_status_check;
ALTER TABLE camps ADD CONSTRAINT camps_status_check
  CHECK (status IN ('pending', 'published', 'rejected', 'archived'));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_source_check;
ALTER TABLE camps ADD CONSTRAINT camps_source_check
  CHECK (source IN ('doc', 'google', 'manual', 'osm'));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_price_unit_check;
ALTER TABLE camps ADD CONSTRAINT camps_price_unit_check
  CHECK (price_unit IS NULL OR price_unit IN ('per_person', 'per_site', 'per_vehicle'));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_pet_policy_check;
ALTER TABLE camps ADD CONSTRAINT camps_pet_policy_check
  CHECK (pet_policy IS NULL OR pet_policy IN ('allowed', 'not-allowed', 'seasonal', 'conditional', 'leashed-only'));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_campfire_policy_check;
ALTER TABLE camps ADD CONSTRAINT camps_campfire_policy_check
  CHECK (campfire_policy IS NULL OR campfire_policy IN ('allowed', 'not-allowed', 'fire-pit-only', 'seasonal'));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_season_open_check;
ALTER TABLE camps ADD CONSTRAINT camps_season_open_check
  CHECK (season_open_month IS NULL OR (season_open_month BETWEEN 1 AND 12));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_season_close_check;
ALTER TABLE camps ADD CONSTRAINT camps_season_close_check
  CHECK (season_close_month IS NULL OR (season_close_month BETWEEN 1 AND 12));

ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_quality_score_check;
ALTER TABLE camps ADD CONSTRAINT camps_quality_score_check
  CHECK (data_quality_score >= 0 AND data_quality_score <= 1);

-- =============================================================================
-- STEP 6: 索引
-- =============================================================================

-- 唯一索引:同 source 下 source_id 唯一(用于去重)
CREATE UNIQUE INDEX IF NOT EXISTS uq_camps_source_source_id
  ON camps (source, source_id) WHERE source_id IS NOT NULL;

-- 唯一索引:google_place_id 全局唯一
CREATE UNIQUE INDEX IF NOT EXISTS uq_camps_google_place_id
  ON camps (google_place_id) WHERE google_place_id IS NOT NULL;

-- 唯一索引:slug 全局唯一
CREATE UNIQUE INDEX IF NOT EXISTS uq_camps_slug
  ON camps (slug) WHERE slug IS NOT NULL;

-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps (status);
CREATE INDEX IF NOT EXISTS idx_camps_source ON camps (source);
CREATE INDEX IF NOT EXISTS idx_camps_camp_type ON camps (camp_type);
CREATE INDEX IF NOT EXISTS idx_camps_region ON camps (region);

-- 排序索引
CREATE INDEX IF NOT EXISTS idx_camps_rating_published
  ON camps (rating DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_camps_quality_published
  ON camps (data_quality_score DESC, rating DESC) WHERE status = 'published';

-- 数组字段 GIN 索引(支持 ?| 等运算)
CREATE INDEX IF NOT EXISTS idx_camps_facilities_gin ON camps USING GIN (facilities);
CREATE INDEX IF NOT EXISTS idx_camps_tags_gin ON camps USING GIN (tags);

-- =============================================================================
-- STEP 7: 触发器 — 自动更新 updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_camps_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_camps_updated_at ON camps;
CREATE TRIGGER trg_camps_updated_at
  BEFORE UPDATE ON camps
  FOR EACH ROW
  EXECUTE FUNCTION update_camps_updated_at();

-- =============================================================================
-- STEP 8: 启用 RLS + 调整策略 — 只暴露 published 给公众
-- =============================================================================

-- 启用 RLS(若已启用是 no-op)
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view camps" ON camps;
DROP POLICY IF EXISTS "Anyone can view published camps" ON camps;

CREATE POLICY "Anyone can view published camps"
  ON camps FOR SELECT
  USING (status = 'published');

-- 注意:已认证用户(包括管理员通过 service role)可以读全部数据
-- 这条策略允许已登录用户查看 pending/rejected/archived(用于后台管理)
DROP POLICY IF EXISTS "Authenticated can view all camps" ON camps;
CREATE POLICY "Authenticated can view all camps"
  ON camps FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT/UPDATE 已有策略,这里不动
-- (实际批量写入将通过 service role key 绕过 RLS)

-- =============================================================================
-- STEP 9: import_jobs 表 — 跟踪批量导入历史
-- =============================================================================

CREATE TABLE IF NOT EXISTS import_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,           -- 'doc' | 'google-text-search' | 'google-enrich' | etc.
  job_type        TEXT NOT NULL,           -- 'import' | 'enrich' | 'refresh'
  status          TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'succeeded', 'failed', 'partial')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  total_count     INTEGER DEFAULT 0,
  success_count   INTEGER DEFAULT 0,
  failed_count    INTEGER DEFAULT 0,
  skipped_count   INTEGER DEFAULT 0,
  cost_usd        NUMERIC DEFAULT 0,
  error_log       JSONB DEFAULT '[]'::jsonb,
  metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_started_at
  ON import_jobs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status
  ON import_jobs (status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_source
  ON import_jobs (source);

-- import_jobs 启用 RLS,只有管理员可读(通过 service role 写入)
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view import jobs" ON import_jobs;
CREATE POLICY "Authenticated can view import jobs"
  ON import_jobs FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- STEP 10: 验证 — 检查表结构
-- =============================================================================

-- 执行后可运行以下查询确认:
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'camps'
--   ORDER BY ordinal_position;
--
-- 应看到约 50 列,新增字段都在,review_pros / review_cons 类型为 jsonb

-- =============================================================================
-- 完成!下一步:
-- 1. 检查 .env.local 已添加 SUPABASE_SERVICE_ROLE_KEY
-- 2. 运行 pnpm install 安装新依赖
-- 3. 运行 pnpm import:doc --dry-run 试跑 DOC 导入
-- =============================================================================
