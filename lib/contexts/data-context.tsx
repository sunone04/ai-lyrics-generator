'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Generation } from '@/lib/types';
import { useAuth } from './auth-context';

interface DataContextType {
  // Generations data
  generations: Generation[];
  favorites: Generation[];
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
  updateGeneration: (id: number, updates: Partial<Generation>) => void;
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
  
  // Data states
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [favorites, setFavorites] = useState<Generation[]>([]);
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
  const isCacheValid = (lastFetch: number) => {
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  // Fetch generations with caching
  const fetchGenerations = useCallback(async (force = false) => {
    if (!user) return;
    
    if (!force && isCacheValid(lastFetchGenerations) && generations.length > 0) {
      return; // Use cached data
    }

    setLoadingGenerations(true);
    try {
      const response = await fetch('/api/me/generations?page=1&pageSize=20', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations || []);
        setLastFetchGenerations(Date.now());
      }
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoadingGenerations(false);
    }
  }, [user, lastFetchGenerations]);

  // Fetch favorites with caching
  const fetchFavorites = useCallback(async (force = false) => {
    if (!user) return;
    
    if (!force && isCacheValid(lastFetchFavorites) && favorites.length > 0) {
      return; // Use cached data
    }

    setLoadingFavorites(true);
    try {
      const response = await fetch('/api/me/generations?favorites=true&page=1&pageSize=20', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.generations || []);
        setLastFetchFavorites(Date.now());
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user, lastFetchFavorites]);

  // Fetch personal styles with caching
  const fetchPersonalStyles = useCallback(async (force = false) => {
    if (!user || !profile) return;
    const canFetchPersonalStyles = profile?.status === 'active' || (profile?.trial_end_date && new Date(profile.trial_end_date) > new Date());
    // 对于强制刷新（如删除/新增后），允许绕过“会员限制”，以确保UI与数据库一致
    if (!canFetchPersonalStyles && !force) return;
    
    // 仅基于时间窗口做缓存，避免“空数组反复重载”的死循环
    if (!force && isCacheValid(lastFetchPersonalStyles)) return;

    setLoadingPersonalStyles(true);
    try {
      const response = await fetch('/api/personal-styles?page=1&pageSize=20', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const data = await response.json();
        // 服务端当前返回键为 styleGroups
        const list = data.personalStyles || data.styleGroups || [];
        setPersonalStyles(list);
        setLastFetchPersonalStyles(Date.now());
      }
    } catch (error) {
      console.error('Error fetching personal styles:', error);
    } finally {
      setLoadingPersonalStyles(false);
    }
  }, [user, profile, lastFetchPersonalStyles]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchGenerations(true),
      fetchFavorites(true),
      fetchPersonalStyles(true),
    ]);
  }, [fetchGenerations, fetchFavorites, fetchPersonalStyles]);

  // Data mutations
  const updateGeneration = useCallback((id: number, updates: Partial<Generation>) => {
    setGenerations(prev => prev.map(gen => 
      gen.id === id ? { ...gen, ...updates } : gen
    ));
    setFavorites(prev => prev.map(gen => 
      gen.id === id ? { ...gen, ...updates } : gen
    ));
  }, []);

  const removeGeneration = useCallback((id: number) => {
    setGenerations(prev => prev.filter(gen => gen.id !== id));
    setFavorites(prev => prev.filter(gen => gen.id !== id));
  }, []);

  const addPersonalStyle = useCallback((style: any) => {
    setPersonalStyles(prev => [style, ...prev]);
  }, []);

  const updatePersonalStyle = useCallback((id: number, updates: any) => {
    setPersonalStyles(prev => prev.map(style => 
      style.id === id ? { ...style, ...updates } : style
    ));
  }, []);

  const removePersonalStyle = useCallback((id: number) => {
    setPersonalStyles(prev => prev.filter(style => style.id !== id));
  }, []);

  // Auto-fetch data when user changes
  useEffect(() => {
    if (user) {
      // Fetch data with a small delay to avoid race conditions
      const timer = setTimeout(() => {
        fetchGenerations();
        fetchFavorites();
        fetchPersonalStyles();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Clear data when user logs out
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
