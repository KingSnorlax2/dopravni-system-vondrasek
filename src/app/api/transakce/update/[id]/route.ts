import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();

    const updatedTransaction = await prisma.transakce.update({
      where: { id: Number(id) },
      data: {
        nazev: data.nazev,
        castka: data.castka,
        datum: new Date(data.datum),
        typ: data.typ,
        popis: data.popis,
        autoId: data.autoId
      },
      include: {
        auto: {
          select: {
            id: true,
            spz: true,
            znacka: true,
            model: true
          }
        }
      }
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}   