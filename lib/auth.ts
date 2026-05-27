// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { validateUserCredentials } from '@/lib/validate-user'
import type { Role } from '@/types/next-auth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
      }
    },
    callbackUrl: {
      name: `next-auth.callback_url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
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
            return null;
          }

          console.log('[NextAuth] Calling backend for:', credentials.email);
          
          const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.loginToken) {
            console.log('[NextAuth] Backend login failed');
            return null;
          }

          // You might need to fetch user details separately if not returned
          return {
            id: data.userId || data.user?.id,
            name: data.user?.name || 'User',
            email: credentials.email,
            role: data.role || 'USER',
            accessToken: data.loginToken,
          };
        } catch (error) {
          console.error('[NextAuth] Error:', error);
          return null;
        }
      },

    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[JWT Callback] Before update:', { 
        hasToken: !!token.accessToken, 
        hasUser: !!user,
        userId: token.id
      });
      
      // When user signs in, add their data to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
        token.restaurantName = user.restaurantName;
        token.accessToken = user.accessToken; // This is now the backend's token
        console.log('[JWT Callback] Added to JWT:', { 
          id: token.id, 
          role: token.role,
          hasAccessToken: !!token.accessToken,
          accessTokenPreview: token.accessToken ? token.accessToken.substring(0, 30) + '...' : 'none'
        });
      } else {
        console.log('[JWT Callback] No user object, keeping existing token');
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('[Session Callback] Before update:', {
        hasSessionUser: !!session.user,
        hasTokenAccessToken: !!token.accessToken,
        tokenKeys: Object.keys(token)
      });
      
      // Add token data to session
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.restaurantId = token.restaurantId as string;
        session.user.restaurantName = token.restaurantName as string;
        session.user.accessToken = token.accessToken as string; // This is the backend's token
        
        console.log('[Session Callback] After update:', {
          id: session.user.id,
          role: session.user.role,
          hasAccessToken: !!session.user.accessToken,
          accessTokenPreview: session.user.accessToken ? session.user.accessToken.substring(0, 30) + '...' : 'none'
        });
      } else {
        console.log('[Session Callback] Missing session.user or token');
      }
      
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}