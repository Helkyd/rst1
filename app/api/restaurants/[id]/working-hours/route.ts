import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetcher } from '@/lib/api/api_server_backend'
import {
  canManageRestaurant,
  normalizeWorkingHours,
  type WorkingHourInput,
} from '@/lib/working-hours'

// We don't need WeekDay from Prisma anymore since we're using API-only
// Define WeekDay type for validation
type WeekDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'

export const runtime = 'nodejs'

function parseHours(body: unknown): WorkingHourInput[] | null {
  if (!body || typeof body !== 'object' || !('hours' in body)) return null
  const hours = (body as { hours: unknown }).hours
  if (!Array.isArray(hours)) return null

  const validDays = new Set<WeekDay>(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
  const parsed: WorkingHourInput[] = []

  for (const row of hours) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const dayOfWeek = r.dayOfWeek as string
    if (!validDays.has(dayOfWeek as WeekDay)) continue
    parsed.push({
      dayOfWeek: dayOfWeek as WeekDay,
      startTime: String(r.startTime ?? '09:00'),
      endTime: String(r.endTime ?? '22:00'),
      isOpen: Boolean(r.isOpen),
    })
  }

  if (parsed.length === 0) return null
  return normalizeWorkingHours(parsed)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  
  // Check if user can manage this restaurant
  const restaurant = await fetcher<any>(`/api/restaurants/${id}`)
  
  // Check if user can manage this restaurant
  const canManage = session.user.role === 'ADMIN' || 
                   (session.user.role === 'RESTAURANT' && session.user.restaurantId === id)
  
  if (!canManage) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Return the working hours from the restaurant object
  return NextResponse.json(restaurant.workingHours || [])
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    // Check authorization
    const canManage = session.user.role === 'ADMIN' || 
                     (session.user.role === 'RESTAURANT' && session.user.restaurantId === id)
    
    if (!canManage) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Fetch restaurant to verify it exists
    let restaurant
    try {
      restaurant = await fetcher<any>(`/api/restaurants/${id}`)
    } catch (error) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404 }
      )
    }

    const hours = parseHours(await request.json())
    if (!hours) {
      return NextResponse.json(
        { error: 'Horários inválidos' },
        { status: 400 }
      )
    }

    // Update the restaurant with new working hours
    const updatedRestaurant = await fetcher<any>(`/api/restaurants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ workingHours: hours }),
    })

    return NextResponse.json({ hours: updatedRestaurant.workingHours })
  } catch (error) {
    console.error('[api/working-hours PUT]', error)
    return NextResponse.json(
      { error: 'Erro ao guardar horários' },
      { status: 500 }
    )
  }
}
