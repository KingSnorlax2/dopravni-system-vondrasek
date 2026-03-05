import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/prisma'
import {
  sendSTKWarningEmail,
  sendStatisticsEmail,
  sendTransactionsReportEmail,
  sendRepairsReportEmail,
  sendUsersReportEmail,
  sendDriverAttendanceReportEmail,
} from '@/lib/email'
import { getSTKWarningDays } from '@/features/settings/queries'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function parseEmails(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    const body = await req.json()
    const {
      to,
      type,
      vehicleIds,
      transactionIds,
      repairIds,
      userIds,
      shiftIds,
    } = body as {
      to?: string
      type?: string
      vehicleIds?: string[]
      transactionIds?: number[]
      repairIds?: number[]
      userIds?: number[]
      shiftIds?: number[]
    }

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'E-mailová adresa je povinná' },
        { status: 400 }
      )
    }

    const emails = parseEmails(to)
    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Zadejte alespoň jednu e-mailovou adresu' },
        { status: 400 }
      )
    }

    const invalid = emails.filter((e) => !isValidEmail(e))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Neplatné e-mailové adresy: ${invalid.join(', ')}` },
        { status: 400 }
      )
    }

    const toNormalized = emails.join(', ')

    if (type === 'selected-stk' && Array.isArray(vehicleIds) && vehicleIds.length > 0) {
      const ids = vehicleIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
      if (ids.length === 0) {
        return NextResponse.json({ error: 'Neplatná vozidla' }, { status: 400 })
      }

      const vehicles = await prisma.auto.findMany({
        where: { id: { in: ids } },
        select: { spz: true, znacka: true, model: true, datumSTK: true },
      })

      const stkVehicles = vehicles
        .filter((v) => v.datumSTK != null)
        .map((v) => ({
          spz: v.spz,
          znacka: v.znacka,
          model: v.model,
          datumSTK: v.datumSTK as Date,
        }))

      if (stkVehicles.length > 0) {
        await sendSTKWarningEmail(toNormalized, stkVehicles)
      }

      return NextResponse.json({
        success: true,
        count: stkVehicles.length,
        message:
          stkVehicles.length > 0
            ? `Report STK pro ${stkVehicles.length} vozidel odeslán na ${toNormalized}`
            : `Vybraná vozidla nemají datum STK (e-mail neodeslán)`,
      })
    }

    if (type === 'stk') {
      const warningDays = await getSTKWarningDays()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + warningDays)
      const today = new Date()

      const expiringVehicles = await prisma.auto.findMany({
        where: {
          datumSTK: { gte: today, lte: cutoffDate },
          AND: { NOT: { stav: 'vyřazeno' } },
        },
        orderBy: { datumSTK: 'asc' },
      })

      if (expiringVehicles.length > 0) {
        await sendSTKWarningEmail(
          toNormalized,
          expiringVehicles.map((v) => ({
            spz: v.spz,
            znacka: v.znacka,
            model: v.model,
            datumSTK: v.datumSTK!,
          }))
        )
      }

      return NextResponse.json({
        success: true,
        count: expiringVehicles.length,
        message:
          expiringVehicles.length > 0
            ? `Report STK odeslán na ${toNormalized}`
            : `Žádná vozidla s blížícím se STK (e-mail neodeslán)`,
      })
    }

    if (type === 'statistics') {
      const [allVehicles, allMaintenance, warningDays] = await Promise.all([
        prisma.auto.findMany({
          include: { udrzby: true },
        }),
        prisma.udrzba.findMany({
          where: { status: 'COMPLETED' },
          include: { auto: true },
        }),
        getSTKWarningDays(),
      ])

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + warningDays)
      const today = new Date()

      const activeVehicles = allVehicles.filter((v) => v.stav === 'aktivní').length
      const inServiceVehicles = allVehicles.filter((v) => v.stav === 'servis').length
      const retiredVehicles = allVehicles.filter((v) => v.stav === 'vyřazeno').length
      const totalMileage = allVehicles.reduce((sum, v) => sum + v.najezd, 0)
      const averageMileage =
        allVehicles.length > 0 ? Math.round(totalMileage / allVehicles.length) : 0
      const totalMaintenanceCost = allMaintenance.reduce((sum, r) => sum + r.cena, 0)

      const currentYear = new Date().getFullYear()
      const fleetAgeDistribution = {
        newer: allVehicles.filter((v) => currentYear - v.rokVyroby <= 3).length,
        medium: allVehicles.filter(
          (v) => currentYear - v.rokVyroby > 3 && currentYear - v.rokVyroby <= 7
        ).length,
        older: allVehicles.filter((v) => currentYear - v.rokVyroby > 7).length,
      }

      const vehiclesWithStk = allVehicles
        .filter(
          (v) =>
            v.datumSTK &&
            v.stav === 'aktivní' &&
            v.datumSTK >= today &&
            v.datumSTK <= cutoffDate
        )
        .map((v) => ({
          spz: v.spz,
          znacka: v.znacka,
          model: v.model,
          datumSTK: v.datumSTK!,
        }))
        .sort((a, b) => a.datumSTK.getTime() - b.datumSTK.getTime())

      await sendStatisticsEmail(toNormalized, {
        totalVehicles: allVehicles.length,
        activeVehicles,
        inServiceVehicles,
        retiredVehicles,
        totalMaintenanceCost,
        averageMileage,
        fleetAgeDistribution,
        stkExpiringCount: vehiclesWithStk.length,
        vehiclesWithStk,
      })

      return NextResponse.json({
        success: true,
        message: `Report statistik odeslán na ${toNormalized}`,
      })
    }

    if (type === 'transactions') {
      const ids = Array.isArray(transactionIds) ? transactionIds.filter((n) => typeof n === 'number' && !isNaN(n)) : undefined
      await sendTransactionsReportEmail(toNormalized, ids?.length ? ids : undefined)
      return NextResponse.json({
        success: true,
        message: `Přehled transakcí odeslán na ${toNormalized}`,
      })
    }

    if (type === 'repairs') {
      const ids = Array.isArray(repairIds) ? repairIds.filter((n) => typeof n === 'number' && !isNaN(n)) : undefined
      await sendRepairsReportEmail(toNormalized, ids?.length ? ids : undefined)
      return NextResponse.json({
        success: true,
        message: `Přehled oprav odeslán na ${toNormalized}`,
      })
    }

    if (type === 'users') {
      const ids = Array.isArray(userIds) ? userIds.filter((n) => typeof n === 'number' && !isNaN(n)) : undefined
      await sendUsersReportEmail(toNormalized, ids?.length ? ids : undefined)
      return NextResponse.json({
        success: true,
        message: `Přehled uživatelů odeslán na ${toNormalized}`,
      })
    }

    if (type === 'driver-attendance') {
      const ids = Array.isArray(shiftIds) ? shiftIds.filter((n) => typeof n === 'number' && !isNaN(n)) : undefined
      await sendDriverAttendanceReportEmail(toNormalized, ids?.length ? ids : undefined)
      return NextResponse.json({
        success: true,
        message: `Přehled docházky řidičů odeslán na ${toNormalized}`,
      })
    }

    return NextResponse.json(
      { error: 'Neplatný typ reportu. Použijte "stk", "selected-stk", "statistics", "transactions", "repairs", "users" nebo "driver-attendance"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Chyba při odesílání reportu:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se odeslat report' },
      { status: 500 }
    )
  }
}
