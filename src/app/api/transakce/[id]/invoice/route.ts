import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Add new invoice to transaction */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transakceId = Number(params.id);
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');

    const faktura = await prisma.transakceFaktura.create({
      data: {
        transakceId,
        nazev: file.name,
        typ: file.type,
        obsah: base64String,
      },
    });

    return NextResponse.json({ id: faktura.id, nazev: faktura.nazev });
  } catch (error) {
    console.error('Invoice upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 