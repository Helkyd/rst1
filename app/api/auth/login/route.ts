import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { validateUserCredentials } from '@/lib/validate-user'

import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e palavra-passe são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await validateUserCredentials(email, password)

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Email ou palavra-passe incorretos' },
        { status: 401 }
      )
    }


    // In your POST function:
    const loginToken = jwt.sign(
      {
        sub: result.user.id,
        loginBridge: true,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '2m' }
)

    
    return NextResponse.json({
      loginToken,
      role: result.user.role,
      needsSetup: result.user.needsSetup,
    })
  } catch (error) {
    console.error('[api/auth/login]', error)
    return NextResponse.json(
      { error: 'Erro de ligação à base de dados' },
      { status: 500 }
    )
  }
}
