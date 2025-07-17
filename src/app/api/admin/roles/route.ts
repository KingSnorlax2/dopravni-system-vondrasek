import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PermissionKey } from '@prisma/client'

const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_users',
  'manage_vehicles',
  'view_reports',
  'manage_distribution',
  'driver_access',
]

function requireAdmin(session: any) {
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET: Return all roles with their permissions, or all permissions if ?permissions=1
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const url = new URL(req.url)
  if (url.searchParams.get('permissions')) {
    return NextResponse.json(ALL_PERMISSIONS)
  }
  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(roles.map(role => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions.map(p => p.permission),
    allowedPages: role.allowedPages || [],
    defaultLandingPage: role.defaultLandingPage || '',
  })))
}

// POST: Create a new role with name, permissions, allowedPages, defaultLandingPage
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { name, permissions, allowedPages, defaultLandingPage } = body
  if (!name || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  // Create the role
  const role = await prisma.role.create({
    data: {
      name,
      allowedPages: allowedPages || [],
      defaultLandingPage: defaultLandingPage || '',
      permissions: {
        create: permissions.map((perm: PermissionKey) => ({ permission: perm })),
      },
    },
    include: { permissions: true },
  })
  return NextResponse.json({
    id: role.id,
    name: role.name,
    permissions: role.permissions.map(p => p.permission),
    allowedPages: role.allowedPages || [],
    defaultLandingPage: role.defaultLandingPage || '',
  })
}

// PATCH: Update permissions, allowedPages, defaultLandingPage for a role
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { roleName, permissions, allowedPages, defaultLandingPage } = body
  if (!roleName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }
  // Remove all current permissions
  if (Array.isArray(permissions)) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    await prisma.rolePermission.createMany({
      data: permissions.map((perm: PermissionKey) => ({
        roleId: role.id,
        permission: perm,
      })),
    })
  }
  // Update allowedPages and defaultLandingPage
  await prisma.role.update({
    where: { id: role.id },
    data: {
      allowedPages: allowedPages || role.allowedPages,
      defaultLandingPage: defaultLandingPage ?? role.defaultLandingPage,
    },
  })
  // Return updated role
  const updated = await prisma.role.findUnique({
    where: { id: role.id },
    include: { permissions: true },
  })
  return NextResponse.json({
    id: updated?.id,
    name: updated?.name,
    permissions: updated?.permissions.map(p => p.permission),
    allowedPages: updated?.allowedPages || [],
    defaultLandingPage: updated?.defaultLandingPage || '',
  })
} 