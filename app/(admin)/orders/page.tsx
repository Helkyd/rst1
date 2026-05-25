import OrdersTable from '@/components/orders/OrdersTable'
import { fetcher } from '@/lib/api/api_server_backend'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim()

  // Fetch all orders from the API (we assume the API returns the same shape as the Prisma query with includes)
  const allOrders = await fetcher<any[]>('/api/orders')

  // Filter by query if provided (client-side filtering)
  const filteredOrders = query ? allOrders.filter(order => {
    const searchLower = query.toLowerCase()
    
    // Check user name
    const userMatch = order.user?.name?.toLowerCase().includes(searchLower) ?? false
    if (userMatch) return true
    
    // Check driver name
    const driverMatch = order.driver?.name?.toLowerCase().includes(searchLower) ?? false
    if (driverMatch) return true
    
    // Check restaurant name in items
    const restaurantMatch = order.items?.some((item: any) => 
      item.restaurant?.name?.toLowerCase().includes(searchLower) ?? false
    ) ?? false
    if (restaurantMatch) return true
    
    // Check orderCounter (if query is a number)
    if (Number.isFinite(Number(query))) {
      return order.orderCounter === Number(query)
    }
    
    return false
  }) : allOrders

  // Sort by createdAt descending
  const orders = filteredOrders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Pedidos
          </h1>
          <p className="text-gray-400 mt-1">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            {query ? ` para "${query}"` : ' no total'}
          </p>
        </div>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
