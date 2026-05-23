// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

async function createPrismaClient() {
  const { PrismaClient } = await import('@prisma/client/extension')
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? await createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database features will not work.')
}