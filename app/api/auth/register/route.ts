import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { fetcher } from '@/lib/api/api_server_backend'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, telephone, role } = body

    if (!name?.trim() || !email?.trim() || !password || !telephone?.trim()) {
      return NextResponse.json(
        { error: 'Preenche todos os campos obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A palavra-passe deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (role !== 'RESTAURANT') {
      return NextResponse.json(
        { error: 'Registo disponível apenas para restaurantes' },
        { status: 400 }
      )
    }

    // Check if user exists via API
    const existingEmail = await fetcher<any[]>(`/api/users?search=${email.trim()}`)
    const existingTelephone = await fetcher<any[]>(`/api/users?search=${telephone.trim()}`)
    
    const emailExists = existingEmail.some(user => user.email.toLowerCase().trim() === email.toLowerCase().trim())
    const telephoneExists = existingTelephone.some(user => user.telephone === telephone.trim())

    if (emailExists || telephoneExists) {
      return NextResponse.json(
        { error: 'Email ou telefone já registado' },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      password: hashed,
      role: 'RESTAURANT',
      restaurantId: null,
    }

    const user = await fetcher<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 })
  } catch (error) {
    console.error('Error in register route:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
