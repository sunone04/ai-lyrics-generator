'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        // 获取初始会话和用户信息
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (mounted) {
          // 验证会话和用户的一致性
          if (currentSession && currentUser && currentSession.user.id === currentUser.id) {
            setSession(currentSession);
            setUser(currentUser);
          } else {
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              // 会话创建或刷新：获取最新用户信息
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (currentUser) {
                setSession(newSession);
                setUser(currentUser);
              } else {
                setSession(null);
                setUser(null);
              }
              break;
              
            case 'SIGNED_OUT':
              setSession(null);
              setUser(null);
              break;
              
            case 'USER_UPDATED':
              // 用户信息更新：刷新用户数据
              if (newSession?.user) {
                setUser(newSession.user);
              }
              break;
              
            default:
              // 其他事件：保持当前状态
              if (newSession) {
                setSession(newSession);
              }
              break;
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};