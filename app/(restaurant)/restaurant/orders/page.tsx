import { fetcher } from '@/lib/api/api_server_backend'
import { requireRestaurant } from '@/lib/session'
import OrdersTable from '@/components/orders/OrdersTable'

export default async function RestaurantOrdersPage() {
  const session = await requireRestaurant()
  const restaurantId = session.user.restaurantId!

  // Since we don't have a direct API endpoint for restaurant-scoped orders,
  // we'll fetch all orders and filter on the client side
  // This is a limitation of the API-only approach
  const allOrders = await fetcher<any[]>(`/api/orders`)
  
  // Filter orders that have items from this restaurant
  const orders = allOrders.filter(order => 
    order.items?.some((item: any) => item.restaurantId === restaurantId) ?? false
  ).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).map(order => ({
    ...order,
    user: { name: order.user?.name ?? '' },
    driver: { name: order.driver?.name ?? '' },
    items: order.items?.filter((item: any) => item.restaurantId === restaurantId) ?? []
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Pedidos</h1>
        <p className="text-gray-400 mt-1">{orders.length} pedidos do restaurante</p>
      </div>
      <OrdersTable
        orders={orders}
        orderLinkPrefix="/restaurant/orders"
        hideRestaurantColumn
      />
    </div>
  )
}
