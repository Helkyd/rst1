import { fetcher } from '@/lib/api/api_server_backend'
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

export default async function DriversPage() {
  try {
    // Fetch all drivers
    const drivers = await fetcher<any[]>(`/api/users?role=DRIVER`)
    
    // Fetch active deliveries count
    const activeDeliveriesResponse = await fetcher<any>(`/api/orders/available`)
    const activeDeliveries = Array.isArray(activeDeliveriesResponse) ? activeDeliveriesResponse.length : 0
    
    // Fetch completed deliveries count
    const completedDeliveriesResponse = await fetcher<any>(`/api/orders?status=DELIVERED`)
    const completedDeliveries = Array.isArray(completedDeliveriesResponse) ? completedDeliveriesResponse.length : 0

    // Enhance drivers with their order counts and recent activity
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        try {
          // Fetch driver's orders
          const driverOrders = await fetcher<any[]>(`/api/orders/driver/${driver.id}`)
          
          // Count active orders for this driver
          const activeOrders = driverOrders.filter(order => 
            ['ACCEPTED_DRIVER', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)
          ).length
          
          return {
            ...driver,
            orderCount: driverOrders.length,
            activeOrderCount: activeOrders
          }
        } catch (error) {
          console.error(`Error fetching orders for driver ${driver.id}:`, error)
          return {
            ...driver,
            orderCount: 0,
            activeOrderCount: 0
          }
        }
      })
    )

    const busyCount = driversWithStats.filter((d) => d.activeOrderCount > 0).length

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Motoristas
          </h1>
          <p className="text-gray-400 mt-1">
            Gestão de entregadores da plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Motoristas"
            value={driversWithStats.length}
            icon={Truck}
            color="orange"
            change="registados"
          />
          <StatsCard
            label="Em entrega"
            value={activeDeliveries}
            icon={Package}
            color="blue"
            change={`${busyCount} motoristas ocupados`}
          />
          <StatsCard
            label="Entregas concluídas"
            value={completedDeliveries}
            icon={CheckCircle2}
            color="green"
            change="total histórico"
          />
        </div>

        {driversWithStats.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhum motorista"
            description="Os motoristas são criados na app de entregas. Quando existirem na base de dados, aparecem aqui com estatísticas de entregas."
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
                <TableHeader>Registo</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {driversWithStats.map((driver) => {
                const isBusy = driver.activeOrderCount > 0
                return (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium text-white">
                      {driver.name}
                    </TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>{driver.telephone}</TableCell>
                    <TableCell>{driver.orderCount}</TableCell>
                    <TableCell>
                      <Badge variant={isBusy ? 'warning' : 'success'}>
                        {isBusy ? 'Em entrega' : 'Disponível'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {formatDate(driver.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error fetching drivers data:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Motoristas
          </h1>
          <p className="text-gray-400 mt-1">Erro ao carregar motoristas</p>
        </div>
      </div>
    )
  }
}
