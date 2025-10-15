import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const schema = z.object({
      identifier: z.string().min(2, { message: 'Zadejte email nebo uživatelské jméno.' }),
      password: z.string().min(1, { message: 'Zadejte heslo.' }),
      cisloTrasy: z.string().min(1, { message: 'Zadejte číslo trasy.' })
    })

    // Backward compatibility: accept { email } or { username }
    const identifier = (body.identifier || body.email || body.username || '').toString().trim()
    const parsed = schema.safeParse({
      identifier,
      password: body.password ?? '',
      cisloTrasy: body.cisloTrasy ?? ''
    })

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as string
        errors[path] = issue.message
      }
      return NextResponse.json({ errors }, { status: 422 })
    }

    const { password, cisloTrasy } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Neplatné přihlašovací údaje.' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Neplatné přihlašovací údaje.' }, { status: 401 })
    }

    await prisma.driverRouteLogin.create({
      data: { ridicEmail: user.email ?? identifier, cisloTrasy }
    })

    return NextResponse.json({ success: true, message: 'Trasa byla zaznamenána' })
  } catch (err) {
    console.error('Driver login error:', err)
    return NextResponse.json({ error: 'Interní chyba serveru.' }, { status: 500 })
  }
}


