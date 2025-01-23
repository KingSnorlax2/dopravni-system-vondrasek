import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const transakceSchema = z.object({
  id: z.number().optional(),
  nazev: z.string().min(1, 'Název je povinný'),
  castka: z.number().refine(value => value !== 0, {
    message: 'Částka musí být kladná nebo záporná',
  }),
  datum: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Neplatný formát data',
  }),
  typ: z.string().min(1, 'Typ transakce je povinný'),
  popis: z.string().min(1, 'Popis je povinný'),
  autoId: z.number().nullable().optional()
});

export async function GET() {
  try {
    const transakce = await prisma.transakce.findMany({
      orderBy: {
        datum: 'desc',
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
    console.error('Chyba při načítání transakcí:', error);
    return NextResponse.json(
      { error: 'Chyba při načítání transakcí' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validationResult = transakceSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const transakce = await prisma.transakce.create({
      data: {
        ...validationResult.data,
        datum: new Date(validationResult.data.datum)
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

    return NextResponse.json({ success: true, data: transakce });
  } catch (error) {
    console.error('Chyba při vytváření transakce:', error);
    return NextResponse.json(
      { error: 'Chyba při vytváření transakce' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const validationResult = transakceSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const id = validationResult.data.id;
    const transakce = await prisma.transakce.update({
      where: { id },
      data: {
        ...validationResult.data,
        datum: new Date(validationResult.data.datum)
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

    return NextResponse.json({ success: true, data: transakce });
  } catch (error) {
    console.error('Chyba při aktualizaci transakce:', error);
    return NextResponse.json(
      { error: 'Chyba při aktualizaci transakce' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.transakce.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při odstraňování transakce:', error);
    return NextResponse.json(
      { error: 'Chyba při odstraňování transakce' },
      { status: 500 }
    );
  }
}