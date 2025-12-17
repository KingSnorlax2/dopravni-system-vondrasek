import { z } from 'zod'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'

/**
 * Result type for safe actions
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string[]> }

/**
 * Creates a type-safe Server Action with automatic validation and error handling
 * 
 * @param schema - Zod schema for input validation
 * @param handler - Async function that processes the validated input
 * @returns Server Action function
 * 
 * @example
 * ```typescript
 * const createVehicle = createSafeAction(
 *   createVehicleSchema,
 *   async (data) => {
 *     const vehicle = await db.auto.create({ data })
 *     return vehicle
 *   }
 * )
 * 
 * // Usage in component
 * const result = await createVehicle(formData)
 * if (result.success) {
 *   // Handle success
 * } else {
 *   // Handle error
 *   console.error(result.error, result.fields)
 * }
 * ```
 */
export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (input: unknown): Promise<ActionResult<TOutput>> => {
    try {
      // Step 1: Validate input with Zod
      const validationResult = schema.safeParse(input)
      
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Chyba validace',
          fields: validationResult.error.flatten().fieldErrors,
        }
      }

      // Step 2: Execute handler with validated input
      const data = await handler(validationResult.data)

      // Step 3: Return success result
      return {
        success: true,
        data,
      }
    } catch (error) {
      // Step 4: Handle redirect errors (must re-throw)
      if (isRedirectError(error)) {
        throw error
      }

      // Step 5: Handle other errors
      console.error('Safe action error:', error)
      
      // Check if it's a known error type
      if (error instanceof Error) {
        // Check for authentication/authorization errors
        if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
          return {
            success: false,
            error: error.message || 'Neautorizovaný přístup',
          }
        }
        
        // Check for Prisma errors
        if (error instanceof Error && 'code' in error) {
          // Prisma error
          if ((error as any).code === 'P2002') {
            return {
              success: false,
              error: 'Záznam s těmito údaji již existuje',
            }
          }
        }
        
        return {
          success: false,
          error: error.message || 'Interní chyba serveru',
        }
      }

      // Step 6: Generic error fallback
      return {
        success: false,
        error: 'Interní chyba serveru',
      }
    }
  }
}

/**
 * Helper to create safe action with authentication check
 * 
 * @example
 * ```typescript
 * const createVehicle = createAuthenticatedAction(
 *   createVehicleSchema,
 *   async (data, session) => {
 *     // session is guaranteed to exist
 *     const vehicle = await db.auto.create({ data })
 *     return vehicle
 *   }
 * )
 * ```
 */
export function createAuthenticatedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, session: { userId: string; role: string }) => Promise<TOutput>
) {
  return createSafeAction(schema, async (input) => {
    // Import here to avoid circular dependencies
    const { validateUserSession } = await import('@/lib/auth-guard')
    
    const session = await validateUserSession()
    
    return handler(input, {
      userId: session.user.id,
      role: session.user.role,
    })
  })
}

/**
 * Helper to create safe action with role authorization
 * 
 * @example
 * ```typescript
 * const deleteVehicle = createAuthorizedAction(
 *   deleteVehicleSchema,
 *   [UzivatelRole.ADMIN],
 *   async (data, session) => {
 *     // Only ADMIN can execute this
 *     await db.auto.delete({ where: { id: data.id } })
 *   }
 * )
 * ```
 */
export function createAuthorizedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  allowedRoles: string[],
  handler: (input: TInput, session: { userId: string; role: string }) => Promise<TOutput>
) {
  return createSafeAction(schema, async (input) => {
    // Import here to avoid circular dependencies
    const { authorizeRole } = await import('@/lib/auth-guard')
    const { UzivatelRole } = await import('@prisma/client')
    
    // Convert string roles to UzivatelRole enum values
    const roleEnums: any[] = allowedRoles.map(r => {
      // Handle both string and enum values
      if (r === 'ADMIN') return UzivatelRole.ADMIN
      if (r === 'DISPECER') return UzivatelRole.DISPECER
      if (r === 'RIDIC') return UzivatelRole.RIDIC
      return UzivatelRole[r as keyof typeof UzivatelRole]
    }).filter(Boolean)
    
    const session = await authorizeRole(roleEnums)
    
    return handler(input, {
      userId: session.user.id,
      role: session.user.role,
    })
  })
}

