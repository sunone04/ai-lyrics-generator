'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/lib/types';

// 轻量去重缓存：避免在路由快速切换或并发初始化时重复请求 /api/me/bootstrap
const BOOTSTRAP_DEDUPE_MS = 3000;
let bootstrapCache: { data: any | null; expiresAt: number; inflight: Promise<any> | null } = {
  data: null,
  expiresAt: 0,
  inflight: null,
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBootstrap = useCallback(async () => {
    try {
      // 命中本地短期缓存
      if (Date.now() < bootstrapCache.expiresAt && bootstrapCache.data) {
        const data = bootstrapCache.data;
        if (!data?.user) {
          setUser(null);
          setProfile(null);
          return null;
        }
        const u = { id: data.user.id, email: data.user.email } as User;
        setUser(u);
        if (data.profile) setProfile(data.profile as Profile);
        return u;
      }

      // 合并并发请求
      if (bootstrapCache.inflight) {
        const data = await bootstrapCache.inflight;
        if (!data?.user) {
          setUser(null);
          setProfile(null);
          return null;
        }
        const u = { id: data.user.id, email: data.user.email } as User;
        setUser(u);
        if (data.profile) setProfile(data.profile as Profile);
        return u;
      }

      const inflight = (async () => {
        const res = await fetch('/api/me/bootstrap', { cache: 'no-store' });
        const data = await res.json();
        // 设置短期缓存
        bootstrapCache.data = data;
        bootstrapCache.expiresAt = Date.now() + BOOTSTRAP_DEDUPE_MS;
        return data;
      })();

      bootstrapCache.inflight = inflight;
      const data = await inflight;
      bootstrapCache.inflight = null;
      if (!data?.user) {
        setUser(null);
        setProfile(null);
        return null;
      }

      const u = { id: data.user.id, email: data.user.email } as User;
      setUser(u);
      if (data.profile) setProfile(data.profile as Profile);

      // Seed trial cache for useTrial hook to avoid extra GET
      try {
        const trial = data.trial;
        if (trial && typeof window !== 'undefined') {
          const TTL = 6 * 60 * 60 * 1000; // 6 hours
          const cacheKey = `trial_status_cache_v1:${u.id}`;
          const value = {
            isInTrial: !!trial.isInTrial,
            canUseTrial: !!trial.canUseTrial,
            isTrialUsed: !!trial.isTrialUsed,
            trialStartDate: trial.trialStartDate,
            trialEndDate: trial.trialEndDate,
            loading: false,
          };
          localStorage.setItem(cacheKey, JSON.stringify({ value, expiresAt: Date.now() + TTL }));
        }
      } catch {}

      return u;
    } catch (e) {
      setUser(null);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchBootstrap();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchBootstrap]);

  const signOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (!res.ok) throw new Error('Sign out failed');
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
