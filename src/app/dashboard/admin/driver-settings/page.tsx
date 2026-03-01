import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSmenaRidicOrderBy } from '@/lib/driver-attendance'
import DriverSettingsClient from './DriverSettingsClient'
import type { DriverLogRow } from './types'

const ALLOWED_PAGE_SIZES = [10, 25, 50] as const
const DEFAULT_PAGE_SIZE = 10

function parsePageSize(raw: string | undefined): number {
  const n = parseInt(raw ?? '', 10)
  return ALLOWED_PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE
}

export default async function DriverSettingsPage({
  searchParams,
}: {
  searchParams: {
    page?: string
    search?: string
    q?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }
}) {
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const pageSize = parsePageSize(searchParams?.pageSize)
  const search = (searchParams?.search ?? searchParams?.q ?? '').trim().slice(0, 100)
  const sortBy = searchParams?.sortBy ?? 'date'
  const sortOrder = (searchParams?.sortOrder ?? 'desc') as 'asc' | 'desc'
  const skip = (page - 1) * pageSize

  let whereSmena: Prisma.SmenaRidicWhereInput = {}

  if (search) {
    const uzivatele = await prisma.uzivatel.findMany({
      where: {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { jmeno: { contains: search, mode: 'insensitive' as const } },
        ],
      },
      select: { email: true },
    })
    const foundEmails = uzivatele.map((u) => u.email)
    whereSmena = foundEmails.length > 0
      ? { ridicEmail: { in: foundEmails } }
      : { id: { lt: 0 } }
  }

  const orderBy = getSmenaRidicOrderBy(searchParams?.sortBy, searchParams?.sortOrder)

  const [shifts, totalCount] = await Promise.all([
    prisma.smenaRidic.findMany({
      where: whereSmena,
      orderBy,
      take: pageSize,
      skip,
    }),
    prisma.smenaRidic.count({ where: whereSmena }),
  ])

  const emails = [...new Set(shifts.map((s) => s.ridicEmail))]
  const uzivatele = await prisma.uzivatel.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, jmeno: true },
  })
  const emailToUzivatel = new Map(uzivatele.map((u) => [u.email, u]))

  const rows: DriverLogRow[] = shifts.map((s) => {
    const u = emailToUzivatel.get(s.ridicEmail)
    const clockOut = s.casOdjezdu ?? s.casNavratu ?? null
    return {
      id: s.id,
      driverName: u?.jmeno ?? s.ridicEmail,
      email: s.ridicEmail,
      clockIn: s.casPrichodu.toISOString(),
      clockOut: clockOut ? clockOut.toISOString() : null,
      status: clockOut ? 'finished' : 'active',
      cisloTrasy: s.cisloTrasy ?? null,
      uzivatelId: u ? String(u.id) : null,
    }
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  if (page > totalPages && totalPages > 0) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(totalPages))
    params.set('pageSize', String(pageSize))
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)
    redirect(`/dashboard/admin/driver-settings?${params.toString()}`)
  }

  return (
    <div className="container py-10">
      <div className="text-sm text-muted-foreground mb-4">
        Dashboard / Admin / Správa přístupů a docházka
      </div>
      <h1 className="text-3xl font-bold mb-6">Správa přístupů a docházka</h1>
      <DriverSettingsClient
        rows={rows}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        currentSearch={search}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
