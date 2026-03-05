import { NextResponse } from 'next/server'
import { getDefaultPageSize } from '@/features/settings/queries'

export async function GET() {
  try {
    const defaultPageSize = await getDefaultPageSize()
    return NextResponse.json({ defaultPageSize })
  } catch (error) {
    console.error('Error fetching default page size:', error)
    return NextResponse.json(
      { defaultPageSize: 10 },
      { status: 500 }
    )
  }
}
