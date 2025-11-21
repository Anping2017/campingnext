'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthSync from '@/components/AuthSync';
import AuthBanner from '@/components/AuthBanner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// 包装组件，确保只在客户端渲染 AuthProvider
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 在 SSR 时，直接渲染 children，不渲染 AuthProvider
  if (!mounted) {
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

