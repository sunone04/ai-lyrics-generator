type CachedProfile = {
  status: string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  cachedAt: number;
};

const KEY = 'profile-cache-v1';

export function getProfileFromCache(ttlMs = 5 * 60 * 1000): Omit<CachedProfile, 'cachedAt'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedProfile;
    if (Date.now() - data.cachedAt > ttlMs) return null;
    const { cachedAt, ...rest } = data;
    return rest;
  } catch {
    return null;
  }
}

// Session-long cache: ignore TTL; only changes on explicit clear or overwrite
export function getProfileFromCacheNoTTL(): Omit<CachedProfile, 'cachedAt'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedProfile;
    const { cachedAt, ...rest } = data;
    return rest;
  } catch {
    return null;
  }
}

export function setProfileCache(profile: Omit<CachedProfile, 'cachedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedProfile = { ...profile, cachedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function clearProfileCache() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
}


