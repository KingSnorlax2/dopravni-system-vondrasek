'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, MapPin, Truck, Users, Clock, Target, Award, AlertTriangle, CheckCircle, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

interface Statistics {
  totalRoutes: number;
  completedRoutes: number;
  activeRoutes: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
  totalVehicles: number;
  availableVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  customerSatisfaction: number;
  fuelEfficiency: number;
}

interface DistrictStats {
  name: string;
  routes: number;
  deliveries: number;
  completionRate: number;
  averageTime: number;
  issues: number;
}

interface DriverStats {
  name: string;
  routes: number;
  deliveries: number;
  completionRate: number;
  averageTime: number;
  performance: number;
}

export default function NewspaperStatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [districtStats, setDistrictStats] = useState<DistrictStats[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const { toast } = useToast();

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock statistics
        const mockStats: Statistics = {
          totalRoutes: 156,
          completedRoutes: 142,
          activeRoutes: 8,
          totalDeliveries: 2840,
          completedDeliveries: 2715,
          averageDeliveryTime: 127,
          onTimeDeliveries: 2580,
          delayedDeliveries: 155,
          totalVehicles: 24,
          availableVehicles: 18,
          totalDrivers: 32,
          activeDrivers: 28,
          customerSatisfaction: 94,
          fuelEfficiency: 87
        };
        
        const mockDistrictStats: DistrictStats[] = [
          { name: 'Praha 1', routes: 25, deliveries: 450, completionRate: 96, averageTime: 115, issues: 2 },
          { name: 'Praha 2', routes: 22, deliveries: 380, completionRate: 94, averageTime: 128, issues: 3 },
          { name: 'Praha 3', routes: 28, deliveries: 520, completionRate: 92, averageTime: 135, issues: 5 },
          { name: 'Praha 4', routes: 20, deliveries: 320, completionRate: 98, averageTime: 110, issues: 1 },
          { name: 'Praha 5', routes: 18, deliveries: 280, completionRate: 95, averageTime: 125, issues: 2 },
          { name: 'Brno', routes: 15, deliveries: 220, completionRate: 93, averageTime: 140, issues: 3 },
          { name: 'Plzeň', routes: 12, deliveries: 180, completionRate: 97, averageTime: 105, issues: 1 }
        ];
        
        const mockDriverStats: DriverStats[] = Array.from({ length: 15 }, (_, i) => ({
          name: `Řidič ${i + 1}`,
          routes: Math.floor(Math.random() * 15) + 5,
          deliveries: Math.floor(Math.random() * 200) + 100,
          completionRate: Math.floor(Math.random() * 15) + 85,
          averageTime: Math.floor(Math.random() * 60) + 100,
          performance: Math.floor(Math.random() * 20) + 80
        }));
        
        setStats(mockStats);
        setDistrictStats(mockDistrictStats);
        setDriverStats(mockDriverStats);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast({
          title: 'Chyba',
          description: 'Nepodařilo se načíst statistiky',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [toast, timeRange]);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col space-y-4 w-full">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 bg-gray-100 rounded-md w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completionRate = Math.round((stats.completedRoutes / stats.totalRoutes) * 100);
  const deliveryRate = Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100);
  const onTimeRate = Math.round((stats.onTimeDeliveries / stats.totalDeliveries) * 100);
  const vehicleUtilization = Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Statistiky a reporty</h2>
          <p className="text-muted-foreground">
            Komplexní přehled výkonnosti distribuce novin
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dnes</SelectItem>
              <SelectItem value="week">Tento týden</SelectItem>
              <SelectItem value="month">Tento měsíc</SelectItem>
              <SelectItem value="quarter">Tento kvartál</SelectItem>
              <SelectItem value="year">Tento rok</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-blue-700">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              Úspěšnost tras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <div className="flex items-center space-x-1">
              <Progress value={completionRate} className="h-2 mt-2" />
              <span className="text-xs font-medium">{completionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedRoutes} z {stats.totalRoutes} tras dokončeno
            </p>
          </CardContent>
        </Card>
        
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Včasnost doručení
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{onTimeRate}%</div>
            <div className="flex items-center space-x-1">
              <Progress value={onTimeRate} className="h-2 mt-2" />
              <span className="text-xs font-medium">{onTimeRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.onTimeDeliveries} z {stats.totalDeliveries} doručení včas
            </p>
          </CardContent>
        </Card>
        
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-purple-700">
              <Truck className="h-4 w-4 mr-2 text-purple-500" />
              Využití vozidel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehicleUtilization}%</div>
            <div className="flex items-center space-x-1">
              <Progress value={vehicleUtilization} className="h-2 mt-2" />
              <span className="text-xs font-medium">{vehicleUtilization}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalVehicles - stats.availableVehicles} z {stats.totalVehicles} vozidel v provozu
            </p>
          </CardContent>
        </Card>
        
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-amber-700">
              <Award className="h-4 w-4 mr-2 text-amber-500" />
              Spokojenost zákazníků
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.customerSatisfaction}%</div>
            <div className="flex items-center space-x-1">
              <Progress value={stats.customerSatisfaction} className="h-2 mt-2" />
              <span className="text-xs font-medium">{stats.customerSatisfaction}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Průměrné hodnocení služby
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Výkonnost podle oblastí
            </CardTitle>
            <CardDescription>
              Přehled dokončených tras a průměrné časy doručení
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {districtStats.map((district) => (
                <div key={district.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{district.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{district.routes} tras</Badge>
                      <Badge variant="outline">{district.deliveries} doručení</Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Úspěšnost: {district.completionRate}%</span>
                      <span>Průměrný čas: {district.averageTime} min</span>
                    </div>
                    <Progress value={district.completionRate} className="h-2" />
                    {district.issues > 0 && (
                      <div className="flex items-center text-xs text-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {district.issues} problémů
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Výkonnost řidičů
            </CardTitle>
            <CardDescription>
              Top 10 nejlepších řidičů podle výkonnosti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverStats
                .sort((a, b) => b.performance - a.performance)
                .slice(0, 10)
                .map((driver, index) => (
                  <div key={driver.name} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {driver.routes} tras • {driver.deliveries} doručení
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{driver.performance}%</div>
                      <div className="text-xs text-muted-foreground">
                        {driver.completionRate}% úspěšnost
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Trendy výkonnosti
          </CardTitle>
          <CardDescription>
            Vývoj klíčových metrik v čase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Dokončené trasy</h4>
              <div className="space-y-2">
                {['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'].map((day, i) => {
                  const value = Math.floor(Math.random() * 30) + 15;
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{day}</span>
                        <span>{value}</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Průměrný čas doručení</h4>
              <div className="space-y-2">
                {['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'].map((day, i) => {
                  const value = Math.floor(Math.random() * 60) + 90;
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{day}</span>
                        <span>{value} min</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Spokojenost zákazníků</h4>
              <div className="space-y-2">
                {['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'].map((day, i) => {
                  const value = Math.floor(Math.random() * 20) + 85;
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{day}</span>
                        <span>{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Celkové doručení</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedDeliveries.toLocaleString()} dokončeno ({deliveryRate}%)
            </p>
          </CardContent>
        </Card>
        
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Průměrný čas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDeliveryTime} min</div>
            <p className="text-xs text-muted-foreground">
              Průměrná doba doručení na trasu
            </p>
          </CardContent>
        </Card>
        
        <Card className="unified-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Úspora paliva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fuelEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Efektivita spotřeby paliva
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
