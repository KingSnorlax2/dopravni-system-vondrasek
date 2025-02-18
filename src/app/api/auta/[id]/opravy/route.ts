import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const opravaSchema = z.object({
  datumOpravy: z.string(),
  popis: z.string().min(1, "Popis je povinný").max(500, "Popis je příliš dlouhý"),
  cena: z.number().min(0, "Cena nemůže být záporná"),
  typOpravy: z.enum(["běžná", "servisní", "porucha"]),
  stav: z.enum(["plánovaná", "probíhá", "dokončená"]),
  servis: z.string().optional(),
  poznamka: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!prisma) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }

  try {
    const data = await request.json();
    const validationResult = opravaSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Neplatná data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const autoId = parseInt(params.id);

    // Verify that the auto exists
    const auto = await prisma.auto.findUnique({
      where: { id: autoId }
    });

    if (!auto) {
      return NextResponse.json(
        { error: 'Auto nebylo nalezeno' },
        { status: 404 }
      );
    }

    const oprava = await prisma.oprava.create({
      data: {
        ...validationResult.data,
        autoId,
        datumOpravy: new Date(validationResult.data.datumOpravy),
      },
    });

    return NextResponse.json(oprava);
  } catch (error) {
    console.error('Chyba při vytváření opravy:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při vytváření opravy' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);
    const opravy = await prisma.oprava.findMany({
      where: { autoId },
      orderBy: { datumOpravy: 'desc' },
    });

    return NextResponse.json(opravy);
  } catch (error) {
    console.error('Chyba při načítání oprav:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při načítání oprav' },
      { status: 500 }
    );
  }
} 