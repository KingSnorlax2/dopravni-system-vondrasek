import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { isMaintenanceModeEnabled } from '@/features/settings/queries'

export default async function HomepageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  const maintenanceEnabled = await isMaintenanceModeEnabled()
  const role = (session.user as { role?: string }).role

  if (maintenanceEnabled && role !== 'ADMIN') {
    redirect('/maintenance')
  }

  return <>{children}</>
}
