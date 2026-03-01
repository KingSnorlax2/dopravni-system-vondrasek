import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/driver-login/logs
 * Returns driver route login stats and recent entries.
 * DEPRECATED: Prefer server-side data on /dashboard/admin/driver-settings.
 * Secured: ADMIN role required.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Nemáte oprávnění k této akci' },
      { status: 403 }
    )
  }

  try {
    const [recent, totalCount, todayCount, last7DaysCount] = await Promise.all([
      prisma.driverRouteLogin.findMany({
        orderBy: { casPrihlaseni: 'desc' },
        take: 50
      }),
      prisma.driverRouteLogin.count(),
      prisma.driverRouteLogin.count({
        where: { casPrihlaseni: { gte: new Date(new Date().setHours(0,0,0,0)) } }
      }),
      prisma.driverRouteLogin.count({
        where: { casPrihlaseni: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      })
    ])

    return NextResponse.json({
      stats: {
        totalCount,
        todayCount,
        last7DaysCount
      },
      recent
    })
  } catch (err) {
    console.error('GET /api/driver-login/logs error:', err)
    return NextResponse.json({ error: 'Nepodařilo se načíst přihlášení řidičů.' }, { status: 500 })
  }
}
