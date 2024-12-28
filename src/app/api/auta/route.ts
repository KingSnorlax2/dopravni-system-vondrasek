import { NextResponse } from 'next/server';
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
    return NextResponse.json(
      { error: 'Chyba při načítání dat z databáze' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
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
      { status: 500 }
    );
  }
}