import { createServerClient } from './supabase-server';

export interface SecurityCheck {
  ipAddress: string;
  userAgent: string;
  browserFingerprint?: string;
  userId?: string;
  actionType: 'login' | 'generate' | 'rewrite' | 'register';
}

export class SecurityService {
  private supabase;

  constructor() {
    this.supabase = null;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerClient();
    }
    return this.supabase;
  }

  /**
   * 记录安全日志
   */
  async logSecurityEvent(check: SecurityCheck, success: boolean = true) {
    try {
      const supabase = await this.getSupabase();
      
      await supabase
        .from('security_logs')
        .insert({
          user_id: check.userId,
          ip_address: check.ipAddress,
          user_agent: check.userAgent,
          browser_fingerprint: check.browserFingerprint,
          action_type: check.actionType,
          success
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * 检查IP地址是否异常
   */
  async checkIpAnomaly(ipAddress: string, actionType: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // 检查过去1小时内同一IP的操作次数
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('security_logs')
        .select('action_type, created_at')
        .eq('ip_address', ipAddress)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        console.error('Error checking IP anomaly:', error);
        return false;
      }

      // 计算各种操作类型的频率
      const actionCounts = data.reduce((acc, log) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 设置阈值
      const thresholds = {
        'register': 3,    // 1小时内最多3次注册
        'login': 10,      // 1小时内最多10次登录
        'generate': 50,   // 1小时内最多50次生成
        'rewrite': 50     // 1小时内最多50次优化
      };

      const currentActionCount = actionCounts[actionType] || 0;
      const threshold = thresholds[actionType as keyof typeof thresholds] || 10;

      return currentActionCount > threshold;
    } catch (error) {
      console.error('Error in IP anomaly check:', error);
      return false;
    }
  }

  /**
   * 检查浏览器指纹是否异常
   */
  async checkBrowserFingerprintAnomaly(
    browserFingerprint: string, 
    actionType: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // 检查过去24小时内同一浏览器指纹的操作次数
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('security_logs')
        .select('action_type, created_at, user_id')
        .eq('browser_fingerprint', browserFingerprint)
        .gte('created_at', oneDayAgo.toISOString());

      if (error) {
        console.error('Error checking browser fingerprint anomaly:', error);
        return false;
      }

      // 检查是否有多个用户使用同一个浏览器指纹
      const uniqueUsers = new Set(data.map(log => log.user_id).filter(Boolean));
      if (uniqueUsers.size > 5) {
        return true; // 可疑：同一浏览器指纹被5个以上用户使用
      }

      // 检查操作频率
      const actionCounts = data.reduce((acc, log) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const thresholds = {
        'register': 10,   // 24小时内最多10次注册
        'login': 50,      // 24小时内最多50次登录
        'generate': 200,  // 24小时内最多200次生成
        'rewrite': 200    // 24小时内最多200次优化
      };

      const currentActionCount = actionCounts[actionType] || 0;
      const threshold = thresholds[actionType as keyof typeof thresholds] || 100;

      return currentActionCount > threshold;
    } catch (error) {
      console.error('Error in browser fingerprint anomaly check:', error);
      return false;
    }
  }

  /**
   * 检查用户行为是否异常
   */
  async checkUserBehaviorAnomaly(userId: string, actionType: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      // 检查过去1小时内用户的操作频率
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('security_logs')
        .select('action_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        console.error('Error checking user behavior anomaly:', error);
        return false;
      }

      // 计算操作频率
      const actionCounts = data.reduce((acc, log) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const thresholds = {
        'generate': 100,  // 1小时内最多100次生成
        'rewrite': 100    // 1小时内最多100次优化
      };

      const currentActionCount = actionCounts[actionType] || 0;
      const threshold = thresholds[actionType as keyof typeof thresholds] || 50;

      return currentActionCount > threshold;
    } catch (error) {
      console.error('Error in user behavior anomaly check:', error);
      return false;
    }
  }

  /**
   * 综合安全检查
   */
  async performSecurityCheck(check: SecurityCheck): Promise<{
    isAnomaly: boolean;
    reason?: string;
  }> {
    try {
      const results = await Promise.all([
        this.checkIpAnomaly(check.ipAddress, check.actionType),
        check.browserFingerprint 
          ? this.checkBrowserFingerprintAnomaly(check.browserFingerprint, check.actionType)
          : Promise.resolve(false),
        check.userId 
          ? this.checkUserBehaviorAnomaly(check.userId, check.actionType)
          : Promise.resolve(false)
      ]);

      const [ipAnomaly, browserAnomaly, userAnomaly] = results;
      
      if (ipAnomaly) {
        return { isAnomaly: true, reason: 'IP地址异常活动' };
      }
      
      if (browserAnomaly) {
        return { isAnomaly: true, reason: '浏览器指纹异常活动' };
      }
      
      if (userAnomaly) {
        return { isAnomaly: true, reason: '用户行为异常' };
      }

      return { isAnomaly: false };
    } catch (error) {
      console.error('Error in security check:', error);
      return { isAnomaly: false };
    }
  }

  /**
   * 生成浏览器指纹
   */
  generateBrowserFingerprint(userAgent: string): string {
    // 简单的浏览器指纹生成（实际项目中可以使用更复杂的算法）
    const canvas = userAgent.includes('Chrome') ? 'chrome' : 
                   userAgent.includes('Firefox') ? 'firefox' : 
                   userAgent.includes('Safari') ? 'safari' : 'other';
    
    const platform = userAgent.includes('Windows') ? 'windows' : 
                     userAgent.includes('Mac') ? 'mac' : 
                     userAgent.includes('Linux') ? 'linux' : 'other';
    
    const mobile = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
    
    return `${canvas}-${platform}-${mobile}`;
  }
}

export const securityService = new SecurityService();
