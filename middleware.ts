import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 仅保护敏感页面/API：管理端与用户私有API
  if (isProtectedPath(pathname)) {
    // 兼容不同 Supabase 版本/前缀：匹配形如 sb-<project>-access-token / sb-<project>-refresh-token
    const all = request.cookies.getAll()
    const hasSupabaseToken = all.some(c => {
      const name = c.name || ''
      const val = c.value || ''
      const looksAccess = name.startsWith('sb-') && name.endsWith('access-token')
      const looksRefresh = name.startsWith('sb-') && name.endsWith('refresh-token')
      const longEnough = val.length > 20
      return (looksAccess || looksRefresh) && longEnough
    })
    if (!hasSupabaseToken) {
      return handleUnauthorized(request)
    }
  }

  return NextResponse.next()
}

function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/admin1762096094',
    '/admin1762096094/',
    '/admin1762096094/:path*',
    '/account',
    '/account/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/generate/result',
    '/generate/result/:path*',
    // 仅保护需要用户身份的API
    '/api/user',
    '/api/user/:path*',
    '/api/generations',
    '/api/generations/:path*',
    '/api/favorite',
    '/api/favorite/:path*',
  ]
  return protectedPaths.some((p) => matchPrefix(pathname, p))
}

function matchPrefix(pathname: string, pattern: string) {
  if (pattern.endsWith('/:path*')) return pathname.startsWith(pattern.replace('/:path*', ''))
  return pathname === pattern || pathname.startsWith(pattern)
}

function handleUnauthorized(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const redirectUrl = new URL('/auth/signin', request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/admin1762096094',
    '/admin1762096094/:path*',
    '/account',
    '/account/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/generate/result',
    '/generate/result/:path*',
    '/api/user',
    '/api/user/:path*',
    '/api/generations',
    '/api/generations/:path*',
    '/api/favorite',
    '/api/favorite/:path*',
  ]
}