import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import ServerSettingsClient from './ServerSettingsClient'
import type { SystemSettings } from '@/features/settings/validations'

const DEFAULT_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  defaultPageSize: 10,
  stkWarningDays: 30,
  stkNotificationIntervalDays: 7,
  allowDriverLogin: true,
}

function parseSettingValue(value: string, type: string): string | number | boolean {
  if (type === 'boolean') return value === 'true'
  if (type === 'number') return parseInt(value, 10) || 0
  return value
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/')
  }

  const role = (session.user as { role?: string }).role
  const hasAdminRole = role === 'ADMIN'
  if (!hasAdminRole) {
    redirect('/403')
  }

  const rows = await db.settings.findMany()
  const settingsMap = new Map(rows.map((r) => [r.key, r]))

  const formattedData: SystemSettings = {
    maintenanceMode: (parseSettingValue(settingsMap.get('maintenanceMode')?.value ?? 'false', 'boolean') as boolean) ?? DEFAULT_SETTINGS.maintenanceMode,
    defaultPageSize: (parseSettingValue(settingsMap.get('defaultPageSize')?.value ?? '10', 'number') as number) || DEFAULT_SETTINGS.defaultPageSize,
    stkWarningDays: (parseSettingValue(settingsMap.get('stkWarningDays')?.value ?? '30', 'number') as number) || DEFAULT_SETTINGS.stkWarningDays,
    stkNotificationIntervalDays: (parseSettingValue(settingsMap.get('stkNotificationIntervalDays')?.value ?? '7', 'number') as number) || DEFAULT_SETTINGS.stkNotificationIntervalDays,
    allowDriverLogin: (settingsMap.get('driver_login_locked')?.value ?? 'false') !== 'true',
  }

  return (
    <div className="container py-10">
      <div className="text-sm text-muted-foreground mb-4">
        Dashboard / Admin / Nastavení systému
      </div>
      <h1 className="text-3xl font-bold mb-6">Nastavení aplikace</h1>

      <div className="space-y-6">
        <ServerSettingsClient initialData={formattedData} />
      </div>
    </div>
  )
}
