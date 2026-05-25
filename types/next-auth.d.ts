// Define Role type since we removed Prisma
export type Role = 'ADMIN' | 'RESTAURANT' | 'CLIENT' | 'DRIVER'

import 'next-auth'
import 'next-auth/jwt'

import { DefaultSession } from "next-auth";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
      restaurantId: string | null
      restaurantName: string | null
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role
    restaurantId: string | null
    restaurantName: string | null
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    restaurantId: string | null
    restaurantName: string | null
    accessToken: string;
  }
}
