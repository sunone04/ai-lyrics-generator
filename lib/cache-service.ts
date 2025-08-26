import { createAdminClient } from './supabase-server'

// 缓存配置 - 标准AI SaaS做法
const CACHE_TTL = {
  USER_PROFILE: 300,      // 5分钟 - 用户数据短期缓存
  SUBSCRIPTION_STATUS: 600, // 10分钟 - 订阅状态短期缓存
  BLOG_POSTS: 604800,     // 7天 - 博客内容中期缓存（标准SaaS做法）
  CATEGORIES: 604800,     // 7天 - 分类中期缓存（标准SaaS做法）
  GENERATION_STATS: 300,  // 5分钟 - 生成统计短期缓存
  API_USAGE_LOGS: 1800,   // 30分钟 - API使用日志缓存（标准SaaS做法）
  GENERATION_HISTORY: 3600, // 1小时 - 生成历史缓存（标准SaaS做法）
  SITEMAP: 86400,         // 24小时 - 站点地图缓存（标准SaaS做法）
  PADDLE_WEBHOOK: 1800,   // 30分钟 - Paddle支付缓存（标准SaaS做法）
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
  lastUpdated: number  // 添加最后更新时间
}

interface BlogPostsResult {
  posts: any[]
  total: number
}

interface Category {
  id: number
  name: string
  slug: string
  seo_title?: string
  meta_description?: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface UserProfile {
  id: string
  email: string
  status: 'free' | 'active' | 'canceled' | 'past_due'
  generation_count: number
  rewrite_count: number
  usage_last_reset: string
  favorite_count: number
  is_admin: boolean
  subscription_end_date?: string
  created_at: string
  updated_at: string
}

interface SubscriptionStatus {
  status: 'free' | 'active' | 'canceled' | 'past_due'
  subscription_end_date?: string
  active_price_id?: string
}

/**
 * 基于Supabase的智能缓存服务
 * 标准AI SaaS做法：博客内容长期静态缓存，只在管理操作时更新
 */
export class CacheService {
  private static instance: CacheService
  private cache = new Map<string, CacheEntry<any>>()
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiresAt, lastUpdated: Date.now() })
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * 获取用户配置文件（带缓存）
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `user_profile:${userId}`
    let profile = await this.get<UserProfile>(cacheKey)
    
    if (!profile) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
        .eq('id', userId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      profile = data as UserProfile
      await this.set(cacheKey, profile, CACHE_TTL.USER_PROFILE)
    }
    
    return profile
  }

  /**
   * 获取订阅状态（带缓存）
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    const cacheKey = `subscription:${userId}`
    let status = await this.get<SubscriptionStatus>(cacheKey)
    
    if (!status) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('status, subscription_end_date, active_price_id')
        .eq('id', userId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      status = data as SubscriptionStatus
      await this.set(cacheKey, status, CACHE_TTL.SUBSCRIPTION_STATUS)
    }
    
    return status
  }

  /**
   * 获取博客分类（带智能缓存）
   * 标准SaaS做法：分类较少变化，中期缓存
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories:all'
    let categories = await this.get<Category[]>(cacheKey)
    
    if (!categories) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error || !data) {
        return []
      }
      
      categories = data as Category[]
      // 7天缓存，标准SaaS做法
      await this.set(cacheKey, categories, CACHE_TTL.CATEGORIES)
    }
    
    return categories
  }

  /**
   * 获取博客文章（带智能缓存）
   * 标准SaaS做法：文章内容中期缓存，除非有更新
   */
  async getBlogPosts(categorySlug?: string, page: number = 1, limit: number = 10): Promise<BlogPostsResult> {
    const cacheKey = `blog_posts:${categorySlug || 'all'}:${page}:${limit}`
    let posts = await this.get<BlogPostsResult>(cacheKey)
    
    if (!posts) {
      const supabase = createAdminClient()
      let query = supabase
        .from('posts')
        .select(`
          id, title, slug, excerpt, created_at, updated_at, status, published_at, view_count, category_id,
          category:categories!inner(id, name, slug, created_at, updated_at)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug)
      }
      
      const { data, error } = await query
      
      if (error || !data) {
        return { posts: [], total: 0 }
      }
      
      posts = { posts: data, total: data.length }
      // 7天缓存，标准SaaS做法
      await this.set(cacheKey, posts, CACHE_TTL.BLOG_POSTS)
    }
    
    return posts
  }

  // 已移除: smartRefreshBlogCache（未被调用，避免保留死代码）

  /**
   * 清除用户相关缓存
   */
  async clearUserCache(userId: string): Promise<void> {
    await this.delete(`user_profile:${userId}`)
    await this.delete(`subscription:${userId}`)
    await this.delete(`generation_stats:${userId}`)
  }

  /**
   * 清除博客相关缓存 - 只在管理操作时调用
   * 标准SaaS做法：管理操作后立即清除相关缓存
   */
  async clearBlogCache(): Promise<void> {
    // 清除所有博客相关缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith('blog_posts:') || key.startsWith('categories:')) {
        await this.delete(key)
      }
    }
    // 静默：避免生产日志噪音
  }

  /**
   * 清除特定分类的缓存
   */
  async clearCategoryCache(categoryId: number): Promise<void> {
    // 清除该分类下的所有文章缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith('blog_posts:')) {
        await this.delete(key)
      }
    }
    // 清除分类缓存
    await this.delete('categories:all')
  }

  /**
   * 清除特定文章的缓存
   */
  async clearPostCache(postId: number): Promise<void> {
    // 清除所有文章缓存（因为分页可能受影响）
    for (const key of this.cache.keys()) {
      if (key.startsWith('blog_posts:')) {
        await this.delete(key)
      }
    }
    // 静默
  }

  /**
   * 获取缓存统计信息（增强版）
   */
  getCacheStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    let blogEntries = 0
    let userEntries = 0
    let generationEntries = 0
    let apiEntries = 0
    let sitemapEntries = 0
    let paymentEntries = 0
    let totalMemoryUsage = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
        if (key.startsWith('blog_posts:') || key.startsWith('categories:')) {
          blogEntries++
        } else if (key.startsWith('user_profile:') || key.startsWith('subscription:')) {
          userEntries++
        } else if (key.startsWith('generation_history:') || key.startsWith('generation_stats:')) {
          generationEntries++
        } else if (key.startsWith('api_usage:')) {
          apiEntries++
        } else if (key.startsWith('sitemap:')) {
          sitemapEntries++
        } else if (key.startsWith('paddle_payment:')) {
          paymentEntries++
        }
        
        // 估算内存使用
        totalMemoryUsage += JSON.stringify(entry.data).length
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      blogEntries,
      userEntries,
      generationEntries,
      apiEntries,
      sitemapEntries,
      paymentEntries,
      memoryUsageKB: Math.round(totalMemoryUsage / 1024),
      cacheHitRate: this.calculateCacheHitRate()
    }
  }

  /**
   * 计算缓存命中率
   */
  private cacheHits = 0
  private cacheMisses = 0

  private calculateCacheHitRate(): string {
    const total = this.cacheHits + this.cacheMisses
    if (total === 0) return '0%'
    const hitRate = (this.cacheHits / total) * 100
    return `${hitRate.toFixed(1)}%`
  }

  /**
   * 记录缓存命中
   */
  private recordCacheHit(): void {
    this.cacheHits++
  }

  /**
   * 记录缓存未命中
   */
  private recordCacheMiss(): void {
    this.cacheMisses++
  }

  /**
   * 预热博客缓存 - 部署后调用一次
   */
  async warmupBlogCache(): Promise<void> {
    
    // 预热分类缓存
    await this.getCategories()
    
    // 预热首页博客文章
    await this.getBlogPosts(undefined, 1, 12)
  }

  /**
   * 获取生成历史（带缓存）
   * 标准SaaS做法：生成历史变化不频繁，中期缓存
   */
  async getGenerationHistory(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `generation_history:${userId}:${limit}`
    let history = await this.get<any[]>(cacheKey)
    
    if (!history) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, music_style, music_theme, lyric_style, is_favorited')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error || !data) {
        return []
      }
      
      history = data
      await this.set(cacheKey, history, CACHE_TTL.GENERATION_HISTORY)
    }
    
    return history
  }

  /**
   * 获取API使用统计（带缓存）
   * 标准SaaS做法：API统计变化不频繁，中期缓存
   */
  async getApiUsageStats(userId: string): Promise<any> {
    const cacheKey = `api_usage:${userId}`
    let stats = await this.get<any>(cacheKey)
    
    if (!stats) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('endpoint, response_time, status_code, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
      
      if (error || !data) {
        return { total_calls: 0, avg_response_time: 0, success_rate: 0 }
      }
      
      const totalCalls = data.length
      const avgResponseTime = data.reduce((sum, log) => sum + (log.response_time || 0), 0) / totalCalls
      const successRate = (data.filter(log => log.status_code < 400).length / totalCalls) * 100
      
      stats = { total_calls: totalCalls, avg_response_time: avgResponseTime, success_rate: successRate }
      await this.set(cacheKey, stats, CACHE_TTL.API_USAGE_LOGS)
    }
    
    return stats
  }

  /**
   * 获取站点地图数据（带缓存）
   * 标准SaaS做法：站点地图变化不频繁，长期缓存
   */
  async getSitemapData(): Promise<any> {
    const cacheKey = 'sitemap:all'
    let sitemap = await this.get<any>(cacheKey)
    
    if (!sitemap) {
      const supabase = createAdminClient()
      
      // 获取所有分类
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true)
      
      // 获取所有已发布文章
      const { data: posts } = await supabase
        .from('posts')
        .select('slug, updated_at')
        .eq('status', 'published')
      
      sitemap = {
        categories: categories || [],
        posts: posts || [],
        last_updated: new Date().toISOString()
      }
      
      await this.set(cacheKey, sitemap, CACHE_TTL.SITEMAP)
    }
    
    return sitemap
  }

  /**
   * 获取Paddle支付状态（带缓存）
   * 标准SaaS做法：支付状态变化不频繁，中期缓存
   */
  async getPaddlePaymentStatus(userId: string): Promise<any> {
    const cacheKey = `paddle_payment:${userId}`
    let payment = await this.get<any>(cacheKey)
    
    if (!payment) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('paddle_customer_id, active_price_id, subscription_end_date')
        .eq('id', userId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      payment = data
      await this.set(cacheKey, payment, CACHE_TTL.PADDLE_WEBHOOK)
    }
    
    return payment
  }

  /**
   * 清除生成相关缓存
   */
  async clearGenerationCache(userId: string): Promise<void> {
    // 清除用户生成历史缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith(`generation_history:${userId}:`)) {
        await this.delete(key)
      }
    }
    // 清除API使用统计缓存
    await this.delete(`api_usage:${userId}`)
  }

  /**
   * 清除支付相关缓存
   */
  async clearPaymentCache(userId: string): Promise<void> {
    await this.delete(`paddle_payment:${userId}`)
    await this.delete(`subscription:${userId}`)
  }

  /**
   * 清除站点地图缓存
   */
  async clearSitemapCache(): Promise<void> {
    await this.delete('sitemap:all')
  }
}

// 导出单例实例
export const cacheService = CacheService.getInstance()
