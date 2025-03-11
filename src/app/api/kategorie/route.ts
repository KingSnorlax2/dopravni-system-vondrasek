import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.kategorie.findMany({
      orderBy: { nazev: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categories } = await request.json();
    
    const createdCategories = await Promise.all(
      categories.map((nazev: string) =>
        prisma.kategorie.create({ data: { nazev } })
      )
    );
    
    return NextResponse.json(createdCategories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create categories' }, { status: 500 });
  }
} 