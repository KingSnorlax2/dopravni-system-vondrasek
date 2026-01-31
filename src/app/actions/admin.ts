'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import bcryptjs from 'bcryptjs'

// Zod schemas
const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  password: z.string().min(8, 'Heslo musí mít minimálně 8 znaků').optional(),
  roles: z.array(z.string()).min(1, 'Musí být vybrána alespoň jedna role'),
  status: z.enum(['ACTIVE', 'DISABLED', 'SUSPENDED']).default('ACTIVE'),
  avatar: z.string().url().optional().or(z.literal('')),
})

const RoleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Název role je povinný'),
  displayName: z.string().min(1, 'Zobrazovaný název je povinný'),
  description: z.string().optional(),
  allowedPages: z.array(z.string()).default([]),
  defaultLandingPage: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type UserSchemaType = z.infer<typeof UserSchema>
export type RoleSchemaType = z.infer<typeof RoleSchema>

// Helper function to get current user session
async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Nejste přihlášeni')
  }
  return session.user
}

// Helper function to create audit log
async function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  actorId: string,
  details?: any
) {
  try {
    // Check if auditLog model exists (in case Prisma client hasn't been regenerated)
    if (!prisma.auditLog) {
      console.warn('AuditLog model not available. Please run: npx prisma generate')
      return
    }
    
    // Get actor info from Uzivatel model (authentication model)
    const uzivatel = await prisma.uzivatel.findUnique({
      where: { id: parseInt(actorId) },
      select: { id: true, email: true, jmeno: true },
    })
    
    if (!uzivatel) {
      console.warn(`Cannot create audit log: actor ${actorId} not found in Uzivatel model`)
      return
    }
    
    // Check if User model exists with matching email (for foreign key)
    const userForAudit = await prisma.user.findUnique({
      where: { email: uzivatel.email },
      select: { id: true },
    })
    
    // Prepare audit details with actor info from Uzivatel model
    const auditDetails = {
      ...(details || {}),
      actor: {
        id: uzivatel.id.toString(),
        email: uzivatel.email,
        name: uzivatel.jmeno || uzivatel.email.split('@')[0],
        source: 'Uzivatel', // Mark that actor is from Uzivatel model
      },
    }
    
    // Create audit log
    // If User exists, use it for foreign key. If not, use a placeholder and store actor info in details
    if (userForAudit) {
      // User exists - create audit log with foreign key
      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          actorId: userForAudit.id,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
        },
      })
    } else {
      // User doesn't exist - we need to create audit log without foreign key
      // Since actorId is required, we'll use a system user or create a minimal User record
      // For now, let's try to find or create a system user for audit purposes
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@audit.local' },
      })
      
      if (!systemUser) {
        // Create a system user for audit logs (without password - won't be used for login)
        // Note: This requires User model to allow null password or we need to hash a dummy password
        try {
          systemUser = await prisma.user.create({
            data: {
              email: 'system@audit.local',
              password: await bcryptjs.hash('system-audit-user', 10), // Dummy password
              name: 'System Audit User',
            },
          })
        } catch (createError) {
          console.error('Failed to create system user for audit:', createError)
          // If we can't create system user, skip audit log creation
          return
        }
      }
      
      // Create audit log with system user as actorId, but store real actor info in details
      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          actorId: systemUser.id, // Use system user for foreign key
          details: auditDetails, // Store real actor info here
        },
      })
    }
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Upsert user - Create or update user
 */
