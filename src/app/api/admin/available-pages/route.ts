import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

// Define available pages with metadata
const AVAILABLE_PAGES = [
  { path: '/welcome', label: 'Uvítací stránka', description: 'Vítejte v systému' },
  { path: '/homepage', label: 'Homepage', description: 'Hlavní přehled' },
  { path: '/dashboard', label: 'Dashboard', description: 'Klasický dashboard' },
  { path: '/dashboard/auta', label: 'Vozidla', description: 'Správa vozidel' },
  { path: '/dashboard/auta/mapa', label: 'Mapa vozidel', description: 'GPS mapa vozidel' },
  { path: '/dashboard/auta/archiv', label: 'Archiv vozidel', description: 'Archivovaná vozidla' },
  { path: '/dashboard/auta/stk', label: 'STK', description: 'Kontroly STK' },
  { path: '/dashboard/auta/servis', label: 'Servis', description: 'Servisní záznamy' },
  { path: '/dashboard/opravy', label: 'Opravy', description: 'Správa oprav' },
  { path: '/dashboard/grafy', label: 'Grafy', description: 'Analytika a grafy' },
  { path: '/dashboard/transakce', label: 'Transakce', description: 'Finanční transakce' },
  { path: '/dashboard/noviny', label: 'Noviny', description: 'Distribuce novin' },
  { path: '/dashboard/noviny/distribuce/driver-login', label: 'Přihlášení řidiče', description: 'Přihlášení pro řidiče' },
  { path: '/dashboard/noviny/distribuce/driver-route', label: 'Trasa řidiče', description: 'Správa tras řidiče' },
  { path: '/dashboard/noviny/distribuce/driver-restricted', label: 'Omezený přístup řidiče', description: 'Omezený přístup' },
  { path: '/dashboard/admin/users', label: 'Správa uživatelů', description: 'Uživatelé a role' },
  { path: '/dashboard/admin/settings', label: 'Nastavení systému', description: 'Systémová nastavení' },
  { path: '/dashboard/settings', label: 'Nastavení', description: 'Uživatelská nastavení' },
  { path: '/dashboard/account', label: 'Účet', description: 'Správa účtu' },
  { path: '/dashboard/soubory', label: 'Soubory', description: 'Správa souborů' },
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(AVAILABLE_PAGES)
  } catch (error) {
    console.error('Error fetching available pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

