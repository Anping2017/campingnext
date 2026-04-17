-- Nomad NZ Supabase 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户引导数据表
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户行程表
CREATE TABLE IF NOT EXISTS user_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_camps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trips_created_at ON user_trips(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can view own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can update own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can update own favorites" ON user_favorites;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trips"
  ON user_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON user_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON user_trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON user_trips FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON user_favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- 营地信息表（公开数据，所有用户可读）
CREATE TABLE IF NOT EXISTS camps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  price TEXT NOT NULL CHECK (price IN ('free', 'cheap', 'medium', 'expensive')) DEFAULT 'medium', -- 价格分类：免费、便宜、中等、较贵
  tags TEXT[] DEFAULT '{}',
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  description TEXT NOT NULL,
  facilities TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  rating NUMERIC NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  camp_type TEXT CHECK (camp_type IN ('DOC', 'Holiday Park', 'Freedom Camping', 'Local Camp', 'Private Campground')),
  -- 联系方式
  address TEXT, -- 详细地址
  phone TEXT, -- 电话
  email TEXT, -- 邮箱
  website TEXT, -- 网址
  -- 评价总结（从 Google Maps 评价中提取）
  review_pros TEXT[], -- 优点列表
  review_cons TEXT[], -- 缺点列表
  -- 宠物政策
  pet_policy TEXT CHECK (pet_policy IN ('allowed', 'not-allowed', 'seasonal', 'conditional')), -- 可宠、不可宠、淡季可宠、条件限制可宠
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  camp_id TEXT REFERENCES camps(id) ON DELETE SET NULL,
  camp_name TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子点赞表（记录用户点赞状态）
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 帖子收藏表
CREATE TABLE IF NOT EXISTS post_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_camp_id ON posts(camp_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_post_id ON post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_user_id ON post_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_camps_region ON camps(region);
CREATE INDEX IF NOT EXISTS idx_camps_camp_type ON camps(camp_type);

-- 启用 RLS
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view camps" ON camps;
DROP POLICY IF EXISTS "Authenticated users can insert camps" ON camps;
DROP POLICY IF EXISTS "Authenticated users can update camps" ON camps;
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can view own post favorites" ON post_favorites;
DROP POLICY IF EXISTS "Users can insert own post favorites" ON post_favorites;
DROP POLICY IF EXISTS "Users can delete own post favorites" ON post_favorites;

-- 营地表策略：所有人可读，只有管理员可写（暂时允许所有人写入用于初始化）
CREATE POLICY "Anyone can view camps"
  ON camps FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert camps"
  ON camps FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update camps"
  ON camps FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 帖子表策略：所有人可读，用户只能管理自己的帖子
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- 帖子点赞表策略
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 帖子收藏表策略（注意：与 user_favorites 的策略名称不同，避免冲突）
CREATE POLICY "Users can view own post favorites"
  ON post_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own post favorites"
  ON post_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post favorites"
  ON post_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 管理员系统
-- ============================================

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

-- 策略 2-4: 超级管理员可以管理其他管理员（首次创建需要临时禁用 RLS）
-- 这些策略也会导致递归，所以首次创建管理员时需要使用 Table Editor 或临时禁用 RLS
CREATE POLICY "Super admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update admins"
  ON admins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete admins"
  ON admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 管理员可以管理所有帖子（添加管理员策略）
-- 注意：这个策略会导致递归，因为需要查询 admins 表
-- 暂时注释掉，如果需要可以通过 API 使用 service_role key 来管理
-- DROP POLICY IF EXISTS "Admins can manage all posts" ON posts;
-- CREATE POLICY "Admins can manage all posts"
--   ON posts FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM admins
--       WHERE user_id = auth.uid()
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM admins
--       WHERE user_id = auth.uid()
--     )
--   );

-- 管理员可以管理所有营地（添加管理员策略）
-- 注意：这个策略会导致递归，因为需要查询 admins 表
-- 暂时注释掉，如果需要可以通过 API 使用 service_role key 来管理
-- DROP POLICY IF EXISTS "Admins can manage all camps" ON camps;
-- CREATE POLICY "Admins can manage all camps"
--   ON camps FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM admins
--       WHERE user_id = auth.uid()
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM admins
--       WHERE user_id = auth.uid()
--     )
--   );

-- 管理员可以查看所有用户数据（用于管理）
-- 注意：这里不直接修改 user_preferences 等表的策略，而是通过 API 使用 service_role key

