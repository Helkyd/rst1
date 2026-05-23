// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient as PrismaClientOriginal } from '@prisma/client/extension'

// Re-export for type compatibility
export { PrismaClientOriginal as PrismaClient }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientOriginal | undefined
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 300_000,
    })
    return new PrismaClientOriginal({ adapter })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Type export for better TypeScript support
export type { PrismaClientOriginal as PrismaClientType }

// Optional: Add connection test
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => console.log('Database connected successfully'))
    .catch((error: any) => console.error('Database connection failed:', error))
}