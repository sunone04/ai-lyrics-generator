'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { GenerationListItem } from '@/lib/types';
import { useAuth } from './auth-context';

interface DataContextType {
  // Generations data
  generations: GenerationListItem[];
  favorites: GenerationListItem[];
  personalStyles: any[];

  // Loading states
  loadingGenerations: boolean;
  loadingFavorites: boolean;
  loadingPersonalStyles: boolean;

  // Actions
  fetchGenerations: (force?: boolean) => Promise<void>;
  fetchFavorites: (force?: boolean) => Promise<void>;
  fetchPersonalStyles: (force?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Data mutations
  updateGeneration: (id: number, updates: Partial<GenerationListItem>) => void;
  removeGeneration: (id: number) => void;
  setFavorite: (id: number, isFavorited: boolean) => Promise<void>;
  deleteGenerationById: (id: number) => Promise<void>;
  addPersonalStyle: (style: any) => void;
  updatePersonalStyle: (id: number, updates: any) => void;
  removePersonalStyle: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile, bumpProfileCounts } = useAuth();
  const pathname = usePathname();

  // Enable flags for on-demand SWR fetching
  const [enableGenerations, setEnableGenerations] = useState(false);
  const [enableFavorites, setEnableFavorites] = useState(false);
  const [enablePersonalStyles, setEnablePersonalStyles] = useState(false);

  const pageSize = 20;

  // SWR: generations (auto on dashboard or when explicitly enabled)
  const genKey = user && enableGenerations ? ['/api/me/generations', { page: 1, pageSize }] : null;
  const { data: genResp, isLoading: swrLoadingGenerations, mutate: mutateGenerations } = useSWR(genKey, null, { dedupingInterval: 120000 });
  const generations: GenerationListItem[] = (genResp?.generations as GenerationListItem[]) || [];

  // SWR: favorites (lazy enable on demand)
  const favKey = user && enableFavorites ? ['/api/me/generations', { favorites: true, page: 1, pageSize }] : null;
  const { data: favResp, isLoading: swrLoadingFavorites, mutate: mutateFavorites } = useSWR(favKey, null, { dedupingInterval: 120000 });
  const favorites: GenerationListItem[] = (favResp?.generations as GenerationListItem[]) || [];

  // SWR: personal styles (gated by active/trial)
  const canFetchPersonalStyles = Boolean(
    profile?.status === 'active' || (profile?.trial_end_date && new Date(profile?.trial_end_date) > new Date())
  );
  const psKey = user && enablePersonalStyles && canFetchPersonalStyles ? ['/api/personal-styles', { page: 1, pageSize }] : null;
  const { data: psResp, isLoading: swrLoadingPersonalStyles, mutate: mutatePersonalStyles } = useSWR(psKey, null, { dedupingInterval: 300000 });
  const personalStyles: any[] = (psResp?.styleGroups as any[]) || [];

  // Public loading flags
  const loadingGenerations = Boolean(enableGenerations && swrLoadingGenerations);
  const loadingFavorites = Boolean(enableFavorites && swrLoadingFavorites);
  const loadingPersonalStyles = Boolean(enablePersonalStyles && swrLoadingPersonalStyles);

  // On-demand fetch triggers
  const fetchGenerations = useCallback(async (force = false) => {
    if (!user) return;
    setEnableGenerations(true);
    if (force) await mutateGenerations();
  }, [user, mutateGenerations]);

  const fetchFavorites = useCallback(async (force = false) => {
    if (!user) return;
    setEnableFavorites(true);
    if (force) await mutateFavorites();
  }, [user, mutateFavorites]);

  const fetchPersonalStyles = useCallback(async (force = false) => {
    if (!user) return;
    setEnablePersonalStyles(true);
    if (force) await mutatePersonalStyles();
  }, [user, mutatePersonalStyles]);

  // Refresh all (explicit user action)
  const refreshAll = useCallback(async () => {
    setEnableGenerations(true);
    setEnableFavorites(true);
    setEnablePersonalStyles(true);
    await Promise.all([
      mutateGenerations(),
      mutateFavorites(),
      mutatePersonalStyles(),
    ]);
  }, [mutateGenerations, mutateFavorites, mutatePersonalStyles]);

  // Data mutations (client-side cache updates via SWR)
  const updateGeneration = useCallback((id: number, updates: Partial<GenerationListItem>) => {
    try {
      mutateGenerations((cur: any) => cur ? { ...cur, generations: (cur.generations || []).map((g: any) => g.id === id ? { ...g, ...updates } : g) } : cur, { revalidate: false });
      mutateFavorites((cur: any) => cur ? { ...cur, generations: (cur.generations || []).map((g: any) => g.id === id ? { ...g, ...updates } : g) } : cur, { revalidate: false });
    } catch {}
  }, [mutateGenerations, mutateFavorites]);

