import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PermissionKey } from '@prisma/client'

function requireAdmin(session: any) {
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// PATCH: Update role name, permissions, allowedPages, defaultLandingPage
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const { name, permissions, allowedPages, defaultLandingPage } = body
  // Update name if provided
  let role = await prisma.role.update({
    where: { id: Number(id) },
    data: name ? { name } : {},
    include: { permissions: true },
  })
  // Update permissions if provided
  if (Array.isArray(permissions)) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    await prisma.rolePermission.createMany({
      data: permissions.map((perm: PermissionKey) => ({ roleId: role.id, permission: perm })),
    })
    role = await prisma.role.findUnique({
      where: { id: role.id },
      include: { permissions: true },
    })
  }
  // Update allowedPages and defaultLandingPage
  await prisma.role.update({
    where: { id: Number(id) },
    data: {
      allowedPages: allowedPages || role.allowedPages,
      defaultLandingPage: defaultLandingPage ?? role.defaultLandingPage,
    },
  })
  // Return updated role
  const updated = await prisma.role.findUnique({
    where: { id: Number(id) },
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

// DELETE: Delete role if no users are assigned
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  // Check if any users are assigned to this role
  const userCount = await prisma.userRole.count({ where: { roleId: Number(id) } })
  if (userCount > 0) {
    return NextResponse.json({ error: 'Cannot delete role with assigned users' }, { status: 400 })
  }
  await prisma.rolePermission.deleteMany({ where: { roleId: Number(id) } })
  await prisma.role.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
} 