import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Parse incoming GPS data
    const data = await request.json();
    
    // Validate the data format and API key
    if (!data.apiKey || data.apiKey !== process.env.GPS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!data.deviceId || !data.latitude || !data.longitude) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Find the vehicle by device ID
    const vehicle = await prisma.auto.findFirst({
      where: {
        gpsDeviceId: data.deviceId,
      },
    });
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Unknown device' }, { status: 404 });
    }
    
    // Store the location data
    const location = await prisma.vehicleLocation.create({
      data: {
        autoId: vehicle.id,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        speed: data.speed ? parseFloat(data.speed) : null,
        heading: data.heading ? parseFloat(data.heading) : null,
        altitude: data.altitude ? parseFloat(data.altitude) : null,
        accuracy: data.accuracy ? parseFloat(data.accuracy) : null,
        batteryLevel: data.batteryLevel ? parseFloat(data.batteryLevel) : null,
        timestamp: new Date(),
      },
    });
    
    // Update the vehicle's last known location
    await prisma.auto.update({
      where: {
        id: vehicle.id,
      },
      data: {
        lastLatitude: parseFloat(data.latitude),
        lastLongitude: parseFloat(data.longitude),
        lastLocationUpdate: new Date(),
      },
    });
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Location data received',
      locationId: location.id
    });
  } catch (error) {
    console.error('Error processing GPS data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 