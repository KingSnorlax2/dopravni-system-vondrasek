import 'server-only'
import { db } from '@/lib/prisma'
import type { NotifikaceTyp as PrismaNotifikaceTyp } from '@prisma/client'
import { sendMail, sendPasswordResetEmail, sendSTKWarningEmail } from '@/lib/email'
import type { STKVehicle } from '@/lib/email'

export type NotificationType =
  | 'STK_VAROVANI'
  | 'RESET_HESLA'
  | 'SCHVALENI'
  | 'NOVY_UZIVATEL'
  | 'SYSTEM'

export interface DispatchNotificationParams {
  userId: number
  type: NotificationType
  title: string
  message: string
  link?: string
  emailData?: {
    to?: string
    templateData?: {
      vehicles?: STKVehicle[]
      resetUrl?: string
      [key: string]: unknown
    }
  }
}

const TYP_TO_ENUM: Record<NotificationType, PrismaNotifikaceTyp> = {
  STK_VAROVANI: 'STK_VAROVANI',
  RESET_HESLA: 'RESET_HESLA',
  SCHVALENI: 'SCHVALENI',
  NOVY_UZIVATEL: 'NOVY_UZIVATEL',
  SYSTEM: 'SYSTEM',
}

/**
 * Dispatch a notification: save to DB and optionally send email based on user preferences.
 * Never throws - errors are logged but not propagated.
 */
export async function dispatchNotification(params: DispatchNotificationParams): Promise<void> {
  const { userId, type, title, message, link, emailData } = params

  // 1. Save to database (always)
  try {
    await db.notifikace.create({
      data: {
        uzivatelId: userId,
        typ: TYP_TO_ENUM[type],
        titul: title,
        obsah: message,
        odkaz: link ?? undefined,
      },
    })
  } catch (error) {
    console.error('Failed to save notification to DB:', userId, type, error)
    return
  }

  // 2. Resolve email preference
  let uzivatel: { email: string } | null = null
  try {
    uzivatel = await db.uzivatel.findUnique({
      where: { id: userId },
      select: { email: true },
    })
  } catch (error) {
    console.error('Failed to fetch uzivatel for notification:', userId, error)
  }

  if (!uzivatel) {
    return
  }

  let emailNotificationsEnabled = true
  try {
    const user = await db.user.findFirst({
      where: { email: uzivatel.email },
      select: { id: true },
    })
    if (user) {
      const prefs = await db.userPreferences.findUnique({
        where: { userId: user.id },
        select: { emailNotifications: true },
      })
      if (prefs) {
        emailNotificationsEnabled = prefs.emailNotifications
      }
    }
  } catch (error) {
    console.error('Failed to fetch user preferences:', userId, error)
    // Default to true (permissive for Uzivatel-only users)
  }

  // 3. Send email if preference allows and emailData provided
  if (!emailNotificationsEnabled || !emailData) {
    return
  }

  const to = emailData.to ?? uzivatel.email

  try {
    switch (type) {
      case 'STK_VAROVANI': {
        const vehicles = emailData.templateData?.vehicles
        if (vehicles && Array.isArray(vehicles) && vehicles.length > 0) {
          await sendSTKWarningEmail(to, vehicles)
        }
        break
      }
      case 'RESET_HESLA': {
        const resetUrl = emailData.templateData?.resetUrl
        if (resetUrl && typeof resetUrl === 'string') {
          await sendPasswordResetEmail(to, resetUrl)
        }
        break
      }
      default: {
        const subject = title
        const html = `<p>${message}</p>${link ? `<p><a href="${link}">Klikněte zde</a></p>` : ''}`
        await sendMail({ to, subject, html })
      }
    }
  } catch (error) {
    console.error('Failed to send notification email:', type, to, error)
    // DB notification already saved - do not throw
  }
}
