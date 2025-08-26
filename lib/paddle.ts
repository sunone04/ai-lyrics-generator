// Paddle utility functions

export interface PaddlePrice {
  priceId: string
  quantity: number
}

export interface PaddleCustomer {
  email: string
  address?: {
    countryCode: string
    postalCode?: string
  }
}

export interface PaddleCheckoutOptions {
  items: PaddlePrice[]
  customer?: PaddleCustomer
  // Pass custom data to associate Paddle events with app user (e.g., user_id)
  customData?: Record<string, any>
  settings?: {
    successUrl?: string
    locale?: string
    theme?: string
    displayMode?: string
    variant?: string
    allowLogout?: boolean
    showAddDiscounts?: boolean
    showAddTaxId?: boolean
    frameInitialHeight?: string
    allowDiscountRemoval?: boolean
    allowedPaymentMethods?: string[] | null
    frameStyle?: string
    frameTarget?: string
  }
}

export interface PaddlePricePreviewRequest {
  items: PaddlePrice[]
}

export interface PaddlePricePreviewResponse {
  data: {
    details: {
      lineItems: Array<{
        product: {
          id: string
        }
        formattedTotals: {
          subtotal: string
        }
      }>
    }
  }
}

// 获取 Paddle 环境
export function getPaddleEnvironment(): 'sandbox' | 'live' {
  // 优先使用环境变量，否则根据 NODE_ENV 判断
  const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 
    (process.env.NODE_ENV === 'development' ? 'sandbox' : 'live')
  
  return env as 'sandbox' | 'live'
}

// 获取 Paddle API 基础地址
export function getPaddleApiBaseUrl(): string {
  const environment = getPaddleEnvironment()
  return environment === 'sandbox' 
    ? 'https://sandbox-api.paddle.com/'
    : 'https://api.paddle.com/'
}

// Initialize Paddle
export function initializePaddle(): void {
  if (typeof window === 'undefined') return

  if (!window.Paddle) return

  // 获取客户端令牌
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID
  
  if (!clientToken) return

  // 获取环境设置
  const environment = getPaddleEnvironment()
  
  try {
    // 重要：按照官方文档，只有 sandbox 时才需要设置环境
    if (environment === 'sandbox') {
      window.Paddle.Environment.set('sandbox')
    }
    // live 环境不需要显式设置

    // 然后调用初始化
    window.Paddle.Initialize({
      token: clientToken
    })
  } catch (error) {
    // 静默处理错误，不抛出异常
  }
}

// Open checkout
export function openPaddleCheckout(options: PaddleCheckoutOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Paddle checkout can only be used in browser'))
      return
    }

    if (!window.Paddle || !window.Paddle.Checkout) {
      reject(new Error('Paddle not loaded or Checkout not available'))
      return
    }

    try {
      // 按照官方文档的简单配置
      const checkoutConfig: any = {
        items: options.items
      }

      // 添加客户信息（如果提供）
      if (options.customer) {
        checkoutConfig.customer = options.customer
      }

      // 添加设置（如果提供）
      if (options.settings) {
        checkoutConfig.settings = options.settings
      }

      // 传递自定义数据，便于 webhook 关联用户
      if (options.customData) {
        checkoutConfig.customData = options.customData
      }

      // 使用官方推荐的简单方式打开结账
      window.Paddle.Checkout.open(checkoutConfig)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

// Get price preview
export function getPaddlePricePreview(request: PaddlePricePreviewRequest): Promise<PaddlePricePreviewResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Paddle price preview can only be used in browser'))
      return
    }

    if (!window.Paddle) {
      reject(new Error('Paddle not loaded'))
      return
    }

    window.Paddle.PricePreview(request)
      .then((result: PaddlePricePreviewResponse) => {
        resolve(result)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

// Close checkout
export function closePaddleCheckout(): void {
  if (typeof window === 'undefined') return

  if (!window.Paddle) return

  window.Paddle.Checkout.close()
}

// Check if Paddle is loaded
export function isPaddleLoaded(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.Paddle
}

// Enhanced Paddle status check with detailed diagnostics
export function getPaddleStatus(): {
  isLoaded: boolean
  isInitialized: boolean
  environment: string | null
  clientToken: string | null
  error?: string
} {
  if (typeof window === 'undefined') {
    return {
      isLoaded: false,
      isInitialized: false,
      environment: null,
      clientToken: null,
      error: 'Running on server side'
    }
  }

  if (!window.Paddle) {
    return {
      isLoaded: false,
      isInitialized: false,
      environment: null,
      clientToken: null,
      error: 'Paddle library not loaded'
    }
  }

  try {
    // Check if Paddle is properly initialized
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_ID
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox'
    
    return {
      isLoaded: true,
      isInitialized: !!clientToken,
      environment,
      clientToken: clientToken ? `${clientToken.substring(0, 10)}...` : null,
      error: !clientToken ? 'Client token not configured' : undefined
    }
  } catch (error) {
    return {
      isLoaded: true,
      isInitialized: false,
      environment: null,
      clientToken: null,
      error: `Error checking Paddle status: ${error}`
    }
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Validate price ID format
export function isValidPriceId(priceId: string): boolean {
  // Paddle price IDs typically start with 'pri_' and are alphanumeric
  return /^pri_[a-zA-Z0-9]+$/.test(priceId)
}

// Validate customer ID format
export function isValidCustomerId(customerId: string): boolean {
  // Paddle customer IDs typically start with 'ctm_' and are alphanumeric
  return /^ctm_[a-zA-Z0-9]+$/.test(customerId)
}

// Get subscription status display text
export function getSubscriptionStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'canceled':
      return 'Canceled'
    case 'past_due':
      return 'Past Due'
    case 'paused':
      return 'Paused'
    case 'free':
      return 'Free Plan'
    default:
      return 'Unknown'
  }
}

// Get subscription status color
export function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'canceled':
      return 'text-red-600 bg-red-100'
    case 'past_due':
      return 'text-yellow-600 bg-yellow-100'
    case 'paused':
      return 'text-gray-600 bg-gray-100'
    case 'free':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
