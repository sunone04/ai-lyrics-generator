import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ADMIN_CONFIG } from '@/lib/admin-config';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${ADMIN_CONFIG.signInPath}?returnTo=${encodeURIComponent(ADMIN_CONFIG.adminPath)}`);
  }

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  return (
    <>{children}</>
  );
}


