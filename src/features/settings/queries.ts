import 'server-only'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const MAINTENANCE_CACHE_TAG = 'maintenance-mode'

async function fetchMaintenanceMode(): Promise<boolean> {
  const setting = await prisma.settings.findUnique({
    where: { key: 'maintenanceMode' },
    select: { value: true },
  })
  return (setting?.value ?? 'false') === 'true'
}

/**
 * Returns whether maintenance mode is enabled.
 * Cached for 30 seconds. Use revalidateTag('maintenance-mode') when admin toggles it.
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  return unstable_cache(
    fetchMaintenanceMode,
    ['maintenance-mode'],
    { tags: [MAINTENANCE_CACHE_TAG], revalidate: 30 }
  )()
}

export { MAINTENANCE_CACHE_TAG }

const SETTINGS_CACHE_TAG = 'system-settings'

async function fetchDefaultPageSize(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: { key: 'defaultPageSize' },
    select: { value: true },
  })
  const val = parseInt(setting?.value ?? '10', 10)
  return Number.isNaN(val) || val < 5 ? 10 : Math.min(100, Math.max(5, val))
}

/**
 * Returns the default page size for tables (5–100).
 * Cached. Revalidate via revalidateTag('system-settings') when settings change.
 */
export async function getDefaultPageSize(): Promise<number> {
  return unstable_cache(
    fetchDefaultPageSize,
    ['default-page-size'],
    { tags: [SETTINGS_CACHE_TAG], revalidate: 60 }
  )()
}

async function fetchSTKWarningDays(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: { key: 'stkWarningDays' },
    select: { value: true },
  })
  const val = parseInt(setting?.value ?? '30', 10)
  return Number.isNaN(val) || val < 1 ? 30 : Math.min(90, Math.max(1, val))
}

/**
 * Returns how many days before STK expiration to send notifications (1–90).
 * Cached. Revalidate via revalidateTag('system-settings') when settings change.
 */
export async function getSTKWarningDays(): Promise<number> {
  return unstable_cache(
    fetchSTKWarningDays,
    ['stk-warning-days'],
    { tags: [SETTINGS_CACHE_TAG], revalidate: 60 }
  )()
}

async function fetchSTKNotificationIntervalDays(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: { key: 'stkNotificationIntervalDays' },
    select: { value: true },
  })
  const val = parseInt(setting?.value ?? '7', 10)
  return Number.isNaN(val) || val < 1 ? 7 : Math.min(30, Math.max(1, val))
}

/**
 * Returns how many days between automatic STK notification emails (1–30).
 * Default 7 (weekly).
 */
export async function getSTKNotificationIntervalDays(): Promise<number> {
  return unstable_cache(
    fetchSTKNotificationIntervalDays,
    ['stk-notification-interval'],
    { tags: [SETTINGS_CACHE_TAG], revalidate: 60 }
  )()
}

const STK_LAST_SENT_KEY = 'stkNotificationLastSentAt'

/**
 * Returns when the last automatic STK email was sent, or null if never.
 */
export async function getSTKNotificationLastSentAt(): Promise<Date | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: STK_LAST_SENT_KEY },
    select: { value: true },
  })
  if (!setting?.value) return null
  const date = new Date(setting.value)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Updates the timestamp of the last automatic STK email.
 */
export async function setSTKNotificationLastSentAt(date: Date): Promise<void> {
  await prisma.settings.upsert({
    where: { key: STK_LAST_SENT_KEY },
    update: { value: date.toISOString(), updatedAt: date },
    create: {
      key: STK_LAST_SENT_KEY,
      value: date.toISOString(),
      category: 'alerts',
      label: 'Poslední odeslání STK upozornění',
      type: 'text',
    },
  })
}
