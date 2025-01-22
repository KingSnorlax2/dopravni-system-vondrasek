import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const autoSchema = z.object({
  // ostatní validace...
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID auta' },
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
        poznatky: true
      }
    });

    if (!auto) {
      return NextResponse.json(
        { error: 'Auto nebylo nalezeno' },
        { status: 404 }
      );
    }

    return NextResponse.json(auto);
  } catch (error) {
    console.error('Chyba při načítání auta:', error);
    return NextResponse.json(
      { error: `Chyba při načítání auta: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID auta' },
      { status: 400 }
    );
  }

  try {
    const data = await request.json();

    // Kontrola existence auta
    const existingAuto = await prisma.auto.findUnique({
      where: { id: autoId }
    });

    if (!existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

    // Příprava dat pro aktualizaci
    const updateData: any = {};

    // Validace a přidání polí s kontrolou typu
    if (data.spz !== undefined) updateData.spz = String(data.spz);
    if (data.znacka !== undefined) updateData.znacka = String(data.znacka);
    if (data.model !== undefined) updateData.model = String(data.model);
    if (data.rokVyroby !== undefined) updateData.rokVyroby = Number(data.rokVyroby);
    if (data.najezd !== undefined) updateData.najezd = Number(data.najezd);
    if (data.stav !== undefined) updateData.stav = String(data.stav);
    if (data.datumSTK !== undefined) {
      updateData.datumSTK = data.datumSTK ? new Date(data.datumSTK) : null;
    }
    if (data.poznamka !== undefined) updateData.poznamka = data.poznamka;
    if (data.pripnuto !== undefined) updateData.pripnuto = Boolean(data.pripnuto);

    // Kontrola, zda máme co aktualizovat
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Žádná data k aktualizaci' },
        { status: 400 }
      );
    }

    const updatedAuto = await prisma.auto.update({
      where: { id: autoId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedAuto });
  } catch (error) {
    console.error('Chyba při aktualizaci vozidla:', error);
    return NextResponse.json(
      { error: `Chyba při aktualizaci vozidla: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID auta' },
      { status: 400 }
    );
  }

  try {
    // Nejprve smazání poznámek spojených s autem
    await prisma.note.deleteMany({
      where: { autoId }
    });

    // Poté smazání auta
    const deletedAuto = await prisma.auto.delete({
      where: { id: autoId }
    });

    return NextResponse.json({ success: true, data: deletedAuto });
  } catch (error) {
    console.error('Chyba při mazání auta:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';

    return NextResponse.json(
      { error: 'Chyba při mazání auta', details: errorMessage },
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

