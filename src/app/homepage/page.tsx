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
  MapPin, 
  BarChart3, 
  Settings,
  Newspaper,
  Calendar,
  TrendingUp,
  Shield,
  LogOut,
  AlertTriangle,
  Wrench,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format, isBefore, addMonths } from "date-fns"
import cs from 'date-fns/locale/cs'
import UnifiedLayout from "@/components/layout/UnifiedLayout"

export default function Homepage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    inServiceVehicles: 0,
    retiredVehicles: 0,
    totalUsers: 0,
    vehiclesWithStk: [],
    recentMaintenance: [],
    totalMaintenanceCost: 0,
    averageMileage: 0,
    fleetAgeDistribution: {
      newer: 0,
      medium: 0,
      older: 0
    },
    isLoading: true
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        const [fleetResponse, usersResponse] = await Promise.all([
          fetch('/api/dashboard/fleet-overview'),
          fetch('/api/users')
        ])
        
        const fleetData = await fleetResponse.json()
        const usersData = await usersResponse.json()
        
        setData({
          ...fleetData,
          totalUsers: usersData.length || 0,
          isLoading: false
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setData(prev => ({ ...prev, isLoading: false }))
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  // Calculate vehicles needing STK inspection soon (in next 30 days)
  const urgentStkCount = data.vehiclesWithStk?.filter((vehicle: any) => 
    isBefore(new Date(vehicle.datumSTK), addMonths(new Date(), 1))
  )?.length || 0

  const quickActions = [
    {
      title: "Správa vozidel",
      description: "Přehled a správa vozového parku",
      icon: Car,
      href: "/dashboard/auta",
      color: "bg-blue-500"
    },
    {
      title: "Uživatelé",
      description: "Správa uživatelů a oprávnění",
      icon: Users,
      href: "/dashboard/users",
      color: "bg-green-500"
    },
    {
      title: "Transakce",
      description: "Finanční přehled a faktury",
      icon: FileText,
      href: "/dashboard/transakce",
      color: "bg-purple-500"
    },
    {
      title: "GPS sledování",
      description: "Sledování polohy vozidel",
      icon: MapPin,
      href: "/dashboard/auta",
      color: "bg-orange-500"
    },
    {
      title: "Grafy a statistiky",
      description: "Analýza dat a reporty",
      icon: BarChart3,
      href: "/dashboard/grafy",
      color: "bg-red-500"
    },
    {
      title: "Noviny",
      description: "Správa distribuce novin",
      icon: Newspaper,
      href: "/dashboard/noviny",
      color: "bg-indigo-500"
    }
  ]

  if (status === "loading" || data.isLoading) {
    return (
      <div className="unified-loading">
        <div className="unified-spinner"></div>
      </div>
    )
  }

  return (
    <UnifiedLayout>
      {/* Welcome Section */}
      <div className="unified-section-header">
        <h2 className="unified-section-title">
          Vítejte v dopravním systému
        </h2>
        <p className="unified-section-description">
          Spravujte svůj vozový park, sledujte GPS polohy a analyzujte data na jednom místě.
        </p>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="unified-grid-stats">
        {/* Fleet Status Overview */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Car className="mr-2 h-5 w-5 text-primary" />
              Stav vozového parku
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="text-2xl font-bold">{data.totalVehicles}</div>
            <div className="text-sm text-muted-foreground mb-4">Celkový počet vozidel</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aktivní</span>
                <span className="font-medium">{data.activeVehicles}</span>
              </div>
              <Progress value={(data.activeVehicles / data.totalVehicles) * 100} className="h-2 bg-muted" />
              
              <div className="flex justify-between text-sm">
                <span>V servisu</span>
                <span className="font-medium">{data.inServiceVehicles}</span>
              </div>
              <Progress value={(data.inServiceVehicles / data.totalVehicles) * 100} className="h-2 bg-muted" />
              
              <div className="flex justify-between text-sm">
                <span>Vyřazeno</span>
                <span className="font-medium">{data.retiredVehicles}</span>
              </div>
              <Progress value={(data.retiredVehicles / data.totalVehicles) * 100} className="h-2 bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* STK Overview */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Technické kontroly
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            {urgentStkCount > 0 ? (
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-amber-600 font-medium">{urgentStkCount} vozidel vyžaduje STK do 30 dnů</span>
              </div>
            ) : (
              <div className="text-green-600 font-medium mb-4">Všechna vozidla mají platnou STK</div>
            )}
            
            <div className="space-y-3 mt-2">
              {(data.vehiclesWithStk || []).slice(0, 3).map((vehicle: any) => (
                <div key={vehicle.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{vehicle.spz}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.znacka} {vehicle.model}</div>
                  </div>
                  <Badge variant={
                    isBefore(new Date(vehicle.datumSTK), new Date()) 
                      ? "destructive" 
                      : isBefore(new Date(vehicle.datumSTK), addMonths(new Date(), 1))
                        ? "outline"
                        : "secondary"
                  }>
                    {format(new Date(vehicle.datumSTK), "dd.MM.yyyy")}
                  </Badge>
                </div>
              ))}
            </div>
            
            {(data.vehiclesWithStk || []).length > 3 && (
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/dashboard/auta">
                  Zobrazit vše <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Mileage & Age Overview */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Stáří a nájezd
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Průměrný nájezd</div>
              <div className="text-2xl font-bold">{(data.averageMileage || 0).toLocaleString()} km</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Stáří vozového parku</div>
              <div className="flex justify-between text-sm">
                <span>Do 3 let</span>
                <span className="font-medium">{data.fleetAgeDistribution?.newer ?? 0}</span>
              </div>
              <Progress 
                value={(data.fleetAgeDistribution?.newer ?? 0) / data.totalVehicles * 100} 
                className="h-2 bg-muted" 
              />
              
              <div className="flex justify-between text-sm">
                <span>3-7 let</span>
                <span className="font-medium">{data.fleetAgeDistribution?.medium ?? 0}</span>
              </div>
              <Progress 
                value={(data.fleetAgeDistribution?.medium ?? 0) / data.totalVehicles * 100} 
                className="h-2 bg-muted" 
              />
              
              <div className="flex justify-between text-sm">
                <span>Nad 7 let</span>
                <span className="font-medium">{data.fleetAgeDistribution?.older ?? 0}</span>
              </div>
              <Progress 
                value={(data.fleetAgeDistribution?.older ?? 0) / data.totalVehicles * 100} 
                className="h-2 bg-muted" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Overview */}
        <Card className="unified-card">
          <CardHeader className="unified-card-header">
            <CardTitle className="unified-card-title">
              <Wrench className="mr-2 h-5 w-5 text-primary" />
              Údržba a servis
            </CardTitle>
          </CardHeader>
          <CardContent className="unified-card-content">
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Celkové náklady</div>
              <div className="text-2xl font-bold">{(data.totalMaintenanceCost || 0).toLocaleString()} Kč</div>
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">Poslední záznamy</div>
            <div className="space-y-3">
              {(data.recentMaintenance || []).slice(0, 3).map((record: { id: string; type: string; spz: string; cost: number; date: string }) => (
                <div key={record.id} className="flex justify-between items-start border-b pb-2">
                  <div>
                    <div className="font-medium">{record.type}</div>
                    <div className="text-xs text-muted-foreground">{record.spz}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{record.cost.toLocaleString()} Kč</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(record.date), "dd.MM.yyyy")}
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Rychlé akce</h3>
        <div className="unified-grid-actions">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="unified-card cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="unified-card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Poslední aktivity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Systém je připraven</p>
              <p className="text-xs text-gray-600">Všechny služby jsou funkční</p>
            </div>
            <span className="text-xs text-gray-500">Právě teď</span>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Přihlášení úspěšné</p>
              <p className="text-xs text-gray-600">Uživatel {session?.user?.name} se přihlásil</p>
            </div>
            <span className="text-xs text-gray-500">Právě teď</span>
          </div>
          {urgentStkCount > 0 && (
            <div className="flex items-center space-x-4 p-3 bg-amber-50 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">STK upozornění</p>
                <p className="text-xs text-amber-700">{urgentStkCount} vozidel vyžaduje technickou kontrolu</p>
              </div>
              <span className="text-xs text-amber-600">Důležité</span>
            </div>
          )}
        </div>
      </div>
    </UnifiedLayout>
  )
} 