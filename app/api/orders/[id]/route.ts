import { NextResponse } from 'next/server'
import { fetcher } from '@/lib/api/api_server_backend'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await fetcher<any>(`/api/orders/${id}`)
  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { status } = await request.json()

    // Validate status - using the same validation as the backend API
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED_DRIVER', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const order = await fetcher<any>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}
