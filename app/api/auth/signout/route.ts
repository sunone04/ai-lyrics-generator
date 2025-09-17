import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
  // Build a response so we can attach Set-Cookie headers from the auth helper
  const response = NextResponse.json({ success: true });
  try {
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

    await supabase.auth.signOut();

    // 清除前端可见的登录提示 Cookie
    try {
      const sane: any = { sameSite: 'lax', path: '/' };
      if (process.env.NODE_ENV === 'production') sane.secure = true;
      sane.maxAge = 0;
      response.cookies.set('aig_auth', '', sane);
    } catch {}
  } catch (e) {
    // Keep response success false if needed
    return NextResponse.json({ success: false }, { status: 500 });
  }
  return response;
}
