import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/auta/[id]/fotky/[fotoId] - Delete a photo
export async function DELETE(
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

    // Delete the photo
    await prisma.fotka.delete({
      where: { id: fotoId }
    });

    return NextResponse.json({ message: 'Photo deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

// PUT /api/auta/[id]/fotky/[fotoId] - Update a photo
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

    // Get the new photo data from request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nebyl nahrán žádný soubor' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
    const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Soubor je příliš velký (max 5MB)' },
        { status: 413 }
      );
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Povolené typy: JPG, JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer and convert to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Update the photo
    const updatedPhoto = await prisma.fotka.update({
      where: { id: fotoId },
      data: {
        data: base64,
        mimeType: file.type
      }
    });

    return NextResponse.json({
      id: updatedPhoto.id,
      url: `data:${file.type};base64,${base64.substring(0, 100)}...` // Truncated for response
    });
    
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Find the photo
    const photo = await prisma.fotka.findFirst({
      where: {
        id: fotoId,
        autoId
      }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(photo.data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
} 