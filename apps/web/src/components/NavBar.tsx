'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Compass, Route, Users, User, LogIn, LogOut, Cloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

export default function NavBar() {
  const { user, signOut, isConfigured } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navItems = [
    { href: '/', icon: Home, label: '首页' },
    { href: '/explore', icon: Compass, label: '探索' },
    { href: '/trip', icon: Route, label: '行程' },
    { href: '/community', icon: Users, label: '社区' },
    { href: '/profile', icon: User, label: '我的' },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          
          {/* 登录/登出按钮 */}
          {isConfigured && (
            <button
              onClick={user ? handleSignOut : () => setShowAuthModal(true)}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors"
              title={user ? '退出登录' : '登录同步云端'}
            >
              {user ? (
                <>
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs">退出</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span className="text-xs">登录</span>
                </>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* 登录模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}


