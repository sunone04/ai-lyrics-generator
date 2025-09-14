'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

// 简单本地缓存，减少频繁调用 /api/trial/activate（GET）导致的函数调用与CPU占用
const TRIAL_CACHE_KEY_PREFIX = 'trial_status_cache_v1';
// 因为试用期为 3 天，分钟级精度并无必要；延长缓存有效期以减少请求
const TRIAL_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 小时

interface TrialStatus {
  isInTrial: boolean;
  canUseTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  isTrialUsed: boolean;
  loading: boolean;
  error?: string;
}

interface UsageLimits {
  generation: {
    current: number;
    max: number;
    remaining: number;
    canUse: boolean;
  };
  rewrite: {
    current: number;
    max: number;
    remaining: number;
    canUse: boolean;
  };
  favorites: {
    current: number;
    max: number;
    remaining: number;
    canUse: boolean;
  };
}

interface UsageLimitsResponse {
  profile: {
    id: string;
    status: string;
    isInTrial: boolean;
    canUseTrial: boolean;
    trialStartDate?: string;
    trialEndDate?: string;
    isTrialUsed: boolean;
  };
  usage: UsageLimits;
  limits: {
    maxGenerations: number;
    maxRewrites: number;
    maxFavorites: number;
    isActiveUser: boolean;
  };
}

export function useTrial() {
  const { user, profile } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isInTrial: false,
    canUseTrial: false,
    isTrialUsed: false,
    loading: true
  });
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialStatus = useCallback(async () => {
    if (!user) {
      setTrialStatus({
        isInTrial: false,
        canUseTrial: false,
        isTrialUsed: false,
        loading: false
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // 命中本地缓存则直接返回
      try {
        const cacheKey = `${TRIAL_CACHE_KEY_PREFIX}:${user.id}`;
        const raw = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as { value: TrialStatus; expiresAt: number };
          if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt && parsed.value) {
            setTrialStatus({ ...parsed.value, loading: false });
            setLoading(false);
            return;
          }
        }
      } catch {}

      const response = await fetch('/api/trial/activate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial status');
      }

      const data = await response.json();
      
      const nextStatus: TrialStatus = {
        isInTrial: data.isInTrial,
        canUseTrial: data.canUseTrial,
        trialStartDate: data.trialStartDate,
        trialEndDate: data.trialEndDate,
        isTrialUsed: data.isTrialUsed,
        loading: false
      };
      setTrialStatus(nextStatus);

      // 写入本地缓存
      try {
        const cacheKey = `${TRIAL_CACHE_KEY_PREFIX}:${user.id}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ value: nextStatus, expiresAt: Date.now() + TRIAL_CACHE_TTL_MS })
        );
      } catch {}
    } catch (err) {
      console.error('Error fetching trial status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTrialStatus({
        isInTrial: false,
        canUseTrial: false,
        isTrialUsed: false,
        loading: false
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUsageLimits = async () => {
    if (!user) {
      setUsageLimits(null);
      return;
    }

    try {
      const response = await fetch('/api/me/usage-limits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage limits');
      }

      const data: UsageLimitsResponse = await response.json();
      setUsageLimits(data.usage);
    } catch (err) {
      console.error('Error fetching usage limits:', err);
    }
  };

  const activateTrial = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trial/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to activate trial');
      }

      const data = await response.json();
      
      const nextStatus: TrialStatus = {
        isInTrial: true,
        canUseTrial: false,
        trialStartDate: data.profile.trial_start_date,
        trialEndDate: data.profile.trial_end_date,
        isTrialUsed: true,
        loading: false
      };
      setTrialStatus(nextStatus);

      // 更新本地缓存
      try {
        const cacheKey = `${TRIAL_CACHE_KEY_PREFIX}:${user.id}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ value: nextStatus, expiresAt: Date.now() + TRIAL_CACHE_TTL_MS })
        );
      } catch {}

      // Refresh usage limits
      await fetchUsageLimits();

      return data;
    } catch (err) {
      console.error('Error activating trial:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchTrialStatus();
  };

  useEffect(() => {
    if (user) {
      fetchTrialStatus();
    } else {
      setTrialStatus({
        isInTrial: false,
        canUseTrial: false,
        isTrialUsed: false,
        loading: false
      });
      setUsageLimits(null);
      setLoading(false);
      // 清理缓存（登出后清除所有 trial_status 前缀键）
      try {
        if (typeof window !== 'undefined') {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(TRIAL_CACHE_KEY_PREFIX)) keys.push(k);
          }
          keys.forEach((k) => localStorage.removeItem(k));
        }
      } catch {}
    }
  }, [user, fetchTrialStatus]);

  // Calculate trial time remaining
  const getTrialTimeRemaining = () => {
    if (!trialStatus.trialEndDate) return null;
    
    const endDate = new Date(trialStatus.trialEndDate);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  };

  const isActiveUser = profile?.status === 'active' || trialStatus.isInTrial;

  return {
    ...trialStatus,
    usageLimits,
    loading,
    error,
    activateTrial,
    refreshData,
    getTrialTimeRemaining,
    isActiveUser
  };
}
