import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
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

    const deletedAuta = await prisma.auto.deleteMany({
      where: {
        id: {
          in: numericIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      count: deletedAuta.count
    });
  } catch (error) {
    console.error('Chyba při hromadném mazání:', error);
    return NextResponse.json(
      { error: 'Chyba při hromadném mazání' },
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
