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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (mounted) {
          if (currentSession && currentUser && currentSession.user.id === currentUser.id) {
            setSession(currentSession);
            setUser(currentUser);
          } else {
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // 会话创建或刷新：获取最新用户
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              setSession(newSession);
              setUser(currentUser);
            } else {
              setSession(null);
              setUser(null);
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else {
            // 其他事件，尽量保持现状
            setSession(newSession);
          }
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