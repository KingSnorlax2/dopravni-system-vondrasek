/**
 * EXAMPLE: Protected API Route using auth-guard utilities
 * 
 * This shows how to secure the existing /api/auta route
 * Copy this pattern to your actual route.ts file
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateUserSession, authorizeRole, createErrorResponse } from "@/lib/auth-guard"
import { Role } from "@prisma/client"
import { z } from "zod"

// Example: Vehicle creation schema
const createVehicleSchema = z.object({
  spz: z.string().min(7).max(8),
  znacka: z.string().min(2),
  model: z.string().min(1),
  rokVyroby: z.number().min(1900),
  najezd: z.number().min(0),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
})

/**
 * GET /api/auta
 * Get all vehicles - requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Validate user is logged in
    const session = await validateUserSession()
    
    // Optional: Check if user has specific role
    // Only ADMIN and DISPECER can view all vehicles
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.DISPECER) {
      return NextResponse.json(
        { error: "Nemáte oprávnění k zobrazení vozidel" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get("showAll") === "true"

    const auta = await prisma.auto.findMany({
      where: showAll ? undefined : { aktivni: true },
      orderBy: { id: "desc" },
    })

    return NextResponse.json(auta)
  } catch (error: any) {
    return createErrorResponse(error)
  }
}

/**
 * POST /api/auta
 * Create new vehicle - requires ADMIN or DISPECER role
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Validate user is logged in AND has required role
    const session = await authorizeRole([Role.ADMIN, Role.DISPECER])

    const body = await request.json()
    
    // ✅ Validate input data
    const validatedData = createVehicleSchema.parse(body)

    // ✅ Check for duplicate SPZ
    const existingAuto = await prisma.auto.findUnique({
      where: { spz: validatedData.spz },
    })

    if (existingAuto) {
      return NextResponse.json(
        { error: "Vozidlo s touto SPZ již existuje" },
        { status: 400 }
      )
    }

    // ✅ Create vehicle
    const vehicle = await prisma.auto.create({
      data: {
        ...validatedData,
        aktivni: true,
      },
    })

    return NextResponse.json(
      { success: true, data: vehicle },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.errors },
        { status: 400 }
      )
    }
    return createErrorResponse(error)
  }
}


