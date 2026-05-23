import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Comment out the problematic import
// import { OrderStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { status } = await request.json()
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED']

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(order)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 400 }
    )
  }
}