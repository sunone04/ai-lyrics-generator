// lib/auth.ts

import { createServerClient } from './supabase-server';
import { User } from '@supabase/supabase-js';

/**
 * 服务端获取当前认证用户
 * 返回用户信息或null（如果未认证）
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('getServerUser error:', error);
    return null;
  }
}

/**
 * 服务端认证检查
 * 如果用户未认证，抛出错误
 */
export async function requireAuth(): Promise<{ user: User; supabase: Awaited<ReturnType<typeof createServerClient>> }> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return { user, supabase };
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    // 这里可以添加更复杂的管理员检查逻辑
    // 目前简单检查用户是否存在于profiles表中
    return true;
  } catch (error) {
    console.error('isAdmin error:', error);
    return false;
  }
}