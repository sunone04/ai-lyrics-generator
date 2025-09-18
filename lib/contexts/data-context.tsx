'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
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

  // Cache timestamps
  lastFetchGenerations: number;
  lastFetchFavorites: number;
  lastFetchPersonalStyles: number;

  // Actions
  fetchGenerations: (force?: boolean) => Promise<void>;
  fetchFavorites: (force?: boolean) => Promise<void>;
  fetchPersonalStyles: (force?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Data mutations
  updateGeneration: (id: number, updates: Partial<GenerationListItem>) => void;
  removeGeneration: (id: number) => void;
  addPersonalStyle: (style: any) => void;
  updatePersonalStyle: (id: number, updates: any) => void;
  removePersonalStyle: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  // Data states
  const [generations, setGenerations] = useState<GenerationListItem[]>([]);
  const [favorites, setFavorites] = useState<GenerationListItem[]>([]);
  const [personalStyles, setPersonalStyles] = useState<any[]>([]);

  // Loading states
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingPersonalStyles, setLoadingPersonalStyles] = useState(false);

  // Cache timestamps
  const [lastFetchGenerations, setLastFetchGenerations] = useState(0);
  const [lastFetchFavorites, setLastFetchFavorites] = useState(0);
  const [lastFetchPersonalStyles, setLastFetchPersonalStyles] = useState(0);

  // Check if cache is valid
  const isCacheValid = (lastFetch: number) => Date.now() - lastFetch < CACHE_DURATION;

  // Fetch generations with caching (client → self API → server Supabase)
  const fetchGenerations = useCallback(async (force = false) => {
    if (!user) return;
    // Cache even when the list is empty to avoid refetch loops
    if (!force && isCacheValid(lastFetchGenerations)) return;

    setLoadingGenerations(true);
    try {
      const pageSize = 20;
      const res = await fetch(`/api/me/generations?page=1&pageSize=${pageSize}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch generations');
      const result = await res.json();
      setGenerations(result?.generations || []);
      setLastFetchGenerations(Date.now());
    } catch (error) {
      console.error('Error fetching generations (client direct):', error);
    } finally {
      setLoadingGenerations(false);
    }
  }, [user, lastFetchGenerations]);

  // Fetch favorites with caching (lazy trigger recommended)
  const fetchFavorites = useCallback(async (force = false) => {
    if (!user) return;
    // Cache even when the list is empty to avoid unnecessary refetches
    if (!force && isCacheValid(lastFetchFavorites)) return;

    setLoadingFavorites(true);
    try {
      const pageSize = 20;
      const res = await fetch(`/api/me/generations?favorites=true&page=1&pageSize=${pageSize}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const result = await res.json();
      setFavorites(result?.generations || []);
      setLastFetchFavorites(Date.now());
    } catch (error) {
      console.error('Error fetching favorites (client direct):', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user, lastFetchFavorites]);

  // Fetch personal styles with caching (requires active or trial user)
  const fetchPersonalStyles = useCallback(async (force = false) => {
    if (!user || !profile) return;
    const canFetchPersonalStyles =
      profile?.status === 'active' || (profile?.trial_end_date && new Date(profile.trial_end_date) > new Date());
    if (!canFetchPersonalStyles && !force) return;
    if (!force && isCacheValid(lastFetchPersonalStyles)) return;

    setLoadingPersonalStyles(true);
    try {
      const pageSize = 20;
      const res = await fetch(`/api/personal-styles?page=1&pageSize=${pageSize}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch personal styles');
      const result = await res.json();
      setPersonalStyles(result?.styleGroups || []);
      setLastFetchPersonalStyles(Date.now());
    } catch (error) {
      console.error('Error fetching personal styles (client direct):', error);
    } finally {
      setLoadingPersonalStyles(false);
    }
  }, [user, profile, lastFetchPersonalStyles]);

  // Refresh all (explicit user action)
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchGenerations(true),
      fetchFavorites(true),
      fetchPersonalStyles(true),
    ]);
  }, [fetchGenerations, fetchFavorites, fetchPersonalStyles]);

  // Data mutations (client-side state only)
  const updateGeneration = useCallback((id: number, updates: Partial<GenerationListItem>) => {
    setGenerations(prev => prev.map(gen => gen.id === id ? { ...gen, ...updates } : gen));
    setFavorites(prev => prev.map(gen => gen.id === id ? { ...gen, ...updates } : gen));
  }, []);

  const removeGeneration = useCallback((id: number) => {
    setGenerations(prev => prev.filter(gen => gen.id !== id));
    setFavorites(prev => prev.filter(gen => gen.id !== id));
  }, []);

  const addPersonalStyle = useCallback((style: any) => {
    setPersonalStyles(prev => [style, ...prev]);
  }, []);

  const updatePersonalStyle = useCallback((id: number, updates: any) => {
    setPersonalStyles(prev => prev.map(style => style.id === id ? { ...style, ...updates } : style));
  }, []);

  const removePersonalStyle = useCallback((id: number) => {
    setPersonalStyles(prev => prev.filter(style => style.id !== id));
  }, []);

  // Auto-fetch仅在相关页面触发，避免全站无谓请求消耗
  useEffect(() => {
    if (user) {
      const onDashboard = pathname?.startsWith('/dashboard');
      const onPersonalStyle = pathname?.startsWith('/personal-style');

      const timer = setTimeout(() => {
        if (onDashboard) fetchGenerations();
        if (onPersonalStyle) fetchPersonalStyles();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setGenerations([]);
      setFavorites([]);
      setPersonalStyles([]);
      setLastFetchGenerations(0);
      setLastFetchFavorites(0);
      setLastFetchPersonalStyles(0);
    }
  }, [user, profile, pathname]);

  const value = {
    generations,
    favorites,
    personalStyles,
    loadingGenerations,
    loadingFavorites,
    loadingPersonalStyles,
    lastFetchGenerations,
    lastFetchFavorites,
    lastFetchPersonalStyles,
    fetchGenerations,
    fetchFavorites,
    fetchPersonalStyles,
    refreshAll,
    updateGeneration,
    removeGeneration,
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
