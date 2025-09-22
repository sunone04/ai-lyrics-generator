export interface PaddleConfig {
  environment: 'sandbox' | 'production';
  clientId: string;
  apiKey: string;
  webhookSecret: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  apiBaseUrl: string;
}

export const getPaddleConfig = (): PaddleConfig => {
  const envVar = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as string | undefined;
  const env = (envVar || '').toLowerCase();
  const environment: 'sandbox' | 'production' = env === 'sandbox' ? 'sandbox' : 'production';
  
  return {
    environment: environment || 'sandbox',
    clientId: process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID || '',
    apiKey: process.env.PADDLE_API_KEY || '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
    apiBaseUrl: environment === 'sandbox'
      ? (process.env.NEXT_PUBLIC_PADDLE_API_BASE_URL || 'https://sandbox-api.paddle.com')
      : 'https://api.paddle.com'
  };
};

export const isPaddleEnabled = (): boolean => {
  const config = getPaddleConfig();
  return !!(config.clientId && config.apiKey && config.webhookSecret);
};

// Paddle.js 初始化脚本
export const getPaddleInitScript = (): string => {
  const config = getPaddleConfig();
  
  return `
    <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
    <script type="text/javascript">
      ${config.environment === 'sandbox' ? 'Paddle.Environment.set("sandbox");' : ''}
      Paddle.Initialize({ 
        token: "${config.clientId}"
      });
    </script>
  `;
};

// 价格ID映射
export const getPriceId = (plan: 'monthly' | 'yearly'): string => {
  const config = getPaddleConfig();
  return plan === 'monthly' ? config.monthlyPriceId : config.yearlyPriceId;
};
