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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const auto = await prisma.auto.findUnique({
      where: {
        id: autoId,
        aktivni: true
      },
      include: {
        fotky: true,
        poznatky: true,
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    if (!auto) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

    return NextResponse.json(auto);
  } catch (error) {
    console.error('Chyba při načítání vozidla:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání vozidla z databáze' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const data = await request.json();
    console.log('Přijatá data pro aktualizaci:', data);

    // Validace dat pomocí Zod
    const validationResult = autoSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Neplatná data: ' + validationResult.error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Kontrola existence vozidla
    const existingAuto = await prisma.auto.findUnique({
      where: { 
        id: autoId,
        aktivni: true
      }
    });

    if (!existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

    // Kontrola duplicitní SPZ pokud se mění
    if (validatedData.spz && validatedData.spz !== existingAuto.spz) {
      const duplicateSpz = await prisma.auto.findFirst({
        where: { 
          spz: validatedData.spz,
          aktivni: true,
          id: { not: autoId }
        }
      });

      if (duplicateSpz) {
        return NextResponse.json(
          { error: 'Vozidlo s touto SPZ již existuje' },
          { status: 400 }
        );
      }
    }

    const updatedAuto = await prisma.auto.update({
      where: { 
        id: autoId,
        aktivni: true 
      },
      data: {
        ...validatedData,
        datumSTK: validatedData.datumSTK ? new Date(validatedData.datumSTK) : null,
        fotky: {
          connect: validatedData.fotky?.map(f => ({ id: f.id })) || []
        }
      },
      include: {
        fotky: true,
        poznatky: true,
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    console.log('Aktualizované vozidlo:', updatedAuto);
    return NextResponse.json({ data: updatedAuto });
  } catch (error) {
    console.error('Chyba při aktualizaci vozidla:', error);
    return NextResponse.json(
      { error: 'Chyba při aktualizaci vozidla v databázi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const existingAuto = await prisma.auto.findUnique({
      where: { 
        id: autoId,
        aktivni: true
      }
    });

    if (!existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

    await prisma.auto.update({
      where: { id: autoId },
      data: { aktivni: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při mazání vozidla:', error);
    return NextResponse.json(
      { error: 'Chyba při mazání vozidla z databáze' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id, 10)
    const data = await request.json()

    console.log('Přijatá data pro aktualizaci:', data) // Pro debug

    const updatedAuto = await prisma.auto.update({
      where: {
        id: autoId
      },
      data: {
        spz: data.spz,
        znacka: data.znacka,
        model: data.model,
        rokVyroby: parseInt(data.rokVyroby, 10),
        najezd: parseInt(data.najezd, 10),
        stav: data.stav,
        datumSTK: data.datumSTK ? new Date(data.datumSTK) : null
      },
      include: {
        fotky: true,
        poznatky: true
      }
    })

    console.log('Aktualizované auto:', updatedAuto) // Pro debug

    return NextResponse.json(updatedAuto)
  } catch (error) {
    console.error('Chyba při aktualizaci auta:', error)
    return NextResponse.json(
      { error: 'Chyba při aktualizaci auta' },
      { status: 500 }
    )
  }
}
