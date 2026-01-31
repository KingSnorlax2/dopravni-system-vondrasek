import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

function requireAdmin(session: any) {
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET: List all users from Uzivatel model (used for authentication)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Fetch users from Uzivatel model (authentication model)
  const uzivatele = await prisma.uzivatel.findMany({
    orderBy: { createdAt: 'desc' },
  })
  
  // Fetch all roles to get display names
  const allRoles = await prisma.role.findMany({
    where: { isActive: true },
    select: {
      name: true,
      displayName: true,
    },
  })
  
  // Create a map of role name to display name
  const roleMap = new Map(allRoles.map(r => [r.name, r.displayName]))
  
  // Transform to match expected format
  return NextResponse.json(uzivatele.map(u => {
    const roleName = u.role
    const roleDisplayName = roleMap.get(roleName) || roleName
    
    return {
      id: u.id.toString(),
      name: u.jmeno || u.email.split('@')[0], // Use jmeno or email prefix as name
      email: u.email,
      status: 'ACTIVE', // Uzivatel model doesn't have status, default to ACTIVE
      roles: [roleName], // Single role from enum
      roleDisplayName: roleDisplayName, // Display name from Role table
      avatar: null, // Uzivatel model doesn't have avatar
      lastLoginAt: null, // Uzivatel model doesn't have lastLoginAt
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }
  }))
}

// POST: Create user in Uzivatel model
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { email, password, name, roles } = body
  
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
  }
  
  // Get first role from array, or default to RIDIC
  const role = (Array.isArray(roles) && roles.length > 0) ? roles[0] : 'RIDIC'
  
  // Validate role is valid UzivatelRole enum value
  const validRoles = ['ADMIN', 'DISPECER', 'RIDIC']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be ADMIN, DISPECER, or RIDIC' }, { status: 400 })
  }
  
  const existingUser = await prisma.uzivatel.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }
  
  const hashedPassword = await bcryptjs.hash(password, 10)
  const uzivatel = await prisma.uzivatel.create({
    data: {
      email,
      heslo: hashedPassword,
      jmeno: name,
      role: role as any, // Cast to UzivatelRole enum
    },
  })
  
  // Fetch role display name
  const roleRecord = await prisma.role.findUnique({
    where: { name: role },
    select: { displayName: true },
  })
  
  const roleDisplayName = roleRecord?.displayName || role
  
  return NextResponse.json({
    id: uzivatel.id.toString(),
    name: uzivatel.jmeno || uzivatel.email.split('@')[0],
    email: uzivatel.email,
    status: 'ACTIVE',
    roles: [uzivatel.role],
    roleDisplayName: roleDisplayName, // Display name from Role table
    avatar: null,
    lastLoginAt: null,
    createdAt: uzivatel.createdAt,
    updatedAt: uzivatel.updatedAt,
  })
} 