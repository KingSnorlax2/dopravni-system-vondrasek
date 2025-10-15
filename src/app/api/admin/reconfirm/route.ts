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

  const isAdmin = (
    (session.user as any)?.role === 'ADMIN' ||
    (Array.isArray((session.user as any)?.roles) && (session.user as any).roles.includes('ADMIN'))
  )
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => ({}))
  const result = schema.safeParse(json)
  if (!result.success) {
    return NextResponse.json({ error: 'Chybí povinná pole', errors: result.error.flatten().fieldErrors }, { status: 422 })
  }

  // Find the exact logged-in admin user by id if available, otherwise fall back to email/username (case-insensitive)
  let admin = null as any
  const sessionUser: any = session.user
  if (sessionUser?.id) {
    admin = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  }
  if (!admin) {
    const email = sessionUser?.email as string | undefined
    const username = (sessionUser?.username || sessionUser?.name) as string | undefined
    admin = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
          username ? { username: { equals: username, mode: 'insensitive' } } : undefined,
        ].filter(Boolean) as any
      }
    })
  }
  if (!admin?.password) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await bcrypt.compare(result.data.password, admin.password)
  if (!ok) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}


