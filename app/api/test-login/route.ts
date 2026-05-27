// app/api/test-login/route.ts
import { NextResponse } from 'next/server'
import { validateUserCredentials } from '@/lib/validate-user'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('[Test Login] Checking:', email)
    
    const result = await validateUserCredentials(email, password)
    
    console.log('[Test Login] Result:', { ok: result.ok, reason: result.reason })
    
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 401 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { id: result.user.id, email: result.user.email, role: result.user.role }
    })
  } catch (error) {
    console.error('[Test Login] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}