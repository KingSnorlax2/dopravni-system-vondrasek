import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        departmentAssignments: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            }
          }
        },
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

    return NextResponse.json({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      icon: role.icon,
      color: role.color,
      isSystem: role.isSystem,
      isActive: role.isActive,
      priority: role.priority,
      allowedPages: role.allowedPages,
      defaultLandingPage: role.defaultLandingPage,
      dynamicRules: role.dynamicRules,
      permissions: role.permissions.map(rp => rp.permission),
      userCount: role._count.users
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      displayName,
      description,
      icon,
      color,
      isSystem,
      isActive,
      priority,
      allowedPages,
      defaultLandingPage,
      dynamicRules,
      permissions
    } = body

    // Get current role for audit
    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true
      }
    })

    if (!currentRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if trying to modify system role
    if (currentRole.isSystem && (name !== currentRole.name || isSystem === false)) {
      return NextResponse.json(
        { error: 'Cannot modify system role name or deactivate system role' },
        { status: 400 }
      )
    }

    // Check if new name conflicts with existing role
    if (name !== currentRole.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name }
      })

      if (existingRole) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        displayName,
        description,
        icon,
        color,
        isSystem: isSystem !== undefined ? isSystem : currentRole.isSystem,
        isActive: isActive !== undefined ? isActive : currentRole.isActive,
        priority: priority !== undefined ? priority : currentRole.priority,
        allowedPages: allowedPages || currentRole.allowedPages,
        defaultLandingPage,
        dynamicRules: dynamicRules || currentRole.dynamicRules,
        updatedAt: new Date()
      },
      include: {
        permissions: true
      }
    })

    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      })

      // Create new permissions
      await prisma.rolePermission.createMany({
        data: permissions.map((permission: string) => ({
          roleId,
          permission: permission as any
        }))
      })

      // Fetch updated role with new permissions
      const roleWithPermissions = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true
        }
      })

      // Log the role update
      await prisma.roleAuditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'ROLE',
          entityId: roleId.toString(),
          oldValue: currentRole,
          newValue: roleWithPermissions,
          userId: session.user.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json({
        id: roleWithPermissions?.id,
        name: roleWithPermissions?.name,
        displayName: roleWithPermissions?.displayName,
        description: roleWithPermissions?.description,
        icon: roleWithPermissions?.icon,
        color: roleWithPermissions?.color,
        isSystem: roleWithPermissions?.isSystem,
        isActive: roleWithPermissions?.isActive,
        priority: roleWithPermissions?.priority,
        allowedPages: roleWithPermissions?.allowedPages,
        defaultLandingPage: roleWithPermissions?.defaultLandingPage,
        dynamicRules: roleWithPermissions?.dynamicRules || {},
        permissions: roleWithPermissions?.permissions.map(rp => rp.permission) || []
      })
    }

    // Log the role update
    await prisma.roleAuditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'ROLE',
        entityId: roleId.toString(),
        oldValue: currentRole,
        newValue: updatedRole,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      id: updatedRole.id,
      name: updatedRole.name,
      displayName: updatedRole.displayName,
      description: updatedRole.description,
      icon: updatedRole.icon,
      color: updatedRole.color,
      isSystem: updatedRole.isSystem,
      isActive: updatedRole.isActive,
      priority: updatedRole.priority,
      allowedPages: updatedRole.allowedPages,
      defaultLandingPage: updatedRole.defaultLandingPage,
      dynamicRules: updatedRole.dynamicRules || {},
      permissions: updatedRole.permissions.map(rp => rp.permission)
    })
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
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }

    // Get role for audit
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        users: true
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if it's a system role
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 400 }
      )
    }

    // Check if role has assigned users
    if (role.users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Please reassign users first.' },
        { status: 400 }
      )
    }

    // Delete role (permissions will be deleted automatically due to cascade)
    await prisma.role.delete({
      where: { id: roleId }
    })

    // Log the role deletion
    await prisma.roleAuditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'ROLE',
        entityId: roleId.toString(),
        oldValue: role,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
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