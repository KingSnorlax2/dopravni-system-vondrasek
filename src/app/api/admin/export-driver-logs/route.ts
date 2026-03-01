import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSmenaRidicOrderBy } from '@/lib/driver-attendance'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Nemáte oprávnění k této akci' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const search = (searchParams.get('search') ?? '').trim().slice(0, 100)
  const sortBy = searchParams.get('sortBy') ?? 'date'
  const sortOrder = searchParams.get('sortOrder') ?? 'desc'

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

  const orderBy = getSmenaRidicOrderBy(sortBy, sortOrder)

  const shifts = await prisma.smenaRidic.findMany({
    where: whereSmena,
    orderBy,
  })

  const emails = [...new Set(shifts.map((s) => s.ridicEmail))]
  const uzivatele = await prisma.uzivatel.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, jmeno: true },
  })
  const emailToUzivatel = new Map(uzivatele.map((u) => [u.email, u]))

  const PRAGUE_TIMEZONE = 'Europe/Prague'
  const CS_LOCALE = 'cs-CZ'
  const dateFmt = new Intl.DateTimeFormat(CS_LOCALE, {
    timeZone: PRAGUE_TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
  const dateTimeFmt = new Intl.DateTimeFormat(CS_LOCALE, {
    timeZone: PRAGUE_TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const escapeCsv = (val: string) => {
    const s = String(val ?? '')
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = [
    'Jméno',
    'Email',
    'Datum',
    'Příchod',
    'Odjezd',
    'Trasa',
    'Stav',
  ].map(escapeCsv).join(',')

  const rows = shifts.map((s) => {
    const u = emailToUzivatel.get(s.ridicEmail)
    const clockOut = s.casOdjezdu ?? s.casNavratu ?? null
    const status = clockOut ? 'Ukončeno' : 'Aktivní'
    return [
      escapeCsv(u?.jmeno ?? s.ridicEmail),
      escapeCsv(s.ridicEmail),
      escapeCsv(dateFmt.format(s.casPrichodu)),
      escapeCsv(dateTimeFmt.format(s.casPrichodu)),
      clockOut ? escapeCsv(dateTimeFmt.format(clockOut)) : '',
      escapeCsv(s.cisloTrasy ?? ''),
      escapeCsv(status),
    ].join(',')
  })

  const csv = '\uFEFF' + header + '\n' + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dochazka_ridicu.csv"',
    },
  })
}
