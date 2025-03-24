import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLocationDataForVehicles } from '@/lib/mock-data';

export async function GET() {
  try {
    // Get ALL vehicles
    const vehicles = await prisma.auto.findMany({
      select: {
        id: true,
        spz: true,
        znacka: true,
        model: true,
        stav: true
      }
    });
    
    // Generate mock location data for all vehicles
    const vehiclesWithLocations = generateLocationDataForVehicles(vehicles);
    
    return NextResponse.json(vehiclesWithLocations);
  } catch (error) {
    console.error('Error fetching all vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all vehicles' },
      { status: 500 }
    );
  }
} 