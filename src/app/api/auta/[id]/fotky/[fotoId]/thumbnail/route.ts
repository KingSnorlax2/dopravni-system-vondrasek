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

    // Update the car to set this photo as thumbnail
    await prisma.auto.update({
      where: { id: autoId },
      data: { thumbnailFotoId: fotoId }
    });

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