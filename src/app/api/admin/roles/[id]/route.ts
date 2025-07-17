import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PermissionKey } from '@prisma/client'

// PATCH: Update role name and/or permissions
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const { name, permissions } = body
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
  return NextResponse.json({
    id: role?.id,
    name: role?.name,
    permissions: role?.permissions.map(p => p.permission),
  })
}

// DELETE: Delete role if no users are assigned
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
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