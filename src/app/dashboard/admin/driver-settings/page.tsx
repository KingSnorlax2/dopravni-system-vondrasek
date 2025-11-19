"use client";

import DriverLoginControl from '@/components/newspaper/DriverLoginControl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccessControl } from "@/hooks/useAccessControl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from 'react'
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function DriverSettingsPage() {
  const { hasRole, loading } = useAccessControl();
  const router = useRouter();
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ totalCount: number; todayCount: number; last7DaysCount: number } | null>(null)
  const [recent, setRecent] = useState<Array<{ ridicEmail: string; cisloTrasy: string; casPrihlaseni: string }>>([])

  const groupedByDay = useMemo(() => {
    const groups: Record<string, { date: string; items: typeof recent }> = {}
    for (const r of recent) {
      const d = new Date(r.casPrihlaseni)
      // yyyy-mm-dd key for grouping
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!groups[key]) {
        groups[key] = { date: key, items: [] as typeof recent }
      }
      groups[key].items.push(r)
    }
    // Sort groups by date desc
    const sortedKeys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1))
    return sortedKeys.map((k) => ({ date: k, items: groups[k].items.sort((a, b) => (a.casPrihlaseni < b.casPrihlaseni ? 1 : -1)) }))
  }, [recent])

  useEffect(() => {
    if (!loading && !hasRole("ADMIN")) {
      router.replace("/403");
    }
  }, [loading, hasRole, router]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLogsLoading(true)
        setLogsError(null)
        const res = await fetch('/api/driver-login/logs')
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || 'Nepodařilo se načíst přihlášení řidičů')
        }
        const data = await res.json()
        setStats(data.stats || null)
        setRecent(Array.isArray(data.recent) ? data.recent : [])
      } catch (e: any) {
        setLogsError(e?.message || 'Chyba při načítání logů')
      } finally {
        setLogsLoading(false)
      }
    }
    loadLogs()
  }, [])

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Nastavení přihlášení řidičů</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ovládání přihlášení a omezení</CardTitle>
            <CardDescription>
              Uzamčení přihlášení řidičů a omezení jejich navigace v systému
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverLoginControl />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Přihlášení řidičů (log)</CardTitle>
            <CardDescription>Poslední přihlášení: kdo, kdy a na jakou trasu</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Načítám přihlášení...
              </div>
            ) : logsError ? (
              <div className="text-sm text-red-600">{logsError}</div>
            ) : (
              <div className="space-y-4">
                {stats && (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="px-2 py-0.5 text-xs">Celkem: {stats.totalCount}</Badge>
                    <Badge variant="outline" className="px-2 py-0.5 text-xs">Dnes: {stats.todayCount}</Badge>
                    <Badge variant="outline" className="px-2 py-0.5 text-xs">Posledních 7 dní: {stats.last7DaysCount}</Badge>
                  </div>
                )}

                {groupedByDay.length === 0 ? (
                  <div className="text-xs text-gray-500">Žádné záznamy</div>
                ) : (
                  groupedByDay.map(({ date, items }) => (
                    <div key={date} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {new Date(date).toLocaleDateString('cs-CZ', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        <Badge variant="secondary" className="px-2 py-0.5 text-xs">{items.length} přihlášení</Badge>
                      </div>
                      <div className="rounded border divide-y">
                        {items.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums text-gray-700">{new Date(r.casPrihlaseni).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-gray-500">•</span>
                              <span className="font-medium">Trasa {r.cisloTrasy}</span>
                            </div>
                            <div className="truncate max-w-[45%] text-gray-600" title={r.ridicEmail}>{r.ridicEmail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


