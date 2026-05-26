// middleware.ts (at root level, NOT in app folder)
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    console.log('[Middleware] Path:', path)
    console.log('[Middleware] Token exists:', !!token)
    console.log('[Middleware] Token role:', token?.role)
    
    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(loginUrl)
    }
    
    // Role-based authorization
    if (path.startsWith('/admin') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    if (path.startsWith('/restaurant') && token.role !== 'RESTAURANT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true if token exists (user is authenticated)
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/restaurant/:path*',
    '/api/admin/:path*',
    '/api/restaurant/:path*',
    // Exclude auth API routes and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ]
}