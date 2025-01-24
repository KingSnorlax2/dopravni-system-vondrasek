import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Transakce } from '@/types/transakce';

const transakceSchema = z.object({
  id: z.number().optional(),
  nazev: z.string().min(1, 'Název je povinný'),
  autoId: z.number().nullable().optional(),
  castka: z.number().refine(value => value !== 0, {
    message: 'Částka musí být kladná nebo záporná',
  }),
  datum: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Neplatný formát data',
  }),
  typ: z.enum(['příjem', 'výdaj']),
  popis: z.string().min(1, 'Popis je povinný'),
  faktura: z.string().optional(),
});

export async function GET() {
  try {
    const transakce = await prisma.transakce.findMany({
      orderBy: {
        datum: 'desc'
      },
      include: {
        auto: {
          select: {
            spz: true,
            znacka: true,
            model: true
          }
        }
      }
    });
    return NextResponse.json(transakce);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ 
      error: 'Nepodařilo se načíst transakce' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validationResult = transakceSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.errors[0].message 
      }, { status: 400 });
    }

    const transakce = await prisma.transakce.create({
      data: {
        nazev: data.nazev,
        autoId: data.autoId,
        castka: data.castka,
        datum: new Date(data.datum),
        typ: data.typ,
        popis: data.popis,
        faktura: data.faktura
      },
      include: {
        auto: {
          select: {
            spz: true,
            znacka: true,
            model: true
          }
        }
      }
    });

    return NextResponse.json({ data: transakce });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ 
      error: 'Nepodařilo se vytvořit transakci' 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const validationResult = transakceSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.errors[0].message 
      }, { status: 400 });
    }

    const transakce = await prisma.transakce.update({
      where: { id: data.id },
      data: {
        nazev: data.nazev,
        autoId: data.autoId,
        castka: data.castka,
        datum: new Date(data.datum),
        typ: data.typ,
        popis: data.popis,
        faktura: data.faktura
      },
      include: {
        auto: {
          select: {
            spz: true,
            znacka: true,
            model: true
          }
        }
      }
    });

    return NextResponse.json({ data: transakce });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ 
      error: 'Nepodařilo se aktualizovat transakci' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'ID transakce je povinné' 
      }, { status: 400 });
    }

    await prisma.transakce.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Transakce byla úspěšně smazána' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ 
      error: 'Nepodařilo se smazat transakci' 
    }, { status: 500 });
  }
}