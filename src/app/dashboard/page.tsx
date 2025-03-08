"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Car, 
  AlertTriangle,
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Wrench,
  ArrowRight
} from "lucide-react"
import { format, isBefore, addMonths } from "date-fns"
import { cs } from "date-fns/locale"
import Link from "next/link"

export default function DashboardPage() {
  const [data, setData] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    inServiceVehicles: 0,
    retiredVehicles: 0,
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
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/fleet-overview')
        const dashboardData = await response.json()
        setData({
          ...dashboardData,
          isLoading: false
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setData(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate vehicles needing STK inspection soon (in next 30 days)
  const urgentStkCount = data.vehiclesWithStk?.filter((vehicle: any) => 
    isBefore(new Date(vehicle.datumSTK), addMonths(new Date(), 1))
  )?.length || 0

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Přehled vozového parku</h1>
      
      {data.isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fleet Status Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Car className="mr-2 h-5 w-5 text-primary" />
                Stav vozového parku
              </CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Technické kontroly
              </CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Stáří a nájezd
              </CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-primary" />
                Údržba a servis
              </CardTitle>
            </CardHeader>
            <CardContent>
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
      )}
    </div>
  )
}
