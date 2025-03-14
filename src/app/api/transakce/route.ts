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
  kategorieId: z.number().nullable().optional(),
});

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
        Auto: {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = transakceSchema.parse(body);
    
    const newTransaction = await prisma.transakce.create({
      data: {
        nazev: validatedData.nazev,
        castka: validatedData.castka,
        datum: new Date(validatedData.datum),
        typ: validatedData.typ,
        popis: validatedData.popis,
        faktura: validatedData.faktura,
        // Ensure the category relationship is properly established
        ...(validatedData.kategorieId ? {
          kategorie: {
            connect: { id: validatedData.kategorieId }
          }
        } : {}),
        // Handle the auto relationship if needed
        ...(validatedData.autoId ? {
          Auto: {
            connect: { id: validatedData.autoId }
          }
        } : {})
      },
      // Include the category in the response
      include: {
        kategorie: {
          select: {
            id: true,
            nazev: true
          }
        },
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
    
    return NextResponse.json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
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
        kategorieId: data.kategorieId
      },
      include: {
        auto: {
          select: {
            spz: true,
            znacka: true,
            model: true
          }
        },
        kategorie: {
          select: {
            id: true,
            nazev: true
          }
        }
      }
    });

    return NextResponse.json({ data: transakce });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating transaction:', error.message);
      return NextResponse.json({ 
        error: `Nepodařilo se aktualizovat transakci: ${error.message}` 
      }, { status: 500 });
    }
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

    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return NextResponse.json({ 
        error: 'Neplatné ID transakce' 
      }, { status: 400 });
    }

    await prisma.transakce.delete({
      where: { id: numericId }
    });

    return NextResponse.json({ 
      message: 'Transakce byla úspěšně smazána' 
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ 
      error: 'Nepodařilo se smazat transakci' 
    }, { status: 500 });
  }
}