  const removeGeneration = useCallback((id: number) => {
    try {
      mutateGenerations((cur: any) => cur ? { ...cur, generations: (cur.generations || []).filter((g: any) => g.id !== id) } : cur, { revalidate: false });
      mutateFavorites((cur: any) => cur ? { ...cur, generations: (cur.generations || []).filter((g: any) => g.id !== id) } : cur, { revalidate: false });
    } catch {}
  }, [mutateGenerations, mutateFavorites]);

  // Server mutations
  const setFavorite = useCallback(async (id: number, isFavorited: boolean) => {
    if (!user) throw new Error('Unauthenticated');
    const res = await fetch('/api/me/generations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId: id, isFavorited })
    });
    if (!res.ok) {
      try { const j = await res.json(); throw new Error(j?.error || 'Failed to update favorite'); } catch { throw new Error('Failed to update favorite'); }
    }
    updateGeneration(id, { is_favorited: isFavorited });
    // Optimistically bump profile favorite_count locally
    try { bumpProfileCounts({ favorites: isFavorited ? 1 : -1 }); } catch {}
    // Optimistically maintain favorites collection
    try {
      mutateFavorites((cur: any) => {
        if (!cur) return cur;
        const list: any[] = Array.isArray(cur.generations) ? cur.generations : [];
        if (isFavorited) {
          // Add if missing
          if (!list.some((g: any) => g.id === id)) {
            const source = generations.find((g) => g.id === id);
            const item = source ? { ...source, is_favorited: true } : { id, is_favorited: true } as any;
            return { ...cur, generations: [item, ...list] };
          }
          // Otherwise just mark favorited
          return { ...cur, generations: list.map((g: any) => g.id === id ? { ...g, is_favorited: true } : g) };
        }
        // Unfavorite: remove from list
        return { ...cur, generations: list.filter((g: any) => g.id !== id) };
      }, { revalidate: false });
    } catch {}
  }, [user, updateGeneration, mutateFavorites, generations]);

  const deleteGenerationById = useCallback(async (id: number) => {
    if (!user) throw new Error('Unauthenticated');
    const res = await fetch('/api/me/generations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId: id })
    });
    if (!res.ok) {
      try { const j = await res.json(); throw new Error(j?.error || 'Failed to delete generation'); } catch { throw new Error('Failed to delete generation'); }
    }
    removeGeneration(id);
  }, [user, removeGeneration]);

  const addPersonalStyle = useCallback((style: any) => {
    try {
      mutatePersonalStyles((cur: any) => cur ? { ...cur, styleGroups: [style, ...(cur.styleGroups || [])] } : cur, { revalidate: false });
    } catch {}
  }, [mutatePersonalStyles]);

  const updatePersonalStyle = useCallback((id: number, updates: any) => {
    try {
      mutatePersonalStyles((cur: any) => cur ? { ...cur, styleGroups: (cur.styleGroups || []).map((s: any) => s.id === id ? { ...s, ...updates } : s) } : cur, { revalidate: false });
    } catch {}
  }, [mutatePersonalStyles]);

  const removePersonalStyle = useCallback((id: number) => {
    try {
      mutatePersonalStyles((cur: any) => cur ? { ...cur, styleGroups: (cur.styleGroups || []).filter((s: any) => s.id !== id) } : cur, { revalidate: false });
    } catch {}
  }, [mutatePersonalStyles]);

  // Auto-enable SWR keys on relevant pages; reset toggles on logout
  useEffect(() => {
    if (user) {
      const onDashboard = pathname?.startsWith('/dashboard');
      const onPersonalStyle = pathname?.startsWith('/personal-style');

      const timer = setTimeout(() => {
        if (onDashboard) setEnableGenerations(true);
        if (onPersonalStyle) setEnablePersonalStyles(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setEnableGenerations(false);
      setEnableFavorites(false);
      setEnablePersonalStyles(false);
    }
  }, [user, profile, pathname]);

  // Lightweight visibility/focus revalidation when enabled
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      try { if (enableGenerations) void mutateGenerations(); } catch {}
      try { if (enableFavorites) void mutateFavorites(); } catch {}
    };
    try { window.addEventListener('focus', onFocus); } catch {}
    try { document.addEventListener('visibilitychange', onFocus); } catch {}
    return () => {
      try { window.removeEventListener('focus', onFocus); } catch {}
      try { document.removeEventListener('visibilitychange', onFocus); } catch {}
    };
  }, [user, enableGenerations, enableFavorites, mutateGenerations, mutateFavorites]);

  const value: DataContextType = {
    generations,
    favorites,
    personalStyles,
    loadingGenerations,
    loadingFavorites,
    loadingPersonalStyles,
    fetchGenerations,
    fetchFavorites,
    fetchPersonalStyles,
    refreshAll,
    updateGeneration,
    removeGeneration,
    setFavorite,
    deleteGenerationById,
    addPersonalStyle,
    updatePersonalStyle,
    removePersonalStyle,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
