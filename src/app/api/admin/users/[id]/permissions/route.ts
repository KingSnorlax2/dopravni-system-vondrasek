import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[id]/permissions - Get user permissions (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.id

    // Get user with their roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true  // This gets the RolePermission records, each has a scalar 'permission' field
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract all unique permissions from user's roles
    const permissions = new Set<string>()
    
    user.roles.forEach(userRole => {
      userRole.role.permissions.forEach(rolePermission => {
        permissions.add(rolePermission.permission)
      })
    })

    return NextResponse.json({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      permissions: Array.from(permissions),
      roleCount: user.roles.length,
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName
      }))
    })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
