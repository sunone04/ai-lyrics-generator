import { createServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * A helper function to protect API routes and server components.
 * It checks for an active user session and throws an error if not found.
 * @returns {Promise<{user: any, supabase: any}>} The user object and Supabase client.
 */
export async function requireAuth() {
  const supabase = await createServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return { user, supabase };
}