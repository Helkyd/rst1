// app/api/debug-session/route.ts
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies() // Add await here
  const allCookies = cookieStore.getAll()
  
  return NextResponse.json({
    hasSession: !!session,
    hasUser: !!session?.user,
    hasAccessToken: !!session?.user?.accessToken,
    userId: session?.user?.id,
    userRole: session?.user?.role,
    accessTokenPreview: session?.user?.accessToken ? session?.user?.accessToken.substring(0, 30) + '...' : null,
    cookies: allCookies.map(c => ({ 
      name: c.name, 
      value: c.value?.substring(0, 30) + '...',
      hasValue: !!c.value
    })),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    }
  })
}