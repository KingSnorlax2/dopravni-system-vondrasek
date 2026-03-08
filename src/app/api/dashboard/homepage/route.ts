import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSTKWarningDays } from '@/features/settings/queries'

// Match AutoTable getSTKStatus exactly: "upcoming" = STK in [today, today + warningDays], exclude expired
function isSTKUpcoming(datumSTK: Date, warningDays: number): boolean {
  const today = new Date()
  const cutoffDate = new Date(today.getTime() + warningDays * 24 * 60 * 60 * 1000)
  const stkDateOnly = new Date(datumSTK.getFullYear(), datumSTK.getMonth(), datumSTK.getDate())
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const cutoffDateOnly = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), cutoffDate.getDate())
  return stkDateOnly >= todayDateOnly && stkDateOnly <= cutoffDateOnly
}

export async function GET() {
  try {
    const now = new Date()
    const stkWarningDays = await getSTKWarningDays()

    // Get all vehicles (aktivni: true to match auta page; includes aktivní, servis, vyřazeno)
    const allVehicles = await prisma.auto.findMany({
      where: { aktivni: true },
      include: {
        opravy: true,
        udrzby: true,
      },
    })

    // Get all maintenance records
    const allMaintenance = await prisma.udrzba.findMany({
      where: { status: 'COMPLETED' },
      include: { auto: true },
      orderBy: { datumUdrzby: 'desc' },
    })

    // Get recent repairs
    const recentRepairs = await prisma.oprava.findMany({
      include: {
        auto: { select: { id: true, spz: true, znacka: true, model: true } },
      },
      orderBy: { datum: 'desc' },
      take: 5,
    })

    // Get recent transactions with summary
    const [recentTransactions, transactionStats] = await Promise.all([
      prisma.transakce.findMany({
        select: {
          id: true,
          nazev: true,
          castka: true,
          datum: true,
          typ: true,
          status: true,
          auto: { select: { spz: true } },
        },
        orderBy: { datum: 'desc' },
        take: 5,
      }),
      prisma.transakce.aggregate({
        where: { status: 'APPROVED' },
        _sum: { castka: true },
        _count: true,
      }),
    ])

    const pendingTransactionsCount = await prisma.transakce.count({
      where: { status: 'PENDING' },
    })

    // Get users count
    const totalUsers = await prisma.uzivatel.count()

    // Fleet stats
    const activeVehicles = allVehicles.filter((v) => v.stav === 'aktivní').length
    const inServiceVehicles = allVehicles.filter((v) => v.stav === 'servis').length
    const retiredVehicles = allVehicles.filter((v) => v.stav === 'vyřazeno').length
    const totalMileage = allVehicles.reduce((sum, v) => sum + v.najezd, 0)
    const averageMileage =
      allVehicles.length > 0 ? Math.round(totalMileage / allVehicles.length) : 0
    const currentYear = now.getFullYear()
    const fleetAgeDistribution = {
      newer: allVehicles.filter((v) => currentYear - v.rokVyroby <= 3).length,
      medium: allVehicles.filter(
        (v) =>
          currentYear - v.rokVyroby > 3 && currentYear - v.rokVyroby <= 7
      ).length,
      older: allVehicles.filter((v) => currentYear - v.rokVyroby > 7).length,
    }

    const totalMaintenanceCost = allMaintenance.reduce((sum, r) => sum + r.cena, 0)

    const vehiclesWithStk = allVehicles
      .filter((v) => v.datumSTK)
      .map((v) => ({
        id: v.id,
        spz: v.spz,
        znacka: v.znacka,
        model: v.model,
        datumSTK: v.datumSTK,
      }))
      .sort((a, b) => {
        const dateA = a.datumSTK
          ? new Date(a.datumSTK).getTime()
          : Number.MAX_SAFE_INTEGER
        const dateB = b.datumSTK
          ? new Date(b.datumSTK).getTime()
          : Number.MAX_SAFE_INTEGER
        return dateA - dateB
      })

    const urgentStkCount = vehiclesWithStk.filter((v) =>
      isSTKUpcoming(new Date(v.datumSTK!), stkWarningDays)
    ).length

    const recentMaintenance = allMaintenance.slice(0, 5).map((record) => ({
      id: record.id,
      type: record.typUdrzby,
      spz: record.auto.spz,
      cost: record.cena,
      date: record.datumUdrzby,
    }))

    return NextResponse.json({
      fleet: {
        totalVehicles: allVehicles.length,
        activeVehicles,
        inServiceVehicles,
        retiredVehicles,
        averageMileage,
        fleetAgeDistribution,
        totalMaintenanceCost,
        vehiclesWithStk,
        urgentStkCount,
        stkWarningDays,
        recentMaintenance,
      },
      transactions: {
        recent: recentTransactions.map((t) => ({
          id: t.id,
          nazev: t.nazev,
          castka: t.castka,
          datum: t.datum,
          typ: t.typ,
          status: t.status,
          spz: t.auto?.spz,
        })),
        totalApprovedSum: transactionStats._sum.castka ?? 0,
        totalApprovedCount: transactionStats._count,
        pendingCount: pendingTransactionsCount,
      },
      repairs: {
        recent: recentRepairs.map((r) => ({
          id: r.id,
          kategorie: r.kategorie,
          popis: r.popis,
          datum: r.datum,
          cena: r.cena,
          spz: r.auto.spz,
          znacka: r.auto.znacka,
          model: r.auto.model,
        })),
      },
      totalUsers,
    })
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    )
  }
}
