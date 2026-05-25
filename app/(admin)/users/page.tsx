import { fetcher } from '@/lib/api/api_server_backend'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { formatDate } from '@/lib/utils'

export default async function UsersPage() {
  try {
    // Fetch all users with role CLIENT
    const users = await fetcher<any[]>(`/api/users?role=CLIENT`)
    
    // For each user, fetch their order count
    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        try {
          const orders = await fetcher<any[]>(`/api/orders/user/${user.id}`)
          return { ...user, orderCount: orders.length }
        } catch (error) {
          console.error(`Error fetching orders for user ${user.id}:`, error)
          return { ...user, orderCount: 0 }
        }
      })
    )

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Clientes
          </h1>
          <p className="text-gray-400 mt-1">{usersWithOrderCounts.length} clientes registados</p>
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
            {usersWithOrderCounts.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-white">
                  {user.name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.telephone}</TableCell>
                <TableCell>{user.orderCount}</TableCell>
                <TableCell className="text-gray-500 text-xs">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  } catch (error) {
    console.error('Error fetching users:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Clientes
          </h1>
          <p className="text-gray-400 mt-1">Erro ao carregar clientes</p>
        </div>
      </div>
    )
  }
}
