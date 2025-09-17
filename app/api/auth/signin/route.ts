import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  try {
    const body = await request.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => cookieStore.getAll(),
          setAll: async (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              const saneOptions: any = { sameSite: 'lax', ...options };
              if (process.env.NODE_ENV === 'production') saneOptions.secure = true;
              response.cookies.set(name, value, saneOptions);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    // 标记前端可见的登录提示 Cookie（非 HttpOnly），用于避免匿名访问无谓的 bootstrap 请求
    try {
      const sane: any = { sameSite: 'lax', path: '/' };
      if (process.env.NODE_ENV === 'production') sane.secure = true;
      // 7 天有效期即可，用户长期登录依旧以 Supabase 会话为准
      sane.maxAge = 60 * 60 * 24 * 7;
      response.cookies.set('aig_auth', '1', sane);
    } catch {}
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 });
  }
  return response;
}
