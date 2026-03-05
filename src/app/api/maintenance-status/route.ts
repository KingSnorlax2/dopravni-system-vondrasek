import { NextResponse } from 'next/server'
import { isMaintenanceModeEnabled } from '@/features/settings/queries'

export async function GET() {
  try {
    const maintenanceMode = await isMaintenanceModeEnabled()
    return NextResponse.json({ maintenanceMode })
  } catch (error) {
    console.error('Error fetching maintenance status:', error)
    return NextResponse.json(
      { maintenanceMode: false },
      { status: 500 }
    )
  }
}
