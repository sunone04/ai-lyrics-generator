import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@headlessui/react'],
    // 移除 ppr 实验性功能，因为它需要 canary 版本
  },
  // 静态优化
  output: 'standalone',
  poweredByHeader: false,
  generateEtags: false,
  
  // 图像优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 压缩配置
  compress: true,
  
  // 缓存配置
  async headers() {
    return [
      {
        source: '/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/pricing',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/faq',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/www/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
