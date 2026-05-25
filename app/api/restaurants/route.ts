import { fetcher } from '@/lib/api/api_server_backend'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { geocodeAddress } from '@/lib/geocode'
import { seedDefaultWorkingHours } from '@/lib/working-hours'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchParams.toString()
    let url = '/api/restaurants'
    if (params) {
      url += `?${params}`
    }

    const restaurants = await fetcher<any[]>(url)
    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Erro ao buscar restaurantes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, telephone, email, taxId, website, logo } = body

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: 'Nome e morada são obrigatórios' },
        { status: 400 }
      )
    }

    const trimmedAddress = address.trim()
    const geocoded = await geocodeAddress(trimmedAddress)

    // Create restaurant via API
    const restaurantData = {
      name: name.trim(),
      address: trimmedAddress,
      telephone: telephone?.trim() || null,
      email: email?.trim() || null,
      taxId: taxId?.trim() || null,
      website: website?.trim() || null,
      logo: logo?.trim() || null,
      latitude: geocoded?.latitude ?? null,
      longitude: geocoded?.longitude ?? null,
    }

    const restaurant = await fetcher<any>('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData),
    })

    // Seed default working hours for the new restaurant
    await seedDefaultWorkingHours(restaurant.id)

    return NextResponse.json(
      {
        ...restaurant,
        geocoded: !!geocoded,
        geocodeMessage: geocoded
          ? `Coordenadas obtidas (${geocoded.source}): ${geocoded.latitude.toFixed(5)}, ${geocoded.longitude.toFixed(5)}`
          : 'Restaurante criado. Não foi possível obter GPS — tenta incluir bairro e cidade (ex: Talatona, Luanda, Angola).',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[api/restaurants POST]', error)
    return NextResponse.json(
      { error: 'Erro ao criar restaurante' },
      { status: 500 }
    )
  }
}
