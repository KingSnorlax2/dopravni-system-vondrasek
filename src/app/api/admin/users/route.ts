import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

// GET: List all users with roles and status
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username, // Add this line
    status: u.status,
    roles: u.roles.map(r => r.role.name),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  })))
}

// POST: Create user with multiple roles
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { email, password, name, roles } = body
  if (!email || !password || !name || !Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }
  const hashedPassword = await bcryptjs.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      roles: {
        create: roles.map((roleName: string) => ({
          role: { connect: { name: roleName } },
        })),
      },
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