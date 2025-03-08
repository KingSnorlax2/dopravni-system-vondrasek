import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all vehicles
    const allVehicles = await prisma.auto.findMany({
      include: {
        opravy: true,
        udrzby: true
      }
    })

    // Get all maintenance records
    const allMaintenance = await prisma.udrzba.findMany({
      where: { provedeno: true },
      include: { auto: true },
      orderBy: { datumProvedeni: 'desc' }
    })

    // Calculate fleet status
    const activeVehicles = allVehicles.filter(v => v.stav === 'aktivní').length
    const inServiceVehicles = allVehicles.filter(v => v.stav === 'servis').length
    const retiredVehicles = allVehicles.filter(v => v.stav === 'vyřazeno').length

    // Calculate average mileage
    const totalMileage = allVehicles.reduce((sum, vehicle) => sum + vehicle.najezd, 0)
    const averageMileage = allVehicles.length > 0 
      ? Math.round(totalMileage / allVehicles.length) 
      : 0

    // Calculate fleet age distribution
    const currentYear = new Date().getFullYear()
    const fleetAgeDistribution = {
      newer: allVehicles.filter(v => currentYear - v.rokVyroby <= 3).length,
      medium: allVehicles.filter(v => currentYear - v.rokVyroby > 3 && currentYear - v.rokVyroby <= 7).length,
      older: allVehicles.filter(v => currentYear - v.rokVyroby > 7).length
    }

    // Calculate maintenance costs
    const totalMaintenanceCost = allMaintenance.reduce((sum, record) => sum + record.nakladyCelkem, 0)

    // Format data for front-end
    const vehiclesWithStk = allVehicles
      .filter(v => v.datumSTK && v.stav === 'aktivní')
      .map(v => ({
        id: v.id,
        spz: v.spz,
        znacka: v.znacka,
        model: v.model,
        datumSTK: v.datumSTK
      }))
      .sort((a, b) => {
        // Handle potential null values safely
        const dateA = a.datumSTK ? new Date(a.datumSTK).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.datumSTK ? new Date(b.datumSTK).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      })

    const recentMaintenance = allMaintenance
      .slice(0, 5)
      .map(record => ({
        id: record.id,
        type: record.typ,
        spz: record.auto.spz,
        cost: record.nakladyCelkem,
        date: record.datumProvedeni
      }))

    return NextResponse.json({
      totalVehicles: allVehicles.length,
      activeVehicles,
      inServiceVehicles,
      retiredVehicles,
      vehiclesWithStk,
      recentMaintenance,
      totalMaintenanceCost,
      averageMileage,
      fleetAgeDistribution
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 