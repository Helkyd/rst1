import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'
import OrderStatusSelect from '@/components/orders/OrderStatusSelect'
import Card from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

import { fetcher } from '@/lib/api/api_server_backend'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  try {
    const order = await fetcher<any>(`/api/orders/${id}`, {}, true)
    
    if (!order) notFound()

    // Calculate subtotal (without delivery fee and tax if needed)
    const subtotal = order.items?.reduce((sum: number, item: any) => 
      sum + (Number(item.price) * Number(item.quantity)), 0) || 0
    
    // Use order.total as the final total (includes everything)
    const finalTotal = Number(order.total) || 0
    const ivaAmount = Number(order.totalIVA) || 0
    const deliveryFee = Number(order.deliveryFee) || 0

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-muted/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Pedido #{order.orderCounter || order.id.slice(-6)}
            </h1>
            <p className="text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div className="ml-auto">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <Card title="Gestão do pedido">
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Cliente" className="lg:col-span-1">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Nome</dt>
                <dd className="text-white">{order.user?.name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-white">{order.user?.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Telefone</dt>
                <dd className="text-white">{order.user?.telephone || 'N/A'}</dd>
              </div>
              {order.user?.address && (
                <div>
                  <dt className="text-gray-500">Morada</dt>
                  <dd className="text-white">{order.user.address}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Motorista" className="lg:col-span-1">
            {order.driver ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="text-white">{order.driver.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telefone</dt>
                  <dd className="text-white">{order.driver.telephone || 'N/A'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">Sem motorista atribuído</p>
            )}
          </Card>

          <Card title="Resumo" className="lg:col-span-1">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="text-white">{formatCurrency(subtotal)}</dd>
              </div>
              {ivaAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">IVA</dt>
                  <dd className="text-white">{formatCurrency(ivaAmount)}</dd>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Taxa de entrega</dt>
                  <dd className="text-white">{formatCurrency(deliveryFee)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-surface-border font-medium">
                <dt className="text-white">Total</dt>
                <dd className="text-brand-500 font-bold">{formatCurrency(finalTotal)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card title="Itens do pedido">
          {order.items && order.items.length > 0 ? (
            <ul className="divide-y divide-surface-border">
              {order.items.map((item: any) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {item.product?.name || item.productName || 'Produto'}
                      </p>
                      <span className="text-xs text-gray-500">
                        x{item.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.restaurant?.name || 'Restaurante'} · 
                      {formatCurrency(item.price)} cada
                    </p>
                  </div>
                  <span className="text-white font-medium ml-4">
                    {formatCurrency(Number(item.price) * Number(item.quantity))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhum item encontrado</p>
          )}
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error fetching order details:', error)
    notFound()
  }
}