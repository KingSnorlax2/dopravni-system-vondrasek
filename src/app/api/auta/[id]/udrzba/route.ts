import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auta/[id]/udrzba - Fetch all maintenance records for a car
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id)
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      )
    }

    const udrzby = await prisma.udrzba.findMany({
      where: {
        autoId
      },
      orderBy: {
        datumProvedeni: 'desc'
      }
    })

    return NextResponse.json(udrzby)
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    )
  }
}

// POST /api/auta/[id]/udrzba - Create a new maintenance record
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id)
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      typ, 
      popis, 
      datumProvedeni, 
      datumPristi, 
      najezdKm, 
      nakladyCelkem, 
      provedeno, 
      dokumenty, 
      poznamka 
    } = body

    // Validate required fields
    if (!typ || !popis || !datumProvedeni || nakladyCelkem === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if the car exists
    const car = await prisma.auto.findUnique({
      where: { id: autoId }
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Create the maintenance record
    const udrzba = await prisma.udrzba.create({
      data: {
        autoId,
        typ,
        popis,
        datumProvedeni: new Date(datumProvedeni),
        datumPristi: datumPristi ? new Date(datumPristi) : null,
        najezdKm: najezdKm || car.najezd, // Use car's current mileage if not provided
        nakladyCelkem: parseFloat(nakladyCelkem.toString()),
        provedeno: provedeno ?? false,
        dokumenty,
        poznamka
      }
    })

    return NextResponse.json(udrzba, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}
