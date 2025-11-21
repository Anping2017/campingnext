'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();
  
  // 只在客户端创建 Supabase 客户端
  const [supabase, setSupabase] = useState<any>(null);
  
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      const client = createClientComponentClient();
      setSupabase(client);
      
      // 如果 Supabase 未配置，直接设置为未登录状态
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      // 获取当前会话
      client.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.warn('获取会话失败:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(() => {
        // 静默处理错误
        setLoading(false);
      });

      // 监听认证状态变化
      try {
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        // 静默处理错误
        setLoading(false);
      }
    } catch (error) {
      // 如果创建客户端失败，静默处理
      setLoading(false);
    }
  }, [isConfigured]);

  const signUp = async (email: string, password: string) => {
    if (!isConfigured || !supabase) {
      return { error: { message: 'Supabase 未配置，无法注册' } };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || '注册失败' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isConfigured || !supabase) {
      return { error: { message: 'Supabase 未配置，无法登录' } };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || '登录失败' } };
    }
  };

  const signOut = async () => {
    if (!isConfigured || !supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('登出失败:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isConfigured, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

