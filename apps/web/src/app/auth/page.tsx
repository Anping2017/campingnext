'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import NavBar from '@/components/NavBar';
import { LogIn } from 'lucide-react';

export default function AuthPage() {
  const [showModal, setShowModal] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? '欢迎回来' : '加入 Nomad NZ'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login' 
              ? '登录以同步你的数据到云端' 
              : '注册账号，自动保存你的偏好和行程'}
          </p>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            // 如果有重定向参数，跳转到指定页面，否则跳转到首页
            const targetPath = redirect || '/';
            setTimeout(() => {
              router.push(targetPath);
            }, 500);
          }}
          initialMode={mode}
        />
      </div>

      <NavBar />
    </div>
  );
}

