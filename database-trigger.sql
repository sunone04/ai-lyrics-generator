-- 可选：创建触发器自动为新用户创建profile
-- 这是一个额外的保障措施，确保每个新用户都有profile

-- 创建函数来处理新用户注册
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, status, generation_count, rewrite_count, usage_last_reset)
  VALUES (
    NEW.id,
    'free',
    0,
    0,
    CURRENT_DATE
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

-- 注意：这个触发器需要在Supabase控制台中执行，因为它涉及auth schema