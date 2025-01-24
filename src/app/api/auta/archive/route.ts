import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { ids } = await request.json()

    const archivedVehicles = await prisma.auto.updateMany({
      where: { id: { in: ids } },
      data: { aktivni: false }
    })

    return NextResponse.json({ success: true, data: archivedVehicles })
  } catch (error) {
    console.error('Error archiving vehicles:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
