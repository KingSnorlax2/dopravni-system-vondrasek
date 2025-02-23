import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"

export async function GET() {
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
    
    console.log("Creating admin user...")

    await prisma.user.create({
      data: {
        email: "admin@admin.com",
        password: hashedPassword,
        name: "Admin"
      }
    })

    console.log("Admin user created successfully")

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