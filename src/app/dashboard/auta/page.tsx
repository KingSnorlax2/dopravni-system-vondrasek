import { prisma } from '@/lib/prisma'
import { AutoPageClient } from '@/components/dashboard/AutoPageClient'
import { getSTKWarningDays } from '@/features/settings/queries'

/**
 * Server Component - Fetches vehicle data directly from database
 * No client-side fetching needed
 */
export default async function AutoPage() {
  const [auta, stkWarningDays] = await Promise.all([
    prisma.auto.findMany({
      where: { aktivni: true },
      orderBy: { id: 'desc' },
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
        thumbnailFotoId: true,
        thumbnailUrl: true,
      },
    }),
    getSTKWarningDays(),
  ])

  const serializedVehicles = auta.map(auto => ({
    ...auto,
    datumSTK: auto.datumSTK?.toISOString() || null,
    createdAt: auto.createdAt.toISOString(),
    updatedAt: auto.updatedAt.toISOString(),
  }))

  return (
    <AutoPageClient
      initialVehicles={serializedVehicles}
      stkWarningDays={stkWarningDays}
    />
  )
}