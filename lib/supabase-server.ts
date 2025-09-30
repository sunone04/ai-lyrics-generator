import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Safe cookie helpers that also work during build (no request scope)
async function safeCookieGetAll() {
  try {
    const store = await cookies();
    return store.getAll();
  } catch {
    return [] as { name: string; value: string }[];
  }
}

async function safeCookieSetAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
  try {
    const store = await cookies();
    cookiesToSet.forEach(({ name, value, options }) => {
      // @ts-expect-error: options type is provided by Next runtime
      store.set(name, value, options);
    });
  } catch {
    // outside request scope: noop
  }
}

export function createServerComponentClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: safeCookieGetAll,
        setAll: safeCookieSetAll,
      },
    }
  );
}

// Service-role client that NEVER attaches user cookies, to bypass RLS for admin ops
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  // Important: use supabase-js directly (no cookies) so Authorization uses service role
  return createServiceClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getServerSession() {
  try {
    const supabase = createServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

export async function getServerUser() {
  try {
    const supabase = createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}
