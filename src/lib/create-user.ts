import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const hashedPassword = await bcryptjs.hash('Admin123', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: 'Admin'
      }
    })
    
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'User might already exist' })
  }
} 