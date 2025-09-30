"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function GAListener({ measurementId }: { measurementId?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    const qs = searchParams?.toString();
    const url = pathname + (qs ? `?${qs}` : '');
    try {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_path: url,
        page_location: typeof window !== 'undefined' ? window.location.href : undefined,
        send_to: measurementId,
      });
    } catch {}
  }, [pathname, searchParams, measurementId]);

  return null;
}
