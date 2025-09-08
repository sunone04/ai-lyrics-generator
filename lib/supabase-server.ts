import { createServerClient } from '@supabase/ssr';
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

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: safeCookieGetAll,
        setAll: safeCookieSetAll,
      },
    }
  );
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
