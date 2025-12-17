import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"
import { authOptions } from "@/auth"

function requireAdmin(session: any) {
  if (!session || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// Get all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: { include: { role: true } },
      }
    })

    // Map roles to role names for response
    const usersWithRoles = users.map(u => ({
      ...u,
      roles: u.roles.map(r => r.role.name)
    }))

    return NextResponse.json(usersWithRoles)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// Create new user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, name, role } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user with default or provided role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: {
          create: [{ role: { connect: { name: role || 'USER' } } }]
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: { include: { role: true } },
      }
    })

    // Map roles to role names for response
    const userWithRoles = {
      ...user,
      roles: user.roles.map(r => r.role.name)
    }

    return NextResponse.json(userWithRoles)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
} 