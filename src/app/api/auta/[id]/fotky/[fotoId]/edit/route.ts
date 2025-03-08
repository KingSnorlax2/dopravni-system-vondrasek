import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string, fotoId: string } }
) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Update the photo in the database
    const updatedPhoto = await prisma.fotka.update({
      where: { id: params.fotoId },
      data: {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    });

    return NextResponse.json({
      id: updatedPhoto.id,
      message: 'Photo updated successfully'
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
} 