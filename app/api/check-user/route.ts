// app/api/check-user/route.ts
import { NextResponse } from 'next/server'
import { publicFetcher } from '@/lib/api/api_server_backend'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  
  try {
    // Try to find user via public endpoint if available
    const user = await publicFetcher(`/api/users?email=${encodeURIComponent(email)}`)
    return NextResponse.json({ exists: true, user })
  } catch (error: any) {
    return NextResponse.json({ 
      exists: false, 
      error: error.message,
      note: 'User might not exist or endpoint requires auth'
    }, { status: 404 })
  }
}