-- AI歌词生成器 - 数据库重置脚本
-- 执行顺序：先删除所有对象，然后重新创建

-- 1. 删除所有视图
DROP VIEW IF EXISTS user_usage_stats CASCADE;
DROP VIEW IF EXISTS blog_stats CASCADE;
DROP VIEW IF EXISTS api_usage_stats CASCADE;

-- 2. 删除所有触发器
DROP TRIGGER IF EXISTS update_favorite_count_trigger ON generations;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 删除所有函数
DROP FUNCTION IF EXISTS update_favorite_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_generations() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_api_logs() CASCADE;
DROP FUNCTION IF EXISTS check_user_usage_limit(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_favorite_limit(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_usage_count(UUID, TEXT) CASCADE;

-- 4. 删除所有表（按依赖关系顺序）
DROP TABLE IF EXISTS api_usage_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 5. 删除所有枚举类型
DROP TYPE IF EXISTS generation_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- 6. 重新创建枚举类型
CREATE TYPE subscription_status AS ENUM ('free', 'active', 'canceled', 'past_due');
CREATE TYPE post_status AS ENUM ('draft', 'published');
CREATE TYPE generation_type AS ENUM ('full', 'partial');

-- 7. 重新创建表结构
-- 用户配置文件表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paddle_customer_id TEXT UNIQUE,
  status subscription_status DEFAULT 'free' NOT NULL,
  active_price_id TEXT,
  generation_count INT DEFAULT 0 NOT NULL,
  rewrite_count INT DEFAULT 0 NOT NULL,
  usage_last_reset DATE DEFAULT CURRENT_DATE NOT NULL,
  favorite_count INT DEFAULT 0 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  last_login_ip INET,
  last_login_at TIMESTAMPTZ,
  browser_fingerprint TEXT
);

-- 博客分类表
CREATE TABLE categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  sort_order INT DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 博客文章表
CREATE TABLE posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  category_id BIGINT REFERENCES categories(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status post_status DEFAULT 'draft',
  slug TEXT UNIQUE NOT NULL,
  seo_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  excerpt TEXT,
  view_count INT DEFAULT 0 NOT NULL,
  published_at TIMESTAMPTZ
);

-- 歌词生成记录表
CREATE TABLE generations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  language TEXT,
  music_style TEXT,
  music_theme TEXT,
  length_option TEXT,
  lyric_style TEXT,
  intent_or_request TEXT,
  artist_style TEXT,
  emotion_intensity SMALLINT,
  rhyme_requirement TEXT,
  song_structure TEXT,
  paragraph_length TEXT,
  sentence_preference TEXT,
  bpm SMALLINT,
  generated_lyrics TEXT NOT NULL,
  model_used TEXT NOT NULL,
  is_favorited BOOLEAN DEFAULT FALSE NOT NULL,
  generation_type generation_type DEFAULT 'full' NOT NULL,
  parent_generation_id BIGINT REFERENCES generations(id),
  optimization_request TEXT
);

-- 用户会话表
CREATE TABLE user_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT UNIQUE NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  browser_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- API使用日志表
CREATE TABLE api_usage_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES profiles(id),
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_data JSONB,
  response_status SMALLINT,
  response_time INT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_agent TEXT
);

