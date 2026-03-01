'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { createAuthorizedAction } from '@/lib/safe-action'
import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
} from '../schema'

/**
 * Create a new transaction
 * Requires: ADMIN, DISPECER or ACCOUNTANT role
 * Uses scalar autoId for strict 1:N relationship
 */
export const createTransaction = createAuthorizedAction(
  createTransactionSchema,
  ['ADMIN', 'DISPECER', 'ACCOUNTANT'],
  async (data, session) => {
    const transaction = await db.transakce.create({
      data: {
        nazev: data.nazev,
        castka: data.castka,
        datum: new Date(data.datum),
        typ: data.typ,
        popis: data.popis,
        kategorieId: data.kategorieId ?? null,
        autoId: data.autoId ?? null,
      },
      include: {
        kategorie: {
          select: {
            id: true,
            nazev: true,
          },
        },
        auto: {
          select: {
            id: true,
            spz: true,
            znacka: true,
            model: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/transakce')
    return transaction
  }
)

/**
 * Delete a transaction
 * Requires: ADMIN, DISPECER or ACCOUNTANT role
 */
export const deleteTransaction = createAuthorizedAction(
  deleteTransactionSchema,
  ['ADMIN', 'DISPECER', 'ACCOUNTANT'],
  async (data, session) => {
    await db.transakce.delete({
      where: { id: data.id },
    })

    revalidatePath('/dashboard/transakce')
    return { success: true, message: 'Transakce byla úspěšně smazána' }
  }
)

/**
 * Update a transaction
 * Requires: ADMIN or DISPECER role
 * Uses scalar autoId for strict 1:N relationship (no many-to-many)
 */
export const updateTransaction = createAuthorizedAction(
  updateTransactionSchema,
  ['ADMIN', 'DISPECER'],
  async (data, session) => {
    const transaction = await db.transakce.update({
      where: { id: data.id },
      data: {
        nazev: data.nazev,
        castka: data.castka,
        datum: new Date(data.datum),
        typ: data.typ,
        popis: data.popis,
        kategorieId: data.kategorieId ?? null,
        autoId: data.autoId ?? null,
      },
      include: {
        kategorie: {
          select: {
            id: true,
            nazev: true,
          },
        },
        auto: {
          select: {
            id: true,
            spz: true,
            znacka: true,
            model: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/transakce')
    return transaction
  }
)
