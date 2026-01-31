import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { UzivatelRole } from '@prisma/client'
import bcryptjs from 'bcryptjs'

function requireAdmin(session: any) {
  if (!session || !session.user || !session.user.role || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET: Get user details by ID from Uzivatel model
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const { id } = params
  
  try {
    const uzivatel = await prisma.uzivatel.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!uzivatel) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Fetch role display name
    const role = await prisma.role.findUnique({
      where: { name: uzivatel.role },
      select: { displayName: true },
    })
    
    const roleDisplayName = role?.displayName || uzivatel.role
    
    return NextResponse.json({
      id: uzivatel.id.toString(),
      name: uzivatel.jmeno || uzivatel.email.split('@')[0],
      email: uzivatel.email,
      username: null, // Uzivatel model doesn't have username
      status: 'ACTIVE', // Uzivatel model doesn't have status
      department: null, // Uzivatel model doesn't have department
      position: null, // Uzivatel model doesn't have position
      phone: null, // Uzivatel model doesn't have phone
      trustScore: null, // Uzivatel model doesn't have trustScore
      roles: [uzivatel.role], // Single role from enum
      roleDisplayName: roleDisplayName, // Display name from Role table
      createdAt: uzivatel.createdAt,
      updatedAt: uzivatel.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH: Update user info and role in Uzivatel model
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  const body = await req.json()
  const { name, email, roles, password } = body
  
  // Get first role from array, or keep existing
  let roleToUpdate: UzivatelRole | undefined = undefined
  if (roles && Array.isArray(roles) && roles.length > 0) {
    const role = roles[0]
    const validRoles = ['ADMIN', 'DISPECER', 'RIDIC']
    if (validRoles.includes(role)) {
      roleToUpdate = role as UzivatelRole
    }
  }
  
  // Build update data
  const updateData: any = {}
  if (name !== undefined) updateData.jmeno = name
  if (email !== undefined) updateData.email = email
  if (roleToUpdate !== undefined) updateData.role = roleToUpdate
  if (password && String(password).trim().length > 0) {
    updateData.heslo = await bcryptjs.hash(String(password), 10)
  }
  
  // Update user
  const uzivatel = await prisma.uzivatel.update({
    where: { id: parseInt(id) },
    data: updateData,
  })
  
  // Fetch role display name
  const role = await prisma.role.findUnique({
    where: { name: uzivatel.role },
    select: { displayName: true },
  })
  
  const roleDisplayName = role?.displayName || uzivatel.role
  
  return NextResponse.json({
    id: uzivatel.id.toString(),
    name: uzivatel.jmeno || uzivatel.email.split('@')[0],
    email: uzivatel.email,
    status: 'ACTIVE',
    roles: [uzivatel.role],
    roleDisplayName: roleDisplayName, // Display name from Role table
    createdAt: uzivatel.createdAt,
    updatedAt: uzivatel.updatedAt,
  })
}

// DELETE: Delete user from Uzivatel model
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = params
  
  try {
    await prisma.uzivatel.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 