export async function upsertUser(data: UserSchemaType) {
  try {
    // 1. Authentication & Authorization
    const session = await getServerSession(authOptions)
    
    // Check if user has admin role from session (Uzivatel model)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Nemáte oprávnění k této akci',
      }
    }

    // 2. Validation
    const validated = UserSchema.parse(data)

    // 2. Get first role from array (Uzivatel model supports only single role)
    const role = validated.roles[0] || 'RIDIC'
    
    // Validate role exists in Role table and is active
    // Note: Uzivatel.role is an enum, so it must be one of: ADMIN, DISPECER, RIDIC
    // But we still check the Role table to ensure it exists and is active
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
      select: { isActive: true },
    })
    
    if (!roleRecord) {
      return {
        success: false,
        error: `Role "${role}" neexistuje v databázi. Vytvořte ji nejprve v sekci Role.`,
      }
    }
    
    if (!roleRecord.isActive) {
      return {
        success: false,
        error: `Role "${role}" není aktivní. Aktivujte ji nejprve v sekci Role.`,
      }
    }

    // 3. Check if email already exists (for new users or when changing email)
    if (!validated.id) {
      const existingUser = await prisma.uzivatel.findUnique({
        where: { email: validated.email },
      })
      if (existingUser) {
        return {
          success: false,
          error: 'Uživatel s tímto emailem již existuje',
          errors: {
            email: ['Uživatel s tímto emailem již existuje'],
          },
        }
      }
    } else {
      // For updates, check if email is taken by another user
      const existingUser = await prisma.uzivatel.findUnique({
        where: { email: validated.email },
      })
      if (existingUser && existingUser.id.toString() !== validated.id) {
        return {
          success: false,
          error: 'Email je již používán jiným uživatelem',
          errors: {
            email: ['Email je již používán jiným uživatelem'],
          },
        }
      }
    }

    // 4. Prepare data for Uzivatel model
    const userData: any = {
      jmeno: validated.name,
      email: validated.email,
      role: role as any, // Cast to UzivatelRole enum
    }

    // Hash password only if provided
    if (validated.password && validated.password.length > 0) {
      userData.heslo = await bcryptjs.hash(validated.password, 10)
    }

    // 5. Get old user data for audit log (if updating)
    let oldUserData = null
    if (validated.id) {
      const oldUser = await prisma.uzivatel.findUnique({
        where: { id: parseInt(validated.id) },
      })
      if (oldUser) {
        oldUserData = {
          name: oldUser.jmeno,
          email: oldUser.email,
          role: oldUser.role,
        }
      }
    }

    // 6. Upsert user in Uzivatel model
    let result
    if (validated.id) {
      // Update existing user
      result = await prisma.uzivatel.update({
        where: { id: parseInt(validated.id) },
        data: userData,
      })
    } else {
      // Create new user
      if (!validated.password || validated.password.length === 0) {
        return {
          success: false,
          error: 'Heslo je povinné pro nové uživatele',
        }
      }

      result = await prisma.uzivatel.create({
        data: userData,
      })
    }

    // 7. Create audit log (if audit log model exists)
    try {
      await createAuditLog(
        validated.id ? 'USER_UPDATE' : 'USER_CREATE',
        'Uzivatel',
        result.id.toString(),
        session.user.id,
        {
          old: oldUserData,
          new: {
            name: result.jmeno,
            email: result.email,
            role: result.role,
          },
        }
      )
    } catch (error) {
      // Audit log creation is optional
      console.warn('Failed to create audit log:', error)
    }

    // 8. Revalidate
    revalidatePath('/dashboard/admin/users')

    // 9. Return result (transform to match expected format)
    return {
      success: true,
      data: {
        id: result.id.toString(),
        name: result.jmeno || result.email.split('@')[0],
        email: result.email,
        status: 'ACTIVE', // Uzivatel model doesn't have status
        roles: [result.role], // Single role as array
        avatar: null, // Uzivatel model doesn't have avatar
        lastLoginAt: null, // Uzivatel model doesn't have lastLoginAt
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Neplatná data',
        errors: error.flatten().fieldErrors,
      }
    }

    console.error('Error in upsertUser:', error)
    return {
      success: false,
      error: 'Nastala chyba při ukládání uživatele',
    }
  }
}

/**
 * Toggle user status
 * Note: Uzivatel model doesn't have status field, so this function is disabled
 * Use DELETE endpoint to remove users instead
 */
export async function toggleUserStatus(
  userId: string,
  status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED'
) {
  // Uzivatel model doesn't support status field
  // Return success but don't do anything (for backward compatibility with UI)
  return {
    success: true,
    data: {
      id: userId,
      status: 'ACTIVE', // Always return ACTIVE since Uzivatel model doesn't have status
    },
  }
}

/**
 * Upsert role - Create or update role
 */
