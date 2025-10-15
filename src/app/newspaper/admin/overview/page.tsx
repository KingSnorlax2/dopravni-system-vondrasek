import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, Newspaper, Activity } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function NewspaperAdminOverviewPage() {
  // Query directly via Prisma on the server
  const [recent, totalCount, todayCount, last7DaysCount] = await Promise.all([
    prisma.driverRouteLogin.findMany({ orderBy: { casPrihlaseni: 'desc' }, take: 50 }),
    prisma.driverRouteLogin.count(),
    prisma.driverRouteLogin.count({ where: { casPrihlaseni: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.driverRouteLogin.count({ where: { casPrihlaseni: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  ])

  const stats = { totalCount, todayCount, last7DaysCount }

  return (
    <div className="space-y-6">
      <div className="unified-section-header">
        <div>
          <h2 className="text-xl font-semibold">Přehled řidičů a novin</h2>
          <p className="text-gray-600">Rychlý souhrn aktivit a přihlášení řidičů</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="h-4 w-4 mr-2"/>Přihlášení dnes</CardTitle>
            <CardDescription>Počet unikátních přihlášení dnes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayCount}</div>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="h-4 w-4 mr-2"/>Posledních 7 dní</CardTitle>
            <CardDescription>Počet přihlášení</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.last7DaysCount}</div>
          </CardContent>
        </Card>
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center"><Truck className="h-4 w-4 mr-2"/>Celkem záznamů</CardTitle>
            <CardDescription>Historie přihlášení řidičů</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center"><Newspaper className="h-4 w-4 mr-2"/>Poslední přihlášení řidičů</CardTitle>
          <CardDescription>Nejnovější záznamy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Číslo trasy</th>
                  <th className="py-2 pr-4">Čas přihlášení</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-4">{r.ridicEmail}</td>
                    <td className="py-2 pr-4"><Badge variant="secondary">{r.cisloTrasy}</Badge></td>
                    <td className="py-2 pr-4">{new Date(r.casPrihlaseni).toLocaleString()}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>Žádné záznamy</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


