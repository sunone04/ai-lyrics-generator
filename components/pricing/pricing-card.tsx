'use client'

import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { openPaddleCheckout, initializePaddle, isPaddleLoaded } from '@/lib/paddle'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  priceId: string | null
}

interface PricingCardProps {
  plan: Plan
}

export default function PricingCard({ plan }: PricingCardProps) {
  const user = null as any
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // 重要：确保组件完全静态化，不受登录状态影响
  // 所有计划信息都保持静态显示，包括样式和布局

  const handleSubscribe = async () => {
    if (!user) {
      const returnTo = encodeURIComponent('/pricing')
      router.push(`/auth/signin?returnTo=${returnTo}`)
      return
    }

    if (!plan.priceId) {
      router.push('/generate')
      return
    }

    setIsLoading(true)
    try {
      // 等待Paddle脚本加载
      if (!isPaddleLoaded()) {
        let attempts = 0
        const maxAttempts = 10
        while (!isPaddleLoaded() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }
        if (!isPaddleLoaded()) {
          console.error('Paddle failed to load')
          toast.error('支付系统加载失败，请刷新页面重试')
          setIsLoading(false)
          return
        }
      }

      // 确保初始化
      initializePaddle()
      
      // 再次等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (!plan.priceId || !plan.priceId.startsWith('pri_')) {
        console.error('Invalid price ID format:', plan.priceId)
        toast.error('支付配置错误，请联系客服')
        setIsLoading(false)
        return
      }

      // 客户信息 - 设置为美国地区
      const customerInfo = {
        email: user.email as string,
        address: {
          countryCode: 'US',
          region: 'US'
        }
      }

      console.log('Opening Paddle checkout...')

      // 使用官方推荐的简单方式，设置英文界面
      await openPaddleCheckout({
        items: [{ priceId: plan.priceId, quantity: 1 }],
        customer: customerInfo,
        customData: { user_id: user.id },
        settings: { 
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          locale: 'en'
        }
      })
      
      console.log('Checkout opened successfully')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('支付页面打开失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 确保按钮文本和样式完全一致，不受登录状态影响
  const getButtonContent = () => {
    if (!plan.priceId) {
      return (
        <div className="w-full text-center">
          <Link
            href="/generate"
            className="inline-block text-gray-600 hover:text-gray-800 transition-colors font-medium hover:underline cursor-pointer"
          >
            Start Free
          </Link>
        </div>
      )
    }

    return (
      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={`w-full rounded-md px-3 py-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200 cursor-pointer ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 hover:shadow-md focus-visible:outline-blue-600 transform hover:scale-105'
        }`}
      >
        {isLoading ? 'Loading...' : plan.cta}
      </button>
    )
  }

  return (
    <div className={`relative rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-200 xl:p-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer min-h-[800px] ${
      plan.popular ? 'ring-2 ring-blue-600' : ''
    }`}>
      {plan.popular && (
        <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white text-center">
          Most Popular
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-semibold leading-8 text-gray-900">
          {plan.name}
        </h3>
        <div className="mt-4 flex items-baseline justify-center gap-x-2">
          <span className="text-4xl font-bold tracking-tight text-gray-900">
            {plan.price}
          </span>
          <span className="text-sm font-semibold leading-6 text-gray-600">
            /{plan.period}
          </span>
          {plan.priceId && (
            <span className="text-xs text-gray-500 align-super">(tax included)</span>
          )}
        </div>
        <p className="mt-6 text-lg leading-6 text-gray-600">
          {plan.description}
        </p>
      </div>

      <ul role="list" className="mt-10 space-y-4 text-lg leading-6 text-gray-600">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-x-3">
            <CheckIcon className="h-6 w-5 flex-none text-green-600" aria-hidden="true" />
            <span className="text-lg">{feature}</span>
          </li>
        ))}
      </ul>

      {/* 按钮容器，使用绝对定位确保垂直对齐 */}
      <div className="absolute bottom-8 left-8 right-8 xl:left-10 xl:right-10">
        {getButtonContent()}
      </div>
    </div>
  )
}
