'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { preferencesUtils } from '@/types/preferences';
import { onboardingUtils } from '@/components/OnboardingModal';
import { createClientComponentClient } from '@/lib/supabase';

// 自动同步用户数据到 Supabase
// 注意：此 hook 只应在需要同步的页面使用，后台管理页面不应使用
export function useUserDataSync() {
  const { user, session, isConfigured } = useAuth();
  const hasSyncedRef = useRef(false);
  const syncingRef = useRef(false); // 防止并发同步

  useEffect(() => {
    if (!user || !session || !isConfigured || hasSyncedRef.current || syncingRef.current) return;

    const syncData = async () => {
      // 如果已经在同步中，直接返回
      if (syncingRef.current) return;
      
      try {
        syncingRef.current = true;
        hasSyncedRef.current = true;

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
        hasSyncedRef.current = false; // 失败后允许重试
      } finally {
        syncingRef.current = false;
      }
    };

    // 延迟一点再同步，确保用户已完全登录
    const timer = setTimeout(syncData, 1000);
    return () => {
      clearTimeout(timer);
      syncingRef.current = false;
    };
  }, [user, session, isConfigured]);
}

