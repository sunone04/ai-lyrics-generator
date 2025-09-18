'use client';

import { ReactNode } from 'react';
import { PaddleProvider } from '@/components/ui/paddle-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { DataProvider } from '@/lib/contexts/data-context';

export default function ConditionalProviders({ children }: { children: ReactNode }) {
  // 全局挂载 Provider，确保全站组件（如 Navbar）可实时读取登录状态
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

