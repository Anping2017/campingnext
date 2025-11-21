'use client';

import { useUserDataSync } from '@/hooks/useUserDataSync';

// 全局数据同步组件，在所有页面自动同步用户数据
export default function AuthSync() {
  // useUserDataSync 内部已经处理了 SSR 检查
  useUserDataSync();
  return null;
}

