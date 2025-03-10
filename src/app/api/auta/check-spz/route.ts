import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spz = searchParams.get('spz');

    if (!spz) {
      return NextResponse.json({ error: 'SPZ parameter is required' }, { status: 400 });
    }

    const existingAuto = await prisma.auto.findFirst({
      where: { spz: spz }
    });

    return NextResponse.json({ exists: !!existingAuto });
  } catch (error) {
    console.error('Error checking SPZ:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 