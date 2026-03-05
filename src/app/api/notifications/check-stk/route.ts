import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSTKNotification } from '@/lib/emailService';
import { getSTKWarningDays } from '@/features/settings/queries';

export async function GET() {
  try {
    const warningDays = await getSTKWarningDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + warningDays);

    const today = new Date();

    const expiringVehicles = await prisma.auto.findMany({
      where: {
        datumSTK: {
          gte: today,
          lte: cutoffDate,
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
        message: `Odesláno upozornění pro ${expiringVehicles.length} vozidel`
      });
    }

    return NextResponse.json({
      success: true,
      count: 0,
      message: 'Žádná vozidla nevyžadují upozornění'
    });

  } catch (error) {
    console.error('Chyba při kontrole STK:', error);
    return NextResponse.json(
      { error: 'Chyba při kontrole STK' },
      { status: 500 }
    );
  }
}
