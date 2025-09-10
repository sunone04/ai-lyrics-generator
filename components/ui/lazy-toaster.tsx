'use client'

import dynamic from 'next/dynamic'

// 在客户端懒加载 Toaster，避免进入服务端渲染上下文
const Toaster = dynamic(() => import('react-hot-toast').then(m => m.Toaster), {
  ssr: false,
})

export function LazyToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  )
}

