import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/AuthContext'

// 动态导入客户端组件，禁用 SSR
const AuthSync = dynamic(() => import('@/components/AuthSync'), { ssr: false })
const AuthBanner = dynamic(() => import('@/components/AuthBanner'), { ssr: false })

export const metadata: Metadata = {
  title: 'Nomad NZ - 新西兰露营智能助手',
  description: '轻松规划露营行程、记录营地、获取推荐路线',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProvider>
          <AuthSync />
          <AuthBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}


