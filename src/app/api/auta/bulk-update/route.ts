import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    console.log('Received delete request for IDs:', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('No cars selected for deletion');
      return NextResponse.json(
        { error: 'Nebyla vybrána žádná auta' },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    console.log('Converted to numeric IDs:', numericIds);

    if (numericIds.length === 0) {
      console.error('No valid car IDs provided');
      return NextResponse.json(
        { error: 'Žádná platná ID nebyla poskytnuta' },
        { status: 400 }
      );
    }

    // First, check if the cars exist
    const existingCars = await prisma.auto.findMany({
      where: {
        id: {
          in: numericIds
        }
      },
      select: { id: true }
    });
    console.log('Existing cars:', existingCars.map(car => car.id));

    const deletedAuta = await prisma.auto.deleteMany({
      where: {
        id: {
          in: numericIds
        }
      }
    });

    console.log(`Successfully deleted ${deletedAuta.count} cars`);

    return NextResponse.json({
      success: true,
      count: deletedAuta.count,
      requestedIds: numericIds,
      existingIds: existingCars.map(car => car.id)
    });
  } catch (error) {
    console.error('Chyba při hromadném mazání:', error);
    return NextResponse.json(
      { 
        error: 'Chyba při hromadném mazání', 
        details: error instanceof Error ? error.message : 'Neznámá chyba' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids, stav } = await request.json();

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

    const updatedAuta = await prisma.auto.updateMany({
      where: {
        id: {
          in: numericIds
        }
      },
      data: {
        stav: stav
      }
    });

    return NextResponse.json({
      success: true,
      count: updatedAuta.count
    });
  } catch (error) {
    console.error('Chyba při hromadné aktualizaci:', error);
    return NextResponse.json(
      { error: 'Chyba při hromadné aktualizaci' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ids, datumSTK } = await request.json();

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

    const updatedAuta = await prisma.auto.updateMany({
      where: {
        id: {
          in: numericIds
        }
      },
      data: {
        datumSTK: datumSTK
      }
    });

    return NextResponse.json({
      success: true,
      count: updatedAuta.count
    });
  } catch (error) {
    console.error('Chyba při hromadné aktualizaci STK:', error);
    return NextResponse.json(
      { error: 'Chyba při hromadné aktualizaci STK' },
      { status: 500 }
    );
  }
}
