import { prisma } from '@/lib/prisma'
import { AutoPageClient } from '@/components/dashboard/AutoPageClient'

/**
 * Server Component - Fetches vehicle data directly from database
 * No client-side fetching needed
 */
export default async function AutoPage() {
  // Fetch vehicles directly from Prisma (Server Component)
  const auta = await prisma.auto.findMany({
    where: {
      aktivni: true
    },
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true,
      spz: true,
      znacka: true,
      model: true,
      rokVyroby: true,
      najezd: true,
      stav: true,
      poznamka: true,
      datumSTK: true,
      aktivni: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  // Serialize dates to strings for client component
  const serializedVehicles = auta.map(auto => ({
    ...auto,
    datumSTK: auto.datumSTK?.toISOString() || null,
    createdAt: auto.createdAt.toISOString(),
    updatedAt: auto.updatedAt.toISOString(),
  }))

  return <AutoPageClient initialVehicles={serializedVehicles} />
}