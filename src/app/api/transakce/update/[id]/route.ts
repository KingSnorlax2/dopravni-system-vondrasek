import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    console.log('Update data received:', data);

    const castka = Number(data.castka);

    const updatedTransaction = await prisma.transakce.update({
      where: { id: Number(id) },
      data: {
        nazev: data.nazev,
        castka: castka,
        datum: new Date(data.datum),
        typ: castka >= 0 ? 'příjem' : 'výdaj',
        popis: data.popis,
        kategorieId: data.kategorieId,
        Auto: data.autoId ? {
          connect: [{ id: Number(data.autoId) }]
        } : undefined
      },
      include: {
        kategorie: true,
        Auto: {
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
    return NextResponse.json({ 
      error: 'Nepodařilo se aktualizovat transakci' 
    }, { status: 500 });
  }
}   