import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as z from 'zod'

const schema = z.object({
  password: z.string().min(1, 'Heslo je povinné'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = (session.user as any)?.role === 'ADMIN'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => ({}))
  const result = schema.safeParse(json)
  if (!result.success) {
    return NextResponse.json({ error: 'Chybí povinná pole', errors: result.error.flatten().fieldErrors }, { status: 422 })
  }

  // Strictly resolve the current user by session id; fallback to email only if present
  const sessionUser: any = session.user
  const admin = sessionUser?.id
    ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
    : (sessionUser?.email
        ? await prisma.user.findFirst({ where: { email: { equals: sessionUser.email, mode: 'insensitive' } } })
        : null)
  if (!admin?.password) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await bcrypt.compare(result.data.password, admin.password)
  if (!ok) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}


