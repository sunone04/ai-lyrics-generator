"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

// Lightweight dedupe cache to avoid duplicate /api/me/bootstrap requests during fast route switches
const BOOTSTRAP_DEDUPE_MS = 3000;
let bootstrapCache: { data: any | null; expiresAt: number; inflight: Promise<any> | null } = {
  data: null,
  expiresAt: 0,
  inflight: null,
};

// Front-end readable login hint cookie name (to avoid anon bootstrap calls)
export const AUTH_HINT_COOKIE = 'aig_auth';

export function hasAuthHintCookie(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const cookies = document.cookie?.split('; ').filter(Boolean) || [];
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === AUTH_HINT_COOKIE && v === '1') return true;
    }
  } catch {}
  return false;
}

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
      // Prefer short-term local cache
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

      // Merge concurrent in-flight
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
          } as any;
          localStorage.setItem(cacheKey, JSON.stringify({ value, expiresAt: Date.now() + TTL }));

          // Automatic trial activation on first eligible login (non-blocking)
          try {
            const alreadyTriedKey = `trial_auto_activated_v1:${u.id}`;
            const alreadyTried = localStorage.getItem(alreadyTriedKey);
            const isActive = (data.profile as any)?.status === 'active';
            if (!alreadyTried && !isActive && value.canUseTrial && !value.isInTrial) {
              // Mark as tried; if activation fails, remove to allow future retry
              localStorage.setItem(alreadyTriedKey, '1');
              (async () => {
                try {
                  const res = await fetch('/api/trial/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                  if (res.ok) {
                    try { await fetchBootstrap(); } catch {}
                  } else {
                    try { localStorage.removeItem(alreadyTriedKey); } catch {}
                  }
                } catch {
                  try { localStorage.removeItem(alreadyTriedKey); } catch {}
                }
              })();
            }
          } catch {}
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

  // Mount: only fetch when login hint cookie exists; avoid any API for anonymous users
  useEffect(() => {
    const init = async () => {
      try {
        if (hasAuthHintCookie()) {
          await fetchBootstrap();
        }
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

// Optional: safe read when provider not mounted; returns undefined
export function useOptionalAuth() {
  try {
    return useContext(AuthContext);
  } catch {
    return undefined as any;
  }
}

