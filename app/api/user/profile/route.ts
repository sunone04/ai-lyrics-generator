import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cacheService } from '@/lib/cache-service';

// Cache for profile data to reduce database calls
const PROFILE_CACHE = new Map<string, { profile: any; timestamp: number }>();
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of PROFILE_CACHE.entries()) {
    if (now - value.timestamp > PROFILE_CACHE_TTL) {
      PROFILE_CACHE.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options)
          },
        },
      }
    );
    
    // 使用更轻量的getSession()替代getUser()
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user; // 功能完全相同

    // Fetch from database - 使用缓存服务优化
    let profile = await cacheService.getUserProfile(user.id);
    
    if (!profile) {
      // 缓存未命中，从数据库获取
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
      }
      
      profile = profileData;
      // 更新缓存
      await cacheService.set(`user_profile:${user.id}`, profile, 300);
    }

    return NextResponse.json(profile, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // 60 minutes client cache
        'ETag': `"${Date.now()}"`,
        'X-Cache': profile ? 'HIT' : 'MISS'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options)
          },
        },
      }
    );
    
    // 使用更轻量的getSession()替代getUser()
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user; // 功能完全相同

    const body = await request.json();
    
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', user.id)
      .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // 清除缓存，强制重新获取
    await cacheService.clearUserCache(user.id);

    return NextResponse.json(profile);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}