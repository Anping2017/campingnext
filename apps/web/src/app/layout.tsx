import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'

// 动态导入 AuthWrapper，禁用 SSR
const AuthWrapper = dynamic(() => import('@/components/AuthWrapper'), { ssr: false })

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
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}