-- 8. 创建索引（性能优化）
-- 用户配置文件索引
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_paddle_customer_id ON profiles(paddle_customer_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX idx_profiles_last_login_ip ON profiles(last_login_ip);

-- 歌词生成记录索引
CREATE INDEX idx_generations_user_id_created_at ON generations(user_id, created_at DESC);
CREATE INDEX idx_generations_is_favorited_created_at ON generations(is_favorited, created_at);
CREATE INDEX idx_generations_user_id_is_favorited ON generations(user_id, is_favorited);
CREATE INDEX idx_generations_generation_type ON generations(generation_type);
CREATE INDEX idx_generations_parent_generation_id ON generations(parent_generation_id);

-- 博客文章索引
CREATE INDEX idx_posts_status_slug ON posts(status, slug);
CREATE INDEX idx_posts_category_id_status ON posts(category_id, status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);

-- 博客分类索引
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- 用户会话索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_browser_fingerprint ON user_sessions(browser_fingerprint);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- API使用日志索引
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_ip_address ON api_usage_logs(ip_address);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- 9. 启用行级安全 (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- 10. 创建RLS策略
-- Profiles表策略
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Generations表策略
CREATE POLICY "Users can view own generations" ON generations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON generations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON generations 
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all generations" ON generations 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Categories表策略（公开读取）
CREATE POLICY "Anyone can view categories" ON categories 
FOR SELECT TO public USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON categories 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Posts表策略（已发布文章公开读取）
CREATE POLICY "Anyone can view published posts" ON posts 
FOR SELECT TO public USING (status = 'published');

CREATE POLICY "Admins can manage posts" ON posts 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- User Sessions表策略
CREATE POLICY "Users can view own sessions" ON user_sessions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anonymous sessions" ON user_sessions 
FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Anonymous can insert sessions" ON user_sessions 
FOR INSERT WITH CHECK (user_id IS NULL);

-- API Usage Logs表策略
CREATE POLICY "Users can view own logs" ON api_usage_logs 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON api_usage_logs 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous logs" ON api_usage_logs 
FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Anonymous can insert logs" ON api_usage_logs 
FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Admins can view all logs" ON api_usage_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- 11. 创建触发器函数
-- 自动为新用户创建profile的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    0,
    0,
    CURRENT_DATE,
    0,
    FALSE
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 如果profile已存在，忽略错误
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 更新文章updated_at的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建文章更新触发器
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 收藏计数更新函数
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_favorited = TRUE THEN
            UPDATE profiles 
            SET favorite_count = favorite_count + 1 
            WHERE id = NEW.user_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_favorited = FALSE AND NEW.is_favorited = TRUE THEN
            UPDATE profiles 
            SET favorite_count = favorite_count + 1 
            WHERE id = NEW.user_id;
        ELSIF OLD.is_favorited = TRUE AND NEW.is_favorited = FALSE THEN
            UPDATE profiles 
            SET favorite_count = favorite_count - 1 
            WHERE id = NEW.user_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_favorited = TRUE THEN
            UPDATE profiles 
            SET favorite_count = favorite_count - 1 
            WHERE id = OLD.user_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建收藏计数更新触发器
CREATE TRIGGER update_favorite_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON generations
    FOR EACH ROW EXECUTE FUNCTION update_favorite_count();

-- 12. 创建数据清理函数
-- 自动删除未收藏的旧记录的函数
CREATE OR REPLACE FUNCTION cleanup_old_generations()
RETURNS void AS $$
BEGIN
  DELETE FROM generations 
  WHERE is_favorited = FALSE 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = FALSE 
  WHERE last_activity < NOW() - INTERVAL '24 hours';
  
  DELETE FROM user_sessions 
  WHERE last_activity < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 清理旧API日志的函数
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_usage_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 13. 创建实用函数
-- 检查用户使用限制的函数
CREATE OR REPLACE FUNCTION check_user_usage_limit(user_uuid UUID, operation_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile profiles%ROWTYPE;
    max_limit INT;
    current_count INT;
BEGIN
    -- 获取用户信息
    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 检查是否需要重置计数
    IF user_profile.usage_last_reset != CURRENT_DATE THEN
        UPDATE profiles 
        SET generation_count = 0, rewrite_count = 0, usage_last_reset = CURRENT_DATE
        WHERE id = user_uuid;
        
        user_profile.generation_count := 0;
        user_profile.rewrite_count := 0;
    END IF;
    
    -- 根据用户类型和操作类型确定限制
    IF user_profile.status = 'free' THEN
        IF operation_type = 'generation' THEN
            max_limit := 1;
            current_count := user_profile.generation_count;
        ELSIF operation_type = 'rewrite' THEN
            max_limit := 1;
            current_count := user_profile.rewrite_count;
        END IF;
    ELSE
        IF operation_type = 'generation' THEN
            max_limit := 30;
            current_count := user_profile.generation_count;
        ELSIF operation_type = 'rewrite' THEN
            max_limit := 30;
            current_count := user_profile.rewrite_count;
        END IF;
    END IF;
    
    RETURN current_count < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查收藏限制的函数
CREATE OR REPLACE FUNCTION check_favorite_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile profiles%ROWTYPE;
    max_favorites INT;
BEGIN
    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF user_profile.status = 'free' THEN
        max_favorites := 3;
    ELSE
        max_favorites := 100;
    END IF;
    
    RETURN user_profile.favorite_count < max_favorites;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加使用计数的函数
CREATE OR REPLACE FUNCTION increment_usage_count(user_uuid UUID, operation_type TEXT)
RETURNS void AS $$
BEGIN
    IF operation_type = 'generation' THEN
        UPDATE profiles 
        SET generation_count = generation_count + 1
        WHERE id = user_uuid;
    ELSIF operation_type = 'rewrite' THEN
        UPDATE profiles 
        SET rewrite_count = rewrite_count + 1
        WHERE id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 插入默认数据
-- 插入默认博客分类
INSERT INTO categories (name, slug, seo_title, meta_description, sort_order) VALUES
('Getting Started', 'getting-started', 'Getting Started with Songwriting', 'Learn the basics of songwriting and lyric creation', 1),
('Hip Hop & Rap', 'hip-hop-rap', 'Hip Hop and Rap Lyrics Guide', 'Master the art of writing hip hop and rap lyrics', 2),
('Pop Music', 'pop-music', 'Pop Music Songwriting Tips', 'Create catchy pop songs with these songwriting techniques', 3),
('Country Music', 'country-music', 'Country Music Lyrics Writing', 'Learn how to write authentic country music lyrics', 4),
('Rock Music', 'rock-music', 'Rock Music Songwriting Guide', 'Write powerful rock music lyrics and songs', 5),
('R&B & Soul', 'rnb-soul', 'R&B and Soul Music Writing', 'Create soulful R&B lyrics and melodies', 6),
('Electronic Music', 'electronic-music', 'Electronic Music Production', 'Write lyrics for electronic and dance music', 7),
('Songwriting Tips', 'songwriting-tips', 'General Songwriting Tips', 'Essential tips and techniques for better songwriting', 8);

-- 15. 创建视图
-- 用户使用统计视图
CREATE VIEW user_usage_stats AS
SELECT 
  p.id,
  p.email,
  p.status,
  p.generation_count,
  p.rewrite_count,
  p.usage_last_reset,
  p.favorite_count,
  COUNT(g.id) as total_generations,
  COUNT(CASE WHEN g.is_favorited THEN 1 END) as favorited_count,
  COUNT(CASE WHEN g.generation_type = 'partial' THEN 1 END) as partial_optimizations
FROM profiles p
LEFT JOIN generations g ON p.id = g.user_id
GROUP BY p.id, p.email, p.status, p.generation_count, p.rewrite_count, p.usage_last_reset, p.favorite_count;

-- 博客统计视图
CREATE VIEW blog_stats AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  COUNT(p.id) as total_posts,
  COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_posts,
  SUM(p.view_count) as total_views,
  MAX(p.published_at) as last_published
FROM categories c
LEFT JOIN posts p ON c.id = p.category_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.slug;

-- API使用统计视图
CREATE VIEW api_usage_stats AS
SELECT 
  DATE(created_at) as usage_date,
  endpoint,
  method,
  COUNT(*) as request_count,
  AVG(response_time) as avg_response_time,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), endpoint, method
ORDER BY usage_date DESC, request_count DESC;

-- 16. 验证设置
-- 检查所有表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'generations', 'categories', 'posts', 'user_sessions', 'api_usage_logs');

-- 检查RLS是否启用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'generations', 'categories', 'posts', 'user_sessions', 'api_usage_logs');

-- 检查策略是否创建成功
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- 检查触发器是否创建成功
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 检查视图是否创建成功
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
