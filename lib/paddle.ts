type CheckoutOptions = {
  items: { priceId: string; quantity: number }[];
  customer?: any;
  customData?: Record<string, any>;
  settings?: { successUrl?: string; locale?: string };
};

export function isPaddleLoaded() {
  return typeof window !== 'undefined' && !!(window as any).Paddle;
}

export function initializePaddle() {
  if (!isPaddleLoaded()) return;
  const Paddle = (window as any).Paddle;
  if (!Paddle?.Initialized) {
    try {
      Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID,
        eventCallback: () => {},
      });
    } catch {}
  }
}

export async function openPaddleCheckout(opts: CheckoutOptions) {
  if (!isPaddleLoaded()) throw new Error('Paddle not loaded');
  const Paddle = (window as any).Paddle;
  return new Promise<void>((resolve, reject) => {
    try {
      Paddle.Checkout.open({
        items: opts.items,
        customer: opts.customer,
        customData: opts.customData,
        settings: opts.settings,
        onLoaded: () => resolve(),
        onError: (e: any) => reject(e),
      });
    } catch (e) {
      reject(e);
    }
  });
}


