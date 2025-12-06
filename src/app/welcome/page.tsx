'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, LogOut, ArrowRight } from 'lucide-react'
import { signOut } from 'next-auth/react'
import UnifiedLayout from '@/components/layout/UnifiedLayout'

export default function WelcomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allowedPages, setAllowedPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/')
      return
    }

    // Immediately redirect to defaultLandingPage (middleware should handle this, but this is a backup)
    const defaultLandingPage = (session.user as any)?.defaultLandingPage;
    if (defaultLandingPage && defaultLandingPage !== '/welcome') {
      router.replace(defaultLandingPage);
      return;
    }

    // Get allowed pages from session
    const pages = (session.user as any)?.allowedPages || []
    setAllowedPages(pages)
    setLoading(false)
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání...</p>
          </div>
        </div>
      </UnifiedLayout>
    )
  }

  if (!session) {
    return null
  }

  const userName = session.user?.name || session.user?.email || 'Uživateli'
  const userRole = (session.user as any)?.role || 'USER'

  // Filter out the welcome page and root pages, and format for display
  const availablePages = allowedPages
    .filter(page => page !== '/welcome' && page !== '/' && page !== '/homepage')
    .map(page => {
      // Get page label from path
      const pageLabels: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/dashboard/auta': 'Vozidla',
        '/dashboard/auta/mapa': 'Mapa vozidel',
        '/dashboard/auta/archiv': 'Archiv vozidel',
        '/dashboard/auta/stk': 'STK',
        '/dashboard/auta/servis': 'Servis',
        '/dashboard/opravy': 'Opravy',
        '/dashboard/grafy': 'Grafy',
        '/dashboard/transakce': 'Transakce',
        '/dashboard/noviny': 'Noviny',
        '/dashboard/noviny/distribuce/driver-login': 'Přihlášení řidiče',
        '/dashboard/noviny/distribuce/driver-route': 'Trasa řidiče',
        '/dashboard/noviny/distribuce/driver-restricted': 'Omezený přístup řidiče',
        '/dashboard/admin/users': 'Správa uživatelů',
        '/dashboard/admin/settings': 'Nastavení systému',
        '/dashboard/settings': 'Nastavení',
        '/dashboard/account': 'Účet',
        '/dashboard/soubory': 'Soubory',
      }
      return {
        path: page,
        label: pageLabels[page] || page,
      }
    })

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Home className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Vítejte, {userName}!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Jste úspěšně přihlášeni do systému
            </CardDescription>
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Role: {userRole}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Vyberte stránku, ke které máte přístup:
              </p>
            </div>

            {availablePages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Nemáte přístup k žádným stránkám.
                </p>
                <p className="text-sm text-gray-400">
                  Kontaktujte administrátora pro získání přístupu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePages.map((page) => (
                  <Button
                    key={page.path}
                    variant="outline"
                    className="h-auto py-4 px-6 justify-between group hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => handleNavigate(page.path)}
                  >
                    <span className="font-medium text-gray-900">{page.label}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </Button>
                ))}
              </div>
            )}

            <div className="pt-6 border-t flex justify-center">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásit se
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  )
}

