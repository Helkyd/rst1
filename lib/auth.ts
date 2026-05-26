// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Role } from '@/types/next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE START ===");
        console.log("Email:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }
        
        try {
          const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });
          
          const data = await res.json();
          console.log("Response status:", res.status);
          console.log("Has access_token:", !!data.access_token);
          console.log("Has user:", !!data.user);
          
          if (res.ok && data && data.user && data.access_token) {
            const user = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              accessToken: data.access_token,
            };
            
            console.log("✅ Returning user with token, token length:", user.accessToken.length);
            console.log("User role:", user.role);
            return user;
          }
          
          console.log("❌ Authorization failed - missing data");
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Has user object:", !!user);
      console.log("Current token before update:", {
        hasAccessToken: !!token.accessToken,
        hasId: !!token.id
      });
      
      if (user) {
        console.log("Adding user data to token");
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.name = user.name;
        token.email = user.email;
        console.log("Token after update:", {
          hasAccessToken: !!token.accessToken,
          hasId: !!token.id,
          role: token.role
        });
      }
      
      console.log("=== JWT END ===");
      return token;
    },
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Session before:", {
        hasUser: !!session.user,
        userKeys: session.user ? Object.keys(session.user) : []
      });
      console.log("Token data:", {
        hasAccessToken: !!token.accessToken,
        hasId: !!token.id,
        role: token.role
      });
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.accessToken = token.accessToken as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      
      console.log("Session after:", {
        hasAccessToken: !!session.user?.accessToken,
        hasId: !!session.user?.id,
        role: session.user?.role
      });
      console.log("=== SESSION END ===");
      return session;
    }
  }
};