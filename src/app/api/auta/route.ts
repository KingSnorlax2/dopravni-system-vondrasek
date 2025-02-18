import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const autoSchema = z.object({
  spz: z.string().min(7, "SPZ musí mít minimálně 7 znaků").max(8, "SPZ může mít maximálně 8 znaků"),
  znacka: z.string().min(2, "Značka musí mít alespoň 2 znaky").max(20, "Značka může mít maximálně 20 znaků"),
  model: z.string().min(1, "Model je povinný").max(20, "Model může mít maximálně 20 znaků"),
  rokVyroby: z.number()
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear(), "Rok výroby nemůže být v budoucnosti"),
  najezd: z.number().min(0, "Nájezd nemůže být záporný"),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
  datumSTK: z.string().nullable().optional(),
  poznamka: z.string().nullable().optional(),
  fotky: z.array(z.object({ id: z.string() })).optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    
    const auta = await prisma.auto.findMany({
      where: showAll ? undefined : {
        aktivni: true
      },
      orderBy: {
        id: 'desc'
      },
      include: {
        fotky: true,
        poznatky: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    const transformedAuta = auta.map(auto => ({
      id: auto.id,
      spz: auto.spz,
      znacka: auto.znacka,
      model: auto.model,
      rokVyroby: auto.rokVyroby,
      najezd: auto.najezd,
      stav: auto.stav as "aktivní" | "servis" | "vyřazeno",
      fotky: auto.fotky.map(foto => ({
        id: foto.id
      })),
      datumSTK: auto.datumSTK?.toISOString() || undefined,
      poznamka: auto.poznamka || undefined,
      poznatky: auto.poznatky.map(poznamka => ({
        id: poznamka.id.toString(),
        text: poznamka.text,
        createdAt: poznamka.createdAt.toISOString()
      })),
      _count: auto._count
    }));

    return NextResponse.json(transformedAuta);
  } catch (error) {
    console.error('Chyba při načítání vozidel:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání vozidel' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Přijatá data:', data);

    const validationResult = autoSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validační chyby:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Neplatná data',
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Kontrola duplicitní SPZ
    const existingAuto = await prisma.auto.findUnique({
      where: { spz: validatedData.spz }
    });

    if (existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo s touto SPZ již existuje' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.auto.create({
      data: {
        ...validatedData,
        datumSTK: validatedData.datumSTK ? new Date(validatedData.datumSTK) : null,
        aktivni: true,
        fotky: validatedData.fotky?.length ? {
          connect: validatedData.fotky.map(foto => ({ id: foto.id }))
        } : undefined
      },
      include: {
        fotky: true,
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}