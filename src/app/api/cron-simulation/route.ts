import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSTKNotification } from '@/lib/emailService';

export async function GET() {
  try {
    console.log('Začínám simulaci CRON jobu pro kontrolu STK');
    
    // Najít auta, kterým končí STK v následujících 30 dnech
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();

    const expiringVehicles = await prisma.auto.findMany({
      where: {
        datumSTK: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        AND: {
          NOT: {
            stav: 'vyřazeno'
          }
        }
      },
      orderBy: {
        datumSTK: 'asc'
      }
    });

    console.log(`Nalezeno ${expiringVehicles.length} vozidel s končící STK`);

    if (expiringVehicles.length > 0) {
      await sendSTKNotification(
        process.env.NOTIFICATION_EMAIL!,
        expiringVehicles.map(vehicle => ({
          spz: vehicle.spz,
          znacka: vehicle.znacka,
          model: vehicle.model,
          datumSTK: vehicle.datumSTK!
        }))
      );

      return NextResponse.json({
        success: true,
        count: expiringVehicles.length,
        vehicles: expiringVehicles.map(v => ({
          spz: v.spz,
          znacka: v.znacka,
          model: v.model,
          datumSTK: v.datumSTK
        })),
        message: `Odesláno upozornění pro ${expiringVehicles.length} vozidel`
      });
    }

    return NextResponse.json({
      success: true,
      count: 0,
      message: 'Žádná vozidla nevyžadují upozornění'
    });

  } catch (error) {
    console.error('Chyba při simulaci CRON jobu:', error);
    return NextResponse.json(
      { 
        error: 'Chyba při kontrole STK',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
