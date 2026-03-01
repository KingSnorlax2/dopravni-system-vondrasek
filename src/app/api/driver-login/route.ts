import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/** Start and end of today in local time for shift date comparison */
function getTodayRange(): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const requestSchema = z.object({
  identifier: z.string().min(2, { message: 'Zadejte email nebo uživatelské jméno.' }),
  password: z.string().min(1, { message: 'Zadejte heslo.' }),
  cisloTrasy: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const identifier = (body.identifier ?? body.email ?? body.username ?? '').toString().trim()
    const parsed = requestSchema.safeParse({
      identifier,
      password: body.password ?? '',
      cisloTrasy: body.cisloTrasy ?? undefined,
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

    // Verify driver against Uzivatel (email only; no username on Uzivatel)
    const uzivatel = await prisma.uzivatel.findUnique({
      where: { email: identifier.toLowerCase() },
    })
    if (!uzivatel || !uzivatel.heslo) {
      return NextResponse.json({ error: 'Neplatné přihlašovací údaje.' }, { status: 401 })
    }

    const passwordValid = await bcryptjs.compare(password, uzivatel.heslo)
    if (!passwordValid) {
      return NextResponse.json({ error: 'Neplatné přihlašovací údaje.' }, { status: 401 })
    }

    const ridicEmail = uzivatel.email
    const { start: startOfToday, end: endOfToday } = getTodayRange()

    // Find today's shift for this driver (date range for @db.Date)
    const existingShift = await prisma.smenaRidic.findFirst({
      where: {
        ridicEmail,
        datum: { gte: startOfToday, lte: endOfToday },
      },
    })

    // STATE 1: No record → Arrival (create new shift; cisloTrasy ignored)
    if (!existingShift) {
      await prisma.smenaRidic.create({
        data: {
          ridicEmail,
          datum: startOfToday,
          // casPrichodu defaults to now()
        },
      })
      return NextResponse.json({
        success: true,
        action: 'ARRIVAL',
        message: 'Příchod zaznamenán',
      })
    }

    // STATE 2: Record exists, no departure yet → Departure (require cisloTrasy)
    if (existingShift.casOdjezdu == null) {
      const routeProvided = typeof cisloTrasy === 'string' && cisloTrasy.trim().length > 0
      if (!routeProvided) {
        return NextResponse.json(
          {
            error: 'MISSING_ROUTE',
            message: 'Pro odjezd na rozvoz musíte zadat číslo trasy.',
          },
          { status: 400 }
        )
      }
      await prisma.smenaRidic.update({
        where: { id: existingShift.id },
        data: {
          casOdjezdu: new Date(),
          cisloTrasy: cisloTrasy!.trim(),
        },
      })
      return NextResponse.json({
        success: true,
        action: 'DEPARTURE',
        message: 'Odjezd na trasu zaznamenán',
      })
    }

    // STATE 3: Departure filled, no return yet → Return (end of shift)
    if (existingShift.casNavratu == null) {
      await prisma.smenaRidic.update({
        where: { id: existingShift.id },
        data: { casNavratu: new Date() },
      })
      return NextResponse.json({
        success: true,
        action: 'RETURN',
        message: 'Konec směny zaznamenán',
      })
    }

    // STATE 4: All times filled → shift already closed
    return NextResponse.json(
      {
        error: 'SHIFT_CLOSED',
        message: 'Pro dnešek již máte uzavřenou směnu.',
      },
      { status: 400 }
    )
  } catch (err) {
    console.error('Driver login error:', err)
    return NextResponse.json({ error: 'Interní chyba serveru.' }, { status: 500 })
  }
}
