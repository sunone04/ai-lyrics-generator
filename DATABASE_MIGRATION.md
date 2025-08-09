# 数据库迁移指南 - 修复RLS策略问题

## 问题描述
用户在generate页面点击生成时出现错误：
```
Failed to create user profile: new row violates row-level security policy for table "profiles"
```

## 根本原因
`profiles`表启用了RLS但缺少INSERT策略，导致新用户无法创建profile记录。

## 解决步骤

### 1. 立即修复（必须执行）
在Supabase SQL编辑器中执行以下SQL：

```sql
-- 添加缺失的INSERT策略
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
```

### 2. 验证修复
执行以下查询确认策略已正确创建：

```sql
-- 查看profiles表的所有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

应该看到以下策略：
- `Users can view own profile` (SELECT)
- `Users can insert own profile` (INSERT) 
- `Users can update own profile` (UPDATE)

### 3. 可选：添加触发器保障（推荐）
为了确保每个新用户都自动创建profile，可以添加触发器：

```sql
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
```

### 4. 测试验证
1. 创建新用户账号
2. 登录后访问generate页面
3. 填写参数并点击生成
4. 确认不再出现RLS错误

## 预防措施
- 所有表的RLS策略都应该包含完整的CRUD权限
- 新表创建时应该同时定义所有必要的RLS策略
- 定期审查RLS策略确保完整性

## 相关文件更新
- `DEPLOYMENT.md` - 已更新包含正确的RLS策略
- `lib/user-service.ts` - 改进了错误处理
- `app/api/generate/route.ts` - 添加了更好的错误处理