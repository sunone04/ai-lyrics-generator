'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Paddle: any
  }
}

export default function PaddleProvider() {
  const router = useRouter()
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // 只在需要时加载Paddle脚本，不自动初始化
    if (!scriptRef.current && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
      script.async = true
      script.onload = () => {
        console.log('Paddle.js script loaded successfully')
        // 不自动初始化，等待用户主动调用
      }
      script.onerror = (error) => {
        console.error('Failed to load Paddle.js script:', error)
        // 完全静默处理错误，不显示任何提示
      }
      
      document.head.appendChild(script)
      scriptRef.current = script
    }

    // 清理函数
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
    }
  }, [router])

  // 这个组件不渲染任何可见内容，也不自动初始化Paddle
  return null
}