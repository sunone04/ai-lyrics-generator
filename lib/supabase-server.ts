import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

export function createServerComponentClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return await cookies().getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async getAll() {
          return await cookies().getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
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
