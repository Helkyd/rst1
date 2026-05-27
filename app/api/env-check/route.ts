// app/api/env-check/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // Only show non-sensitive env vars
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL_INTERNAL,
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    HAS_JWT_SECRET: !!process.env.JWT_SECRET,
  }
  
  return NextResponse.json(env)
}