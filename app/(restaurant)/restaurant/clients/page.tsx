import { fetcher } from '@/lib/api/api_server_backend'
import { requireRestaurant } from '@/lib/session'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { formatDate } from '@/lib/utils'

export default async function RestaurantClientsPage() {
  const session = await requireRestaurant()
  const restaurantId = session.user.restaurantId!

  // Fetch all CLIENT users
  const users = await fetcher<any[]>(`/api/users?role=CLIENT`)

  // For each user, fetch their orders and count how many are from this restaurant
  const clientsWithOrderCounts = await Promise.all(
    users.map(async (user) => {
      const orders = await fetcher<any[]>(`/api/orders/user/${user.id}`)
      const restaurantOrderCount = orders.reduce((count, order) => {
        const hasRestaurantItem = order.items?.some((item: any) => item.restaurantId === restaurantId) ?? false
        return count + (hasRestaurantItem ? 1 : 0)
      }, 0)
      return { ...user, orderCount: restaurantOrderCount }
    })
  )

  const clients = clientsWithOrderCounts.filter(user => user.orderCount > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Clientes</h1>
        <p className="text-gray-400 mt-1">
          {clients.length} clientes com pedidos no seu restaurante
        </p>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Nome</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Telefone</TableHeader>
            <TableHeader>Pedidos</TableHeader>
            <TableHeader>Registo</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium text-white">
                {client.name}
              </TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.telephone}</TableCell>
              <TableCell>{client.orderCount}</TableCell>
              <TableCell className="text-gray-500 text-xs">
                {formatDate(client.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
