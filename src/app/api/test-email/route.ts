import { NextResponse } from 'next/server';
import { sendSTKWarningEmail } from '@/lib/email';
import { devLog } from '@/lib/logger';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    devLog('Začínám test emailu');
    devLog('ENV proměnné:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      to: process.env.NOTIFICATION_EMAIL
    });

    const testVehicles = [
      {
        spz: "TEST123",
        znacka: "Test",
        model: "Auto",
        datumSTK: new Date('2024-03-15')
      }
    ];

    await sendSTKWarningEmail(
      process.env.NOTIFICATION_EMAIL!,
      testVehicles
    );

    return NextResponse.json({
      success: true,
      message: 'Testovací email byl odeslán',
      sentTo: process.env.NOTIFICATION_EMAIL
    });

  } catch (error) {
    console.error('Detailní chyba:', error);
    return NextResponse.json(
      { 
        error: 'Chyba při odesílání emailu',
        details: error instanceof Error ? error.message : String(error),
        env: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER?.substring(0, 3) + '...',
          from: process.env.SMTP_FROM?.substring(0, 3) + '...',
          to: process.env.NOTIFICATION_EMAIL?.substring(0, 3) + '...'
        }
      },
      { status: 500 }
    );
  }
}
