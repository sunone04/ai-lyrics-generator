// Paddle支付系统配置
export const PADDLE_CONFIG = {
  // 环境配置
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  
  // API密钥
  apiKey: process.env.PADDLE_API_KEY!,
  
  // Webhook密钥
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET!,
  
  // 客户端ID
  clientId: process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID!,
  
  // 价格ID
  priceIds: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!,
    yearly: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!,
  },
  
  // 网站URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
  
  // 重定向URL
  redirectUrls: {
    return: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`,
    cancel: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?subscription=cancelled`,
  },
  
  // Webhook事件类型
  webhookEvents: {
    TRANSACTION_COMPLETED: 'transaction.completed',
    SUBSCRIPTION_CANCELED: 'subscription.canceled',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_PAUSED: 'subscription.paused',
    SUBSCRIPTION_RESUMED: 'subscription.resumed',
    SUBSCRIPTION_CREATED: 'subscription.created',
  },
  
  // 订阅状态映射
  subscriptionStatus: {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    PAST_DUE: 'past_due',
    PAUSED: 'paused',
    FREE: 'free',
  },
  
  // 错误消息
  errorMessages: {
    MISSING_PRICE_ID: '缺少价格ID',
    UNAUTHORIZED: '未授权访问',
    AUTH_FAILED: '用户身份验证失败',
    ALREADY_SUBSCRIBED: '您已有活跃订阅',
    MISSING_CUSTOMER_ID: '缺少客户ID',
    NO_PERMISSION: '无权操作此订阅',
    INVALID_STATUS: '订阅状态不允许此操作',
    PADDLE_API_ERROR: 'Paddle API调用失败',
    DATABASE_UPDATE_ERROR: '数据库更新失败',
  },
  
  // 成功消息
  successMessages: {
    SUBSCRIPTION_CANCELED: '订阅已成功取消',
    SUBSCRIPTION_UPDATED: '订阅状态已更新',
    CHECKOUT_CREATED: '支付链接已创建',
  },
};

// 验证Paddle配置是否完整
export function validatePaddleConfig(): boolean {
  const requiredFields = [
    'apiKey',
    'webhookSecret',
    'clientId',
    'priceIds.monthly',
    'priceIds.yearly',
    'siteUrl'
  ];
  
  for (const field of requiredFields) {
    const value = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], PADDLE_CONFIG)
      : PADDLE_CONFIG[field as keyof typeof PADDLE_CONFIG];
      
    if (!value || value.includes('your_') || value.includes('placeholder')) {
      console.error(`Paddle配置不完整: ${field} 未设置或使用占位符值`);
      return false;
    }
  }
  
  return true;
}

// 获取价格ID
export function getPriceId(planType: 'monthly' | 'yearly'): string {
  return PADDLE_CONFIG.priceIds[planType];
}

// 获取重定向URL
export function getRedirectUrl(type: 'return' | 'success' | 'cancel'): string {
  return PADDLE_CONFIG.redirectUrls[type];
}

// 检查是否为有效的Webhook事件
export function isValidWebhookEvent(eventType: string): boolean {
  return Object.values(PADDLE_CONFIG.webhookEvents).includes(eventType);
}

// 检查订阅状态是否有效
export function isValidSubscriptionStatus(status: string): boolean {
  return Object.values(PADDLE_CONFIG.subscriptionStatus).includes(status);
}
