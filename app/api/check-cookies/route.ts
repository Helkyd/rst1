// app/api/check-cookies/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  
  return NextResponse.json({
    cookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
    cookieNames: allCookies.map(c => c.name),
  })
}