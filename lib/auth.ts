// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { validateUserCredentials } from '@/lib/validate-user'
import type { Role } from '@/types/next-auth'

// IMPORTANT: Use your actual backend URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://aodelivery-api.angolaerp.co.ao'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] Missing credentials');
            return null;
          }

          console.log('[NextAuth] Validating credentials for:', credentials.email);
          
          // First, validate credentials locally (optional - you could skip this and just call the backend)
          const result = await validateUserCredentials(
            credentials.email,
            credentials.password
          );

          if (!result.ok) {
            console.log('[NextAuth] Validation failed:', result.reason);
            return null;
          }

          console.log('[NextAuth] Validation successful for:', result.user.email);
          
          // Call YOUR BACKEND API to get a token
          console.log('[NextAuth] Calling backend API for token:', `${BACKEND_API_URL}/api/auth/login`);
          
          const loginResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('[NextAuth] Backend response status:', loginResponse.status);
          
          if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.error('[NextAuth] Backend login failed:', loginResponse.status, errorText);
            return null;
          }

          const loginData = await loginResponse.json();
          console.log('[NextAuth] Backend response data:', { 
            hasLoginToken: !!loginData.loginToken,
            hasToken: !!loginData.token,
            role: loginData.role 
          });
          
          // Your backend might return either 'loginToken' or 'token'
          const backendToken = loginData.loginToken || loginData.token;
          
          if (!backendToken) {
            console.error('[NextAuth] No token returned from backend. Response keys:', Object.keys(loginData));
            return null;
          }

          console.log('[NextAuth] Successfully got token from backend API');
          
          // Return user with the BACKEND'S token
          const userWithToken = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            restaurantId: result.user.restaurantId,
            restaurantName: result.user.restaurantName ?? null,
            accessToken: backendToken,
          };
          
          console.log('[NextAuth] Returning user with backend token');
          
          return userWithToken;
        } catch (error) {
          console.error('[NextAuth] Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
        token.restaurantName = user.restaurantName;
        token.accessToken = user.accessToken;
        console.log('[JWT Callback] Added backend token to JWT');
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.restaurantId = token.restaurantId as string;
        session.user.restaurantName = token.restaurantName as string;
        session.user.accessToken = token.accessToken as string;
        console.log('[Session Callback] Added backend token to session');
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}