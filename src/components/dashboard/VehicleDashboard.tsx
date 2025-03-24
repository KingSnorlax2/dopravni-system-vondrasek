'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, AlertTriangle, Bell, BarChart3, Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { VehicleStatusOverview } from "./VehicleStatusOverview";
import { MaintenanceAlerts } from "./MaintenanceAlerts";
import { RecentActivities } from "./RecentActivities";

interface Vehicle {
  id: string;
  spz: string;
  znacka: string;
  model: string;
  stav: 'aktivní' | 'servis' | 'vyřazeno';
  rokVyroby?: number;
  najezd?: number;
}

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  spz: string;
  type: string;
  date: string;
  daysRemaining: number;
}

interface VehicleDashboardProps {
  vehicles: Vehicle[];
  maintenanceAlerts: MaintenanceAlert[];
}

export function VehicleDashboard({ vehicles, maintenanceAlerts }: VehicleDashboardProps) {
  // Count vehicles by status
  const statusCounts = {
    active: vehicles.filter((v: Vehicle) => v.stav === 'aktivní').length,
    service: vehicles.filter((v: Vehicle) => v.stav === 'servis').length,
    inactive: vehicles.filter((v: Vehicle) => v.stav === 'vyřazeno').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Celkem vozidel</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                {statusCounts.active} aktivních
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                {statusCounts.service} v servisu
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100">
                {statusCounts.inactive} vyřazených
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vozidla vyžadující pozornost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vozidla se STK nebo servisem v následujících 30 dnech
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dnešní aktivita</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vozidla v pohybu dnes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main dashboard content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="maintenance">Údržba</TabsTrigger>
          <TabsTrigger value="activity">Aktivita</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upozornění</AlertTitle>
            <AlertDescription>
              3 vozidla mají platnost STK méně než 30 dní. <Link href="/dashboard/auta?filter=stk" className="font-medium underline underline-offset-4">Zobrazit</Link>
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Mapa aktivních vozidel</CardTitle>
                  <CardDescription>
                    Aktuální poloha vozidel ve vozovém parku
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[300px] relative">
                  {/* Mini Map Preview */}
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <Link
                      href="/dashboard/auta/mapa"
                      className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <span className="px-4 py-2 bg-white rounded-md shadow-sm font-medium">
                        Zobrazit mapu
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Status vozidel</CardTitle>
                <CardDescription>
                  Přehled podle stavu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VehicleStatusOverview data={statusCounts} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceAlerts alerts={maintenanceAlerts} />
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <RecentActivities />
        </TabsContent>
      </Tabs>
    </div>
  );
} 