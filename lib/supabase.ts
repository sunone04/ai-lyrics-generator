// lib/supabase.ts

import { createBrowserClient, createServerClient as createSsrServerClient } from '@supabase/ssr'

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 创建浏览器端Supabase客户端
 * 用于客户端组件和浏览器环境
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}