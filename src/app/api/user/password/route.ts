import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    })

    if (!user?.password) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return new NextResponse('Invalid current password', { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return new NextResponse('Password updated successfully')
  } catch (error) {
    console.error('Password update error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 