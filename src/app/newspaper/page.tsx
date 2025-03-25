'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Newspaper, TruckIcon, Calendar, Clock, AlertTriangle, 
  CheckCircle, Map, ChevronRight, Users, FileText, BarChart4,
  Zap, MoreHorizontal, Download, ListFilter, Search
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from '@/components/layout/Sidebar';

// Types
interface DeliveryRoute {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'delayed' | 'issue';
  startTime: string;
  endTime?: string;
  vehicleId: string;
  driverId: string;
  dropPoints: number;
  completedDropPoints: number;
  district: string;
  durationMinutes: number;
  distance: number;
}

interface Vehicle {
  id: string;
  spz: string;
  model: string;
  status: 'ready' | 'in-use' | 'maintenance' | 'unavailable';
  driver?: string;
  lastInspection: string;
  fuelLevel: number;
}

interface Driver {
  id: string;
  name: string;
  photo?: string;
  status: 'available' | 'on-duty' | 'off-duty' | 'sick';
  performance: number;
  totalDeliveries: number;
  phone: string;
}

export default function NewspaperDistributionPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  
  // Static values for initial render
  const staticStats = {
    totalPapers: 4500,
    deliveredPapers: 2370,
    activeRoutes: 3,
    completedRoutes: 1,
    progressPercentage: 53
  };
  
  // Use state for values that will be calculated
  const [stats, setStats] = useState(staticStats);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In production, replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockVehicles: Vehicle[] = Array.from({ length: 16 }, (_, i) => ({
          id: `vehicle-${i+1}`,
          spz: `${Math.floor(Math.random() * 9) + 1}A${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9999) + 1000}`,
          model: ['Ford Transit', 'Mercedes Sprinter', 'VW Transporter', 'Fiat Ducato', 'Toyota Proace'][Math.floor(Math.random() * 5)],
          status: ['ready', 'in-use', 'maintenance', 'ready'][Math.floor(Math.random() * 4)] as any,
          driver: `Řidič ${i+1}`,
          lastInspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          fuelLevel: Math.floor(Math.random() * 100)
        }));
        
        const mockDrivers: Driver[] = Array.from({ length: 20 }, (_, i) => ({
          id: `driver-${i+1}`,
          name: `Řidič ${i+1}`,
          photo: i % 5 === 0 ? undefined : `/avatars/driver-${(i % 10) + 1}.jpg`,
          status: ['available', 'on-duty', 'off-duty', 'available', 'available', 'sick'][Math.floor(Math.random() * 6)] as any,
          performance: Math.floor(Math.random() * 30) + 70,
          totalDeliveries: Math.floor(Math.random() * 500) + 100,
          phone: `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`
        }));

        const mockRoutes: DeliveryRoute[] = Array.from({ length: 16 }, (_, i) => {
          const isActive = i < 7;
          const isCompleted = i >= 7 && i < 12;
          const isPending = i >= 12;
          const hasIssue = i === 5 || i === 10;
          const isDelayed = i === 3;
          
          let status: 'pending' | 'active' | 'completed' | 'delayed' | 'issue' = 'pending';
          if (isActive) status = hasIssue ? 'issue' : isDelayed ? 'delayed' : 'active';
          else if (isCompleted) status = 'completed';
          
          const startTime = isActive || isCompleted 
            ? new Date(Date.now() - (Math.random() * 3 + 1) * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + (Math.random() * 2) * 60 * 60 * 1000).toISOString();
            
          const endTime = isCompleted 
            ? new Date(Date.parse(startTime) + (Math.random() * 3 + 2) * 60 * 60 * 1000).toISOString()
            : undefined;
            
          const durationMinutes = Math.floor(Math.random() * 60) + 90;
          
          return {
            id: `route-${i+1}`,
            name: `Trasa ${String.fromCharCode(65 + (i % 16))}`,
            status,
            startTime,
            endTime,
            vehicleId: `vehicle-${i+1}`,
            driverId: `driver-${(i % 20) + 1}`,
            dropPoints: Math.floor(Math.random() * 30) + 30,
            completedDropPoints: isCompleted ? Math.floor(Math.random() * 30) + 30 : 
                                isActive ? Math.floor(Math.random() * 20) : 0,
            district: ['Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Praha 6', 'Brno', 'Plzeň'][i % 8],
            durationMinutes,
            distance: (Math.random() * 20 + 10).toFixed(1) as unknown as number
          };
        });
        
        setVehicles(mockVehicles);
        setDrivers(mockDrivers);
        setRoutes(mockRoutes);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Chyba',
          description: 'Nepodařilo se načíst data distribuce',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    setMounted(true);
    // Now it's safe to calculate values on the client
    setStats({
      ...staticStats,
      // Any recalculated values go here
    });
  }, []);

  // Handlers
  const handleRouteAction = (routeId: string, action: string) => {
    toast({
      title: `Akce: ${action}`,
      description: `Akce ${action} byla provedena na trase ${routeId}`
    });
    
    // Update routes based on action
    if (action === 'start') {
      setRoutes(prevRoutes => 
        prevRoutes.map(route => 
          route.id === routeId 
            ? { ...route, status: 'active', startTime: new Date().toISOString() } 
            : route
        )
      );
    } else if (action === 'complete') {
      setRoutes(prevRoutes => 
        prevRoutes.map(route => 
          route.id === routeId 
            ? { 
                ...route, 
                status: 'completed', 
                endTime: new Date().toISOString(),
                completedDropPoints: route.dropPoints 
              } 
            : route
        )
      );
    } else if (action === 'cancel') {
      setRoutes(prevRoutes => 
        prevRoutes.filter(route => route.id !== routeId)
      );
    }
  };

  // Filter routes based on search and status
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = searchQuery === '' || 
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.district.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const completedRoutes = routes.filter(r => r.status === 'completed').length;
  const pendingRoutes = routes.filter(r => r.status === 'pending').length;
  const issueRoutes = routes.filter(r => r.status === 'issue').length;
  
  const totalDeliveryPoints = routes.reduce((sum, route) => sum + route.dropPoints, 0);
  const completedDeliveryPoints = routes.reduce((sum, route) => sum + route.completedDropPoints, 0);
  const deliveryProgress = Math.round((completedDeliveryPoints / totalDeliveryPoints) * 100);
  
  const availableVehicles = vehicles.filter(v => v.status === 'ready').length;
  const availableDrivers = drivers.filter(d => d.status === 'available').length;

  // Format date for display
  const formattedDate = format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: cs });

  // Don't render dynamic content until after hydration
  if (!mounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageHeader
        title="Distribuce novin"
        description={`Přehled distribuce pro ${formattedDate}`}
        icon={<Newspaper className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export dat
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Naplánovat trasy
            </Button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center text-blue-700">
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Aktivní trasy
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-3xl font-bold">{activeRoutes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeRoutes > 0 ? `${Math.round((activeRoutes / routes.length) * 100)}% z celkového počtu` : 'Žádné aktivní trasy'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Dokončené trasy
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-3xl font-bold">{completedRoutes}</div>
            <div className="flex items-center space-x-1">
              <Progress 
                value={Math.round((completedRoutes / routes.length) * 100)} 
                className="h-2 mt-2" 
              />
              <span className="text-xs font-medium">{Math.round((completedRoutes / routes.length) * 100)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center text-amber-700">
              <TruckIcon className="h-4 w-4 mr-2 text-amber-500" />
              Vozidla připravena
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-3xl font-bold">{availableVehicles}</div>
            <Badge variant={availableVehicles < 5 ? "destructive" : "outline"} className="mt-1">
              {availableVehicles < 5 ? "Nedostatek vozidel" : "Dostatečný počet"}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center text-purple-700">
              <Users className="h-4 w-4 mr-2 text-purple-500" />
              Dostupní řidiči
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-3xl font-bold">{availableDrivers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {drivers.filter(d => d.status === 'on-duty').length} aktuálně v terénu
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Přehled tras</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Hledat trasy..."
                      className="pl-8 w-[180px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    defaultValue="all"
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[130px]">
                      <div className="flex items-center">
                        <ListFilter className="h-4 w-4 mr-2" />
                        <span>Filtr</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny trasy</SelectItem>
                      <SelectItem value="active">Aktivní</SelectItem>
                      <SelectItem value="completed">Dokončené</SelectItem>
                      <SelectItem value="pending">Čekající</SelectItem>
                      <SelectItem value="issue">Problémové</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                Celkem {filteredRoutes.length} tras, {activeRoutes} aktivních
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse flex flex-col space-y-4 w-full">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="h-16 bg-gray-100 rounded-md w-full"></div>
                      ))}
                    </div>
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>Žádné trasy odpovídající kritériím</p>
                  </div>
                ) : (
                  filteredRoutes.map((route) => (
                    <div 
                      key={route.id} 
                      className={`
                        border rounded-lg p-3 transition-colors hover:bg-slate-50
                        ${route.status === 'active' ? 'border-blue-200 bg-blue-50/50' : 
                          route.status === 'completed' ? 'border-green-200 bg-green-50/50' : 
                          route.status === 'issue' ? 'border-red-200 bg-red-50/50' :
                          route.status === 'delayed' ? 'border-orange-200 bg-orange-50/50' : 
                          'border-gray-200'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-base">{route.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`ml-2
                                ${route.status === 'active' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 
                                  route.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                  route.status === 'issue' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                  route.status === 'delayed' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : 
                                  'bg-gray-100 text-gray-800 hover:bg-gray-100'}
                              `}
                            >
                              {route.status === 'active' ? 'Aktivní' : 
                                route.status === 'completed' ? 'Dokončeno' : 
                                route.status === 'issue' ? 'Problém' :
                                route.status === 'delayed' ? 'Zpožděno' : 
                                'Čeká na zahájení'}
                            </Badge>
                            <Badge className="ml-2" variant="outline">
                              {route.district}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {route.status === 'completed' ? (
                              <span>Dokončeno v {format(new Date(route.endTime!), 'HH:mm')}</span>
                            ) : route.status === 'active' ? (
                              <span>Zahájeno v {format(new Date(route.startTime), 'HH:mm')}</span>
                            ) : (
                              <span>Plánovaný začátek: {format(new Date(route.startTime), 'HH:mm')}</span>
                            )}
                            <span className="mx-1">•</span>
                            <span>{route.dropPoints} míst doručení</span>
                            <span className="mx-1">•</span>
                            <span>{route.distance} km</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/newspaper/routes/${route.id}`}>
                              <Map className="h-3.5 w-3.5 mr-1" />
                              Mapa
                            </Link>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Akce</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {route.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleRouteAction(route.id, 'start')}>
                                  <Clock className="h-3.5 w-3.5 mr-2" />
                                  Zahájit distribuci
                                </DropdownMenuItem>
                              )}
                              {route.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleRouteAction(route.id, 'complete')}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                  Označit za dokončené
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleRouteAction(route.id, 'edit')}>
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                Upravit trasu
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRouteAction(route.id, 'cancel')}
                                className="text-red-600 hover:text-red-700 focus:text-red-700"
                              >
                                <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                                Zrušit trasu
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {(route.status === 'active' || route.status === 'completed') && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Dokončeno: {route.completedDropPoints} z {route.dropPoints}</span>
                            <span>{Math.round((route.completedDropPoints / route.dropPoints) * 100)}%</span>
                          </div>
                          <Progress 
                            value={Math.round((route.completedDropPoints / route.dropPoints) * 100)} 
                            className="h-2" 
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={drivers.find(d => d.id === route.driverId)?.photo} />
                            <AvatarFallback className="text-xs">
                              {drivers.find(d => d.id === route.driverId)?.name.substr(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {drivers.find(d => d.id === route.driverId)?.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicles.find(v => v.id === route.vehicleId)?.spz}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export seznamu
              </Button>
              <Button size="sm" asChild>
                <Link href="/newspaper/planning">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plánovat nové trasy
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistika distribuce</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <h4 className="text-sm font-medium">Celkový průběh</h4>
                    <span className="text-sm">{deliveryProgress}%</span>
                  </div>
                  <Progress value={deliveryProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Doručeno: {completedDeliveryPoints} z {totalDeliveryPoints}</span>
                    <span>Zbývá: {totalDeliveryPoints - completedDeliveryPoints}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Rychlost doručení</h4>
                    <div className="text-2xl font-bold">
                      {Math.round(completedDeliveryPoints / (activeRoutes || 1))} / hod
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Průměrná rychlost na aktivní trasu
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Problémy</h4>
                    <div className="text-2xl font-bold text-red-600">{issueRoutes}</div>
                    <p className="text-xs text-muted-foreground">
                      {issueRoutes === 0 ? 'Žádné problémové trasy' : 'Trasy vyžadující pozornost'}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Výkonnost podle oblastí</h4>
                  <div className="space-y-3">
                    {['Praha 4', 'Praha 6', 'Praha 5', 'Brno', 'Plzeň'].map((district, i) => {
                      const progress = Math.floor(Math.random() * 40) + 60;
                      return (
                        <div key={district} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{district}</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Dnešní směna</CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: cs })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                  <div className="text-blue-800 font-medium mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-blue-600" />
                    Noční distribuce
                  </div>
                  <div className="text-sm text-blue-700 mb-1">22:00 - 5:00</div>
                  <div className="flex items-center text-sm text-blue-600 mt-2">
                    <TruckIcon className="h-4 w-4 mr-1.5" />
                    <span>16 vozidel v terénu</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Nejbližší události</h4>
                  <div className="space-y-2">
                    <div className="flex items-start border-l-2 border-green-500 pl-3 py-1">
                      <div className="w-12 text-xs text-muted-foreground">22:00</div>
                      <div>
                        <div className="text-sm font-medium">Zahájení rozvozu</div>
                        <div className="text-xs text-muted-foreground">Všechny trasy</div>
                      </div>
                    </div>
                    <div className="flex items-start border-l-2 border-blue-500 pl-3 py-1">
                      <div className="w-12 text-xs text-muted-foreground">01:30</div>
                      <div>
                        <div className="text-sm font-medium">Kontrolní bod</div>
                        <div className="text-xs text-muted-foreground">Vyhodnocení průběhu</div>
                      </div>
                    </div>
                    <div className="flex items-start border-l-2 border-orange-500 pl-3 py-1">
                      <div className="w-12 text-xs text-muted-foreground">05:00</div>
                      <div>
                        <div className="text-sm font-medium">Deadline dokončení</div>
                        <div className="text-xs text-muted-foreground">Uzavření směny</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Dostupní řidiči</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {drivers
                      .filter(driver => ['available', 'on-duty'].includes(driver.status))
                      .slice(0, 12)
                      .map(driver => (
                        <div key={driver.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={driver.photo} />
                              <AvatarFallback>{driver.name.substr(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{driver.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {driver.status === 'on-duty' ? 'Na trase' : 'Dostupný'}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              driver.performance > 90 ? 'bg-green-100 text-green-800' :
                              driver.performance > 70 ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }
                          >
                            {driver.performance}%
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                  
                  <Button variant="outline" className="w-full mt-3" size="sm" asChild>
                    <Link href="/newspaper/drivers">
                      <Users className="h-4 w-4 mr-1.5" />
                      Všichni řidiči
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Rychlé akce</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/newspaper/planning">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Plánování nové distribuce
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/newspaper/routes">
                    <Map className="h-4 w-4 mr-1.5" />
                    Přehled všech tras
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/newspaper/vehicles">
                    <TruckIcon className="h-4 w-4 mr-1.5" />
                    Správa vozidel
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/newspaper/statistics">
                    <BarChart4 className="h-4 w-4 mr-1.5" />
                    Reporty a statistiky
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 