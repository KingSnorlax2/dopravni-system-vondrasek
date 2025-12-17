import { NextResponse } from 'next/server';
import { db, prisma } from '@/lib/prisma';
import { createVehicleSchema } from '@/lib/schemas/vehicle';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    
    // If showAll=true, use base client to get ALL vehicles (active + inactive)
    // If showAll=false or not provided, use extended client to get only active vehicles
    const client = showAll ? prisma : db;
    
    const auta = await client.auto.findMany({
      // When showAll=true, prisma (base client) returns all vehicles
      // When showAll=false, db (extended client) automatically filters aktivni: true
      orderBy: {
        id: 'desc'
      },
      include: {
        fotky: true,
        poznatky: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    // For each car without a thumbnail, set the first photo as thumbnail
    for (const auto of auta) {
      if (!auto.thumbnailFotoId && auto.fotky.length > 0) {
        // Update the database to set the first photo as thumbnail
        await db.auto.update({
          where: { id: auto.id },
          data: { thumbnailFotoId: auto.fotky[0].id }
        });
        
        // Update the object in memory too
        auto.thumbnailFotoId = auto.fotky[0].id;
      }
    }

    const transformedAuta = auta.map(auto => ({
      id: auto.id,
      spz: auto.spz,
      znacka: auto.znacka,
      model: auto.model,
      rokVyroby: auto.rokVyroby,
      najezd: auto.najezd,
      stav: auto.stav as "aktivní" | "servis" | "vyřazeno",
      fotky: auto.fotky.map(foto => ({
        id: foto.id
      })),
      thumbnailFotoId: auto.thumbnailFotoId,
      datumSTK: auto.datumSTK?.toISOString() || undefined,
      poznamka: auto.poznamka || undefined,
      poznatky: auto.poznatky.map(poznamka => ({
        id: poznamka.id.toString(),
        text: poznamka.text,
        createdAt: poznamka.createdAt.toISOString()
      })),
      _count: auto._count
    }));

    return NextResponse.json(transformedAuta);
  } catch (error) {
    console.error('Chyba při načítání vozidel:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání vozidel' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Přijatá data:', data);

    const validationResult = createVehicleSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validační chyby:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Neplatná data',
          fields: validationResult.error.flatten().fieldErrors,
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Kontrola duplicitní SPZ
    const existingAuto = await db.auto.findUnique({
      where: { spz: validatedData.spz }
    });

    if (existingAuto) {
      return NextResponse.json(
        { error: 'Vozidlo s touto SPZ již existuje' },
        { status: 400 }
      );
    }

    const vehicle = await db.auto.create({
      data: {
        spz: validatedData.spz,
        znacka: validatedData.znacka,
        model: validatedData.model,
        rokVyroby: validatedData.rokVyroby,
        najezd: validatedData.najezd,
        stav: validatedData.stav,
        poznamka: validatedData.poznamka || null,
        datumSTK: validatedData.datumSTK instanceof Date ? validatedData.datumSTK : validatedData.datumSTK ? new Date(validatedData.datumSTK) : null,
        aktivni: true,
        fotky: validatedData.fotky?.length ? {
          connect: validatedData.fotky.map(foto => ({ id: foto.id }))
        } : undefined
      },
      include: {
        fotky: true,
        _count: {
          select: {
            gpsZaznamy: true,
            udrzby: true,
            tankovani: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}