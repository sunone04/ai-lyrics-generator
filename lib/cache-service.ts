import { createClient } from '@supabase/supabase-js';

// 简化的缓存服务 - 只保留必要的缓存功能
export class CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  /**
   * 删除缓存值
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 获取用户生成历史（简化版）
   */
  async getGenerationHistory(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `generation_history:${userId}:${limit}`;
    let history = await this.get<any[]>(cacheKey);
    
    if (!history) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, music_style, music_theme, lyric_style, is_favorited')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error || !data) {
        return [];
      }
      
      history = data;
      await this.set(cacheKey, history, 10 * 60 * 1000); // 10分钟缓存
    }
    
    return history;
  }

  /**
   * 获取博客文章（简化版）
   */
  async getBlogPosts(categorySlug?: string, page: number = 1, limit: number = 12): Promise<any> {
    const cacheKey = `blog_posts:${categorySlug || 'all'}:${page}:${limit}`;
    let posts = await this.get<any>(cacheKey);
    
    if (!posts) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      let query = supabase
        .from('posts')
        .select(`
          id, title, slug, excerpt, created_at, updated_at, status, published_at, view_count, category_id,
          category:categories!inner(id, name, slug, created_at, updated_at)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }
      
      const offset = (page - 1) * limit;
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      
      if (error || !data) {
        return { posts: [], total: 0 };
      }
      
      posts = { posts: data, total: count || 0 };
      await this.set(cacheKey, posts, 30 * 60 * 1000); // 30分钟缓存
    }
    
    return posts;
  }

  /**
   * 获取博客分类（简化版）
   */
  async getCategories(): Promise<any[]> {
    const cacheKey = 'blog_categories:all';
    let categories = await this.get<any[]>(cacheKey);
    
    if (!categories) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error || !data) {
        return [];
      }
      
      categories = data;
      await this.set(cacheKey, categories, 60 * 60 * 1000); // 1小时缓存
    }
    
    return categories;
  }

  /**
   * 获取站点地图数据（简化版）
   */
  async getSitemapData(): Promise<any> {
    const cacheKey = 'sitemap:all';
    let sitemap = await this.get<any>(cacheKey);
    
    if (!sitemap) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // 获取所有分类
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true);
      
      // 获取所有已发布文章
      const { data: posts } = await supabase
        .from('posts')
        .select('slug, updated_at')
        .eq('status', 'published');
      
      sitemap = {
        categories: categories || [],
        posts: posts || [],
        last_updated: new Date().toISOString()
      };
      
      // 30分钟缓存
      await this.set(cacheKey, sitemap, 30 * 60 * 1000);
    }
    
    return sitemap;
  }

  /**
   * 清除分类相关缓存
   */
  async clearCategoryCache(categoryId: number): Promise<void> {
    // 清除分类缓存
    await this.delete('blog_categories:all');
    
    // 清除所有相关的博客文章缓存
    const keysToDelete: string[] = [];
    for (const [key] of this.cache) {
      if (key.startsWith('blog_posts:')) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * 清除文章相关缓存
   */
  async clearPostCache(postId: number): Promise<void> {
    // 清除所有博客文章缓存
    const keysToDelete: string[] = [];
    for (const [key] of this.cache) {
      if (key.startsWith('blog_posts:')) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }
}

export const cacheService = new CacheService();
