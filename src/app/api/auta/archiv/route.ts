import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const archivedAutos = await prisma.archivedAuto.findMany({
      orderBy: { datumArchivace: 'desc' }
    });
    return NextResponse.json(archivedAutos);
  } catch (error) {
    console.error('Chyba při načítání archivovaných vozidel:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání dat z databáze' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { autoId, duvodArchivace } = await request.json();

    const result = await prisma.$transaction(async (prisma) => {
      const originalAuto = await prisma.auto.findUnique({
        where: { id: autoId },
        include: {
          fotky: true, 
          poznatky: true, 
          transakce: true,
          gpsZaznamy: true, 
          udrzby: true, 
          tankovani: true
        }
      });

      if (!originalAuto) {
        throw new Error('Vozidlo nebylo nalezeno');
      }

      const archivedAuto = await prisma.archivedAuto.create({
        data: {
          originalId: originalAuto.id,
          spz: originalAuto.spz,
          znacka: originalAuto.znacka,
          model: originalAuto.model,
          rokVyroby: originalAuto.rokVyroby,
          najezd: originalAuto.najezd,
          stav: originalAuto.stav,
          poznamka: originalAuto.poznamka,
          datumSTK: originalAuto.datumSTK,
          datumArchivace: new Date(),
          duvodArchivace: duvodArchivace || 'Bez specifikace',
          archivedData: originalAuto as any
        }
      });

      await Promise.all([
        prisma.fotka.deleteMany({ where: { autoId } }),
        prisma.note.deleteMany({ where: { autoId } }),
        prisma.transakce.deleteMany({ where: { autoId } }),
        prisma.gPSZaznam.deleteMany({ where: { autoId } }),
        prisma.udrzba.deleteMany({ where: { autoId } }),
        prisma.tankovani.deleteMany({ where: { autoId } }),
        prisma.auto.delete({ where: { id: autoId } })
      ]);

      return archivedAuto;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Chyba při archivaci vozidla:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při archivaci vozidla' },
      { status: 500 }
    );
  }
}
