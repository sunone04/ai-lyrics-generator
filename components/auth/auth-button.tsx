'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error('Error signing in:', error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.email}
        </span>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleSignIn} 
      disabled={isSigningIn}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isSigningIn ? 'Signing in...' : 'Sign In'}
    </Button>
  );
}