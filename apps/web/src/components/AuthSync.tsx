'use client';

import { usePathname } from 'next/navigation';
import { useUserDataSync } from '@/hooks/useUserDataSync';

// 全局数据同步组件，在所有页面自动同步用户数据
// 注意：后台管理页面不需要同步用户数据
export default function AuthSync() {
  const pathname = usePathname();
  
  // 后台页面不执行数据同步
  const isAdminPage = pathname?.startsWith('/admin');
  
  // 只在非后台页面执行同步
  if (!isAdminPage) {
    useUserDataSync();
  }
  
  return null;
}

