'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { GenerationListItem } from '@/lib/types';
import { useAuth } from './auth-context';
import { createClient } from '@/lib/supabase';

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
  const supabase = useMemo(() => createClient(), []);

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

  // Fetch generations with caching (client → Supabase with RLS)
  const fetchGenerations = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && isCacheValid(lastFetchGenerations) && generations.length > 0) return;

    setLoadingGenerations(true);
    try {
      const pageSize = 20;
      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, music_style, music_theme, model_used, is_favorited, generated_lyrics')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      if (error) throw error;
      setGenerations(data || []);
      setLastFetchGenerations(Date.now());
    } catch (error) {
      console.error('Error fetching generations (client direct):', error);
    } finally {
      setLoadingGenerations(false);
    }
  }, [user, lastFetchGenerations, supabase]);

  // Fetch favorites with caching (lazy trigger recommended)
  const fetchFavorites = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && isCacheValid(lastFetchFavorites) && favorites.length > 0) return;

    setLoadingFavorites(true);
    try {
      const pageSize = 20;
      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, music_style, music_theme, model_used, is_favorited, generated_lyrics')
        .eq('user_id', user.id)
        .eq('is_favorited', true)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      if (error) throw error;
      setFavorites(data || []);
      setLastFetchFavorites(Date.now());
    } catch (error) {
      console.error('Error fetching favorites (client direct):', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user, lastFetchFavorites, supabase]);

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
      const { data, error } = await supabase
        .from('personal_style_groups')
        .select('id, name, created_at, personal_style_lyrics(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      if (error) throw error;
      setPersonalStyles(data || []);
      setLastFetchPersonalStyles(Date.now());
    } catch (error) {
      console.error('Error fetching personal styles (client direct):', error);
    } finally {
      setLoadingPersonalStyles(false);
    }
  }, [user, profile, lastFetchPersonalStyles, supabase]);

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

  // Auto-fetch on user change: recent + personal styles only; favorites lazy
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchGenerations();
        fetchPersonalStyles();
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
  }, [user, profile]);

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
