import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const gpsZaznamy = await prisma.gPSZaznam.findMany({
      where: {
        autoId: autoId
      },
      orderBy: {
        cas: 'desc'
      },
      take: 100 // Posledních 100 záznamů
    });

    return NextResponse.json(gpsZaznamy);
  } catch (error) {
    console.error('GPS Error:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání GPS záznamů' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const autoId = parseInt(params.id, 10);

  if (isNaN(autoId)) {
    return NextResponse.json(
      { error: 'Neplatné ID vozidla' },
      { status: 400 }
    );
  }

  try {
    const data = await request.json();
    const gpsZaznam = await prisma.gPSZaznam.create({
      data: {
        autoId: autoId,
        latitude: data.latitude,
        longitude: data.longitude,
        rychlost: data.rychlost || null,
        stav: data.stav || 'jízda'
      }
    });

    return NextResponse.json(gpsZaznam);
  } catch (error) {
    console.error('GPS Create Error:', error);
    return NextResponse.json(
      { error: 'Chyba při ukládání GPS záznamu' },
      { status: 500 }
    );
  }
}