import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"
import { devLog } from "@/lib/logger"

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@admin.com" }
    })

    if (adminExists) {
      return NextResponse.json({ message: "Admin user already exists" })
    }

    // Create admin user
    const hashedPassword = await bcryptjs.hash("Admin123", 10)
    
    devLog('Creating admin user...');

    await prisma.user.create({
      data: {
        email: "admin@admin.com",
        password: hashedPassword,
        name: "Admin"
      }
    })

    devLog("Admin user created successfully")

    return NextResponse.json({ 
      message: "Admin user created successfully"
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    )
  }
} 