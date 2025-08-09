import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user session found',
        user: null 
      });
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        last_sign_in_at: user.last_sign_in_at
      },
      error: null 
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Server error',
      user: null 
    });
  }
}