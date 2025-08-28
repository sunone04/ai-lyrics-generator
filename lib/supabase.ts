import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// 浏览端轻量客户端（仅使用 anon key），避免在服务端持久运行导致 Vercel 活跃 CPU
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
}

// 兼容旧引用
export { createBrowserClient as createClient };


