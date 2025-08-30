import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession?.value === 'authenticated') {
      return NextResponse.json({ 
        isAdmin: true,
        message: 'Admin access granted' 
      });
    }
    
    return NextResponse.json(
      { 
        isAdmin: false,
        message: 'Admin access denied' 
      },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { 
        isAdmin: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
