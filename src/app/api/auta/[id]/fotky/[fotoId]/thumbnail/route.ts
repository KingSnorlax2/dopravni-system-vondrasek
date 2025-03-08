import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auta/[id]/fotky/[fotoId]/thumbnail - Set a photo as the car's thumbnail
export async function POST(
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

    // Update the car to set this photo as thumbnail using raw SQL
    await prisma.$executeRaw`
      UPDATE "Auto" 
      SET "thumbnailFotoId" = ${fotoId}
      WHERE "id" = ${autoId}
    `;

    return NextResponse.json({ 
      message: 'Thumbnail set successfully',
      thumbnailFotoId: fotoId
    });
    
  } catch (error) {
    console.error('Error setting thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to set thumbnail' },
      { status: 500 }
    );
  }
} 