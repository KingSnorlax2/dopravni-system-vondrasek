import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
  category: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "boolean", "select"]),
  options: z.any().optional()
});

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { category: 'asc' }
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při načítání nastavení' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const validationResult = settingSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Neplatná data' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.update({
      where: { key: data.key },
      data: validationResult.data
    });

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json(
      { error: 'Chyba při aktualizaci nastavení' },
      { status: 500 }
    );
  }
} 