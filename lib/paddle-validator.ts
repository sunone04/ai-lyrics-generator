export interface PaddleConfig {
  apiKey: string;
  clientId: string;
  webhookSecret: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  siteUrl: string;
}

export function validatePaddleConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const config: PaddleConfig = {
    apiKey: process.env.PADDLE_API_KEY || '',
    clientId: process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID || '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || ''
  };

  // 检查是否包含占位符
  const placeholderChecks = [
    { key: 'apiKey', value: config.apiKey, name: 'PADDLE_API_KEY' },
    { key: 'clientId', value: config.clientId, name: 'NEXT_PUBLIC_PADDLE_CLIENT_ID' },
    { key: 'webhookSecret', value: config.webhookSecret, name: 'PADDLE_WEBHOOK_SECRET' },
    { key: 'monthlyPriceId', value: config.monthlyPriceId, name: 'NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID' },
    { key: 'yearlyPriceId', value: config.yearlyPriceId, name: 'NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID' },
    { key: 'siteUrl', value: config.siteUrl, name: 'NEXT_PUBLIC_SITE_URL' }
  ];

  placeholderChecks.forEach(({ key, value, name }) => {
    if (!value || value.includes('your_') || value.includes('placeholder')) {
      errors.push(`${name} 未正确配置或仍使用占位符值`);
    }
  });

  // 检查URL格式
  if (config.siteUrl && !config.siteUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_SITE_URL 必须是有效的URL（以http或https开头）');
  }

  // 检查价格ID格式（Paddle价格ID通常以pri_开头）
  if (config.monthlyPriceId && !config.monthlyPriceId.startsWith('pri_')) {
    errors.push('NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID 格式可能不正确（应以pri_开头）');
  }

  if (config.yearlyPriceId && !config.yearlyPriceId.startsWith('pri_')) {
    errors.push('NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID 格式可能不正确（应以pri_开头）');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getPaddleConfig(): PaddleConfig {
  return {
    apiKey: process.env.PADDLE_API_KEY || '',
    clientId: process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID || '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || ''
  };
}
