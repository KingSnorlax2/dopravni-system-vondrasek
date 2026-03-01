import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transakce.findMany({
      select: {
        id: true,
        nazev: true,
        castka: true,
        datum: true,
        typ: true,
        popis: true,
        kategorieId: true,
        autoId: true,
        createdAt: true,
        updatedAt: true,
        faktura: true,
        fakturaTyp: true,
        fakturaNazev: true,
        kategorie: {
          select: {
            id: true,
            nazev: true
          }
        },
        auto: {
          select: {
            id: true,
            spz: true,
            znacka: true,
            model: true
          }
        }
      },
      orderBy: {
        datum: 'desc'
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}