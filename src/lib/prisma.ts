import 'server-only'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client with Soft Delete Extensions
 * 
 * Automatically handles soft delete for models with `aktivni` field:
 * - `delete()` → `update({ aktivni: false })`
 * - `deleteMany()` → `updateMany({ aktivni: false })`
 * - `findMany()`, `findFirst()`, `findUnique()` → automatically filter `aktivni: true`
 * 
 * To bypass soft delete (e.g., for admin operations), use:
 * - `db.auto.findMany({ where: { aktivni: false } })` // Get inactive
 * - `prisma.auto.delete({ where: { id } })` // Use base client for hard delete
 * 
 * ⚠️ IMPORTANT: This file can ONLY be imported in Server Components, Server Actions, or API Routes.
 * It will throw an error if imported in Client Components.
 */

// Runtime check to prevent browser execution (additional safety)
if (typeof window !== 'undefined') {
  throw new Error(
    'Prisma Client cannot be used in the browser. This file should only be imported in Server Components, Server Actions, or API Routes.'
  )
}

// Import singleton Prisma Client from db.ts
import { db as basePrismaSingleton } from './db'

// Base Prisma Client (for hard deletes and special cases)
// Use singleton to prevent connection pool exhaustion
const basePrisma = basePrismaSingleton

// Models that support soft delete (have `aktivni` field)
const SOFT_DELETE_MODELS = ['auto'] as const
type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number]

/**
 * Check if a model supports soft delete
 */
function supportsSoftDelete(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel)
}

// Create singleton for extended client to prevent multiple instances
const globalForExtendedPrisma = global as unknown as { extendedPrisma: ReturnType<typeof basePrisma.$extends<{}>> | undefined }

/**
 * Create extended Prisma Client with Soft Delete middleware
 * Uses Prisma Client Extensions API
 */
const createExtendedClient = () => basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }: any) {
        // Only apply soft delete filter if model supports it
        if (supportsSoftDelete(model)) {
          // Check if user explicitly wants inactive records
          const wantsInactive = args?.where?.aktivni === false
          
          // If not explicitly requesting inactive, filter to active only
          if (!wantsInactive && args?.where?.aktivni === undefined) {
            args.where = {
              ...args.where,
              aktivni: true
            }
          }
        }
        
        return query(args)
      },
      
      async findFirst({ model, operation, args, query }: any) {
        // Only apply soft delete filter if model supports it
        if (supportsSoftDelete(model)) {
          const wantsInactive = args?.where?.aktivni === false
          
          if (!wantsInactive && args?.where?.aktivni === undefined) {
            args.where = {
              ...args.where,
              aktivni: true
            }
          }
        }
        
        return query(args)
      },
      
      async findUnique({ model, operation, args, query }: any) {
        // For findUnique, fetch first, then check aktivni
        if (supportsSoftDelete(model)) {
          const result = await query(args)
          
          // If result exists but is inactive, return null (unless explicitly requested)
          if (result && result.aktivni === false) {
            return null
          }
          
          return result
        }
        
        return query(args)
      },
      
      async delete({ model, operation, args, query }: any) {
        // Convert delete to soft delete (update aktivni: false)
        if (supportsSoftDelete(model)) {
          // Soft delete: update instead of delete
          return (basePrisma as any)[model].update({
            where: args.where,
            data: { aktivni: false }
          })
        }
        
        // For models without soft delete, perform actual delete
        return query(args)
      },
      
      async deleteMany({ model, operation, args, query }: any) {
        // Convert deleteMany to updateMany (set aktivni: false)
        if (supportsSoftDelete(model)) {
          // Soft delete: updateMany instead of deleteMany
          return (basePrisma as any)[model].updateMany({
            where: args.where,
            data: { aktivni: false }
          })
        }
        
        // For models without soft delete, perform actual delete
        return query(args)
      }
    }
  }
})

// Use singleton pattern for extended client to prevent connection pool exhaustion
export const db = globalForExtendedPrisma.extendedPrisma || createExtendedClient()

// Store extended client in global for singleton pattern (development only)
if (process.env.NODE_ENV !== 'production') {
  globalForExtendedPrisma.extendedPrisma = db
}

// Export base client for special cases (e.g., hard deletes, migrations)
export const prisma = basePrisma

// Type helper for extended client
export type ExtendedPrismaClient = typeof db
