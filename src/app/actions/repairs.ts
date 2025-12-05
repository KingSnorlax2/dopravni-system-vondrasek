'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Zod schema for repair creation
const createRepairSchema = z.object({
  autoId: z.number().int().positive(),
  kategorie: z.string().min(1, 'Kategorie je povinná'),
  popis: z.string().min(1, 'Popis je povinný'),
  datum: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val
    return new Date(val)
  }),
  najezd: z.number().int().min(0, 'Nájezd nemůže být záporný'),
  poznamka: z.string().optional().nullable(),
  cena: z.number().min(0, 'Cena nemůže být záporná').optional().nullable(),
})

export type CreateRepairInput = z.infer<typeof createRepairSchema>

export async function createRepair(data: CreateRepairInput) {
  try {
    // Validate input
    const validatedData = createRepairSchema.parse(data)

    // Check if car exists
    const car = await prisma.auto.findUnique({
      where: { id: validatedData.autoId },
    })

    if (!car) {
      return {
        success: false,
        error: 'Vozidlo nebylo nalezeno',
      }
    }

    // Create repair
    const repair = await prisma.oprava.create({
      data: {
        autoId: validatedData.autoId,
        kategorie: validatedData.kategorie,
        popis: validatedData.popis,
        datum: validatedData.datum,
        najezd: validatedData.najezd,
        poznamka: validatedData.poznamka || null,
        cena: validatedData.cena || null,
      },
    })

    // Side effect: Update car mileage if new mileage is greater
    if (validatedData.najezd > car.najezd) {
      await prisma.auto.update({
        where: { id: validatedData.autoId },
        data: { najezd: validatedData.najezd },
      })
    }

    // Revalidate paths
    revalidatePath('/dashboard/opravy')
    revalidatePath(`/dashboard/auta/${validatedData.autoId}`)

    return {
      success: true,
      data: repair,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Neplatná data',
        errors: error.flatten().fieldErrors,
      }
    }

    console.error('Error creating repair:', error)
    return {
      success: false,
      error: 'Nastala chyba při vytváření opravy',
    }
  }
}

export async function getRepairs(autoId?: number) {
  try {
    const where = autoId ? { autoId } : undefined

    const repairs = await prisma.oprava.findMany({
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

    return {
      success: true,
      data: repairs,
    }
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return {
      success: false,
      error: 'Nastala chyba při načítání oprav',
      data: [],
    }
  }
}
