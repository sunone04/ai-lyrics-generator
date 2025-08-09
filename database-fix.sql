-- 修复profiles表的RLS策略
-- 添加缺失的INSERT策略

-- 为profiles表添加INSERT策略
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 可选：如果需要更宽松的策略，也可以使用以下策略
-- CREATE POLICY "Authenticated users can insert profile" ON profiles 
-- FOR INSERT 
-- TO authenticated 
-- WITH CHECK (auth.uid() = id);

-- 验证所有策略是否正确设置
-- 查看profiles表的所有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';