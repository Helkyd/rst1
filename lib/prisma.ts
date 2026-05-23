// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient as PrismaClientOriginal } from '@prisma/client/extension'

export { PrismaClientOriginal as PrismaClient }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientOriginal | undefined
}

function createPrismaClient() {
  // During build time, return a dummy client or skip connection
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Skipping database connection during build')
    // Return a dummy proxy that throws helpful errors
    return new Proxy({} as PrismaClientOriginal, {
      get: (_, prop) => {
        throw new Error(`Cannot use prisma.${String(prop)} during build. Make sure to mark your page as dynamic with 'export const dynamic = "force-dynamic"'`)
      }
    }) as PrismaClientOriginal
  }

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

export type { PrismaClientOriginal as PrismaClientType }

// Only connect in production runtime, not during build
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  prisma.$connect()
    .then(() => console.log('Database connected successfully'))
    .catch((error: any) => console.error('Database connection failed:', error))
}