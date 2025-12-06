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
    
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        actorId,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      },
    })
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
    const user = await getCurrentUser()
    
    // Check if user has admin role (you may want to check permissions instead)
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    })
    
    const isAdmin = adminUser?.roles.some(
      (ur) => ur.role.name === 'ADMIN' || ur.role.name === 'admin'
    )
    
    if (!isAdmin) {
      return {
        success: false,
        error: 'Nemáte oprávnění k této akci',
      }
    }

    // 2. Validation
    const validated = UserSchema.parse(data)

    // 3. Check if email already exists (for new users or when changing email)
    if (!validated.id) {
      const existingUser = await prisma.user.findUnique({
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
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      })
      if (existingUser && existingUser.id !== validated.id) {
        return {
          success: false,
          error: 'Email je již používán jiným uživatelem',
          errors: {
            email: ['Email je již používán jiným uživatelem'],
          },
        }
      }
    }

    // 4. Prepare data
    const userData: any = {
      name: validated.name,
      email: validated.email,
      status: validated.status,
      updatedBy: user.id,
      ...(validated.avatar && { avatar: validated.avatar }),
    }

    // Hash password only if provided
    if (validated.password && validated.password.length > 0) {
      userData.password = await bcryptjs.hash(validated.password, 10)
    }

    // 5. Get old user data for audit log (if updating)
    let oldUserData = null
    if (validated.id) {
      const oldUser = await prisma.user.findUnique({
        where: { id: validated.id },
        include: { roles: { include: { role: true } } },
      })
      if (oldUser) {
        oldUserData = {
          name: oldUser.name,
          email: oldUser.email,
          status: oldUser.status,
          roles: oldUser.roles.map((r) => r.role.name),
          avatar: oldUser.avatar,
        }
      }
    }

    // 6. Upsert user
    let result
    if (validated.id) {
      // Update existing user
      result = await prisma.user.update({
        where: { id: validated.id },
        data: userData,
        include: { roles: { include: { role: true } } },
      })

      // Update roles - fetch all roles first
      await prisma.userRole.deleteMany({
        where: { userId: validated.id },
      })
      
      // Fetch all roles in parallel
      const roles = await Promise.all(
        validated.roles.map((roleName) =>
          prisma.role.findUnique({ where: { name: roleName } })
        )
      )
      
      // Filter out any null roles and create user roles
      const userRolesData = roles
        .filter((role) => role !== null)
        .map((role) => ({
          userId: validated.id!,
          roleId: role!.id,
          assignedBy: user.id,
        }))
      
      if (userRolesData.length > 0) {
        await prisma.userRole.createMany({
          data: userRolesData,
        })
      }

      // Refresh to get updated roles
      result = await prisma.user.findUnique({
        where: { id: validated.id },
        include: { roles: { include: { role: true } } },
      })
    } else {
      // Create new user
      if (!validated.password || validated.password.length === 0) {
        return {
          success: false,
          error: 'Heslo je povinné pro nové uživatele',
        }
      }

      result = await prisma.user.create({
        data: {
          ...userData,
          password: userData.password,
          createdBy: user.id,
          roles: {
            create: validated.roles.map((roleName) => ({
              role: { connect: { name: roleName } },
              assignedBy: user.id,
            })),
          },
        },
        include: { roles: { include: { role: true } } },
      })
    }

    // 7. Create audit log
    const newUserData = {
      name: result.name,
      email: result.email,
      status: result.status,
      roles: result.roles.map((r) => r.role.name),
      avatar: result.avatar,
    }

    await createAuditLog(
      validated.id ? 'USER_UPDATE' : 'USER_CREATE',
      'User',
      result.id,
      user.id,
      {
        old: oldUserData,
        new: newUserData,
      }
    )

    // 8. Revalidate
    revalidatePath('/dashboard/admin/users')

    // 9. Return result
    return {
      success: true,
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        status: result.status,
        roles: result.roles.map((r) => r.role.name),
        avatar: result.avatar,
        lastLoginAt: result.lastLoginAt,
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
 */
export async function toggleUserStatus(
  userId: string,
  status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED'
) {
  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser()
    
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    })
    
    const isAdmin = adminUser?.roles.some(
      (ur) => ur.role.name === 'ADMIN' || ur.role.name === 'admin'
    )
    
    if (!isAdmin) {
      return {
        success: false,
        error: 'Nemáte oprávnění k této akci',
      }
    }

    // 2. Get old user data
    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    })

    if (!oldUser) {
      return {
        success: false,
        error: 'Uživatel nenalezen',
      }
    }

    // 3. Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedBy: user.id,
      },
      include: { roles: { include: { role: true } } },
    })

    // 4. Create audit log
    await createAuditLog(
      'USER_STATUS_CHANGE',
      'User',
      userId,
      user.id,
      {
        old: { status: oldUser.status },
        new: { status: updatedUser.status },
      }
    )

    // 5. Revalidate
    revalidatePath('/dashboard/admin/users')

    // 6. Return result
    return {
      success: true,
      data: {
        id: updatedUser.id,
        status: updatedUser.status,
      },
    }
  } catch (error) {
    console.error('Error in toggleUserStatus:', error)
    return {
      success: false,
      error: 'Nastala chyba při změně statusu uživatele',
    }
  }
}

/**
 * Upsert role - Create or update role
 */
export async function upsertRole(data: RoleSchemaType) {
  try {
    // 1. Authentication & Authorization
    const user = await getCurrentUser()
    
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    })
    
    const isAdmin = adminUser?.roles.some(
      (ur) => ur.role.name === 'ADMIN' || ur.role.name === 'admin'
    )
    
    if (!isAdmin) {
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
          createdBy: user.id,
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
      user.id,
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
    const user = await getCurrentUser()
    
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    })
    
    const isAdmin = adminUser?.roles.some(
      (ur) => ur.role.name === 'ADMIN' || ur.role.name === 'admin'
    )
    
    if (!isAdmin) {
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
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: log.details,
        actor: {
          id: log.actor.id,
          name: log.actor.name,
          email: log.actor.email,
        },
        createdAt: log.createdAt,
      })),
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

