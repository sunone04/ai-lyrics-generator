import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // 规范域名：将 www 子域统一重定向到主域，避免 Cookie 落在 www 导致主域读不到
  if (host.startsWith('www.')) {
    const url = new URL(request.url)
    url.host = host.replace(/^www\./, '')
    return NextResponse.redirect(url, 308)
  }

  // 仅保护敏感页面/API：管理端与用户私有API
  if (isProtectedPath(pathname)) {
    // 验证Supabase认证Token的有效性
    const authResult = await validateSupabaseAuth(request)
    if (!authResult.isValid) {
      return handleUnauthorized(request, authResult.reason)
    }
  }

  return NextResponse.next()
}

// 验证Supabase认证状态
async function validateSupabaseAuth(request: NextRequest): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // 获取Supabase认证Cookie
    const all = request.cookies.getAll()
    const hasSupabaseToken = all.some(c => {
      const name = c.name || ''
      const val = c.value || ''
      const looksAccess = name.startsWith('sb-') && name.endsWith('access-token')
      const looksRefresh = name.startsWith('sb-') && name.endsWith('refresh-token')
      const looksAuthToken = name.startsWith('sb-') && name.endsWith('auth-token')
      const longEnough = val.length > 20
      return (looksAccess || looksRefresh || looksAuthToken) && longEnough
    })

    if (!hasSupabaseToken) {
      return { isValid: false, reason: 'No authentication token found' }
    }

    // 检查Token是否过期（基本检查）
    const accessToken = all.find(c => c.name.startsWith('sb-') && c.name.endsWith('access-token'))
    if (accessToken) {
      try {
        // 简单的JWT过期检查（不验证签名，只检查过期时间）
        const payload = JSON.parse(Buffer.from(accessToken.value.split('.')[1], 'base64').toString())
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          return { isValid: false, reason: 'Access token expired' }
        }
      } catch {
        // Token格式错误，视为无效
        return { isValid: false, reason: 'Invalid token format' }
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Auth validation error:', error)
    return { isValid: false, reason: 'Authentication validation failed' }
  }
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

function handleUnauthorized(request: NextRequest, reason?: string) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ 
      error: 'Authentication required', 
      reason: reason || 'No valid authentication found' 
    }, { status: 401 })
  }
  const redirectUrl = new URL('/auth/signin', request.url)
  // 与登录页参数一致（/auth/signin 读取 returnTo）
  redirectUrl.searchParams.set('returnTo', pathname)
  if (reason) {
    redirectUrl.searchParams.set('reason', reason)
  }
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