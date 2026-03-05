import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSTKWarningEmail } from '@/lib/email';
import {
  getSTKWarningDays,
  getSTKNotificationIntervalDays,
  getSTKNotificationLastSentAt,
  setSTKNotificationLastSentAt,
} from '@/features/settings/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify CRON_SECRET when set (Vercel sends it in Authorization header)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 });
      }
    }

    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (!notificationEmail?.trim()) {
      return NextResponse.json(
        { error: 'NOTIFICATION_EMAIL není nastaven' },
        { status: 500 }
      );
    }

    const [warningDays, intervalDays, lastSentAt] = await Promise.all([
      getSTKWarningDays(),
      getSTKNotificationIntervalDays(),
      getSTKNotificationLastSentAt(),
    ]);

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() + warningDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we're allowed to send based on interval
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceLastSent = lastSentAt
      ? Math.floor((now.getTime() - lastSentAt.getTime()) / msPerDay)
      : Infinity;
    const shouldSendByInterval = daysSinceLastSent >= intervalDays;

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

    if (expiringVehicles.length > 0 && shouldSendByInterval) {
      await sendSTKWarningEmail(
        notificationEmail,
        expiringVehicles.map(vehicle => ({
          spz: vehicle.spz,
          znacka: vehicle.znacka,
          model: vehicle.model,
          datumSTK: vehicle.datumSTK!
        }))
      );
      await setSTKNotificationLastSentAt(now);

      return NextResponse.json({
        success: true,
        count: expiringVehicles.length,
        message: `Odesláno upozornění pro ${expiringVehicles.length} vozidel`
      });
    }

    if (expiringVehicles.length > 0 && !shouldSendByInterval) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: `Žádná vozidla nevyžadují upozornění (interval: každých ${intervalDays} dní, poslední odeslání před ${daysSinceLastSent} dny)`
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
