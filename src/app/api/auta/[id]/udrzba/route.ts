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
        datumUdrzby: 'desc'
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
    // Support both old field names (datumProvedeni) and new field names (datumUdrzby)
    const { 
      typ, 
      typUdrzby,
      popis, 
      datumProvedeni, 
      datumUdrzby,
      cena,
      nakladyCelkem,
      stav,
      servis,
      poznamka 
    } = body

    // Map old field names to new schema field names
    const finalTypUdrzby = typUdrzby || typ
    const finalDatumUdrzby = datumUdrzby || datumProvedeni
    const finalCena = cena !== undefined ? parseFloat(cena.toString()) : (nakladyCelkem !== undefined ? parseFloat(nakladyCelkem.toString()) : undefined)

    // Validate required fields
    if (!finalTypUdrzby || !popis || !finalDatumUdrzby || finalCena === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: typUdrzby, popis, datumUdrzby, and cena are required' },
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
        typUdrzby: finalTypUdrzby,
        popis,
        datumUdrzby: new Date(finalDatumUdrzby),
        cena: finalCena,
        stav: stav || 'PLANNED',
        servis: servis || null,
        poznamka: poznamka || null
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
