import { NextResponse } from 'next/server'

/** Pedido de recuperação — resposta genérica por segurança */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    // Get the backend API URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    
    // Since we're moving away from Prisma, we'll call the backend API to check if user exists
    // For security, we still return a generic response regardless of whether the email exists
    try {
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      // Don't check response status - we ignore errors for security
      await response.text()
    } catch (apiError) {
      // Ignore API errors for security - still return success message
      console.error('Forgot password API error:', apiError)
    }

    // Em produção: enviar email com token. Por agora apenas confirmação genérica.
    return NextResponse.json({
      message: 'Se o email existir, enviaremos instruções.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao processar pedido' },
      { status: 500 }
    )
  }
}