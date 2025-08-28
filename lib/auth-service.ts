import { createServerClient, createAdminClient } from './supabase-server';
import { User } from '@supabase/supabase-js';

// 认证缓存配置
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5分钟

interface AuthCacheEntry {
  user: User;
  expiresAt: number;
}

// 智能认证服务 - 标准SaaS做法
export class AuthService {
  private static instance: AuthService;
  private authCache = new Map<string, AuthCacheEntry>();
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 获取认证用户（带缓存）
   * 标准SaaS做法：短期缓存认证状态，避免重复验证
   */
  async getAuthenticatedUser(): Promise<User | null> {
    try {
      const supabase = await createServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // 缓存用户信息
      this.authCache.set(user.id, {
        user,
        expiresAt: Date.now() + AUTH_CACHE_TTL
      });

      return user;
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      return null;
    }
  }

  /**
   * 获取缓存的认证用户
   * 标准SaaS做法：优先使用缓存，减少数据库查询
   */
  async getCachedUser(userId: string): Promise<User | null> {
    const cached = this.authCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.user;
    }
    
    // 缓存过期，重新获取
    return this.getAuthenticatedUser();
  }

  /**
   * 清除用户认证缓存
   */
  clearUserCache(userId: string): void {
    this.authCache.delete(userId);
  }

  /**
   * 清除所有认证缓存
   */
  clearAllCache(): void {
    this.authCache.clear();
  }

  /**
   * 检查用户是否有管理员权限
   * 标准SaaS做法：权限检查与认证分离
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      return profile?.is_admin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * 检查用户订阅状态
   * 标准SaaS做法：订阅状态与认证分离
   */
  async getSubscriptionStatus(userId: string): Promise<string> {
    try {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .single();
      
      return profile?.status || 'free';
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return 'free';
    }
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
