import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Nebyla vybrána žádná auta' },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));

    if (numericIds.length === 0) {
      return NextResponse.json(
        { error: 'Žádná platná ID nebyla poskytnuta' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data integrity
    const result = await prisma.$transaction(async (prisma) => {
      const archivedAutos = [];

      for (const autoId of numericIds) {
        // Get the original auto with all related data
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

        if (!originalAuto) continue;

        // Create archived version with all details
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
            duvodArchivace: 'Hromadná archivace',
            
            // Store related data as JSON in the archivedData field
            archivedData: {
              fotky: originalAuto.fotky,
              poznatky: originalAuto.poznatky,
              transakce: originalAuto.transakce,
              gpsZaznamy: originalAuto.gpsZaznamy,
              udrzby: originalAuto.udrzby,
              tankovani: originalAuto.tankovani
            }
          }
        });

        archivedAutos.push(archivedAuto);

        // Delete related data
        await prisma.fotka.deleteMany({ where: { autoId: originalAuto.id } });
        await prisma.note.deleteMany({ where: { autoId: originalAuto.id } });
        await prisma.transakce.deleteMany({ where: { autoId: originalAuto.id } });
        await prisma.gPSZaznam.deleteMany({ where: { autoId: originalAuto.id } });
        await prisma.udrzba.deleteMany({ where: { autoId: originalAuto.id } });
        await prisma.tankovani.deleteMany({ where: { autoId: originalAuto.id } });
        
        // Finally delete the original auto
        await prisma.auto.delete({ where: { id: originalAuto.id } });
      }

      return archivedAutos;
    });

    return NextResponse.json({
      success: true,
      count: result.length
    });
  } catch (error) {
    console.error('Chyba při hromadné archivaci:', error);
    return NextResponse.json(
      { error: 'Chyba při hromadné archivaci' },
      { status: 500 }
    );
  }
}
