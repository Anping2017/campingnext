'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';
import { Users, FileText, MapPin, Shield, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setChecking(false);
        router.push('/auth?redirect=/admin');
        return;
      }

      try {
        // 先尝试通过 API 检查（更可靠，使用服务端验证）
        let adminStatus = false;
        let checkError = null;
        
        try {
          // 获取当前 session token
          const supabase = (await import('@/lib/supabase')).createClientComponentClient();
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          
          if (!token) {
            console.warn('没有 access token，无法进行 API 检查');
          } else {
            const response = await fetch('/api/admin/check', {
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              adminStatus = data.isAdmin || false;
              checkError = data.error;
              console.log('API 检查结果:', { isAdmin: adminStatus, error: checkError });
              if (!adminStatus && checkError) {
                console.warn('管理员权限检查 API 返回错误:', checkError);
              }
            } else {
              const errorText = await response.text();
              console.warn('管理员权限检查 API 响应失败:', response.status, errorText);
            }
          }
        } catch (apiError) {
          console.warn('API 检查失败，尝试客户端检查:', apiError);
        }
        
        // 如果 API 检查失败或返回 false，尝试客户端检查作为备用
        if (!adminStatus) {
          try {
            console.log('尝试客户端权限检查...');
            adminStatus = await isAdmin(user.id);
            console.log('客户端检查结果:', adminStatus);
          } catch (clientError) {
            console.error('客户端权限检查失败:', clientError);
          }
        }
        
        console.log('最终管理员权限检查结果:', { adminStatus, userId: user.id, email: user.email, error: checkError });
        setIsAdminUser(adminStatus);
        
        if (!adminStatus) {
          console.warn('用户不是管理员，重定向到首页', { userId: user.id, email: user.email });
          // 延迟一下，确保日志输出
          setTimeout(() => {
            router.push('/');
          }, 100);
        }
      } catch (error) {
        console.error('检查管理员权限失败:', error);
        router.push('/');
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">检查权限中...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  const navItems = [
    { href: '/admin', label: '概览', icon: Shield },
    { href: '/admin/users', label: '用户管理', icon: Users },
    { href: '/admin/posts', label: '帖子管理', icon: FileText },
    { href: '/admin/camps', label: '营地管理', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">后台管理</h2>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mt-8"
            >
              <Home className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="ml-64">
        {children}
      </div>
    </div>
  );
}









