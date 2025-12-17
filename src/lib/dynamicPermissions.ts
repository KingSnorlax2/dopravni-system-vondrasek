import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export interface DynamicPermissionContext {
  userId?: string
  department?: string
  vehicleId?: number
  transactionId?: number
  maintenanceId?: number
  amount?: number
  time?: Date
  userTrustScore?: number
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
  requiresApproval?: boolean
  approvalLevel?: 'manager' | 'admin' | 'none'
}

/**
 * Check if a user has a specific permission with dynamic rules
 */
export async function checkDynamicPermission(
  permission: string,
  context: DynamicPermissionContext = {}
): Promise<PermissionResult> {
  try {
    // Get user session and role
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { allowed: false, reason: 'User not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
                departmentAssignments: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return { allowed: false, reason: 'User not found' }
    }

    // Get user's roles and permissions
    const userRoles = user.roles.map(ur => ur.role)
    const userPermissions = userRoles.flatMap(role => 
      role.permissions.map(rp => rp.permission)
    )

    // Check basic permission
    if (!userPermissions.includes(permission as any)) {
      return { allowed: false, reason: 'Permission not granted' }
    }

    // Apply dynamic rules for each role
    for (const role of userRoles) {
      const dynamicRules = role.dynamicRules as any
      if (!dynamicRules) continue

      const result = await applyDynamicRules(role, dynamicRules, context, user)
      if (!result.allowed) {
        return result
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking dynamic permission:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

/**
 * Apply dynamic rules to a permission check
 */
async function applyDynamicRules(
  role: any,
  dynamicRules: any,
  context: DynamicPermissionContext,
  user: any
): Promise<PermissionResult> {
  const now = context.time || new Date()
  const currentHour = now.getHours()

  // Department restriction
  if (dynamicRules.departmentRestriction && context.department) {
    const departmentAssignment = role.departmentAssignments?.find(
      (da: any) => da.department === context.department
    )
    
    if (!departmentAssignment?.canManage) {
      return { 
        allowed: false, 
        reason: 'Access restricted to assigned department' 
      }
    }
  }

  // Time restriction (business hours: 8:00 - 18:00)
  if (dynamicRules.timeRestriction) {
    if (currentHour < 8 || currentHour >= 18) {
      return { 
        allowed: false, 
        reason: 'Access restricted to business hours (8:00 - 18:00)' 
      }
    }
  }

  // Budget limit for approvals
  if (dynamicRules.budgetLimit && context.amount) {
    if (context.amount > dynamicRules.budgetLimit) {
      return {
        allowed: true,
        requiresApproval: true,
        approvalLevel: context.amount > 5000 ? 'admin' : 'manager',
        reason: `Amount exceeds approval limit of ${dynamicRules.budgetLimit} Kč`
      }
    }
  }

  // Trust score restrictions
  if (dynamicRules.minTrustScore && user.trustScore < dynamicRules.minTrustScore) {
    return {
      allowed: false,
      reason: `Trust score too low (${user.trustScore}/${dynamicRules.minTrustScore})`
    }
  }

  return { allowed: true }
}

/**
 * Check if user can edit a specific vehicle
 */
export async function canEditVehicle(
  userId: string,
  vehicleId: number
): Promise<PermissionResult> {
  const vehicle = await prisma.auto.findUnique({
    where: { id: vehicleId },
    select: { department: true, assignedDriver: true }
  })

  if (!vehicle) {
    return { allowed: false, reason: 'Vehicle not found' }
  }

  return checkDynamicPermission('edit_vehicles', {
    userId,
    vehicleId,
    department: vehicle.department || undefined
  })
}

/**
 * Check if user can approve a transaction
 */
export async function canApproveTransaction(
  userId: string,
  transactionId: number
): Promise<PermissionResult> {
  const transaction = await prisma.transakce.findUnique({
    where: { id: transactionId },
    select: { castka: true, status: true }
  })

  if (!transaction) {
    return { allowed: false, reason: 'Transaction not found' }
  }

  if (transaction.status !== 'PENDING') {
    return { allowed: false, reason: 'Transaction is not pending approval' }
  }

  return checkDynamicPermission('approve_expenses', {
    userId,
    transactionId,
    amount: transaction.castka
  })
}

/**
 * Check if user can approve maintenance
 */
export async function canApproveMaintenance(
  userId: string,
  maintenanceId: number
): Promise<PermissionResult> {
  const maintenance = await prisma.udrzba.findUnique({
    where: { id: maintenanceId },
    select: { cena: true, status: true }
  })

  if (!maintenance) {
    return { allowed: false, reason: 'Maintenance record not found' }
  }

  if (maintenance.status !== 'PENDING') {
    return { allowed: false, reason: 'Maintenance is not pending approval' }
  }

  return checkDynamicPermission('approve_maintenance', {
    userId,
    maintenanceId,
    amount: maintenance.cena
  })
}

/**
 * Check if user can access reports
 */
export async function canAccessReports(
  userId: string,
  reportType?: string
): Promise<PermissionResult> {
  const context: DynamicPermissionContext = { userId }
  
  // Add time restriction for financial reports
  if (reportType === 'financial') {
    context.time = new Date()
  }

  return checkDynamicPermission('view_reports', context)
}

/**
 * Get user's effective permissions with dynamic rules applied
 */
export async function getUserEffectivePermissions(
  userId: string,
  context: DynamicPermissionContext = {}
): Promise<{ [key: string]: PermissionResult }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    return {}
  }

  const permissions: { [key: string]: PermissionResult } = {}
  
  // Get all unique permissions from user's roles
  const allPermissions = new Set<string>()
  user.roles.forEach(ur => {
    ur.role.permissions.forEach(rp => {
      allPermissions.add(rp.permission)
    })
  })

  // Check each permission with dynamic rules
  for (const permission of allPermissions) {
    permissions[permission] = await checkDynamicPermission(permission, {
      ...context,
      userId,
      userTrustScore: user.trustScore
    })
  }

  return permissions
}

/**
 * Check if user can perform action based on multiple conditions
 */
export async function canPerformAction(
  action: string,
  resource: string,
  resourceId?: number,
  context: DynamicPermissionContext = {}
): Promise<PermissionResult> {
  const permission = `${action}_${resource}`
  
  // Add resource-specific context
  if (resourceId) {
    switch (resource) {
      case 'vehicles':
        context.vehicleId = resourceId
        break
      case 'transactions':
        context.transactionId = resourceId
        break
      case 'maintenance':
        context.maintenanceId = resourceId
        break
    }
  }

  return checkDynamicPermission(permission, context)
}

/**
 * Get approval requirements for an action
 */
export async function getApprovalRequirements(
  action: string,
  resource: string,
  amount?: number
): Promise<{
  requiresApproval: boolean
  approvalLevel: 'manager' | 'admin' | 'none'
  reason?: string
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { requiresApproval: true, approvalLevel: 'admin', reason: 'Not authenticated' }
  }

  const permission = `${action}_${resource}`
  const result = await checkDynamicPermission(permission, {
    userId: session.user.id,
    amount
  })

  return {
    requiresApproval: result.requiresApproval || false,
    approvalLevel: result.approvalLevel || 'none',
    reason: result.reason
  }
}
