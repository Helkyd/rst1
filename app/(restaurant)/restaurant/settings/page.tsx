import { fetcher } from '@/lib/api/api_server_backend'
import { requireRestaurant } from '@/lib/session'
import WorkingHoursEditor from '@/components/restaurants/WorkingHoursEditor'
import { mergeWithDefaults } from '@/lib/working-hours'

export default async function RestaurantSettingsPage() {
  const session = await requireRestaurant()
  const restaurantId = session.user.restaurantId!

  try {
    const restaurant = await fetcher<any>(`/api/restaurants/${restaurantId}`)
    
    if (!restaurant) {
      return (
        <p className="text-gray-400">Restaurante não encontrado.</p>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            O meu restaurante
          </h1>
          <p className="text-gray-400 mt-1">
            {restaurant.name} — horário e informações
          </p>
        </div>

        <WorkingHoursEditor
          restaurantId={restaurant.id}
          initialHours={mergeWithDefaults(restaurant.workingHours)}
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return (
      <p className="text-gray-400">Erro ao carregar restaurante.</p>
    )
  }
}
