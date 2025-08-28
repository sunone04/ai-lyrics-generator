'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

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
    <Link href="/auth/signin" className="inline-block">
      <Button 
        disabled={isSigningIn}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSigningIn ? 'Signing in...' : 'Sign In'}
      </Button>
    </Link>
  );
}