// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { Role } from '@/types/next-auth'

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing credentials');
          return null;
        }

        // Use BACKEND_API_URL for server-side API calls
        const API_BASE_URL = process.env.BACKEND_API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        try {
          console.log('[Auth] Calling backend:', `${API_BASE_URL}/api/auth/login`);
          
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email.toLowerCase().trim(),
              password: credentials.password,
            }),
          });

          console.log('[Auth] Response status:', response.status);

          if (!response.ok) {
            console.error('[Auth] Backend returned', response.status);
            return null;
          }

          const data = await response.json();
          console.log('[Auth] Backend response received, has user:', !!data.user);
          console.log('[Auth] Has access_token:', !!data.access_token);

          if (!data.access_token || !data.user) {
            console.error('[Auth] Invalid response format');
            return null;
          }

          // Verify the user has admin or restaurant role
          if (data.user.role !== 'ADMIN' && data.user.role !== 'RESTAURANT') {
            console.error('[Auth] Invalid role:', data.user.role);
            return null;
          }

          console.log('[Auth] Login successful for:', data.user.email);
          
          // Return the user object for NextAuth
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as Role,
            accessToken: data.access_token,
            restaurantId: data.user.restaurantId || null,
            restaurantName: data.user.restaurantName || null,
          };
          
        } catch (error) {
          console.error('[Auth] Login error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[JWT Callback] - Has user:', !!user);
      
      if (user) {
        console.log('[JWT Callback] Setting token from user:', user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.restaurantId = user.restaurantId;
        token.restaurantName = user.restaurantName;
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('[Session Callback] - Token accessToken exists:', !!token.accessToken);
      
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as Role;
        session.user.accessToken = token.accessToken as string;
        session.user.restaurantId = token.restaurantId as string | null;
        session.user.restaurantName = token.restaurantName as string | null;
      }
      
      console.log('[Session Callback] Session has accessToken:', !!session.user?.accessToken);
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  // Configure cookies for production domain
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
  },
}