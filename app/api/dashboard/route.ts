import { fetcher } from '@/lib/api/api_server_backend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const dashboardData = await fetcher<any>('/api/dashboard')
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 })
  }
}