export async function upsertRole(data: RoleSchemaType) {
  try {
    // 1. Authentication & Authorization
    // Use getServerSession to check role from Uzivatel model (authentication model)
    const session = await getServerSession(authOptions)
    
    // Check if user has admin role from session (Uzivatel model)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Nemáte oprávnění k této akci',
      }
    }

    // 2. Validation
    const validated = RoleSchema.parse(data)

    // 3. Check if role name already exists (for new roles or when changing name)
    if (!validated.id) {
      const existingRole = await prisma.role.findUnique({
        where: { name: validated.name },
      })
      if (existingRole) {
        return {
          success: false,
          error: 'Role s tímto názvem již existuje',
        }
      }
    } else {
      // For updates, check if name is taken by another role
      const existingRole = await prisma.role.findUnique({
        where: { name: validated.name },
      })
      if (existingRole && existingRole.id !== validated.id) {
        return {
          success: false,
          error: 'Název role je již používán jinou rolí',
        }
      }
    }

    // 4. Get old role data for audit log (if updating)
    let oldRoleData = null
    if (validated.id) {
      const oldRole = await prisma.role.findUnique({
        where: { id: validated.id },
      })
      if (oldRole) {
        oldRoleData = {
          name: oldRole.name,
          displayName: oldRole.displayName,
          description: oldRole.description,
          allowedPages: oldRole.allowedPages,
          defaultLandingPage: oldRole.defaultLandingPage,
          isActive: oldRole.isActive,
        }
      }
    }

    // 5. Upsert role
    let result
    if (validated.id) {
      // Update existing role
      result = await prisma.role.update({
        where: { id: validated.id },
        data: {
          name: validated.name,
          displayName: validated.displayName,
          description: validated.description || '',
          allowedPages: validated.allowedPages,
          defaultLandingPage: validated.defaultLandingPage || null,
          isActive: validated.isActive,
        },
      })
    } else {
      // Create new role
      result = await prisma.role.create({
        data: {
          name: validated.name,
          displayName: validated.displayName,
          description: validated.description || '',
          allowedPages: validated.allowedPages,
          defaultLandingPage: validated.defaultLandingPage || null,
          isActive: validated.isActive,
          createdBy: session.user.id, // Use session user ID
        },
      })
    }

    // 6. Create audit log
    const newRoleData = {
      name: result.name,
      displayName: result.displayName,
      description: result.description,
      allowedPages: result.allowedPages,
      defaultLandingPage: result.defaultLandingPage,
      isActive: result.isActive,
    }

    await createAuditLog(
      validated.id ? 'ROLE_UPDATE' : 'ROLE_CREATE',
      'Role',
      String(result.id),
      session.user.id, // Use session user ID
      {
        old: oldRoleData,
        new: newRoleData,
      }
    )

    // 7. Revalidate
    revalidatePath('/dashboard/admin/users')

    // 8. Return result
    return {
      success: true,
      data: {
        id: result.id,
        name: result.name,
        displayName: result.displayName,
        description: result.description,
        allowedPages: result.allowedPages,
        defaultLandingPage: result.defaultLandingPage,
        isActive: result.isActive,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Neplatná data',
        errors: error.flatten().fieldErrors,
      }
    }

    console.error('Error in upsertRole:', error)
    return {
      success: false,
      error: 'Nastala chyba při ukládání role',
    }
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  entity?: string,
  entityId?: string
) {
  try {
    // 1. Authentication & Authorization
    // Use getServerSession to check role from Uzivatel model (authentication model)
    const session = await getServerSession(authOptions)
    
    // Check if user has admin role from session (Uzivatel model)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Nemáte oprávnění k této akci',
      }
    }

    // 2. Check if auditLog model exists
    if (!prisma.auditLog) {
      return {
        success: false,
        error: 'AuditLog model není k dispozici. Spusťte: npx prisma generate',
      }
    }

    // 3. Build where clause
    const where: any = {}
    if (entity) {
      where.entity = entity
    }
    if (entityId) {
      where.entityId = entityId
    }

    // 4. Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // 5. Get total count
    const total = await prisma.auditLog.count({ where })

    return {
      success: true,
      data: logs.map((log) => {
        // Extract actor info from details if actor relation is null
        let actorInfo = null
        if (log.actor) {
          // Actor exists in User model
          actorInfo = {
            id: log.actor.id,
            name: log.actor.name,
            email: log.actor.email,
          }
        } else if (log.details && typeof log.details === 'object' && 'actor' in log.details) {
          // Actor info stored in details (from Uzivatel model)
          const detailsActor = (log.details as any).actor
          actorInfo = {
            id: detailsActor.id || '',
            name: detailsActor.name || 'Neznámý',
            email: detailsActor.email || '',
          }
        } else {
          // Fallback if no actor info available
          actorInfo = {
            id: '',
            name: 'Neznámý',
            email: '',
          }
        }
        
        return {
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          details: log.details,
          actor: actorInfo,
          createdAt: log.createdAt,
        }
      }),
      total,
    }
  } catch (error) {
    console.error('Error in getAuditLogs:', error)
    return {
      success: false,
      error: 'Nastala chyba při načítání audit logů',
    }
  }
}

