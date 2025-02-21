import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { z } from "zod"

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]).optional()
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    const body = userUpdateSchema.parse(json)

    if (body.email) {
      const exists = await prisma.user.findFirst({
        where: { 
          email: body.email,
          NOT: { id: params.id }
        },
      })

      if (exists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    const data = { ...body }
    if (body.password) {
      data.password = await hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
} 