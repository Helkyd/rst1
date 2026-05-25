import { fetcher } from '@/lib/api/api_server_backend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchParams.toString()
    let url = '/api/orders'
    if (params) {
      url += `?${params}`
    }

    const orders = await fetcher<any[]>(url)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const order = await fetcher<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
