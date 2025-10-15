import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
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


