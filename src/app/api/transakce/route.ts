import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const config = {
  api: {
    bodyParser: false,
  },
};

const autoSchema = z.object({
  id: z.number().optional(),
  nazev: z.string().min(1, 'Název je povinný'),
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
        datum: 'desc',
      },
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