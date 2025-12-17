import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const confirmRouteSchema = z.object({
  barcode: z.string().min(1, 'Číslo trasy je povinné'),
  routeName: z.string().optional(),
  routeArea: z.string().optional(),
  stops: z.number().optional(),
})

/**
 * POST /api/driver-login/confirm-route
 * Saves driver route confirmation to the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nejste přihlášeni' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = confirmRouteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Neplatná data', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { barcode, routeName, routeArea, stops } = parsed.data

    // Save route confirmation to DriverRouteLogin
    // Note: This extends the existing login record or creates a new confirmation
    await prisma.driverRouteLogin.create({
      data: {
        ridicEmail: session.user.email || '',
        cisloTrasy: barcode,
        // Store additional route details in a comment or extend the model if needed
      }
    })

    // Optionally, you could create a separate RouteConfirmation model
    // For now, we're using DriverRouteLogin to track confirmations

    return NextResponse.json({
      success: true,
      message: 'Trasa byla potvrzena a uložena'
    })
  } catch (error) {
    console.error('Error confirming route:', error)
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    )
  }
}

