"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Car,
  Users,
  FileText,
  BarChart3,
  Newspaper,
  Calendar,
  TrendingUp,
  Wrench,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Activity,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format, isBefore, addDays } from "date-fns"
import cs from "date-fns/locale/cs"
import UnifiedLayout from "@/components/layout/UnifiedLayout"
import { SendEmailButton } from "@/components/ui/send-email-button"
import { useAccessControl } from "@/hooks/useAccessControl"

type HomepageData = {
  fleet: {
    totalVehicles: number
    activeVehicles: number
    inServiceVehicles: number
    retiredVehicles: number
    averageMileage: number
    fleetAgeDistribution: { newer: number; medium: number; older: number }
    totalMaintenanceCost: number
    vehiclesWithStk: Array<{
      id: number
      spz: string
      znacka: string
      model: string
      datumSTK: Date | string
    }>
    urgentStkCount: number
    stkWarningDays: number
    recentMaintenance: Array<{
      id: number
      type: string
      spz: string
      cost: number
      date: Date | string
    }>
  }
  transactions: {
    recent: Array<{
      id: number
      nazev: string
      castka: number
      datum: Date | string
      typ: string
      status: string
      spz?: string
    }>
    totalApprovedSum: number
    totalApprovedCount: number
    pendingCount: number
  }
  repairs: {
    recent: Array<{
      id: number
      kategorie: string
      popis: string
      datum: Date | string
      cena: number | null
      spz: string
      znacka: string
      model: string
    }>
  }
  totalUsers: number
}

