import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/accessControl'

// Enhanced role validation
function validateRoleData(data: any) {
  const errors: string[] = []
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Role name is required and must be a string')
  } else if (data.name.length < 2) {
    errors.push('Role name must be at least 2 characters long')
  } else if (data.name.length > 50) {
    errors.push('Role name must be less than 50 characters')
  }
  
  if (!Array.isArray(data.permissions)) {
    errors.push('Permissions must be an array')
  } else if (data.permissions.length === 0) {
    errors.push('At least one permission is required')
  }
  
  // Validate permission keys
  const validPermissions = [
    'view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports',
    'manage_distribution', 'driver_access', 'view_users', 'edit_vehicles',
    'view_distribution', 'manage_roles', 'system_settings'
  ]
  
  const invalidPermissions = data.permissions.filter((p: string) => !validPermissions.includes(p))
  if (invalidPermissions.length > 0) {
    errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`)
  }
  
  return errors
}

// GET /api/admin/roles - List all roles with user counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(session.user, 'manage_roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('permissions') === '1'
    
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // Transform data for frontend
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions.map(p => p.permission),
      allowedPages: role.allowedPages || [],
      defaultLandingPage: role.defaultLandingPage,
      userCount: role._count.users,
      isProtected: role.name === 'ADMIN'
    }))
    
    if (includePermissions) {
      // Return just the permission keys for the frontend
      const allPermissions = [
        'view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports',
        'manage_distribution', 'driver_access', 'view_users', 'edit_vehicles',
        'view_distribution', 'manage_roles', 'system_settings'
      ]
      return NextResponse.json(allPermissions)
    }
    
    return NextResponse.json(transformedRoles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(session.user, 'manage_roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // Validate input data
    const validationErrors = validateRoleData(data)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    })
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      )
    }
    
    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: data.name,
        allowedPages: data.allowedPages || [],
        defaultLandingPage: data.defaultLandingPage,
        permissions: {
          create: data.permissions.map((permission: string) => ({
            permission: permission as any
          }))
        }
      },
      include: {
        permissions: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    })
    
    // Transform response
    const transformedRole = {
      id: role.id,
      name: role.name,
      permissions: role.permissions.map(p => p.permission),
      allowedPages: role.allowedPages || [],
      defaultLandingPage: role.defaultLandingPage,
      userCount: role._count.users,
      isProtected: false
    }
    
    return NextResponse.json(transformedRole, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 