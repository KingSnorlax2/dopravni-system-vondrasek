import { NextResponse } from 'next/server';
<<<<<<< HEAD
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

export async function GET() {
  try {
    const vehicles = await prisma.auto.findMany({
      where: {
        aktivni: true
      },
      include: {
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Chyba při načítání vozidel:', error);
=======
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const auta = await prisma.auto.findMany({
      orderBy: {
        id: 'desc'
      },
      include: {
        fotky: true
      }
    });
    
    console.log('Načtená auta z databáze:', auta);
    
    return NextResponse.json(auta);
  } catch (error) {
    console.error('Chyba při načítání dat:', error instanceof Error ? error.message : error);
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
    return NextResponse.json(
      { error: 'Chyba při načítání dat z databáze' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
<<<<<<< HEAD
    console.log('Přijatá data:', data);

    // Validace dat pomocí Zod
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
        spz: validatedData.spz,
        znacka: validatedData.znacka,
        model: validatedData.model,
        rokVyroby: validatedData.rokVyroby,
        najezd: validatedData.najezd,
        stav: validatedData.stav,
        poznamka: validatedData.poznamka,
        datumSTK: validatedData.datumSTK ? new Date(validatedData.datumSTK) : null,
        aktivni: true
      }
    });

    console.log('Vytvořené vozidlo:', vehicle);
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Chyba při vytváření vozidla:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Chyba při vytváření vozidla: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Chyba při vytváření vozidla' },
=======
    console.log('Přijatá data pro vytvoření auta:', data);

    const requiredFields = ['spz', 'znacka', 'model', 'rokVyroby', 'najezd', 'stav'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Chybí povinné údaje: ${field}` },
          { status: 400 }
        );
      }
    }

    const createData = {
      spz: String(data.spz),
      znacka: String(data.znacka),
      model: String(data.model),
      rokVyroby: Number(data.rokVyroby),
      najezd: Number(data.najezd),
      stav: String(data.stav),
      poznamka: data.poznamka || null,
      datumSTK: data.datumSTK ? new Date(data.datumSTK) : undefined
    };

    console.log('Data pro vytvoření auta:', createData);

    const auto = await prisma.auto.create({
      data: {
        spz: createData.spz,
        znacka: createData.znacka,
        model: createData.model,
        rokVyroby: createData.rokVyroby,
        najezd: createData.najezd,
        stav: createData.stav,
        poznamka: createData.poznamka,
        datumSTK: createData.datumSTK
      }
    });

    return NextResponse.json({ success: true, data: auto });
  } catch (error) {
    console.error('Chyba při vytváření auta:', error);
    return NextResponse.json(
      { 
        error: 'Chyba při vytváření auta',
        details: error instanceof Error ? error.message : String(error)
      },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 500 }
    );
  }
}