export default function Homepage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasRole } = useAccessControl()
  const [data, setData] = useState<HomepageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/homepage", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Homepage fetch error:", err)
        setError("Nepodařilo se načíst data")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Dobré ráno"
    if (hour < 18) return "Dobré odpoledne"
    return "Dobrý večer"
  }

  const quickActions = [
    {
      title: "Vozidla",
      description: "Správa vozového parku, servis, GPS",
      icon: Car,
      href: "/dashboard/auta",
      color: "bg-blue-500",
      show: true,
    },
    {
      title: "Opravy",
      description: "Přehled a evidence oprav",
      icon: Wrench,
      href: "/dashboard/opravy",
      color: "bg-amber-500",
      show: true,
    },
    {
      title: "Grafy",
      description: "Analytika a statistiky",
      icon: BarChart3,
      href: "/dashboard/grafy",
      color: "bg-rose-500",
      show: true,
    },
    {
      title: "Noviny",
      description: "Distribuce novin, přihlášení řidiče",
      icon: Newspaper,
      href: "/dashboard/noviny/distribuce/driver-login",
      color: "bg-indigo-500",
      show: true,
    },
    {
      title: "Uživatelé",
      description: "Správa uživatelů a rolí",
      icon: Users,
      href: "/dashboard/admin/users",
      color: "bg-emerald-500",
      show: hasRole("ADMIN"),
    },
  ].filter((a) => a.show)

  if (status === "loading" || loading) {
    return (
      <UnifiedLayout>
        <div className="unified-loading min-h-[60vh]">
          <div className="unified-spinner" />
        </div>
      </UnifiedLayout>
    )
  }

  if (error || !data) {
    return (
      <UnifiedLayout>
        <div className="unified-section-header">
          <h2 className="unified-section-title">Domovská stránka</h2>
          <p className="text-red-600">{error || "Chyba při načítání"}</p>
        </div>
      </UnifiedLayout>
    )
  }

  const { fleet, transactions, repairs, totalUsers } = data
  const urgentStkCount = fleet.urgentStkCount
  const hasAlerts = urgentStkCount > 0

  return (
    <UnifiedLayout>
      {/* Hero / Welcome */}
      <div className="unified-section-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="unified-section-title">
              {greeting()}, {session?.user?.name || "uživateli"}
            </h2>
            <p className="unified-section-description">
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: cs })}
            </p>
          </div>
          <SendEmailButton reportType="statistics" variant="outline" size="sm">
            Odeslat přehled e-mailem
          </SendEmailButton>
        </div>
      </div>

      {/* Alerts Banner */}
      {hasAlerts && (
        <div className="mb-6 space-y-2">
          {urgentStkCount > 0 && (
            <Link
              href="/dashboard/auta?filter=stk"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 transition-colors hover:bg-amber-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {urgentStkCount} vozidel vyžaduje STK do {fleet.stkWarningDays ?? 30} dnů
                </p>
                <p className="text-sm text-amber-800">
                  Technická kontrola brzy vyprší
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-600" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="unified-grid-stats">
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Car className="mr-2 h-5 w-5 text-primary" />
              Stav vozového parku
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold">{fleet.totalVehicles}</div>
            <div className="mb-4 text-sm text-muted-foreground">
              Celkový počet vozidel
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aktivní</span>
                <span className="font-medium">{fleet.activeVehicles}</span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? (fleet.activeVehicles / fleet.totalVehicles) * 100
                    : 0
                }
                className="h-2 bg-muted"
              />
              <div className="flex justify-between text-sm">
                <span>V servisu</span>
                <span className="font-medium">{fleet.inServiceVehicles}</span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? (fleet.inServiceVehicles / fleet.totalVehicles) * 100
                    : 0
                }
                className="h-2 bg-muted"
              />
              <div className="flex justify-between text-sm">
                <span>Vyřazeno</span>
                <span className="font-medium">{fleet.retiredVehicles}</span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? (fleet.retiredVehicles / fleet.totalVehicles) * 100
                    : 0
                }
                className="h-2 bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header flex flex-row items-center justify-between space-y-0">
            <CardTitle className="unified-card-title">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Technické kontroly (STK)
            </CardTitle>
            <SendEmailButton reportType="stk" variant="ghost" size="sm" iconOnly />
          </CardHeader>
          <CardContent className="unified-card-content">
            {urgentStkCount > 0 ? (
              <div className="mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                <span className="font-medium text-amber-600">
                  {urgentStkCount} vozidel vyžaduje STK do {fleet.stkWarningDays ?? 30} dnů
                </span>
              </div>
            ) : (
              <div className="mb-4 font-medium text-green-600">
                Všechna vozidla mají platnou STK
              </div>
            )}
            <div className="space-y-3">
              {(fleet.vehiclesWithStk || []).slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{v.spz}</div>
                    <div className="text-sm text-muted-foreground">
                      {v.znacka} {v.model}
                    </div>
                  </div>
                  <Badge
                    variant={
                      isBefore(new Date(v.datumSTK), new Date())
                        ? "destructive"
                        : isBefore(
                            new Date(v.datumSTK),
                            addDays(new Date(), fleet.stkWarningDays ?? 30)
                          )
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {format(new Date(v.datumSTK), "dd.MM.yyyy")}
                  </Badge>
                </div>
              ))}
            </div>
            {fleet.vehiclesWithStk?.length > 3 && (
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/dashboard/auta">
                  Zobrazit vše <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Stáří a nájezd
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">
                Průměrný nájezd
              </div>
              <div className="text-2xl font-bold">
                {(fleet.averageMileage || 0).toLocaleString("cs-CZ")} km
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Stáří vozového parku
              </div>
              <div className="flex justify-between text-sm">
                <span>Do 3 let</span>
                <span className="font-medium">
                  {fleet.fleetAgeDistribution?.newer ?? 0}
                </span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? ((fleet.fleetAgeDistribution?.newer ?? 0) /
                        fleet.totalVehicles) *
                      100
                    : 0
                }
                className="h-2 bg-muted"
              />
              <div className="flex justify-between text-sm">
                <span>3–7 let</span>
                <span className="font-medium">
                  {fleet.fleetAgeDistribution?.medium ?? 0}
                </span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? ((fleet.fleetAgeDistribution?.medium ?? 0) /
                        fleet.totalVehicles) *
                      100
                    : 0
                }
                className="h-2 bg-muted"
              />
              <div className="flex justify-between text-sm">
                <span>Nad 7 let</span>
                <span className="font-medium">
                  {fleet.fleetAgeDistribution?.older ?? 0}
                </span>
              </div>
              <Progress
                value={
                  fleet.totalVehicles > 0
                    ? ((fleet.fleetAgeDistribution?.older ?? 0) /
                        fleet.totalVehicles) *
                      100
                    : 0
                }
                className="h-2 bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Wrench className="mr-2 h-5 w-5 text-primary" />
              Údržba a servis
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">
                Celkové náklady na údržbu
              </div>
              <div className="text-2xl font-bold">
                {(fleet.totalMaintenanceCost || 0).toLocaleString("cs-CZ")} Kč
              </div>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">
              Poslední záznamy
            </div>
            <div className="space-y-3">
              {(fleet.recentMaintenance || []).slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium">{r.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.spz}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {r.cost.toLocaleString("cs-CZ")} Kč
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "dd.MM.yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" size="sm" className="mt-2 p-0" asChild>
              <Link href="/dashboard/auta">
                Všechny záznamy <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin summary card */}
      {hasRole("ADMIN") && (
        <Card className="unified-card mb-8">
          <CardContent className="flex flex-wrap items-center gap-6 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <div className="text-sm text-muted-foreground">
                  Aktivních uživatelů
                </div>
              </div>
            </div>
            <Link href="/dashboard/admin/users" className="ml-auto">
              <Button variant="outline" size="sm">
                Správa uživatelů
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mb-10">
        <h3 className="mb-6 text-xl font-semibold text-gray-900">
          Rychlé akce
        </h3>
        <div className="unified-grid-actions">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <Card className="unified-card group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`rounded-xl p-3 ${action.color} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 transition-colors group-hover:text-primary">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Transactions | Recent Repairs */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <Card className="unified-card">
          <CardHeader className="unified-card-header flex flex-row items-center justify-between">
            <CardTitle className="unified-card-title">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Poslední transakce
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/transakce">Všechny</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Žádné transakce
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.recent.map((t) => (
                  <Link
                    key={t.id}
                    href="/dashboard/transakce"
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.nazev}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.datum), "dd.MM.yyyy")}
                        {t.spz && ` • ${t.spz}`}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <span
                        className={
                          t.typ === "příjem"
                            ? "font-medium text-green-600"
                            : "font-medium text-red-600"
                        }
                      >
                        {t.typ === "příjem" ? "+" : "-"}
                        {Math.abs(t.castka).toLocaleString("cs-CZ")} Kč
                      </span>
                      {t.status === "PENDING" && (
                        <Badge variant="outline" className="ml-2">
                          Čeká
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader className="unified-card-header flex flex-row items-center justify-between">
            <CardTitle className="unified-card-title">
              <Wrench className="mr-2 h-5 w-5 text-primary" />
              Poslední opravy
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/opravy">Všechny</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {repairs.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Žádné opravy
              </p>
            ) : (
              <div className="space-y-3">
                {repairs.recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.kategorie}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.popis}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.znacka} {r.model} • {r.spz} •{" "}
                        {format(new Date(r.datum), "dd.MM.yyyy")}
                      </p>
                    </div>
                    {r.cena != null && r.cena > 0 && (
                      <div className="ml-3 font-medium">
                        {r.cena.toLocaleString("cs-CZ")} Kč
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Status */}
      <Card className="unified-card">
        <CardHeader className="unified-card-header">
          <CardTitle className="unified-card-title">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Přehled systému
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-lg bg-green-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-green-900">Systém je připraven</p>
                <p className="text-sm text-green-700">
                  Všechny služby jsou funkční
                </p>
              </div>
              <span className="ml-auto text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
                <Truck className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Přihlášení úspěšné</p>
                <p className="text-sm text-gray-600">
                  {session?.user?.name} ({session?.user?.email})
                </p>
              </div>
              <span className="ml-auto text-xs text-gray-500">
                Právě teď
              </span>
            </div>
            {urgentStkCount > 0 && (
              <div className="flex items-center gap-4 rounded-lg bg-amber-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">STK upozornění</p>
                  <p className="text-sm text-amber-700">
                    {urgentStkCount} vozidel vyžaduje technickou kontrolu do{' '}
                    {fleet.stkWarningDays ?? 30} dnů
                  </p>
                </div>
                <Link href="/dashboard/auta?filter=stk">
                  <Button variant="outline" size="sm" className="ml-auto">
                    Zobrazit
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </UnifiedLayout>
  )
}
