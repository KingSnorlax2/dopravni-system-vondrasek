import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import * as z from 'zod'

const schema = z.object({
  password: z.string().min(1, 'Heslo je povinné'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionUser = session.user as { id?: string; email?: string; role?: string }
  const isAdmin = sessionUser?.role === 'ADMIN'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => ({}))
  const result = schema.safeParse(json)
  if (!result.success) {
    return NextResponse.json({ error: 'Chybí povinná pole', errors: result.error.flatten().fieldErrors }, { status: 422 })
  }

  // Resolve Uzivatel from session (NextAuth uses Uzivatel model; session.id is stringified Uzivatel.id)
  let admin: { heslo: string } | null = null
  if (sessionUser.id) {
    const numericId = parseInt(sessionUser.id, 10)
    if (!Number.isNaN(numericId)) {
      admin = await prisma.uzivatel.findUnique({
        where: { id: numericId },
        select: { heslo: true },
      })
    }
  }
  if (!admin && sessionUser.email) {
    const byEmail = await prisma.uzivatel.findFirst({
      where: { email: { equals: sessionUser.email, mode: 'insensitive' } },
      select: { heslo: true },
    })
    admin = byEmail
  }

  if (!admin?.heslo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await bcryptjs.compare(result.data.password, admin.heslo)
  if (!ok) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}


