/**
 * EXAMPLE: Protected Server Actions using auth-guard utilities
 * 
 * This shows how to secure Server Actions
 * Copy this pattern to your actual actions files
 */

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { validateUserSession, authorizeRole } from "@/lib/auth-guard"
import { Role } from "@prisma/client"
import { z } from "zod"

// Vehicle creation schema
const createVehicleSchema = z.object({
  spz: z.string().min(7).max(8),
  znacka: z.string().min(2),
  model: z.string().min(1),
  rokVyroby: z.number().min(1900),
  najezd: z.number().min(0),
  stav: z.enum(["aktivní", "servis", "vyřazeno"]),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

/**
 * Create a new vehicle
 * Requires: ADMIN or DISPECER role
 */
export async function createVehicle(data: CreateVehicleInput) {
  try {
    // ✅ Validate user is logged in AND has required role
    const session = await authorizeRole([Role.ADMIN, Role.DISPECER])

    // ✅ Validate input
    const validatedData = createVehicleSchema.parse(data)

    // ✅ Check for duplicate SPZ
    const existingAuto = await prisma.auto.findUnique({
      where: { spz: validatedData.spz },
    })

    if (existingAuto) {
      return {
        success: false,
        error: "Vozidlo s touto SPZ již existuje",
      }
    }

    // ✅ Create vehicle
    const vehicle = await prisma.auto.create({
      data: {
        ...validatedData,
        aktivni: true,
      },
    })

    // ✅ Revalidate cache
    revalidatePath("/dashboard/auta")
    revalidatePath("/api/auta")

    return {
      success: true,
      data: vehicle,
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Neplatná data",
        errors: error.flatten().fieldErrors,
      }
    }

    // Auth errors are already handled by authorizeRole
    // But we can return user-friendly messages
    if (error.name === "AuthenticationError" || error.name === "AuthorizationError") {
      return {
        success: false,
        error: error.message,
      }
    }

    console.error("Error creating vehicle:", error)
    return {
      success: false,
      error: "Nastala chyba při vytváření vozidla",
    }
  }
}

/**
 * Delete a vehicle
 * Requires: ADMIN role only
 */
export async function deleteVehicle(vehicleId: number) {
  try {
    // ✅ Only ADMIN can delete vehicles
    const session = await authorizeRole([Role.ADMIN])

    // ✅ Check if vehicle exists
    const vehicle = await prisma.auto.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle) {
      return {
        success: false,
        error: "Vozidlo nebylo nalezeno",
      }
    }

    // ✅ Soft delete (set aktivni to false)
    await prisma.auto.update({
      where: { id: vehicleId },
      data: { aktivni: false },
    })

    // ✅ Revalidate cache
    revalidatePath("/dashboard/auta")
    revalidatePath("/api/auta")

    return {
      success: true,
      message: "Vozidlo bylo úspěšně smazáno",
    }
  } catch (error: any) {
    if (error.name === "AuthenticationError" || error.name === "AuthorizationError") {
      return {
        success: false,
        error: error.message,
      }
    }

    console.error("Error deleting vehicle:", error)
    return {
      success: false,
      error: "Nastala chyba při mazání vozidla",
    }
  }
}

/**
 * Get vehicles (any authenticated user can view)
 * No role restriction - just requires login
 */
export async function getVehicles() {
  try {
    // ✅ Just validate user is logged in (no role check)
    const session = await validateUserSession()

    const vehicles = await prisma.auto.findMany({
      where: { aktivni: true },
      orderBy: { id: "desc" },
    })

    return {
      success: true,
      data: vehicles,
    }
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return {
        success: false,
        error: error.message,
      }
    }

    console.error("Error fetching vehicles:", error)
    return {
      success: false,
      error: "Nastala chyba při načítání vozidel",
      data: [],
    }
  }
}


