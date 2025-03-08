import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateThumbnail } from '@/lib/imageUtils';

// GET /api/auta/[id]/fotky - Fetch all photos for a car
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

    const fotky = await prisma.fotka.findMany({
      where: { autoId }
    });

    return NextResponse.json(fotky);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// POST /api/auta/[id]/fotky - Upload a new photo for a car
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);
    if (isNaN(autoId)) {
      return NextResponse.json({ error: 'Invalid car ID' }, { status: 400 });
    }

    // Check if the car exists
    const car = await prisma.auto.findUnique({
      where: { id: autoId }
    });

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(buffer);
    
    // Save original image and thumbnail
    const photo = await prisma.fotka.create({
      data: {
        data: buffer.toString('base64'),
        mimeType: file.type,
        autoId,
        // You can add thumbnail data here if your schema supports it
        // thumbnail: thumbnailBuffer.toString('base64')
      }
    });

    // If this is the first photo, set as thumbnail
    if (!car.thumbnailFotoId) {
      await prisma.auto.update({
        where: { id: autoId },
        data: { thumbnailFotoId: photo.id }
      });
    }

    return NextResponse.json({ 
      id: photo.id,
      message: 'Photo uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 