import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const fotoSchema = z.object({
  data: z.string(), // base64 encoded image
  mimeType: z.string()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const validationResult = fotoSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Neplatná data', 
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { data: fotoData, mimeType } = validationResult.data;
    const autoId = parseInt(params.id);

    // Special case for new car (not yet saved)
    if (autoId === 0) {
      // Just create a foto without associating it with an auto
      const foto = await prisma.fotka.create({
        data: {
          data: fotoData,
          mimeType
        }
      });

      return NextResponse.json(foto, { status: 201 });
    }

    // Validate that the auto exists
    const auto = await prisma.auto.findUnique({
      where: { id: autoId }
    });

    if (!auto) {
      return NextResponse.json({ error: 'Auto nebylo nalezeno' }, { status: 404 });
    }

    // Create new foto
    const foto = await prisma.fotka.create({
      data: {
        data: fotoData,
        mimeType,
        autoId
      }
    });

    return NextResponse.json(foto, { status: 201 });
  } catch (error) {
    console.error('Chyba při nahrávání fotografie:', error);
    return NextResponse.json({ error: 'Nastala chyba při nahrávání fotografie' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fotoId = searchParams.get('fotoId');

    if (!fotoId) {
      return NextResponse.json({ error: 'ID fotografie je povinné' }, { status: 400 });
    }

    const foto = await prisma.fotka.findUnique({
      where: { id: fotoId }
    });

    if (!foto) {
      return NextResponse.json({ error: 'Fotografie nebyla nalezena' }, { status: 404 });
    }

    // Return the base64 encoded image
    return new Response(foto.data, {
      headers: {
        'Content-Type': foto.mimeType
      }
    });
  } catch (error) {
    console.error('Chyba při načítání fotografie:', error);
    return NextResponse.json({ error: 'Nastala chyba při načítání fotografie' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fotoId = searchParams.get('fotoId');

    if (!fotoId) {
      return NextResponse.json({ error: 'ID fotografie je povinné' }, { status: 400 });
    }

    const autoId = parseInt(params.id);

    // If autoId is 0, it's a temporary foto for a new car
    if (autoId === 0) {
      await prisma.fotka.delete({
        where: { id: fotoId }
      });

      return NextResponse.json({ message: 'Fotografie byla smazána' }, { status: 200 });
    }

    // Validate that the foto belongs to the specified auto
    const foto = await prisma.fotka.findUnique({
      where: { id: fotoId, autoId }
    });

    if (!foto) {
      return NextResponse.json({ error: 'Fotografie nebyla nalezena' }, { status: 404 });
    }

    // Delete the foto
    await prisma.fotka.delete({
      where: { id: fotoId }
    });

    return NextResponse.json({ message: 'Fotografie byla smazána' }, { status: 200 });
  } catch (error) {
    console.error('Chyba při mazání fotografie:', error);
    return NextResponse.json({ error: 'Nastala chyba při mazání fotografie' }, { status: 500 });
  }
}
