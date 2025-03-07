import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const opravaSchema = z.object({
  datumOpravy: z.string(),
  popis: z.string().min(1, "Popis je povinný").max(500, "Popis je příliš dlouhý"),
  cena: z.number().min(0, "Cena nemůže být záporná"),
  typOpravy: z.enum(["běžná", "servisní", "porucha"]),
  stav: z.enum(["plánovaná", "probíhá", "dokončená"]),
  servis: z.string().optional(),
  poznamka: z.string().optional(),
  najezdKm: z.number().optional(),
});

// GET /api/auta/[id]/opravy - Fetch all repair records for a car
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    const opravy = await prisma.oprava.findMany({
      where: { autoId },
      orderBy: { datumOpravy: 'desc' },
    });

    return NextResponse.json(opravy);
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repair records' },
      { status: 500 }
    );
  }
}

// POST /api/auta/[id]/opravy - Create a new repair record
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      datumOpravy, 
      popis, 
      cena, 
      typOpravy, 
      stav, 
      servis,
      poznamka
    } = body;

    // Validate required fields
    if (!datumOpravy || !popis || !typOpravy || !stav || cena === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the car exists
    const car = await prisma.auto.findUnique({
      where: { id: autoId }
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Create the repair record
    const oprava = await prisma.oprava.create({
      data: {
        autoId,
        datumOpravy: new Date(datumOpravy),
        popis,
        cena: parseFloat(cena.toString()),
        typOpravy,
        stav,
        servis,
        poznamka
      }
    });

    // Also update the car's mileage if a new value was provided
    if (body.najezdKm && body.najezdKm > car.najezd) {
      await prisma.auto.update({
        where: { id: autoId },
        data: { najezd: body.najezdKm }
      });
    }

    return NextResponse.json(oprava, { status: 201 });
  } catch (error) {
    console.error('Error creating repair:', error);
    return NextResponse.json(
      { error: 'Failed to create repair record' },
      { status: 500 }
    );
  }
} 