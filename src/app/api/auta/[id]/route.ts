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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const autoId = parseInt(id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const auto = await prisma.auto.findUnique({
      where: {
        id: autoId
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
      { error: `Chyba při načítání vozidla: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const autoId = parseInt(id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const data = await request.json();
    console.log('Přijatá data pro aktualizaci:', data);

    const validationResult = autoSchema.partial().safeParse(data);
    if (!validationResult.success) {
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

    const existingAuto = await prisma.auto.findUnique({
      where: { id: autoId }
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
      where: { id: autoId },
      data: {
        ...validatedData,
        datumSTK: validatedData.datumSTK ? new Date(validatedData.datumSTK) : null,
        fotky: validatedData.fotky ? {
          connect: validatedData.fotky.map(f => ({ id: f.id }))
        } : undefined
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

    return NextResponse.json({ success: true, data: updatedAuto });
  } catch (error) {
    console.error('Chyba při aktualizaci vozidla:', error);
    return NextResponse.json(
      { 
        error: 'Chyba při aktualizaci vozidla',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autoId = parseInt(params.id);
    console.log('Archiving vehicle:', autoId);

    // First, archive the vehicle
    const archiveResponse = await fetch(`${request.url.split('/api/auta/')[0]}/api/auta/archiv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        autoId,
        duvodArchivace: 'Vyřazeno uživatelem'
      })
    });

    if (!archiveResponse.ok) {
      throw new Error('Chyba při archivaci vozidla');
    }

    // Then, update the original vehicle
    const updatedAuto = await prisma.auto.update({
      where: { id: autoId },
      data: {
        aktivni: false,
        stav: 'vyřazeno'
      }
    });

    console.log('Vehicle archived successfully:', updatedAuto);

    return NextResponse.json({
      success: true,
      message: 'Vozidlo bylo úspěšně archivováno',
      data: updatedAuto
    });
  } catch (error) {
    console.error('Error archiving vehicle:', error);
    return NextResponse.json(
      { error: 'Chyba při archivaci vozidla' },
      { status: 500 }
    );
  }
}
