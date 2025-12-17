'use server'

import { createSafeAction } from '@/lib/safe-action'
import { z } from 'zod'
import { loginSchema, registerSchema } from '@/lib/schemas/auth'

/**
 * Login action (handled by NextAuth, this is a placeholder for future use)
 */
export const login = createSafeAction(
  loginSchema,
  async (data) => {
    // Login is handled by NextAuth API route
    // This action can be used for additional login logic if needed
    return { success: true }
  }
)

/**
 * Register action (if needed in the future)
 */
export const register = createSafeAction(
  registerSchema,
  async (data) => {
    // Registration logic would go here
    // For now, this is a placeholder
    throw new Error('Registrace není momentálně dostupná')
  }
)


