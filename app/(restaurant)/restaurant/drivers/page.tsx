import { fetcher } from '@/lib/api/api_server_backend'
import { requireRestaurant } from '@/lib/session'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import StatsCard from '@/components/dashboard/StatsCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { formatDate } from '@/lib/utils'
import { Truck, Package, CheckCircle2 } from 'lucide-react'

export default async function RestaurantDriversPage() {
  const session = await requireRestaurant()
  const restaurantId = session.user.restaurantId!

  // Get orders for this restaurant to find driver IDs
  const restaurantOrders = await fetcher<any[]>(`/api/orders?restaurantId=${restaurantId}`)
  
  // Extract unique driver IDs from orders
  const driverIds = [...new Set(
    restaurantOrders
      .filter(order => order.driverId)
      .map(order => order.driverId)
  )]

  const [drivers, activeForRestaurant, completedForRestaurant] =
    await Promise.all([
      driverIds.length === 0
        ? []
        : fetcher<any[]>(`/api/users?role=DRIVER&ids=${driverIds.join(',')}`),
      // For active orders, we need to filter by status
      restaurantOrders.filter(order => {
        const activeStatuses = ['ACCEPTED_DRIVER', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT']
        return order.driverId !== null && activeStatuses.includes(order.status)
      }).length,
      // For completed orders
      restaurantOrders.filter(order => order.status === 'DELIVERED' && order.driverId !== null).length,
    ])

  // Enhance driver data with their order counts for this restaurant
  const driversWithOrderCounts = await Promise.all(
    drivers.map(async (driver) => {
      const driverOrders = await fetcher<any[]>(`/api/orders/driver/${driver.id}`)
      const restaurantOrderCount = driverOrders.filter(order => 
        order.items?.some((item: any) => item.restaurantId === restaurantId) ?? false
      ).length
      return { ...driver, driverOrders: driverOrders, restaurantOrderCount }
    })
  )

  const busyDrivers = driversWithOrderCounts.filter((d) =>
    d.driverOrders.some((o) => 
      ['ACCEPTED_DRIVER', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
    )
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Motoristas</h1>
        <p className="text-gray-400 mt-1">
          Entregadores que já fizeram entregas do seu restaurante
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Motoristas"
          value={driversWithOrderCounts.length}
          icon={Truck}
          color="orange"
          change="com entregas suas"
        />
        <StatsCard
          label="Entregas activas"
          value={activeForRestaurant}
          icon={Package}
          color="blue"
          change={`${busyDrivers} ocupados agora`}
        />
        <StatsCard
          label="Concluídas"
          value={completedForRestaurant}
          icon={CheckCircle2}
          color="green"
          change="no seu restaurante"
        />
      </div>

      {driversWithOrderCounts.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sem motoristas ainda"
          description="Quando um motorista aceitar e entregar pedidos do seu restaurante, aparecerá aqui com o histórico de entregas."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Telefone</TableHeader>
              <TableHeader>Entregas</TableHeader>
              <TableHeader>Estado</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {driversWithOrderCounts.map((driver) => {
              const isBusy = driver.driverOrders.some((o) =>
                ['ACCEPTED_DRIVER', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
              )
              return (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-white">
                    {driver.name}
                  </TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell>{driver.telephone}</TableCell>
                  <TableCell>{driver.restaurantOrderCount}</TableCell>
                  <TableCell>
                    <Badge variant={isBusy ? 'warning' : 'success'}>
                      {isBusy ? 'Em entrega' : 'Disponível'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
