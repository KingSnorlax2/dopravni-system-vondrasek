import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NextRequest } from 'next/server';

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
  try {
    const autoId = parseInt(params.id);
    
    if (isNaN(autoId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    const car = await prisma.auto.findUnique({
      where: {
        id: autoId
      },
      include: {
        fotky: true
      }
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Process photos to include the full URL
    const processedCar = {
      ...car,
      fotky: car.fotky.map(foto => ({
        id: foto.id,
        url: `data:${foto.mimeType};base64,${foto.data}`
      }))
    };

    return NextResponse.json(processedCar);
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    
    // Format the data properly
    const updateData = {
      ...data,
      // Convert datumSTK from Date object to ISO string if it exists
      datumSTK: data.datumSTK ? new Date(data.datumSTK).toISOString() : null,
    }
    
    // Remove any fields that shouldn't be updated
    delete updateData.id
    delete updateData.fotky
    const updatedAuto = await prisma.auto.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    
    return NextResponse.json(updatedAuto)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
      { status: 500 }
    )
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
