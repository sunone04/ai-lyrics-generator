/**
 * 订阅服务 - 处理用户订阅状态、会员类型和到期时间判断
 */

export interface SubscriptionInfo {
  isActive: boolean;
  isPremium: boolean;
  planName: string | null;
  billingCycle: string | null;
  startDate: Date | null;
  endDate: Date | null;
  nextBillingDate: Date | null;
  canceledAt: Date | null;
  daysUntilExpiry: number | null;
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'paused';
}

export interface UserProfile {
  id: string;
  email: string;
  status: 'free' | 'active' | 'canceled' | 'past_due';
  active_price_id: string | null;
  subscription_plan_name: string | null;
  subscription_billing_cycle: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  next_billing_date: string | null;
  subscription_canceled_at: string | null;
  paddle_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export class SubscriptionService {
  /**
   * 获取用户的完整订阅信息
   */
  static getSubscriptionInfo(profile: UserProfile): SubscriptionInfo {
    const now = new Date();
    
    // 解析日期
    const startDate = profile.subscription_start_date ? new Date(profile.subscription_start_date) : null;
    const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
    const nextBillingDate = profile.next_billing_date ? new Date(profile.next_billing_date) : null;
    const canceledAt = profile.subscription_canceled_at ? new Date(profile.subscription_canceled_at) : null;

    // 计算到期天数
    let daysUntilExpiry: number | null = null;
    if (endDate) {
      const diffTime = endDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 判断是否为活跃订阅
    const isActive = this.isSubscriptionActive(profile, now);
    
    // 判断是否为付费会员
    const isPremium = isActive && profile.status === 'active';

    return {
      isActive,
      isPremium,
      planName: profile.subscription_plan_name,
      billingCycle: profile.subscription_billing_cycle,
      startDate,
      endDate,
      nextBillingDate,
      canceledAt,
      daysUntilExpiry,
      status: profile.status as any
    };
  }

  /**
   * 判断订阅是否处于活跃状态
   */
  static isSubscriptionActive(profile: UserProfile, currentDate: Date = new Date()): boolean {
    // 如果状态不是 active，则不活跃
    if (profile.status !== 'active') {
      return false;
    }

    // 如果没有到期时间，但有活跃的价格ID，认为是活跃的（可能是终身会员）
    if (!profile.subscription_end_date && profile.active_price_id) {
      return true;
    }

    // 如果有到期时间，检查是否已过期
    if (profile.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      return currentDate <= endDate;
    }

    return false;
  }

  /**
   * 获取会员类型显示名称
   */
  static getMembershipDisplayName(subscriptionInfo: SubscriptionInfo): string {
    if (!subscriptionInfo.isPremium) {
      return '免费用户';
    }

    if (subscriptionInfo.planName) {
      return subscriptionInfo.planName;
    }

    // 根据计费周期推断
    switch (subscriptionInfo.billingCycle) {
      case 'monthly':
        return 'Pro 月度会员';
      case 'yearly':
        return 'Pro 年度会员';
      case 'lifetime':
        return 'Pro 终身会员';
      default:
        return 'Pro 会员';
    }
  }

  /**
   * 获取到期状态描述
   */
  static getExpiryStatusText(subscriptionInfo: SubscriptionInfo): string {
    if (!subscriptionInfo.isPremium) {
      return '无订阅';
    }

    if (subscriptionInfo.billingCycle === 'lifetime') {
      return '终身有效';
    }

    if (!subscriptionInfo.endDate) {
      return '无到期时间';
    }

    if (subscriptionInfo.daysUntilExpiry === null) {
      return '无到期时间';
    }

    if (subscriptionInfo.daysUntilExpiry < 0) {
      return '已过期';
    }

    if (subscriptionInfo.daysUntilExpiry === 0) {
      return '今天到期';
    }

    if (subscriptionInfo.daysUntilExpiry === 1) {
      return '明天到期';
    }

    if (subscriptionInfo.daysUntilExpiry <= 7) {
      return `${subscriptionInfo.daysUntilExpiry} 天后到期`;
    }

    if (subscriptionInfo.daysUntilExpiry <= 30) {
      return `${subscriptionInfo.daysUntilExpiry} 天后到期`;
    }

    // 超过30天，显示具体日期
    return `${subscriptionInfo.endDate.toLocaleDateString('zh-CN')} 到期`;
  }

  /**
   * 检查订阅是否即将到期（7天内）
   */
  static isSubscriptionExpiringSoon(subscriptionInfo: SubscriptionInfo): boolean {
    if (!subscriptionInfo.isPremium || subscriptionInfo.billingCycle === 'lifetime') {
      return false;
    }

    return subscriptionInfo.daysUntilExpiry !== null && 
           subscriptionInfo.daysUntilExpiry >= 0 && 
           subscriptionInfo.daysUntilExpiry <= 7;
  }

  /**
   * 根据 Paddle 价格 ID 推断计划信息
   * ⚠️ 重要：请根据您的实际价格 ID 更新这个映射
   */
  static inferPlanFromPriceId(priceId: string | null): { planName: string; billingCycle: string } {
    if (!priceId) {
      return { planName: 'Unknown Plan', billingCycle: 'unknown' };
    }

    // ⚠️ 请根据您的实际价格 ID 更新这个映射
    const priceMapping: Record<string, { planName: string; billingCycle: string }> = {
      // 您的实际价格 ID
      'pri_01k2acdk98a4d59e7sfrc49mm6': { planName: 'AI Lyrics Generator - Monthly Plan', billingCycle: 'monthly' },
      
      // 如果您有其他价格 ID，请在这里添加
      // 'pri_your_yearly_price_id': { planName: 'AI Lyrics Generator - Yearly Plan', billingCycle: 'yearly' },
      // 'pri_your_lifetime_price_id': { planName: 'AI Lyrics Generator - Lifetime Plan', billingCycle: 'lifetime' },
      
      // 保留示例作为参考
      'pri_monthly_001': { planName: 'Pro Monthly', billingCycle: 'monthly' },
      'pri_yearly_001': { planName: 'Pro Yearly', billingCycle: 'yearly' },
      'pri_lifetime_001': { planName: 'Pro Lifetime', billingCycle: 'lifetime' },
    };

    const result = priceMapping[priceId];
    if (result) {
      console.log(`Price ID ${priceId} mapped to: ${result.planName} (${result.billingCycle})`);
      return result;
    }

    console.warn(`Unknown Price ID: ${priceId}, using default mapping`);
    return { planName: 'Pro Plan', billingCycle: 'monthly' };
  }

  /**
   * 格式化订阅信息用于显示
   */
  static formatSubscriptionForDisplay(subscriptionInfo: SubscriptionInfo) {
    return {
      membershipType: this.getMembershipDisplayName(subscriptionInfo),
      expiryStatus: this.getExpiryStatusText(subscriptionInfo),
      isExpiringSoon: this.isSubscriptionExpiringSoon(subscriptionInfo),
      isActive: subscriptionInfo.isActive,
      isPremium: subscriptionInfo.isPremium,
      daysUntilExpiry: subscriptionInfo.daysUntilExpiry,
      endDate: subscriptionInfo.endDate,
      nextBillingDate: subscriptionInfo.nextBillingDate,
      canceledAt: subscriptionInfo.canceledAt
    };
  }
}
