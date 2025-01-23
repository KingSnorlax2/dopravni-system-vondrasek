import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fotka = await prisma.fotka.findUnique({
      where: { id: params.id }
    })

    if (!fotka) {
      return NextResponse.json({ error: 'Fotka nenalezena' }, { status: 404 })
    }

    // Převedení Base64 zpět na buffer
    const buffer = Buffer.from(fotka.data, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fotka.mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Chyba při načítání fotky:', error)
    return NextResponse.json({ error: 'Chyba při načítání fotky' }, { status: 500 })
  }
}