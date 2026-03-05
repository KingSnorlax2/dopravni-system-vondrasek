'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { MAINTENANCE_CACHE_TAG } from './queries'
const SETTINGS_CACHE_TAG = 'system-settings'
import type { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAuthorizedAction } from '@/lib/safe-action'
import { systemSettingsSchema } from './validations'

type SystemSettingsInput = z.infer<typeof systemSettingsSchema>

const SETTINGS_CONFIG: Array<{
  key: string
  category: string
  label: string
  type: string
  getValue: (data: SystemSettingsInput) => string
}> = [
  {
    key: 'maintenanceMode',
    category: 'system',
    label: 'Režim údržby',
    type: 'boolean',
    getValue: (d) => String(d.maintenanceMode ?? false),
  },
  {
    key: 'defaultPageSize',
    category: 'tables',
    label: 'Výchozí počet položek na stránku',
    type: 'number',
    getValue: (d) => String(d.defaultPageSize ?? 10),
  },
  {
    key: 'stkWarningDays',
    category: 'alerts',
    label: 'Upozornění na STK (dny)',
    type: 'number',
    getValue: (d) => String(d.stkWarningDays ?? 30),
  },
  {
    key: 'stkNotificationIntervalDays',
    category: 'alerts',
    label: 'Interval odesílání STK e-mailů (dny)',
    type: 'number',
    getValue: (d) => String(d.stkNotificationIntervalDays ?? 7),
  },
  {
    key: 'driver_login_locked',
    category: 'driver_access',
    label: 'Uzamčení přihlášení řidičů',
    type: 'boolean',
    getValue: (d) => String(!(d.allowDriverLogin ?? true)),
  },
]

export const updateSystemSettings = createAuthorizedAction(
  systemSettingsSchema,
  ['ADMIN'],
  async (data) => {
    for (const config of SETTINGS_CONFIG) {
      const value = config.getValue(data)
      await prisma.settings.upsert({
        where: { key: config.key },
        update: { value, updatedAt: new Date() },
        create: {
          key: config.key,
          value,
          category: config.category,
          label: config.label,
          type: config.type,
        },
      })
    }
    revalidatePath('/dashboard/admin/settings')
    revalidateTag(MAINTENANCE_CACHE_TAG)
    revalidateTag(SETTINGS_CACHE_TAG)
    return { success: true }
  }
)
