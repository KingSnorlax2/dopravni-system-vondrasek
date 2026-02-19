import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

const uploadFileSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE, { message: 'Soubor je příliš velký (max 5MB)' }),
  type: z.enum(ACCEPTED_IMAGE_TYPES, {
    errorMap: () => ({ message: 'Povolené typy: JPG, JPEG, PNG, WebP' }),
  }),
});

// GET /api/auta/[id]/fotky - Fetch all photos for a car
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);

    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Neplatné ID vozidla' },
        { status: 400 }
      );
    }

    const fotky = await prisma.fotka.findMany({
      where: { autoId },
    });

    return NextResponse.json(fotky);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst fotografie' },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Pro nahrání fotografie se musíte přihlásit.' },
        { status: 401 }
      );
    }

    const autoId = parseInt(params.id);
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Neplatné ID vozidla' },
        { status: 400 }
      );
    }

    const car = await prisma.auto.findUnique({
      where: { id: autoId },
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.size === 'undefined') {
      return NextResponse.json(
        { error: 'Nebyl nahrán žádný soubor' },
        { status: 400 }
      );
    }

    const validation = uploadFileSchema.safeParse({
      size: file.size,
      type: file.type,
    });

    if (!validation.success) {
      const message = validation.error.errors[0]?.message ?? 'Neplatný soubor';
      const status = file.size > MAX_FILE_SIZE ? 413 : 400;
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const photo = await prisma.fotka.create({
      data: {
        data: base64Data,
        mimeType: file.type,
        autoId,
      },
    });

    if (!car.thumbnailFotoId) {
      await prisma.auto.update({
        where: { id: autoId },
        data: { thumbnailFotoId: photo.id },
      });
    }

    return NextResponse.json({
      id: photo.id,
      message: 'Fotografie byla úspěšně nahrána',
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při nahrávání fotografie' },
      { status: 500 }
    );
  }
}
