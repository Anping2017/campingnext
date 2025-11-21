'use client';

import { useState, useEffect } from 'react';
import { Cloud, X, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

export default function AuthBanner() {
  const { user, isConfigured } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查是否已关闭过（存储在 localStorage）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissedState = localStorage.getItem('authBannerDismissed');
    if (dismissedState === 'true') {
      setDismissed(true);
    }
  }, []);

  // 在 SSR 时不渲染
  if (!mounted) return null;

  // 监听登录状态，显示同步成功提示
  useEffect(() => {
    if (user && isConfigured) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isConfigured]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('authBannerDismissed', 'true');
  };

  // 如果已登录、未配置或已关闭，不显示登录提示
  if (user || !isConfigured || dismissed) {
    // 显示同步成功提示
    if (showSyncSuccess && user) {
      return (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white z-40 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>数据已同步到云端</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="w-4 h-4" />
              <span>登录后可同步数据到云端</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="w-3 h-3" />
                登录
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 为顶部横幅留出空间 */}
      <div className="h-10" />

      {/* 登录模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}

