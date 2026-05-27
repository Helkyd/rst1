import { NextResponse } from 'next/server'
import { adminFetcher } from '@/lib/api/api_server_backend'

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// app/api/dashboard/route.ts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Try to use the token
  let response = await fetch(`${process.env.BACKEND_URL}/api/dashboard`, {
    headers: { 'Authorization': `Bearer ${session.user.accessToken}` }
  });
  
  // If token is invalid, refresh it
  if (response.status === 403) {
    const refreshResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.user.accessToken}` }
    });
    
    if (refreshResponse.ok) {
      const { newToken } = await refreshResponse.json();
      // Update session with new token (you'll need to implement this)
      // Then retry the dashboard request
    }
  }
  
  // ... rest of your code
}