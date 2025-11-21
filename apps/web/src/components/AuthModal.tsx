'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, isConfigured } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        // 验证密码
        if (password.length < 6) {
          setError('密码至少需要6个字符');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message || '注册失败，请重试');
        } else {
          // 注册成功，切换到登录模式
          setMode('login');
          setError(null);
          setPassword('');
          setConfirmPassword('');
          // 显示成功消息
          alert('注册成功！请登录');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || '登录失败，请检查邮箱和密码');
        } else {
          // 登录成功，关闭模态框
          onClose();
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setError(null);
          // 显示成功提示
          setTimeout(() => {
            alert('登录成功！数据正在同步到云端...');
          }, 100);
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'login' ? '登录' : '注册'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少6个字符' : '请输入密码'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Confirm Password (仅注册时显示) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            {mode === 'login' ? '还没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

        {/* Supabase 未配置提示 */}
        {!isConfigured && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <div className="font-medium mb-1">Supabase 未配置</div>
                <div className="space-y-1">
                  <div>请在 apps/web/.env.local 中添加：</div>
                  <div className="font-mono text-xs bg-amber-100 p-2 rounded">
                    NEXT_PUBLIC_SUPABASE_URL=your_url<br/>
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
                  </div>
                  <div>配置后需要重启开发服务器</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 提示 */}
        {isConfigured && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            {mode === 'register' 
              ? '注册后可自动保存你的偏好和行程数据' 
              : '登录后可同步你的数据到云端'}
          </div>
        )}
      </div>
    </div>
  );
}

