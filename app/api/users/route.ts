import { fetcher } from '@/lib/api/api_server_backend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchParams.toString()
    let url = '/api/users'
    if (params) {
      url += `?${params}`
    }

    const users = await fetcher<any[]>(url)
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
