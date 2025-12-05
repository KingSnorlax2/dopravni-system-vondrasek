import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const opravaSchema = z.object({
  datum: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val
    return new Date(val)
  }),
  popis: z.string().min(1, "Popis je povinný").max(500, "Popis je příliš dlouhý"),
  kategorie: z.string().min(1, "Kategorie je povinná"),
  najezd: z.number().int().min(0, "Nájezd nemůže být záporný"),
  poznamka: z.string().optional().nullable(),
  cena: z.number().min(0, "Cena nemůže být záporná").optional().nullable(),
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
      orderBy: { datum: 'desc' },
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
    
    // Validate input
    const validationResult = opravaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Neplatná data',
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

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
        kategorie: validatedData.kategorie,
        popis: validatedData.popis,
        datum: validatedData.datum,
        najezd: validatedData.najezd,
        poznamka: validatedData.poznamka || null,
        cena: validatedData.cena || null,
      }
    });

    // Side effect: Update car mileage if new mileage is greater
    if (validatedData.najezd > car.najezd) {
      await prisma.auto.update({
        where: { id: autoId },
        data: { najezd: validatedData.najezd },
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