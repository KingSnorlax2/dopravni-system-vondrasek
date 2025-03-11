import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Delete categories with IDs 13, 15, and 16
    await prisma.kategorie.deleteMany({
      where: {
        id: {
          in: [13, 15, 16]
        }
      }
    });

    return NextResponse.json({ message: 'Categories deleted successfully' });
  } catch (error) {
    console.error('Error deleting categories:', error);
    return NextResponse.json({ error: 'Failed to delete categories' }, { status: 500 });
  }
} 