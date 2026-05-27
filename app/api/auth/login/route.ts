import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { validateUserCredentials } from '@/lib/validate-user'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email, password, token } = await request.json()

    // Check if this is a token-based validation (for password reset, etc.)
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
        if (!secret) {
          return NextResponse.json(
            { error: 'Configuração de segurança inválida' },
            { status: 500 }
          )
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, secret) as any
        
        if (!decoded || !decoded.userId) {
          return NextResponse.json(
            { error: 'Token inválido ou expirado' },
            { status: 401 }
          )
        }

        // Token is valid
        return NextResponse.json({
          valid: true,
          userId: decoded.userId,
          role: decoded.role,
          email: decoded.email,
        })
      } catch (error) {
        console.error('[api/auth/login] Token validation error:', error)
        
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
          return NextResponse.json(
            { error: 'Token expirado' },
            { status: 401 }
          )
        }
        if (error instanceof jwt.JsonWebTokenError) {
          return NextResponse.json(
            { error: 'Token inválido' },
            { status: 401 }
          )
        }
        
        return NextResponse.json(
          { error: 'Erro ao validar token' },
          { status: 500 }
        )
      }
    }

    // Regular email/password login
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

    // Generate JWT token using the same function as in lib/auth.ts
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET or NEXTAUTH_SECRET is not defined')
    }

    // Match the same format as your generateAccessToken function
    const loginToken = jwt.sign(
      {
        userId: result.user.id,
        role: result.user.role,
        email: result.user.email,
        loginBridge: true, // Mark this as a login bridge token
      },
      secret,
      { expiresIn: '2m' } // Short expiration for bridge token
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

// Optional: Add GET endpoint to validate tokens
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'Configuração de segurança inválida' },
        { status: 500 }
      )
    }

    const decoded = jwt.verify(token, secret) as any

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      loginBridge: decoded.loginBridge || false,
    })
  } catch (error) {
    console.error('[api/auth/login] GET validation error:', error)
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      )
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao validar token' },
      { status: 500 }
    )
  }
}