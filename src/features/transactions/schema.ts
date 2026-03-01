import { z } from 'zod'

/**
 * Schema for creating a transaction
 */
export const createTransactionSchema = z.object({
  nazev: z.string().min(1, 'Název je povinný'),
  castka: z.number().refine(value => value !== 0, {
    message: 'Částka musí být kladná nebo záporná',
  }),
  datum: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Neplatný formát data',
  }),
  typ: z.enum(['příjem', 'výdaj']),
  popis: z.string().min(1, 'Popis je povinný'),
  kategorieId: z.number().nullable().optional(),
  autoId: z.number().nullable().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

/**
 * Schema for deleting a transaction
 */
export const deleteTransactionSchema = z.object({
  id: z.number().int().positive('ID transakce je povinné'),
})

export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>

/**
 * Schema for updating a transaction
 */
export const updateTransactionSchema = z.object({
  id: z.number().int().positive('ID transakce je povinné'),
  nazev: z.string().min(1, 'Název je povinný'),
  castka: z.number().refine(value => value !== 0, {
    message: 'Částka musí být kladná nebo záporná',
  }),
  datum: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Neplatný formát data',
  }),
  typ: z.enum(['příjem', 'výdaj']),
  popis: z.string().min(1, 'Popis je povinný'),
  kategorieId: z.number().nullable().optional(),
  autoId: z.number().nullable().optional(),
})

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
