import { PrismaClient } from '@prisma/client'

// Create global prisma instance to prevent multiple instances during hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Prisma Client with connection pool configuration
export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Gracefully disconnect on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
} 