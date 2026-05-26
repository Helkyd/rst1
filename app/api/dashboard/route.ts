// app/api/admin/dashboard/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[API] Session exists:', !!session)
    console.log('[API] Session user exists:', !!session?.user)
    console.log('[API] Access token exists:', !!session?.user?.accessToken)
    
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }
    
    // Use BACKEND_API_URL for external API calls
    const backendUrl = process.env.BACKEND_API_URL || 'https://aodelivery-api.angolaerp.co.ao'
    const response = await fetch(`${backendUrl}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}