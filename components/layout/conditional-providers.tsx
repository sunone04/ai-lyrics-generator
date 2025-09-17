'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PaddleProvider } from '@/components/ui/paddle-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { DataProvider } from '@/lib/contexts/data-context';

export default function ConditionalProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';

  // 仅在需要鉴权/数据的业务路由挂载 Provider，其他页面不挂载以避免不必要的初始化
  const needsAuth = /^(?:\/dashboard|\/account|\/generate|\/edit|\/personal-style)(?:\/|$)/.test(pathname);

  if (!needsAuth) {
    // 仍然包裹 PaddleProvider（其内部已按路径懒加载 Paddle 脚本）
    return <PaddleProvider>{children}</PaddleProvider>;
  }

  return (
    <PaddleProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </PaddleProvider>
  );
}

