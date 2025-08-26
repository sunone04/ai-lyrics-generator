'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getRouteConfig } from '@/lib/route-protection';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  // 允许覆盖路由配置
  forceRequireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback = <div>Please sign in to access this page.</div>,
  redirectTo,
  forceRequireAuth
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // 获取当前路由的配置
  const routeConfig = getRouteConfig(pathname);
  
  // 使用传入的redirectTo或路由配置中的redirectTo
  const finalRedirectTo = redirectTo || routeConfig.redirectTo || '/auth/signin';
  
  // 判断是否需要认证
  const requiresAuth = forceRequireAuth !== undefined ? forceRequireAuth : routeConfig.requiresAuth;

  useEffect(() => {
    if (!loading && requiresAuth && !user && finalRedirectTo) {
      // 保存当前路径作为返回地址
      const returnTo = encodeURIComponent(pathname);
      const redirectUrl = finalRedirectTo.includes('?') 
        ? `${finalRedirectTo}&returnTo=${returnTo}`
        : `${finalRedirectTo}?returnTo=${returnTo}`;
      
      router.push(redirectUrl);
    }
  }, [user, loading, router, finalRedirectTo, requiresAuth, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 如果不需要认证，直接显示内容
  if (!requiresAuth) {
    return <>{children}</>;
  }

  // 如果需要认证但用户未登录，显示fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // 用户已登录，显示内容
  return <>{children}</>;
}