// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE CALLED ===");
        
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          const backendUrl = 'http://localhost:3000/api/auth/login';
          const res = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });
          
          const data = await res.json();
          
          if (res.ok && data && data.user && data.access_token) {
            // Ensure the role matches the Role type
            const validRoles = ['ADMIN', 'RESTAURANT', 'CLIENT', 'DRIVER'];
            const userRole = validRoles.includes(data.user.role) ? data.user.role : 'CLIENT';
            
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: userRole,  // Now this matches the Role type
              accessToken: data.access_token,
              restaurantId: data.user.restaurantId || null,
              restaurantName: data.user.restaurantName || null,
            };
          }
          
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      console.log("[JWT] Callback - user present:", !!user);
      
      if (user) {
        token.id = user.id;
        token.role = user.role as any; // Type assertion for Role
        token.accessToken = user.accessToken;
        token.restaurantId = user.restaurantId;
        token.restaurantName = user.restaurantName;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      console.log("[SESSION] Callback - token present:", !!token);
      
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
        session.user.restaurantId = token.restaurantId;
        session.user.restaurantName = token.restaurantName;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };