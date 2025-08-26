// 路由保护配置
// 定义哪些页面需要认证，哪些不需要

export interface RouteConfig {
  path: string;
  requiresAuth: boolean;
  redirectTo?: string;
  fallback?: string;
}

export const ROUTE_PROTECTION: RouteConfig[] = [
  // 公开页面 - 无需认证
  { path: '/', requiresAuth: false },
  { path: '/generate', requiresAuth: false },
  { path: '/edit', requiresAuth: false },
  { path: '/pricing', requiresAuth: false },
  { path: '/blog', requiresAuth: false },
  { path: '/blog/category/[slug]', requiresAuth: false },
  { path: '/blog/[slug]', requiresAuth: false },
  { path: '/blog/page/[page]', requiresAuth: false },
  { path: '/faq', requiresAuth: false },
  { path: '/contact', requiresAuth: false },
  { path: '/privacy', requiresAuth: false },
  { path: '/terms', requiresAuth: false },
  { path: '/refund', requiresAuth: false },
  { path: '/auth/signin', requiresAuth: false },
  { path: '/auth/callback', requiresAuth: false },
  { path: '/auth/reset-password', requiresAuth: false },
  { path: '/auth/update-password', requiresAuth: false },
  
  // 需要认证的页面
  { path: '/account', requiresAuth: true, redirectTo: '/auth/signin' },
  { path: '/dashboard', requiresAuth: true, redirectTo: '/auth/signin' },
  { path: '/generate/result/[id]', requiresAuth: true, redirectTo: '/auth/signin' },
  { path: '/generate/result/live', requiresAuth: true, redirectTo: '/auth/signin' },
  
  // 管理员页面
  { path: '/admin1762096094', requiresAuth: true, redirectTo: '/auth/signin' },
  { path: '/admin1762096094/categories', requiresAuth: true, redirectTo: '/auth/signin' },
  { path: '/admin1762096094/posts', requiresAuth: true, redirectTo: '/auth/signin' },
];

// 检查路径是否需要认证
export function isRouteProtected(pathname: string): RouteConfig | null {
  // 移除查询参数
  const path = pathname.split('?')[0];
  
  // 精确匹配
  const exactMatch = ROUTE_PROTECTION.find(route => route.path === path);
  if (exactMatch) return exactMatch;
  
  // 动态路由匹配
  for (const route of ROUTE_PROTECTION) {
    if (route.path.includes('[') && route.path.includes(']')) {
      // 将动态路由转换为正则表达式
      const regexPattern = route.path
        .replace(/\[([^\]]+)\]/g, '[^/]+') // 将 [id] 替换为 [^/]+
        .replace(/\//g, '\\/'); // 转义斜杠
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(path)) {
        return route;
      }
    }
  }
  
  // 默认允许访问（公开）
  return { path, requiresAuth: false };
}

// 获取路由配置
export function getRouteConfig(pathname: string): RouteConfig {
  const config = isRouteProtected(pathname);
  return config || { path: pathname, requiresAuth: false };
}
