'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/prisma'
import { createSafeAction, createAuthorizedAction } from '@/lib/safe-action'
import { createVehicleSchema, updateVehicleSchema, partialUpdateVehicleSchema } from '@/lib/schemas/vehicle'

/**
 * Create a new vehicle
 * Requires: ADMIN or DISPECER role
 */
export const createVehicle = createAuthorizedAction(
  createVehicleSchema,
  ['ADMIN', 'DISPECER'],
  async (data, session) => {
    // Check for duplicate SPZ
    const existingAuto = await db.auto.findUnique({
      where: { spz: data.spz },
    })

    if (existingAuto) {
      throw new Error('Vozidlo s touto SPZ již existuje')
    }

    // Create vehicle
    const vehicle = await db.auto.create({
      data: {
        spz: data.spz,
        znacka: data.znacka,
        model: data.model,
        rokVyroby: data.rokVyroby,
        najezd: data.najezd,
        stav: data.stav,
        poznamka: data.poznamka || null,
        datumSTK: data.datumSTK instanceof Date 
          ? data.datumSTK 
          : data.datumSTK 
            ? new Date(data.datumSTK) 
            : null,
        aktivni: true,
        fotky: data.fotky?.length ? {
          connect: data.fotky.map(foto => ({ id: foto.id }))
        } : undefined
      },
    })

    // Revalidate cache
    revalidatePath('/dashboard/auta')
    revalidatePath('/api/auta')

    return vehicle
  }
)

/**
 * Update a vehicle
 * Requires: ADMIN or DISPECER role
 */
export const updateVehicle = createAuthorizedAction(
  updateVehicleSchema,
  ['ADMIN', 'DISPECER'],
  async (data, session) => {
    // Check for duplicate SPZ (excluding current vehicle)
    if (data.spz) {
      const existingAuto = await db.auto.findFirst({
        where: {
          spz: data.spz,
          id: { not: data.id }
        }
      })

      if (existingAuto) {
        throw new Error('SPZ již existuje')
      }
    }

    // Update vehicle
    const vehicle = await db.auto.update({
      where: { id: data.id },
      data: {
        ...(data.spz && { spz: data.spz }),
        ...(data.znacka && { znacka: data.znacka }),
        ...(data.model && { model: data.model }),
        ...(data.rokVyroby && { rokVyroby: data.rokVyroby }),
        ...(data.najezd !== undefined && { najezd: data.najezd }),
        ...(data.stav && { stav: data.stav }),
        ...(data.poznamka !== undefined && { poznamka: data.poznamka || null }),
        ...(data.datumSTK !== undefined && {
          datumSTK: data.datumSTK instanceof Date 
            ? data.datumSTK 
            : data.datumSTK 
              ? new Date(data.datumSTK) 
              : null
        }),
      }
    })

    // Revalidate cache
    revalidatePath('/dashboard/auta')
    revalidatePath(`/dashboard/auta/${data.id}`)
    revalidatePath('/api/auta')

    return vehicle
  }
)

/**
 * Partial update a vehicle
 * Requires: ADMIN or DISPECER role
 */
export const partialUpdateVehicle = createAuthorizedAction(
  partialUpdateVehicleSchema,
  ['ADMIN', 'DISPECER'],
  async (data, session) => {
    // Check for duplicate SPZ if updating SPZ
    if (data.spz) {
      const existingAuto = await db.auto.findFirst({
        where: {
          spz: data.spz,
          id: { not: data.id }
        }
      })

      if (existingAuto) {
        throw new Error('SPZ již existuje')
      }
    }

    // Build update data (only include defined fields)
    const updateData: any = {}
    if (data.spz !== undefined) updateData.spz = data.spz
    if (data.znacka !== undefined) updateData.znacka = data.znacka
    if (data.model !== undefined) updateData.model = data.model
    if (data.rokVyroby !== undefined) updateData.rokVyroby = data.rokVyroby
    if (data.najezd !== undefined) updateData.najezd = data.najezd
    if (data.stav !== undefined) updateData.stav = data.stav
    if (data.poznamka !== undefined) updateData.poznamka = data.poznamka || null
    if (data.datumSTK !== undefined) {
      updateData.datumSTK = data.datumSTK instanceof Date 
        ? data.datumSTK 
        : data.datumSTK 
          ? new Date(data.datumSTK) 
          : null
    }

    // Update vehicle
    const vehicle = await db.auto.update({
      where: { id: data.id },
      data: updateData
    })

    // Revalidate cache
    revalidatePath('/dashboard/auta')
    revalidatePath(`/dashboard/auta/${data.id}`)
    revalidatePath('/api/auta')

    return vehicle
  }
)

/**
 * Delete a vehicle (soft delete)
 * Requires: ADMIN role only
 * 
 * Note: Uses soft delete via Prisma Extension (aktivni: false)
 */
export const deleteVehicle = createAuthorizedAction(
  updateVehicleSchema.pick({ id: true }),
  ['ADMIN'],
  async (data, session) => {
    // Check if vehicle exists
    const vehicle = await db.auto.findUnique({
      where: { id: data.id },
    })

    if (!vehicle) {
      throw new Error('Vozidlo nebylo nalezeno')
    }

    // Soft delete (Prisma Extension converts delete to update)
    await db.auto.delete({
      where: { id: data.id }
    })

    // Revalidate cache
    revalidatePath('/dashboard/auta')
    revalidatePath('/api/auta')

    return { success: true, message: 'Vozidlo bylo úspěšně smazáno' }
  }
)

/**
 * Get vehicles (any authenticated user can view)
 * No role restriction - just requires login
 */
export const getVehicles = createSafeAction(
  z.object({ includeInactive: z.boolean().optional() }),
  async (data) => {
    const vehicles = await db.auto.findMany({
      where: data.includeInactive ? {} : { aktivni: true },
      orderBy: { id: 'desc' },
      select: {
        id: true,
        spz: true,
        znacka: true,
        model: true,
        rokVyroby: true,
        najezd: true,
        stav: true,
        poznamka: true,
        datumSTK: true,
        aktivni: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Serialize dates
    return vehicles.map(v => ({
      ...v,
      datumSTK: v.datumSTK?.toISOString() || null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    }))
  }
)

