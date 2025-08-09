import { initializePaddle, Paddle } from '@paddle/paddle-js';

export class PaddleService {
  private paddle: Paddle | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const clientId = process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Paddle client ID not configured');
      }

      const paddleInstance = await initializePaddle({
        token: clientId,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        checkout: {
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'en'
          }
        }
      });
      
      this.paddle = paddleInstance || null;

      this.initialized = true;
      console.log('✅ Paddle SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Paddle SDK:', error);
      throw error;
    }
  }

  async openCheckout(priceId: string, customData: any): Promise<void> {
    if (!this.paddle) {
      await this.initialize();
    }

    if (!this.paddle) {
      throw new Error('Paddle SDK not initialized');
    }

    try {
      await this.paddle.Checkout.open({
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        customer: {
          email: customData.customerEmail
        },
        customData: {
          userId: customData.userId,
          planType: customData.planType
        },
        settings: {
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`
        } as any
      });
    } catch (error) {
      console.error('❌ Paddle checkout failed:', error);
      throw new Error('Failed to open checkout. Please try again.');
    }
  }

  async getSubscriptionDetails(subscriptionId: string) {
    // This would typically be called from the server-side
    // Client-side SDK doesn't have subscription management APIs
    throw new Error('Subscription details should be fetched server-side');
  }
}

export const paddleService = new PaddleService();