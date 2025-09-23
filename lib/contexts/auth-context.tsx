"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

// Lightweight dedupe cache to avoid duplicate /api/me/bootstrap requests during fast route switches
const BOOTSTRAP_DEDUPE_MS = 5000;
let bootstrapCache: { data: any | null; expiresAt: number; inflight: Promise<any> | null } = {
  data: null,
  expiresAt: 0,
  inflight: null,
};

// Persisted local cache to speed up perceived auth/profile load on revisit
const BOOTSTRAP_LOCAL_CACHE_KEY = 'bootstrap_cache_v1';
const BOOTSTRAP_LOCAL_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
  refreshProfile: (force?: boolean) => Promise<void>;
  // Optimistic local counters update to avoid redundant bootstrap calls
  bumpProfileCounts: (delta: { generation?: number; rewrite?: number; favorites?: number }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBootstrap = useCallback(async (force?: boolean) => {
    try {
      // Prefer short-term local cache
      if (!force && Date.now() < bootstrapCache.expiresAt && bootstrapCache.data) {
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
      if (!force && bootstrapCache.inflight) {
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
        // Allow HTTP caching (private, max-age) set by the API route
        // Removing `no-store` lets the browser reuse the response for ~30s.
        const res = await fetch('/api/me/bootstrap');
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

      // Persist a compact cache for fast warm start
      try {
        if (typeof window !== 'undefined') {
          const compact = {
            user: { id: u.id, email: u.email },
            profile: data.profile || null,
          };
          localStorage.setItem(
            BOOTSTRAP_LOCAL_CACHE_KEY,
            JSON.stringify({ value: compact, expiresAt: Date.now() + BOOTSTRAP_LOCAL_TTL_MS })
          );
          // Refresh front-visible hint cookie to keep bootstrap fast
          try {
            const secure = typeof location !== 'undefined' && location.protocol === 'https:';
            document.cookie = `aig_auth=1; Max-Age=${60 * 60 * 24 * 7}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
          } catch {}
        }
      } catch {}

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
                    // Force-refresh bootstrap to immediately reflect Trial status
                    try { await fetchBootstrap(true); } catch {}
                    // Notify listeners that trial status may have changed
                    try { window.dispatchEvent(new CustomEvent('trial:changed')); } catch {}
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

  const refreshProfile = useCallback(async (force?: boolean) => {
    try {
      if (force) {
        // Bust short-term cache to guarantee fresh data immediately
        bootstrapCache = { data: null, expiresAt: 0, inflight: null };
      }
    } catch {}
    await fetchBootstrap(force);
  }, [fetchBootstrap]);

  // Mount: show local cached auth/profile quickly; revalidate in background when possible
  useEffect(() => {
    const init = () => {
      try {
        let shownFromCache = false;
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(BOOTSTRAP_LOCAL_CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt && parsed.value?.user) {
                const u = parsed.value.user as { id: string; email?: string };
                const p = parsed.value.profile as Profile | null;
                setUser({ id: u.id, email: u.email } as User);
                if (p) setProfile(p);
                shownFromCache = true;
              }
            }
          } catch {}
        }

        if (shownFromCache) {
          setLoading(false);
          // Background refresh to ensure freshness if we have a hint
          try { if (hasAuthHintCookie()) void fetchBootstrap(); } catch {}
        } else {
          if (hasAuthHintCookie()) {
            fetchBootstrap().finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        }
      } catch {
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
    bumpProfileCounts: (delta: { generation?: number; rewrite?: number; favorites?: number }) => {
      try {
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev } as Profile;
          const dg = delta.generation ?? 0;
          const dr = delta.rewrite ?? 0;
          const df = delta.favorites ?? 0;
          // Clamp to >= 0 to avoid negative UI states
          next.generation_count = Math.max(0, (next.generation_count || 0) + dg);
          next.rewrite_count = Math.max(0, (next.rewrite_count || 0) + dr);
          next.favorite_count = Math.max(0, (next.favorite_count || 0) + df);

          // Keep short-term in-memory cache consistent
          try {
            if (bootstrapCache?.data?.profile) {
              const p = bootstrapCache.data.profile as any;
              p.generation_count = next.generation_count;
              p.rewrite_count = next.rewrite_count;
              p.favorite_count = next.favorite_count;
            }
          } catch {}

          // Keep localStorage bootstrap cache consistent
          try {
            if (typeof window !== 'undefined') {
              const raw = localStorage.getItem(BOOTSTRAP_LOCAL_CACHE_KEY);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.value) {
                  parsed.value.profile = {
                    ...(parsed.value.profile || {}),
                    generation_count: next.generation_count,
                    rewrite_count: next.rewrite_count,
                    favorite_count: next.favorite_count,
                  };
                  localStorage.setItem(
                    BOOTSTRAP_LOCAL_CACHE_KEY,
                    JSON.stringify(parsed)
                  );
                }
              }
            }
          } catch {}

          return next;
        });
      } catch {}
    },
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
