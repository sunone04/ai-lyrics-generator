import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountManagement from '@/components/account/account-management'

export const metadata: Metadata = {
  title: 'Account Management - AI Lyrics Generator',
  description: 'Manage your AI Lyrics Generator account, subscription, and billing information.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountPage() {
  const supabase = await createServerClient()
  
  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Get user profile（仅选择必要字段，减少传输与序列化）
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,status,is_admin,paddle_customer_id,active_price_id,paddle_subscription_id,subscription_plan_name,subscription_billing_cycle,subscription_start_date,subscription_end_date,next_billing_date,subscription_canceled_at,generation_count,rewrite_count,favorite_count,usage_last_reset,updated_at')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    redirect('/auth/signin')
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Account Management
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Manage your subscription, billing, and account settings.
          </p>
          
          <AccountManagement user={user} profile={profile} />
        </div>
      </div>
    </div>
  )
}