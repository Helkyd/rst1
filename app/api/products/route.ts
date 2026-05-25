import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetcher } from '@/lib/api/api_server_backend'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    
    let url = '/api/products'
    if (restaurantId) {
      url += `?restaurantId=${restaurantId}`
    }
    
    const products = await fetcher<any[]>(url)
    
    // Add restaurant name to each product for compatibility
    const productsWithRestaurant = await Promise.all(
      products.map(async (product) => {
        if (product.restaurantId) {
          try {
            const restaurant = await fetcher<any>(`/api/restaurants/${product.restaurantId}`)
            return {
              ...product,
              restaurant: { name: restaurant.name || 'Unknown' }
            }
          } catch (error) {
            console.error(`Error fetching restaurant for product ${product.id}:`, error)
            return {
              ...product,
              restaurant: { name: 'Unknown' }
            }
          }
        }
        return {
          ...product,
          restaurant: { name: null }
        }
      })
    )
    
    return NextResponse.json(productsWithRestaurant)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    let { name, price, restaurantId, taxPercentage, description, image1, image2, image3, image4 } = body

    if (session.user.role === 'RESTAURANT') {
      if (!session.user.restaurantId) {
        return NextResponse.json({ error: 'Sem restaurante' }, { status: 403 })
      }
      restaurantId = session.user.restaurantId
    }

    if (!name?.trim() || !restaurantId) {
      return NextResponse.json(
        { error: 'Nome e restaurante são obrigatórios' },
        { status: 400 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Preço inválido' },
        { status: 400 }
      )
    }

    // Map tax percentage to valid values
    const validTaxRates = ['VAT_6', 'VAT_13', 'VAT_23'];
    const tax = taxPercentage && validTaxRates.includes(taxPercentage) ? taxPercentage : 'VAT_23';

    const productData = {
      name: name.trim(),
      price,
      restaurantId,
      taxPercentage: tax,
      description: description?.trim() || null,
      image1: image1 || null,
      image2: image2 || null,
      image3: image3 || null,
      image4: image4 || null,
    }

    const product = await fetcher<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
