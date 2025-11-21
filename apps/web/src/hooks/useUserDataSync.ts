'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { preferencesUtils } from '@/types/preferences';
import { onboardingUtils } from '@/components/OnboardingModal';
import { createClientComponentClient } from '@/lib/supabase';

// 自动同步用户数据到 Supabase
export function useUserDataSync() {
  const { user, session, isConfigured } = useAuth();
  // 使用 useState 而不是 useRef，避免 SSR 问题
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;
    
    if (!user || !session || !isConfigured || hasSynced) return;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const syncData = async () => {
      try {
        setHasSynced(true);

        // 获取 access token
        const accessToken = session.access_token;

        // 同步偏好数据
        const preferences = preferencesUtils.load();
        if (preferences) {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              userId: user.id,
              data: preferences,
              dataType: 'preferences',
              accessToken,
            }),
          });
        }

        // 同步引导数据
        const onboarding = onboardingUtils.load();
        if (onboarding) {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              userId: user.id,
              data: onboarding,
              dataType: 'onboarding',
              accessToken,
            }),
          });
        }

        // 同步收藏的营地
        const favorites = localStorage.getItem('favoriteCamps');
        if (favorites) {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              userId: user.id,
              data: JSON.parse(favorites),
              dataType: 'favorites',
              accessToken,
            }),
          });
        }

        console.log('用户数据同步完成');
      } catch (error) {
        console.error('同步用户数据失败:', error);
        setHasSynced(false); // 失败后允许重试
      }
    };

    // 延迟一点再同步，确保用户已完全登录
    const timer = setTimeout(syncData, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, isConfigured, hasSynced]);
}

