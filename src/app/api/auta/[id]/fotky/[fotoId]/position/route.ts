import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/auta/[id]/fotky/[fotoId]/position - Update photo position
export async function PUT(
  request: Request,
  { params }: { params: { id: string, fotoId: string } }
) {
  try {
    const autoId = parseInt(params.id);
    const fotoId = params.fotoId;
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    // Get position data from request body
    const data = await request.json();
    const { positionX, positionY, scale } = data;
    
    // Validate position data
    if (typeof positionX !== 'number' || typeof positionY !== 'number' || typeof scale !== 'number') {
      return NextResponse.json(
        { error: 'Invalid position data. positionX, positionY, and scale must be numbers.' },
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

    // Check if the photo exists and belongs to the car
    const photo = await prisma.fotka.findFirst({
      where: {
        id: fotoId,
        autoId
      }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found or does not belong to this car' },
        { status: 404 }
      );
    }

    // Update the photo's position data using raw SQL to bypass Prisma type checking
    await prisma.$executeRaw`
      UPDATE "Fotka" 
      SET "positionX" = ${positionX}, "positionY" = ${positionY}, "scale" = ${scale} 
      WHERE "id" = ${fotoId}
    `;

    // Fetch the updated photo for response (optional)
    // const photo = await prisma.fotka.findUnique({
    //   where: { id: fotoId }
    // });

    return NextResponse.json({ 
      message: 'Photo position updated successfully',
      photo: {
        id: fotoId,
        positionX,
        positionY,
        scale
      }
    });
    
  } catch (error) {
    console.error('Error updating photo position:', error);
    return NextResponse.json(
      { error: 'Failed to update photo position' },
      { status: 500 }
    );
  }
} 