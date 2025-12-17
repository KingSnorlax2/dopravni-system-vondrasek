'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { createSafeAction, createAuthenticatedAction } from '@/lib/safe-action'
import { z } from 'zod'

/**
 * Maintenance creation schema
 */
const createMaintenanceSchema = z.object({
  autoId: z.number().int().positive('ID vozidla musí být kladné číslo'),
  kategorie: z.string().min(1, 'Kategorie je povinná'),
  popis: z.string().min(1, 'Popis je povinný'),
  datum: z.coerce.date({
    required_error: 'Datum je povinné',
    invalid_type_error: 'Neplatné datum',
  }),
  najezd: z.coerce.number({
    required_error: 'Nájezd je povinný',
    invalid_type_error: 'Nájezd musí být číslo',
  }).int('Nájezd musí být celé číslo').min(0, 'Nájezd nemůže být záporný'),
  poznamka: z.string().optional().nullable(),
  cena: z.coerce.number({
    invalid_type_error: 'Cena musí být číslo',
  }).min(0, 'Cena nemůže být záporná').optional().nullable(),
})

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>

/**
 * Create a new maintenance record
 * Requires: Authenticated user
 */
export const createMaintenance = createAuthenticatedAction(
  createMaintenanceSchema,
  async (data, session) => {
    // Check if vehicle exists
    const vehicle = await db.auto.findUnique({
      where: { id: data.autoId },
    })

    if (!vehicle) {
      throw new Error('Vozidlo nebylo nalezeno')
    }

    // Create maintenance record
    const maintenance = await db.udrzba.create({
      data: {
        autoId: data.autoId,
        kategorie: data.kategorie,
        popis: data.popis,
        datum: data.datum,
        najezd: data.najezd,
        poznamka: data.poznamka || null,
        cena: data.cena || null,
      },
    })

    // Update vehicle mileage if new mileage is greater
    if (data.najezd > vehicle.najezd) {
      await db.auto.update({
        where: { id: data.autoId },
        data: { najezd: data.najezd },
      })
    }

    // Revalidate paths
    revalidatePath('/dashboard/udrzba')
    revalidatePath(`/dashboard/auta/${data.autoId}`)

    return maintenance
  }
)

/**
 * Get maintenance records
 */
export const getMaintenance = createSafeAction(
  z.object({
    autoId: z.number().int().positive().optional(),
  }),
  async (data) => {
    const where = data.autoId ? { autoId: data.autoId } : {}

    const maintenance = await db.udrzba.findMany({
      where,
      include: {
        auto: {
          select: {
            id: true,
            spz: true,
            znacka: true,
            model: true,
          },
        },
      },
      orderBy: {
        datum: 'desc',
      },
    })

    return maintenance
  }
)


