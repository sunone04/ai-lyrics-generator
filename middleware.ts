import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 只对 /api/user/* 路由进行认证检查
  if (request.nextUrl.pathname.startsWith('/api/user/')) {
    // 使用一个可写的响应对象，这样 Supabase 在刷新 token 时能把新 cookie 写回响应
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // 将刷新后的会话 cookie 写入响应，而不是写入 request

              response.cookies.set(name, value, options as any);
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/user/:path*',
  ],
};
