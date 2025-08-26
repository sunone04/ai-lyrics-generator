import { NextResponse, type NextRequest } from 'next/server'

// 极其轻量的认证中间件 - 标准AI SaaS标准做法
// 只检查cookie存在性，不进行任何网络请求，最小化Vercel CPU消耗
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 完全公开的页面 - 无需认证，利于SEO
  if (isPublicPage(pathname)) {
    return NextResponse.next()
  }
  
  // 受保护的页面 - 需要认证
  if (isProtectedPage(pathname)) {
    // 使用 cookies.has() 替代 cookies.get() - 这是最轻量的方式
    // 只检查认证cookie是否存在，不读取值，不进行验证
    const hasAuthCookie = request.cookies.has('sb-access-token') || 
                         request.cookies.has('sb-refresh-token')
    
    if (!hasAuthCookie) {
      return handleUnauthorized(request)
    }
  }

  // 允许请求继续，详细验证在页面/API内部进行
  // 这是标准AI SaaS的做法：中间件轻量，API严格
  return NextResponse.next()
}

// 判断是否为完全公开的页面（利于SEO）
function isPublicPage(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/blog',
    '/blog/',
    '/faq',
    '/pricing',
    '/privacy',
    '/terms',
    '/refund',
    '/contact',
    '/sitemap.xml',
    '/robots.txt'
  ]
  
  // 博客分类页面
  if (pathname.startsWith('/blog/category/')) return true
  // 博客文章页面
  if (pathname.startsWith('/blog/') && pathname !== '/blog/') return true
  // 静态资源
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) return true
  
  return publicPaths.includes(pathname)
}

// 判断是否为受保护的页面
function isProtectedPage(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/admin1762096094'
  ]
  
  return protectedPaths.some(path => pathname.startsWith(path))
}

// 处理未授权请求
function handleUnauthorized(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // API路由返回401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  // 页面路由重定向到登录页
  const redirectUrl = new URL('/auth/signin', request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    // 精确匹配需要检查的路由，避免不必要的中间件执行
    // 这是性能优化的关键：只对需要的路由执行中间件
    '/dashboard',
    '/dashboard/:path*',
    // 其余页面均为公开访问，不做拦截
    '/admin1762096094',
    '/admin1762096094/:path*',
    // 受保护的API路由（仅保留存在的）
    '/api/rewrite',
    '/api/user',
    '/api/user/:path*',
    '/api/generations',
    '/api/generations/:path*',

    // 不再拦截任何公开页面，公开页不经过中间件
  ]
}