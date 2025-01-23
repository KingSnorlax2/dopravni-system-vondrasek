import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const transakceSchema = z.object({
=======
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const config = {
  api: {
    bodyParser: false,
  },
};

const autoSchema = z.object({
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
  id: z.number().optional(),
  nazev: z.string().min(1, 'Název je povinný'),
  castka: z.number().refine(value => value !== 0, {
    message: 'Částka musí být kladná nebo záporná',
  }),
  datum: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Neplatný formát data',
  }),
<<<<<<< HEAD
  typ: z.string().min(1, 'Typ transakce je povinný'),
  popis: z.string().min(1, 'Popis je povinný'),
  autoId: z.number().nullable().optional()
=======
  typ: z.enum(['příjem', 'výdaj']),
  popis: z.string().min(1, 'Popis je povinný'),
  faktura: z.string().optional(),
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
});

export async function GET() {
  try {
    const transakce = await prisma.transakce.findMany({
      orderBy: {
        datum: 'desc',
      },
<<<<<<< HEAD
      include: {
        auto: {
          select: {
            spz: true,
            znacka: true,
            model: true
          }
        }
      }
=======
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
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
<<<<<<< HEAD
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

=======
    const data = await request.formData();
    const transakce = await prisma.transakce.create({
      data: {
        nazev: data.get('nazev') as string,
        castka: parseFloat(data.get('castka') as string),
        datum: new Date(data.get('datum') as string),
        typ: data.get('typ') as string,
        popis: data.get('popis') as string,
      },
    });
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
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
<<<<<<< HEAD
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

=======
    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    
    const transakce = await prisma.transakce.update({
      where: { id },
      data: {
        nazev: data.get('nazev') as string,
        castka: parseFloat(data.get('castka') as string),
        datum: new Date(data.get('datum') as string),
        typ: data.get('typ') as string,
        popis: data.get('popis') as string,
      },
    });
>>>>>>> 7e02d48523526290cb22bf0affaeb4e0806d8d6f
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