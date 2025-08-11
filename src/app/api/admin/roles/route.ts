import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/roles - Get all roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        departmentAssignments: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        priority: 'desc'
      }
    })

    // Transform the data to include only the fields we need
    const transformedRoles = roles.map(role => ({
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
    }))

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
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Validate required fields
    if (!name || !displayName || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      )
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        icon,
        color,
        isSystem: isSystem || false,
        isActive: isActive !== undefined ? isActive : true,
        priority: priority || 0,
        allowedPages: allowedPages || [],
        defaultLandingPage,
        dynamicRules: dynamicRules || {},
        createdBy: session.user.id,
        permissions: {
          create: (permissions || []).map((permission: string) => ({
            permission: permission as any
          }))
        }
      },
      include: {
        permissions: true
      }
    })

    // Log the role creation
    await prisma.roleAuditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ROLE',
        entityId: role.id.toString(),
        newValue: role,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

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
      permissions: role.permissions.map(rp => rp.permission)
    })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 