// lib/prisma.ts
import { PrismaClient } from '@prisma/client/extension' // Note the /extension
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add error handling for missing DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database features will not work.')
}