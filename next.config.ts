import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境配置 - 移除了开发时的忽略设置
  reactStrictMode: true,
};

export default nextConfig;
