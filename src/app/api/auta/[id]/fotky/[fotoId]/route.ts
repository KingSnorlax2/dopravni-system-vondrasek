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
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate the file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are supported.' },
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