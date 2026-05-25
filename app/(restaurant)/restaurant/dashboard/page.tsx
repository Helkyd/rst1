import { fetcher } from '@/lib/api/api_server_backend'
import { requireRestaurant } from '@/lib/session'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentOrders from '@/components/dashboard/RecentOrders'
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react'

export default async function RestaurantDashboardPage() {
  const session = await requireRestaurant()
  const restaurantId = session.user.restaurantId!

  try {
    // Fetch dashboard data for this restaurant
    const [restaurantStats, recentOrdersData] = await Promise.all([
      fetcher<any>(`/api/restaurants/${restaurantId}/stats`),
      fetcher<any[]>(`/api/orders?limit=5`) // We'll filter client-side for recent orders
    ])

    // Get all orders to filter for restaurant-specific data
    const allOrders = await fetcher<any[]>(`/api/orders`)
    const restaurantOrders = allOrders.filter(order => 
      order.items?.some((item: any) => item.restaurantId === restaurantId) ?? false
    )
    
    // Get products count
    const products = await fetcher<any[]>(`/api/restaurants/${restaurantId}/products`)
    
    // Get unique clients who ordered from this restaurant
    const clients = await fetcher<any[]>(`/api/users?role=CLIENT`)
    const clientOrdersPromises = clients.map(client => 
      fetcher<any[]>(`/api/orders/user/${client.id}`)
    )
    const allClientOrders = await Promise.all(clientOrdersPromises)
    const clientWithRestaurantOrders = clients.filter((client, index) => 
      allClientOrders[index]?.some((order: any) => 
        order.items?.some((item: any) => item.restaurantId === restaurantId) ?? false
      ) ?? false
    )

    const orderCount = restaurantStats.totalOrders || 0
    const productCount = products.length
    const revenue = { _sum: { price: restaurantStats.totalRevenue || 0 } }
    const recentOrders = restaurantOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(order => ({
        ...order,
        user: { name: order.user?.name ?? '' }
      }))
    const clientCount = clientWithRestaurantOrders.length

    const stats = [
      {
        label: 'Pedidos',
        value: orderCount,
        icon: ShoppingBag,
        color: 'orange' as const,
        change: 'do seu restaurante',
      },
      {
        label: 'Clientes',
        value: clientCount,
        icon: Users,
        color: 'blue' as const,
        change: 'com pedidos aqui',
      },
      {
        label: 'Produtos',
        value: productCount,
        icon: Package,
        color: 'green' as const,
        change: 'no menu',
      },
      {
        label: 'Receita (itens)',
        value: `${(revenue._sum.price ?? 0).toLocaleString('pt-AO')} Kz`,
        icon: TrendingUp,
        color: 'purple' as const,
        change: 'vendas registadas',
      },
    ]

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            {session.user.restaurantName} — visão geral
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>

        <RecentOrders
          orders={recentOrders}
          orderLinkPrefix="/restaurant/orders"
          ordersListHref="/restaurant/orders"
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching restaurant dashboard data:', error)
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            {session.user.restaurantName} — visão geral
          </p>
        </div>
        <p className="text-red-400">Erro ao carregar dados do dashboard.</p>
      </div>
    )
  }
}
