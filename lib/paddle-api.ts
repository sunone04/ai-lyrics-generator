import * as crypto from 'node:crypto'

// Server-side Paddle API integration
export class PaddleAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY!;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.paddle.com' 
      : 'https://sandbox-api.paddle.com';
    
    if (!this.apiKey) {
      throw new Error('PADDLE_API_KEY environment variable is required');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Paddle API error: ${response.status} - ${errorData.error?.detail || response.statusText}`);
    }

    return response.json();
  }

  async getSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  async getCustomer(customerId: string) {
    return this.makeRequest(`/customers/${customerId}`);
  }

  async listSubscriptions(customerId?: string) {
    const params = new URLSearchParams();
    if (customerId) {
      params.append('customer_id', customerId);
    }
    
    return this.makeRequest(`/subscriptions?${params.toString()}`);
  }

  async cancelSubscription(subscriptionId: string, effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period') {
    return this.makeRequest(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        effective_from: effectiveFrom
      })
    });
  }

  async pauseSubscription(subscriptionId: string, resumeAt?: string) {
    const body: any = {};
    if (resumeAt) {
      body.resume_at = resumeAt;
    }

    return this.makeRequest(`/subscriptions/${subscriptionId}/pause`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async resumeSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}/resume`, {
      method: 'POST'
    });
  }

  async createCheckout(items: any[], customData: any) {
    return this.makeRequest('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        items,
        customer: {
          email: customData.customerEmail
        },
        custom_data: customData,
        settings: {
          success_url: customData.successUrl,
          cancel_url: customData.cancelUrl
        }
      })
    });
  }

  // Webhook signature verification
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('PADDLE_WEBHOOK_SECRET environment variable is required');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const paddleAPI = new PaddleAPI();