const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['common'],
  // 确保环境变量正确传递到客户端（Vercel 会自动处理，这里保留作为后备）
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // 优化图片加载
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // 确保 webpack 正确解析路径别名
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
  // 在构建时忽略 ESLint 警告（只显示错误）
  eslint: {
    ignoreDuringBuilds: false, // 不忽略，但可以配置规则
  },
}

module.exports = nextConfig



