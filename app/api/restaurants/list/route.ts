import { fetcher } from '@/lib/api/api_server_backend'
import { NextResponse } from 'next/server'

/**
 * Restaurantes disponíveis para associar a uma nova conta RESTAURANTE no registo.
 * Lista restaurantes que ainda não têm um gestor (utilizador RESTAURANT) associado.
 *
 * Nota: todos os admins partilham a mesma base de dados (Supabase).
 * Um restaurante criado por qualquer admin aparece aqui até ter conta de gestor.
 */
export async function GET() {
  try {
    // Since we don't have a direct API endpoint for this specific query,
    // we'll fetch all restaurants and filter on the client side
    // This is a limitation of the API-only approach
    const restaurants = await fetcher<any[]>('/api/restaurants')
    
    // Filter restaurants that don't have staff with RESTAURANT role
    // Note: This assumes the API returns staff information
    // If not, we'd need to add a specific endpoint for this
    const filteredRestaurants = restaurants.filter(restaurant => 
      !restaurant.staff || !restaurant.staff.some((staff: any) => staff.role === 'RESTAURANT')
    )
    
    const result = filteredRestaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
    })).sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching restaurants list:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
