<<<<<<< HEAD
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
=======
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const autoSchema = z.object({
  // ostatní validace...
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
<<<<<<< HEAD
      { error: 'Neplatné ID vozidla' },
=======
      { error: 'Neplatné ID auta' },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 400 }
    );
  }

  try {
    const auto = await prisma.auto.findUnique({
      where: {
<<<<<<< HEAD
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
=======
        id: autoId
      },
      include: {
        fotky: true,
        poznatky: true
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      }
    });

    if (!auto) {
      return NextResponse.json(
<<<<<<< HEAD
        { error: 'Vozidlo nebylo nalezeno' },
=======
        { error: 'Auto nebylo nalezeno' },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
        { status: 404 }
      );
    }

    return NextResponse.json(auto);
  } catch (error) {
<<<<<<< HEAD
    console.error('Chyba při načítání vozidla:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání vozidla z databáze' },
=======
    console.error('Chyba při načítání auta:', error);
    return NextResponse.json(
      { error: `Chyba při načítání auta: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
<<<<<<< HEAD
      { error: 'Neplatné ID vozidla' },
=======
      { error: 'Neplatné ID auta' },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 400 }
    );
  }

  try {
    const data = await request.json();
<<<<<<< HEAD
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
=======

    // Kontrola existence auta
    const existingAuto = await prisma.auto.findUnique({
      where: { id: autoId }
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
    });

    if (!existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo nebylo nalezeno' },
        { status: 404 }
      );
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
<<<<<<< HEAD
      { error: 'Neplatné ID vozidla' },
=======
      { error: 'Neplatné ID auta' },
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
      { status: 400 }
    );
  }

  try {
<<<<<<< HEAD
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
=======
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
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
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
<<<<<<< HEAD
=======

>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
