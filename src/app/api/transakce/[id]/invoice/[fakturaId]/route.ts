import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Download or view single invoice */
export async function GET(
  request: Request,
  { params }: { params: { id: string; fakturaId: string } }
) {
  try {
    const transakceId = Number(params.id);
    const fakturaId = Number(params.fakturaId);
    const { searchParams } = new URL(request.url);
    const asAttachment = searchParams.get('download') === '1';

    const faktura = await prisma.transakceFaktura.findFirst({
      where: { id: fakturaId, transakceId },
    });

    if (!faktura) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const buffer = Buffer.from(faktura.obsah, 'base64');
    const disposition = asAttachment
      ? `attachment; filename="${faktura.nazev}"`
      : `inline; filename="${faktura.nazev}"`;
    return new Response(buffer, {
      headers: {
        'Content-Type': faktura.typ || 'application/octet-stream',
        'Content-Disposition': disposition,
      },
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return NextResponse.json(
      { error: 'Failed to download invoice' },
      { status: 500 }
    );
  }
}

/** Replace invoice file */
export async function PUT(
  request: Request,
  { params }: { params: { id: string; fakturaId: string } }
) {
  try {
    const transakceId = Number(params.id);
    const fakturaId = Number(params.fakturaId);

    const existing = await prisma.transakceFaktura.findFirst({
      where: { id: fakturaId, transakceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64String = Buffer.from(bytes).toString('base64');

    await prisma.transakceFaktura.update({
      where: { id: fakturaId },
      data: { nazev: file.name, typ: file.type, obsah: base64String },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error replacing invoice:', error);
    return NextResponse.json(
      { error: 'Failed to replace invoice' },
      { status: 500 }
    );
  }
}

/** Remove invoice */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; fakturaId: string } }
) {
  try {
    const transakceId = Number(params.id);
    const fakturaId = Number(params.fakturaId);

    const deleted = await prisma.transakceFaktura.deleteMany({
      where: { id: fakturaId, transakceId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
