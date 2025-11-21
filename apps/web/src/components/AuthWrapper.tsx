'use client';

import { useEffect, useState } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// 包装组件，确保只在客户端渲染 AuthProvider
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [AuthProvider, setAuthProvider] = useState<any>(null);
  const [AuthSync, setAuthSync] = useState<any>(null);
  const [AuthBanner, setAuthBanner] = useState<any>(null);

  useEffect(() => {
    // 只在客户端动态导入这些组件
    if (typeof window !== 'undefined') {
      import('@/contexts/AuthContext').then((mod) => {
        setAuthProvider(() => mod.AuthProvider);
      });
      import('@/components/AuthSync').then((mod) => {
        setAuthSync(() => mod.default);
      });
      import('@/components/AuthBanner').then((mod) => {
        setAuthBanner(() => mod.default);
      });
      setMounted(true);
    }
  }, []);

  // 在 SSR 时，直接渲染 children，不渲染 AuthProvider
  if (!mounted || !AuthProvider || !AuthSync || !AuthBanner) {
    return <>{children}</>;
  }

  // 客户端挂载后，渲染完整的 AuthProvider
  return (
    <AuthProvider>
      <AuthSync />
      <AuthBanner />
      {children}
    </AuthProvider>
  );
}

