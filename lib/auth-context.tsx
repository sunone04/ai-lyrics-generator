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

    // 获取初始会话 - 使用更可靠的getUser方法
    const getInitialSession = async () => {
      try {
        // 首先尝试获取当前会话
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
        }

        // 然后验证用户身份
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
        }

        if (mounted) {
          // 只有当session和user都存在且匹配时才设置
          if (currentSession && currentUser && currentSession.user.id === currentUser.id) {
            setSession(currentSession);
            setUser(currentUser);
          } else {
            // 如果不匹配，清除状态
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
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
      async (event, session) => {
        if (!mounted) return;
        
        try {
          if (event === 'SIGNED_IN' && session) {
            // 验证用户身份
            const { data: { user: currentUser }, error } = await supabase.auth.getUser();
            if (!error && currentUser && currentUser.id === session.user.id) {
              setSession(session);
              setUser(currentUser);
            } else {
              console.error('User verification failed:', error);
              setSession(null);
              setUser(null);
            }
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            setSession(null);
            setUser(null);
          } else if (session) {
            // 其他事件，验证session有效性
            const { data: { user: currentUser }, error } = await supabase.auth.getUser();
            if (!error && currentUser && currentUser.id === session.user.id) {
              setSession(session);
              setUser(currentUser);
            } else {
              setSession(null);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setSession(null);
          setUser(null);
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
      // 清除本地状态
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