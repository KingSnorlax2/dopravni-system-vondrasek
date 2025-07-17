import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { RoleName, UserStatus } from '@prisma/client'

// PATCH: Update user info, roles, and status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const { name, email, status, roles } = body
  // Update user info
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      status: status as UserStatus,
      roles: roles ? {
        deleteMany: {},
        create: roles.map((roleName: RoleName) => ({
          role: { connect: { name: roleName } },
        })),
      } : undefined,
    },
    include: { roles: { include: { role: true } } },
  })
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    roles: user.roles.map((r) => r.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  })
}

// DELETE: Hard delete user
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  await prisma.userRole.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
} 