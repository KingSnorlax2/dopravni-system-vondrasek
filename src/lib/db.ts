import { PrismaClient } from '@prisma/client'

// Create global prisma instance to prevent multiple instances during hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db 