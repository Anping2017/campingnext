import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthBanner from '@/components/AuthBanner'
import AuthSync from '@/components/AuthSync'

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


