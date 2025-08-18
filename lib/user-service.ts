// lib/user-service.ts

import { createServerClient, createAdminClient } from './supabase-server';
import { Profile, SubscriptionLimits } from './types';
import { SUBSCRIPTION_LIMITS } from './constants';

/**
 * 用户服务类
 * 处理用户配置文件、订阅状态和使用限制
 */
export class UserService {
  
  /**
   * 获取或创建用户配置文件
   */
  async getOrCreateUserProfile(userId: string): Promise<Profile> {
    const supabase = await createServerClient();
    
    // 首先尝试获取现有配置文件
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingProfile && !fetchError) {
      return existingProfile;
    }
    
    // 如果配置文件不存在，创建新的
    const newProfile: Partial<Profile> = {
      id: userId,
      status: 'free',
      generation_count: 0,
      rewrite_count: 0,
      usage_last_reset: new Date().toISOString().split('T')[0], // 今天的日期
    };
    
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
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
          .select('*')
          .eq('id', userId)
          .single();
        
        if (retryProfile && !retryError) {
          return retryProfile;
        }
      }
      
      throw new Error(`Failed to create user profile: ${createError.message}`);
    }
    
    return createdProfile;
  }
  
  /**
   * 获取用户配置文件
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * 检查使用限制
   */
  async checkUsageLimit(userId: string, type: 'generation' | 'rewrite'): Promise<{ canUse: boolean; remaining: number }> {
    const profile = await this.getOrCreateUserProfile(userId);
    
    // 检查是否需要重置每日计数
    const today = new Date().toISOString().split('T')[0];
    if (profile.usage_last_reset !== today) {
      await this.resetDailyUsage(userId);
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
    const limit = type === 'generation' ? limits.maxGenerations : limits.maxRewrites;
    
    const canUse = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);
    
    return { canUse, remaining };
  }
  
  /**
   * 更新使用计数
   */
  async updateUsageCount(userId: string, type: 'generation' | 'rewrite'): Promise<void> {
    const supabase = await createServerClient();
    
    const updateField = type === 'generation' ? 'generation_count' : 'rewrite_count';
    
    const { error } = await supabase
      .from('profiles')
      .update({
        [updateField]: supabase.rpc('increment_count', { 
          user_id: userId, 
          field_name: updateField 
        })
      })
      .eq('id', userId);
    
    if (error) {
      // 如果RPC函数不存在，使用简单的增量更新
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
      }
    }
  }
  
  /**
   * 重置每日使用计数
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
  }
  
  /**
   * 获取订阅限制
   */
  getSubscriptionLimits(status: string): SubscriptionLimits {
    return SUBSCRIPTION_LIMITS[status as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;
  }
  
  /**
   * 更新用户订阅状态
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
  }
  
  /**
   * 获取用户的生成历史
   */
  async getUserGenerations(userId: string, favoritesOnly: boolean = false): Promise<any[]> {
    const supabase = await createServerClient();
    
    let query = supabase
      .from('generations')
      .select('*')
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
    
    // 更新收藏状态
    const { error: updateError } = await supabase
      .from('generations')
      .update({ is_favorited: newFavoriteStatus })
      .eq('id', generationId)
      .eq('user_id', userId);
    
    if (updateError) {
      throw new Error(`Failed to update favorite status: ${updateError.message}`);
    }
    
    return newFavoriteStatus;
  }
}

// 导出单例实例
export const userService = new UserService();