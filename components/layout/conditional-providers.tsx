'use client';

import { ReactNode } from 'react';
import { PaddleProvider } from '@/components/ui/paddle-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { DataProvider } from '@/lib/contexts/data-context';
import { SWRConfig } from 'swr';
import toast from 'react-hot-toast';

export default function ConditionalProviders({ children }: { children: ReactNode }) {
  // 全局挂载 Provider + SWRConfig，统一数据获取与缓存策略
  const fetcher = async (key: string | [string, Record<string, any>]) => {
    let url = '';
    if (Array.isArray(key)) {
      const [base, params] = key;
      const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
        });
      }
      url = u.toString();
    } else {
      url = key;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      let message = 'Request failed';
      try { const j = await res.json(); message = j?.error || j?.message || message; } catch {}
      throw new Error(message);
    }
    return res.json();
  };

  return (
    <PaddleProvider>
      <SWRConfig value={{
        fetcher,
        dedupingInterval: 3000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (error: any) => {
          if (!error) return;
          // Ignore aborts
          if (error?.name === 'AbortError') return;
          const msg = typeof error?.message === 'string' && error.message.trim()
            ? error.message.trim()
            : 'Something went wrong. Please try again.';
          if (/failed to fetch/i.test(msg)) {
            toast.error('Network error. Please check your connection.');
          } else {
            toast.error(msg);
          }
        },
      }}>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </SWRConfig>
    </PaddleProvider>
  );
}
