import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string, fotoId: string } }
) {
  try {
    const { imageData } = await request.json();

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Extract MIME type from data URL (e.g. data:image/png;base64,...)
    const mimeMatch = imageData.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Extract raw base64 string (everything after the comma)
    const base64Data = imageData.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Invalid base64 data' },
        { status: 400 }
      );
    }

    // Validate base64 before saving
    try {
      Buffer.from(base64Data, 'base64');
    } catch {
      return NextResponse.json(
        { error: 'Invalid base64 encoding' },
        { status: 400 }
      );
    }

    // Update Prisma with both mimeType and base64Data
    const updatedPhoto = await prisma.fotka.update({
      where: { id: params.fotoId },
      data: {
        data: base64Data,
        mimeType,
      },
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