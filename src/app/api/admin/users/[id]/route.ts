import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { UserStatus } from '@prisma/client'

function requireAdmin(session: any) {
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET: Get user details by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const { id } = params
  
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { 
        roles: { 
          include: { role: true } 
        } 
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      status: user.status,
      department: user.department,
      position: user.position,
      phone: user.phone,
      trustScore: user.trustScore,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH: Update user info, roles, and status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
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
        create: roles.map((roleName: string) => ({
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
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  await prisma.userRole.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
} 