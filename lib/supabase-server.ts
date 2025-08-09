// lib/supabase-server.ts

import { createServerClient as createSsrServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 创建服务端Supabase客户端
 * 用于API路由、Server Actions和服务端组件
 * 自动处理用户认证状态
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          // 在只读环境中忽略cookie设置错误
        }
      },
    },
  });
}

/**
 * 创建管理员Supabase客户端
 * 拥有service_role权限，仅用于后台管理任务
 * 不处理用户认证，直接使用service key
 */
export function createAdminClient() {
  return createSsrServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Admin client doesn't need to set cookies
      },
    },
  });
}