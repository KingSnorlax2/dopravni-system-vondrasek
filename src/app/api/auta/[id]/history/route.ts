import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Get time range parameters
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate') as string) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : new Date();
    
    // Get history points
    const locationHistory = await prisma.vehicleLocation.findMany({
      where: {
        autoId: parseInt(id),
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    
    return NextResponse.json(locationHistory);
  } catch (error) {
    console.error('Error fetching location history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location history' },
      { status: 500 }
    );
  }
} 