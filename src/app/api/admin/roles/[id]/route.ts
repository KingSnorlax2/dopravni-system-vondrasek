import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/accessControl'

// Enhanced role validation
function validateRoleUpdateData(data: any) {
  const errors: string[] = []
  
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Role name must be a string')
    } else if (data.name.length < 2) {
      errors.push('Role name must be at least 2 characters long')
    } else if (data.name.length > 50) {
      errors.push('Role name must be less than 50 characters')
    }
  }
  
  if (data.permissions !== undefined) {
    if (!Array.isArray(data.permissions)) {
      errors.push('Permissions must be an array')
    } else if (data.permissions.length === 0) {
      errors.push('At least one permission is required')
    }
    
    // Validate permission keys
    const validPermissions = [
      'view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports',
      'manage_distribution', 'driver_access', 'manage_roles', 'view_users', 
      'edit_vehicles', 'view_distribution', 'system_settings'
    ]
    
    const invalidPermissions = data.permissions.filter((p: string) => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }
  }
  
  return errors
}

// GET /api/admin/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(session.user, 'manage_roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }
    
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    })
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    // Transform response
    const transformedRole = {
      id: role.id,
      name: role.name,
      permissions: role.permissions.map(p => p.permission),
      allowedPages: role.allowedPages || [],
      defaultLandingPage: role.defaultLandingPage,
      userCount: role._count.users,
      isProtected: role.name === 'ADMIN'
    }
    
    return NextResponse.json(transformedRole)
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/roles/[id] - Update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(session.user, 'manage_roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }
    
    const data = await request.json()
    
    // Validate input data
    const validationErrors = validateRoleUpdateData(data)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    // Check if role exists and is not protected
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })
    
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    if (existingRole.name === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify protected ADMIN role' },
        { status: 403 }
      )
    }
    
    // Handle potential database constraint violation for duplicate names
    // Since we want to allow duplicates during editing, we'll handle the error gracefully
    let updateData: any = {}
    
    if (data.name !== undefined) {
      updateData.name = data.name
    }
    
    if (data.allowedPages !== undefined) {
      updateData.allowedPages = data.allowedPages
    }
    
    if (data.defaultLandingPage !== undefined) {
      updateData.defaultLandingPage = data.defaultLandingPage
    }
    
    try {
      // Update role
      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: updateData,
        include: {
          permissions: true,
          _count: {
            select: {
              users: true
            }
          }
        }
      })
      
      // Update permissions if provided
      if (data.permissions !== undefined) {
        // Remove all current permissions
        await prisma.rolePermission.deleteMany({
          where: { roleId: roleId }
        })
        
        // Add new permissions
        if (data.permissions.length > 0) {
          await prisma.rolePermission.createMany({
            data: data.permissions.map((permission: string) => ({
              roleId: roleId,
              permission: permission as any
            }))
          })
        }
        
        // Fetch updated role with permissions
        const finalRole = await prisma.role.findUnique({
          where: { id: roleId },
          include: {
            permissions: true,
            _count: {
              select: {
                users: true
              }
            }
          }
        })
        
        if (!finalRole) {
          return NextResponse.json({ error: 'Role not found after update' }, { status: 404 })
        }
        
        // Transform response
        const transformedRole = {
          id: finalRole.id,
          name: finalRole.name,
          permissions: finalRole.permissions.map(p => p.permission),
          allowedPages: finalRole.allowedPages || [],
          defaultLandingPage: finalRole.defaultLandingPage,
          userCount: finalRole._count.users,
          isProtected: finalRole.name === 'ADMIN'
        }
        
        return NextResponse.json(transformedRole)
      }
      
      // Transform response
      const transformedRole = {
        id: updatedRole.id,
        name: updatedRole.name,
        permissions: updatedRole.permissions.map(p => p.permission),
        allowedPages: updatedRole.allowedPages || [],
        defaultLandingPage: updatedRole.defaultLandingPage,
        userCount: updatedRole._count.users,
        isProtected: updatedRole.name === 'ADMIN'
      }
      
      return NextResponse.json(transformedRole)
    } catch (error: any) {
      // Handle database constraint violation for duplicate names
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return NextResponse.json(
          { 
            error: 'Role name already exists in database',
            details: 'The database still enforces uniqueness. Consider using a different name or modifying the database schema.'
          },
          { status: 409 }
        )
      }
      
      console.error('Error updating role:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(session.user, 'manage_roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }
    
    // Check if role exists and is not protected
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })
    
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    if (existingRole.name === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete protected ADMIN role' },
        { status: 403 }
      )
    }
    
    // Check if role has users
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete role with ${existingRole._count.users} assigned users` },
        { status: 409 }
      )
    }
    
    // Delete role (permissions will be cascaded)
    await prisma.role.delete({
      where: { id: roleId }
    })
    
    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 