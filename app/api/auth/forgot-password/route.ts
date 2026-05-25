import { NextResponse } from 'next/server'
import { fetcher } from '@/lib/api/api_server_backend'

/** Pedido de recuperação — resposta genérica por segurança */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    // Check if user exists via API
    const users = await fetcher<any[]>(`/api/users?search=${email.trim()}`)
    const userExists = users.some(user => user.email.toLowerCase().trim() === email.toLowerCase().trim())

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
