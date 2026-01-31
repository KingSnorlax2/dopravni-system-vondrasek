import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PermissionKey, UzivatelRole } from '@prisma/client'

// GET /api/admin/roles - Get all roles
// Query param: ?permissions=1 - Returns only list of all available permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      console.error('Unauthorized access attempt to /api/admin/roles:', {
        hasSession: !!session,
        userRole: session?.user?.role,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If permissions=1 query param, return only list of permissions
    const { searchParams } = new URL(request.url)
    if (searchParams.get('permissions') === '1') {
      // Return all available PermissionKey enum values
      const allPermissions = Object.values(PermissionKey) as string[]
      return NextResponse.json(allPermissions)
    }

    // Optimized approach: Fetch both queries in a single transaction to avoid N+1
    const [roles, userCountsGroup] = await prisma.$transaction([
      prisma.role.findMany({
        include: {
          permissions: true,
          departmentAssignments: true,
          _count: {
            select: {
              users: true // Count from UserRole relation (legacy User model)
            }
          }
        },
        orderBy: {
          priority: 'desc'
        }
      }),
      prisma.uzivatel.groupBy({
        by: ['role'], // Group by UzivatelRole enum
        _count: {
          role: true // Count users per role
        }
      })
    ])

    // Transform groupBy result into a Map for O(1) lookup
    // Map: { "ADMIN": 5, "DISPECER": 2, "RIDIC": 10 }
    const countsMap = userCountsGroup.reduce((acc, curr) => {
      // curr.role is UzivatelRole enum, convert to string for map key
      acc[curr.role] = curr._count.role
      return acc
    }, {} as Record<UzivatelRole, number>)

    // Transform the data to include only the fields we need
    // Merge user counts: legacy User model + Uzivatel model
    const transformedRoles = roles.map(role => {
      // Type-safe lookup: Role.name (string) should match UzivatelRole enum values
      // Use nullish coalescing to default to 0 if role doesn't exist in Uzivatel model
      const roleNameAsEnum = role.name as UzivatelRole
      const uzivatelCount = countsMap[roleNameAsEnum] ?? 0
      
      const legacyUserCount = role._count.users || 0
      const totalUserCount = legacyUserCount + uzivatelCount

      return {
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
        userCount: totalUserCount // Combined count from both models
      }
    })

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