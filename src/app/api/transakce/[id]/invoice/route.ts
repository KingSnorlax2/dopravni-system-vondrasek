import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handle file upload
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');

    // Store in database
    const transaction = await prisma.transakce.update({
      where: { id: Number(id) },
      data: {
        faktura: base64String,
        fakturaTyp: file.type,
        fakturaNazev: file.name
      }
    });

    return NextResponse.json({
      ...transaction,
      faktura: Boolean(transaction.faktura)
    });
  } catch (error) {
    console.error('Detailed upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle file download
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transakce.findUnique({
      where: { id: Number(params.id) }
    });

    if (!transaction?.faktura) {
      return NextResponse.json(
        { error: 'No invoice found' },
        { status: 404 }
      );
    }

    return new Response(transaction.faktura, {
      headers: {
        'Content-Type': transaction.fakturaTyp || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${transaction.fakturaNazev}"`,
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

// Helper function to get file extension
function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 1);
} 