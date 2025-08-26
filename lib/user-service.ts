// lib/user-service.ts

import { createServerClient, createAdminClient } from './supabase-server';
import { Profile, SubscriptionLimits } from './types';
import { SUBSCRIPTION_LIMITS } from './constants';
import { SubscriptionService, type SubscriptionInfo, type UserProfile } from './subscription-service';
import { cacheService } from './cache-service';

// 客户端缓存
const profileCache = new Map<string, { profile: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 用户服务类
 * 处理用户配置文件、订阅状态和使用限制
 * 优化：减少重复数据库调用，使用缓存服务
 */
export class UserService {
  
  /**
   * 获取或创建用户配置文件
   * 优化：使用缓存服务减少数据库调用
   */
  async getOrCreateUserProfile(userId: string): Promise<Profile> {
    // 首先尝试从缓存获取
    let profile = await cacheService.getUserProfile(userId);
    
    if (profile) {
      return profile;
    }
    
    const supabase = await createServerClient();
    
    // 首先尝试获取现有配置文件
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
      .eq('id', userId)
      .single();
    
    if (existingProfile && !fetchError) {
      // 更新缓存
      await cacheService.set(`user_profile:${userId}`, existingProfile, 300);
      return existingProfile;
    }
    
    // 如果配置文件不存在，创建新的
    const newProfile: Partial<Profile> = {
      id: userId,
      status: 'free',
      generation_count: 0,
      rewrite_count: 0,
      usage_last_reset: new Date().toISOString().split('T')[0], // 今天的日期
      favorite_count: 0,
      is_admin: false,
    };
    
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
      .single();
    
    if (createError) {
      console.error('Profile creation error:', createError);
      
      // 提供更详细的错误信息
      if (createError.code === '42501') {
        throw new Error('Database permission error. Please contact support if this persists.');
      } else if (createError.message.includes('row-level security')) {
        throw new Error('User profile creation failed due to security policy. Please ensure you are properly authenticated.');
      } else if (createError.code === '23505') {
        // 唯一约束违反，可能是并发创建
        // 重新尝试获取配置文件
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
          .eq('id', userId)
          .single();
        
        if (retryProfile && !retryError) {
          await cacheService.set(`user_profile:${userId}`, retryProfile, 300);
          return retryProfile;
        }
      }
      
      throw new Error(`Failed to create user profile: ${createError.message}`);
    }
    
    // 更新缓存
    await cacheService.set(`user_profile:${userId}`, createdProfile, 300);
    return createdProfile;
  }
  
  /**
   * 获取用户配置文件
   * 优化：使用缓存服务
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    // 首先尝试从缓存获取
    let profile = await cacheService.getUserProfile(userId);
    
    if (profile) {
      return profile;
    }
    
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, subscription_end_date, created_at, updated_at')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
    
    if (data) {
      // 更新缓存
      await cacheService.set(`user_profile:${userId}`, data, 300);
    }
    
    return data;
  }
  
  /**
   * 检查使用限制
   * 优化：减少数据库调用，使用缓存
   */
  async checkUsageLimit(userId: string, type: 'generation' | 'rewrite'): Promise<{ canUse: boolean; remaining: number }> {
    const profile = await this.getOrCreateUserProfile(userId);
    
    // 检查是否需要重置每日计数
    const today = new Date().toISOString().split('T')[0];
    if (profile.usage_last_reset !== today) {
      await this.resetDailyUsage(userId);
      // 清除缓存，强制重新获取
      await cacheService.clearUserCache(userId);
      // 重新获取更新后的配置文件
      const updatedProfile = await this.getUserProfile(userId);
      if (updatedProfile) {
        profile.generation_count = updatedProfile.generation_count;
        profile.rewrite_count = updatedProfile.rewrite_count;
      }
    }
    
    // 获取用户限制
    const limits = this.getSubscriptionLimits(profile.status);
    const currentCount = type === 'generation' ? profile.generation_count : profile.rewrite_count;
    const limit = type === 'generation' ? limits.maxGenerations : limits.maxLyricOptimizations;
    
    const canUse = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);
    
    return { canUse, remaining };
  }
  
  /**
   * 更新使用计数
   * 优化：使用批量更新，减少数据库调用
   */
  async updateUsageCount(userId: string, type: 'generation' | 'rewrite'): Promise<void> {
    const supabase = await createServerClient();
    
    const updateField = type === 'generation' ? 'generation_count' : 'rewrite_count';
    
    // 使用批量更新函数（如果存在）
    try {
      const { error } = await supabase.rpc('batch_update_generation', {
        p_user_id: userId,
        p_language: null,
        p_music_style: null,
        p_music_theme: null,
        p_lyric_style: null,
        p_generated_lyrics: null,
        p_model_used: null
      });
      
      if (!error) {
        // 清除缓存，强制重新获取
        await cacheService.clearUserCache(userId);
        return;
      }
    } catch (error) {
      // 如果RPC函数不存在，使用简单的增量更新
    }
    
    // 回退到简单更新
    const profile = await this.getUserProfile(userId);
    if (profile) {
      const currentCount = type === 'generation' ? profile.generation_count : profile.rewrite_count;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: currentCount + 1 })
        .eq('id', userId);
      
      if (updateError) {
        throw new Error(`Failed to update usage count: ${updateError.message}`);
      }
      
      // 清除缓存，强制重新获取
      await cacheService.clearUserCache(userId);
    }
  }
  
  /**
   * 重置每日使用计数
   * 优化：清除相关缓存
   */
  async resetDailyUsage(userId: string): Promise<void> {
    const supabase = await createServerClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('profiles')
      .update({
        generation_count: 0,
        rewrite_count: 0,
        usage_last_reset: today
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to reset daily usage: ${error.message}`);
    }
    
    // 清除缓存，强制重新获取
    await cacheService.clearUserCache(userId);
  }
  
  /**
   * 获取订阅限制
   */
  getSubscriptionLimits(status: string): SubscriptionLimits {
    return SUBSCRIPTION_LIMITS[status as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;
  }
  
  /**
   * 更新用户订阅状态
   * 优化：清除相关缓存
   */
  async updateSubscriptionStatus(
    userId: string, 
    status: 'free' | 'active' | 'canceled' | 'past_due'
  ): Promise<void> {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }
    
    // 清除相关缓存
    await cacheService.clearUserCache(userId);
  }
  
  /**
   * 获取用户的生成历史
   * 优化：避免select(*)，只选择必要字段
   */
  async getUserGenerations(userId: string, favoritesOnly: boolean = false): Promise<any[]> {
    const supabase = await createServerClient();
    
    let query = supabase
      .from('generations')
      .select('id, created_at, language, music_style, music_theme, length_option, lyric_style, is_favorited')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (favoritesOnly) {
      query = query.eq('is_favorited', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch user generations: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * 删除用户的生成记录
   */
  async deleteGeneration(userId: string, generationId: string): Promise<void> {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userId); // 确保用户只能删除自己的记录
    
    if (error) {
      throw new Error(`Failed to delete generation: ${error.message}`);
    }
  }
  
  /**
   * 切换生成记录的收藏状态
   * 优化：减少数据库调用，使用缓存
   */
  async toggleFavorite(userId: string, generationId: string): Promise<boolean> {
    const supabase = await createServerClient();
    
    // 首先获取当前状态
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('is_favorited')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch generation: ${fetchError.message}`);
    }
    
    const newFavoriteStatus = !generation.is_favorited;
    
    // 获取用户配置文件（使用缓存）
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // 如果要添加收藏，检查收藏数量限制
    if (newFavoriteStatus) {
      const limits = this.getSubscriptionLimits(profile.status);
      if (profile.favorite_count >= limits.maxFavorites) {
        throw new Error(`收藏数量已达上限 (${limits.maxFavorites})，请升级会员或删除一些收藏`);
      }
    }
    
    // 更新收藏状态
    const { error: updateError } = await supabase
      .from('generations')
      .update({ is_favorited: newFavoriteStatus })
      .eq('id', generationId)
      .eq('user_id', userId);
    
    if (updateError) {
      throw new Error(`Failed to update favorite status: ${updateError.message}`);
    }
    
    // 更新用户的收藏计数
    if (newFavoriteStatus) {
      await supabase
        .from('profiles')
        .update({ favorite_count: profile.favorite_count + 1 })
        .eq('id', userId);
    } else {
      await supabase
        .from('profiles')
        .update({ favorite_count: Math.max(0, profile.favorite_count - 1) })
        .eq('id', userId);
    }
    
    // 清除缓存，强制重新获取
    await cacheService.clearUserCache(userId);
    
    return newFavoriteStatus;
  }

  /**
   * 获取用户的完整订阅信息
   * 优化：使用缓存服务
   */
  async getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
    // 首先尝试从缓存获取
    let profile = await cacheService.getSubscriptionStatus(userId);
    
    if (!profile) {
      const supabase = await createServerClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          status,
          active_price_id,
          subscription_plan_name,
          subscription_billing_cycle,
          subscription_start_date,
          subscription_end_date,
          next_billing_date,
          subscription_canceled_at,
          paddle_subscription_id
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch user subscription info:', error);
        return null;
      }
      
      profile = data;
      // 更新缓存
      await cacheService.set(`subscription:${userId}`, profile, 600);
    }

    return SubscriptionService.getSubscriptionInfo(profile as UserProfile);
  }

  /**
   * 检查用户是否为付费会员
   * 优化：使用缓存服务
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    const subscriptionInfo = await this.getUserSubscriptionInfo(userId);
    return subscriptionInfo?.isPremium || false;
  }

  /**
   * 获取用户的会员显示信息
   * 优化：使用缓存服务
   */
  async getUserMembershipDisplay(userId: string) {
    const subscriptionInfo = await this.getUserSubscriptionInfo(userId);
    
    if (!subscriptionInfo) {
      return {
        membershipType: '免费用户',
        expiryStatus: '无订阅',
        isExpiringSoon: false,
        isActive: false,
        isPremium: false
      };
    }

    return SubscriptionService.formatSubscriptionForDisplay(subscriptionInfo);
  }

  // 客户端缓存
  static async getCachedUserProfile(userId: string): Promise<any> {
    const cached = profileCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.profile;
    }
    
    // 缓存过期或不存在，重新获取
    const userService = new UserService();
    const profile = await userService.getOrCreateUserProfile(userId);
    profileCache.set(userId, { profile, timestamp: now });
    return profile;
  }

  // 新增：清除用户缓存
  static clearUserCache(userId: string): void {
    profileCache.delete(userId);
  }

  // 新增：更新用户缓存
  static updateUserCache(userId: string, profile: any): void {
    profileCache.set(userId, { profile, timestamp: Date.now() });
  }
}

// 导出单例实例
export const userService = new UserService();