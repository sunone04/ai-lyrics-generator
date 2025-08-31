import { createServerComponentClient } from './supabase-server';

export interface SecurityCheck {
  ipAddress: string;
  userAgent: string;
  userId?: string;
  actionType: 'login' | 'generate' | 'rewrite' | 'register';
}

export class SecurityService {
  private supabase: any = null;

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerComponentClient();
    }
    return this.supabase;
  }

  /**
   * 简化的安全检查 - 只检查基本IP频率
   */
  async performSecurityCheck(check: SecurityCheck): Promise<{
    isAnomaly: boolean;
    reason?: string;
  }> {
    try {
      // 简化的IP检查 - 只检查过去1小时内的操作次数
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('endpoint, created_at')
        .eq('ip_address', check.ipAddress)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        console.error('Error checking IP activity:', error);
        return { isAnomaly: false };
      }

      // 计算操作频率
      const actionCounts = data.reduce((acc: any, log: any) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {});

      // 简化的阈值检查
      const thresholds: any = {
        'register': 5,    // 1小时内最多5次注册
        'login': 20,      // 1小时内最多20次登录
        'generate': 100,  // 1小时内最多100次生成
        'rewrite': 100    // 1小时内最多100次优化
      };

      const currentActionCount = actionCounts[check.actionType] || 0;
      const threshold = thresholds[check.actionType] || 50;

      if (currentActionCount > threshold) {
        return { 
          isAnomaly: true, 
          reason: `Too many ${check.actionType} attempts from this IP` 
        };
      }

      return { isAnomaly: false };
    } catch (error) {
      console.error('Error in security check:', error);
      return { isAnomaly: false };
    }
  }

  /**
   * 记录安全事件（简化版）
   */
  async logSecurityEvent(check: SecurityCheck, success: boolean = true) {
    try {
      const supabase = await this.getSupabase();
      
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: check.userId,
          ip_address: check.ipAddress,
          user_agent: check.userAgent,
          endpoint: check.actionType,
          method: 'POST',
          response_status: success ? 200 : 400,
          request_data: {
            action_type: check.actionType
          }
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export const securityService = new SecurityService();
