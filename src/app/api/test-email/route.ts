import { NextResponse } from 'next/server';
import { sendSTKNotification } from '@/lib/emailService';

export async function GET() {
  try {
    console.log('Začínám test emailu');
    console.log('ENV proměnné:', {
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

    await sendSTKNotification(
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
