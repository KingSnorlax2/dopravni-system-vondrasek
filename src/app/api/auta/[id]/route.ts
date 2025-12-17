import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { partialUpdateVehicleSchema } from '@/lib/schemas/vehicle';

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
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Neplatné ID vozidla' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('Received update data for vehicle ID:', id, data);
    
    // Validate input data with partial update schema (includes ID)
    const validationResult = partialUpdateVehicleSchema.safeParse({
      ...data,
      id,
    });
    
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
    
    // Check if SPZ already exists for another car (if SPZ is being updated)
    if (validatedData.spz) {
      const existingCar = await prisma.auto.findFirst({
        where: {
          spz: validatedData.spz,
          id: {
            not: id
          }
        }
      });
      
      if (existingCar) {
        console.log('Duplicate SPZ found:', validatedData.spz, 'for existing car ID:', existingCar.id);
        return NextResponse.json(
          { 
            error: 'SPZ již existuje',
            message: `SPZ ${validatedData.spz} je již použita u jiného vozidla.`
          },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data (exclude ID and fotky from Prisma update)
    const updateData: any = {};
    if (validatedData.spz !== undefined) updateData.spz = validatedData.spz;
    if (validatedData.znacka !== undefined) updateData.znacka = validatedData.znacka;
    if (validatedData.model !== undefined) updateData.model = validatedData.model;
    if (validatedData.rokVyroby !== undefined) updateData.rokVyroby = validatedData.rokVyroby;
    if (validatedData.najezd !== undefined) updateData.najezd = validatedData.najezd;
    if (validatedData.stav !== undefined) updateData.stav = validatedData.stav;
    if (validatedData.poznamka !== undefined) updateData.poznamka = validatedData.poznamka || null;
    if (validatedData.datumSTK !== undefined) {
      updateData.datumSTK = validatedData.datumSTK instanceof Date 
        ? validatedData.datumSTK 
        : validatedData.datumSTK 
          ? new Date(validatedData.datumSTK) 
          : null;
    }
    
    console.log('Updating vehicle with data:', updateData);
    
    const updatedAuto = await prisma.auto.update({
      where: { id },
      data: updateData
    })
    
    console.log('Vehicle updated successfully:', updatedAuto);
    
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
